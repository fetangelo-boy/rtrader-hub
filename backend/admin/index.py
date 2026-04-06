"""
Панель управления — только для owner и admin.
?action=stats           — статистика
?action=users           — список пользователей
?action=block_user      — заблокировать пользователя (POST)
?action=unblock_user    — разблокировать пользователя (POST)
?action=set_role        — изменить роль пользователя (POST)
?action=payments        — заявки на подписку
?action=approve_payment — одобрить заявку (POST)
?action=reject_payment  — отклонить заявку (POST)
?action=invites         — список инвайтов
?action=create_invite   — создать инвайт (POST)
"""
import json
import os
import secrets
from datetime import datetime, timedelta, timezone
import psycopg2

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Auth-Token",
}

def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])

def ok(data: dict, status=200):
    return {"statusCode": status, "headers": {**CORS, "Content-Type": "application/json"}, "body": json.dumps(data, ensure_ascii=False, default=str)}

def err(msg: str, status=400):
    return {"statusCode": status, "headers": {**CORS, "Content-Type": "application/json"}, "body": json.dumps({"error": msg}, ensure_ascii=False)}

PLAN_DAYS = {"week": 7, "month": 30, "quarter": 90, "halfyear": 180, "loyal": 30}

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
    if user["role"] not in ("owner", "admin"):
        return err("Нет прав", 403)

    body = json.loads(event.get("body") or "{}")

    if action == "stats":
        with conn.cursor() as cur:
            cur.execute("SELECT COUNT(*) FROM club_users")
            total_users = cur.fetchone()[0]
            cur.execute("SELECT COUNT(*) FROM club_users WHERE created_at > NOW() - INTERVAL '30 days'")
            new_users_30d = cur.fetchone()[0]
            cur.execute("SELECT COUNT(*) FROM club_subscriptions WHERE status = 'active' AND (expires_at IS NULL OR expires_at > NOW())")
            active_subscriptions = cur.fetchone()[0]
            cur.execute("SELECT COUNT(*) FROM club_subscriptions WHERE status = 'pending'")
            pending_payments = cur.fetchone()[0]
            cur.execute("SELECT COUNT(*) FROM club_users WHERE is_blocked = TRUE")
            blocked_users = cur.fetchone()[0]

        return ok({
            "total_users": total_users,
            "new_users_30d": new_users_30d,
            "active_subscriptions": active_subscriptions,
            "pending_payments": pending_payments,
            "blocked_users": blocked_users,
        })

    if action == "users":
        search = qs.get("search", "").strip()
        with conn.cursor() as cur:
            if search:
                cur.execute("""
                    SELECT id, email, nickname, role, is_blocked, created_at
                    FROM club_users
                    WHERE email ILIKE %s OR nickname ILIKE %s
                    ORDER BY created_at DESC LIMIT 50
                """, (f"%{search}%", f"%{search}%"))
            else:
                cur.execute("""
                    SELECT id, email, nickname, role, is_blocked, created_at
                    FROM club_users
                    ORDER BY created_at DESC LIMIT 50
                """)
            rows = cur.fetchall()

        users = [{"id": r[0], "email": r[1], "nickname": r[2], "role": r[3], "is_blocked": r[4], "created_at": r[5].isoformat()} for r in rows]
        return ok({"users": users})

    if action == "block_user":
        user_id = body.get("user_id")
        if not user_id:
            return err("user_id обязателен")
        with conn.cursor() as cur:
            cur.execute("UPDATE club_users SET is_blocked = TRUE WHERE id = %s", (user_id,))
            conn.commit()
        return ok({"message": "Заблокирован"})

    if action == "unblock_user":
        user_id = body.get("user_id")
        if not user_id:
            return err("user_id обязателен")
        with conn.cursor() as cur:
            cur.execute("UPDATE club_users SET is_blocked = FALSE WHERE id = %s", (user_id,))
            conn.commit()
        return ok({"message": "Разблокирован"})

    if action == "set_role":
        user_id = body.get("user_id")
        role = body.get("role")
        if not user_id or role not in ("subscriber", "admin", "owner"):
            return err("Неверные параметры")
        with conn.cursor() as cur:
            cur.execute("UPDATE club_users SET role = %s WHERE id = %s", (role, user_id))
            conn.commit()
        return ok({"message": "Роль обновлена"})

    if action == "payments":
        with conn.cursor() as cur:
            cur.execute("""
                SELECT s.id, s.user_id, u.nickname, u.email, s.plan, s.status, s.receipt_url, s.created_at
                FROM club_subscriptions s
                JOIN club_users u ON s.user_id = u.id
                ORDER BY s.created_at DESC LIMIT 100
            """)
            rows = cur.fetchall()

        payments = [{"id": r[0], "user_id": r[1], "nickname": r[2], "email": r[3], "plan": r[4], "status": r[5], "receipt_url": r[6], "created_at": r[7].isoformat()} for r in rows]
        return ok({"payments": payments})

    if action == "approve_payment":
        payment_id = body.get("payment_id")
        if not payment_id:
            return err("payment_id обязателен")
        with conn.cursor() as cur:
            cur.execute("SELECT user_id, plan FROM club_subscriptions WHERE id = %s", (payment_id,))
            row = cur.fetchone()
            if not row:
                return err("Заявка не найдена")
            user_id, plan = row
            days = PLAN_DAYS.get(plan, 30)
            expires_at = datetime.now(timezone.utc) + timedelta(days=days)
            cur.execute("""
                UPDATE club_subscriptions SET status = 'active', expires_at = %s WHERE id = %s
            """, (expires_at, payment_id))
            conn.commit()
        return ok({"message": "Подписка активирована"})

    if action == "reject_payment":
        payment_id = body.get("payment_id")
        if not payment_id:
            return err("payment_id обязателен")
        with conn.cursor() as cur:
            cur.execute("UPDATE club_subscriptions SET status = 'rejected' WHERE id = %s", (payment_id,))
            conn.commit()
        return ok({"message": "Заявка отклонена"})

    if action == "invites":
        with conn.cursor() as cur:
            cur.execute("""
                SELECT i.id, i.code, i.days, i.is_used, u.nickname, i.created_at
                FROM club_invites i
                LEFT JOIN club_users u ON i.used_by_user_id = u.id
                ORDER BY i.created_at DESC LIMIT 100
            """)
            rows = cur.fetchall()

        invites = [{"id": r[0], "code": r[1], "days": r[2], "is_used": r[3], "used_by_nickname": r[4], "created_at": r[5].isoformat()} for r in rows]
        return ok({"invites": invites})

    if action == "create_invite":
        days = int(body.get("days", 30))
        code = secrets.token_urlsafe(8).upper()
        with conn.cursor() as cur:
            cur.execute("INSERT INTO club_invites (code, days) VALUES (%s, %s)", (code, days))
            conn.commit()
        return ok({"code": code, "days": days})

    conn.close()
    return err("Неизвестное действие", 400)