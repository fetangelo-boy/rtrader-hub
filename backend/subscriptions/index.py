"""
Подписки пользователей.
?action=status      — GET  — статус подписки текущего пользователя
?action=request     — POST — отправить заявку на оплату (с base64 чеком)
?action=my_requests — GET  — мои заявки на оплату
"""
import json
import os
import base64
import boto3
import urllib.request
from datetime import datetime, timezone
import psycopg2

ADMIN_TG_ID = 716116024
PLAN_LABELS = {
    "week": "Неделя",
    "month": "Месяц",
    "quarter": "Квартал",
    "halfyear": "Полгода",
    "loyal": "Лояльный",
}

def notify_admin(nickname: str, email: str, plan: str, receipt_url: str):
    token = os.environ.get("TELEGRAM_VIP_BOT_TOKEN", "")
    if not token:
        return
    plan_label = PLAN_LABELS.get(plan, plan)
    text = (
        f"🔔 <b>Новая заявка на подписку</b>\n\n"
        f"👤 <b>{nickname}</b> ({email})\n"
        f"📦 Тариф: <b>{plan_label}</b>\n"
        f"🧾 <a href=\"{receipt_url}\">Открыть чек</a>"
    )
    payload = json.dumps({"chat_id": ADMIN_TG_ID, "text": text, "parse_mode": "HTML"}).encode()
    req = urllib.request.Request(
        f"https://api.telegram.org/bot{token}/sendMessage",
        data=payload,
        headers={"Content-Type": "application/json"}
    )
    try:
        urllib.request.urlopen(req, timeout=5)
    except Exception:
        pass

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Auth-Token",
}

PLAN_DAYS = {
    "week":     7,
    "month":    30,
    "quarter":  90,
    "halfyear": 180,
    "loyal":    30,
}

def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])

def ok(data: dict, status=200):
    return {"statusCode": status, "headers": {**CORS, "Content-Type": "application/json"}, "body": json.dumps(data, ensure_ascii=False, default=str)}

def err(msg: str, status=400):
    return {"statusCode": status, "headers": {**CORS, "Content-Type": "application/json"}, "body": json.dumps({"error": msg}, ensure_ascii=False)}

def get_user_by_token(conn, token: str):
    with conn.cursor() as cur:
        cur.execute("""
            SELECT u.id, u.nickname, u.email, u.role, u.is_blocked
            FROM club_users u
            JOIN club_sessions s ON u.id = s.user_id
            WHERE s.token = %s AND s.expires_at > NOW()
        """, (token,))
        row = cur.fetchone()
    if not row:
        return None
    return {"id": row[0], "nickname": row[1], "email": row[2], "role": row[3], "is_blocked": row[4]}

def upload_receipt(data_b64: str, mime: str, user_id: int) -> str:
    data = base64.b64decode(data_b64)
    ext = "jpg" if "jpeg" in mime or "jpg" in mime else mime.split("/")[-1]
    key = f"receipts/{user_id}_{int(datetime.now().timestamp())}.{ext}"
    s3 = boto3.client(
        "s3",
        endpoint_url="https://bucket.poehali.dev",
        aws_access_key_id=os.environ["AWS_ACCESS_KEY_ID"],
        aws_secret_access_key=os.environ["AWS_SECRET_ACCESS_KEY"],
    )
    s3.put_object(Bucket="files", Key=key, Body=data, ContentType=mime)
    return f"https://cdn.poehali.dev/projects/{os.environ['AWS_ACCESS_KEY_ID']}/bucket/{key}"

def handler(event: dict, context) -> dict:
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    qs = event.get("queryStringParameters") or {}
    action = qs.get("action", "")
    token = event.get("headers", {}).get("X-Auth-Token", "")

    conn = get_conn()
    user = get_user_by_token(conn, token)
    if not user:
        return err("Не авторизован", 401)

    if action == "status":
        with conn.cursor() as cur:
            cur.execute("""
                SELECT id, plan, status, expires_at, created_at
                FROM club_subscriptions
                WHERE user_id = %s
                ORDER BY created_at DESC LIMIT 1
            """, (user["id"],))
            row = cur.fetchone()

        if not row:
            return ok({"subscription": None})

        now = datetime.now(timezone.utc)
        expires = row[3]
        if expires and expires.tzinfo is None:
            expires = expires.replace(tzinfo=timezone.utc)

        subscription = {
            "id": row[0],
            "plan": row[1],
            "status": row[2],
            "expires_at": expires.isoformat() if expires else None,
            "is_active": row[2] == "active" and (expires is None or expires > now),
        }
        return ok({"subscription": subscription})

    if action == "request":
        body = json.loads(event.get("body") or "{}")
        plan = body.get("plan", "")
        receipt_b64 = body.get("receipt_base64", "")
        receipt_mime = body.get("receipt_mime", "image/jpeg")

        if plan not in PLAN_DAYS:
            return err("Неверный тариф")
        if not receipt_b64:
            return err("Чек обязателен")

        receipt_url = upload_receipt(receipt_b64, receipt_mime, user["id"])

        with conn.cursor() as cur:
            cur.execute("""
                INSERT INTO club_subscriptions (user_id, plan, status, receipt_url)
                VALUES (%s, %s, %s, %s)
                RETURNING id
            """, (user["id"], plan, "pending", receipt_url))
            conn.commit()

        notify_admin(user["nickname"], user["email"], plan, receipt_url)

        return ok({"message": "Заявка отправлена"})

    if action == "my_requests":
        with conn.cursor() as cur:
            cur.execute("""
                SELECT id, plan, status, expires_at, created_at
                FROM club_subscriptions
                WHERE user_id = %s
                ORDER BY created_at DESC
            """, (user["id"],))
            rows = cur.fetchall()

        requests = [{"id": r[0], "plan": r[1], "status": r[2], "expires_at": r[3], "created_at": r[4]} for r in rows]
        return ok({"requests": requests})

    conn.close()
    return err("Неизвестное действие", 400)