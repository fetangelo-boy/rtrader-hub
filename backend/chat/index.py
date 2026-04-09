"""
Чат по каналам.
source=club  — VIP-клуб, требует токен + подписку
source=public — публичный чат основного сайта, без авторизации (nickname в теле)
"""
import json
import os
import psycopg2

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Auth-Token",
}

READONLY_CHANNELS = {"intraday", "video", "access_info", "knowledge"}
VALID_CHANNELS = {"intraday", "chat", "metals", "oil", "products", "video", "tech", "access_info", "knowledge"}

def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])

def ok(data):
    return {"statusCode": 200, "headers": {**CORS, "Content-Type": "application/json"}, "body": json.dumps(data, ensure_ascii=False, default=str)}

def err(msg, status=400):
    return {"statusCode": status, "headers": {**CORS, "Content-Type": "application/json"}, "body": json.dumps({"error": msg}, ensure_ascii=False)}

def get_user_by_token(conn, token):
    with conn.cursor() as cur:
        cur.execute("""
            SELECT u.id, u.nickname, u.email, u.role, u.is_blocked
            FROM club_users u JOIN club_sessions s ON u.id = s.user_id
            WHERE s.token = %s AND s.expires_at > NOW()
        """, (token,))
        row = cur.fetchone()
    if not row:
        return None
    return {"id": row[0], "nickname": row[1], "email": row[2], "role": row[3], "is_blocked": row[4]}

def has_active_subscription(conn, user_id):
    with conn.cursor() as cur:
        cur.execute("""
            SELECT 1 FROM club_subscriptions
            WHERE user_id = %s AND status = 'active' AND (expires_at IS NULL OR expires_at > NOW())
            LIMIT 1
        """, (user_id,))
        return cur.fetchone() is not None

def handler(event: dict, context) -> dict:
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    qs = event.get("queryStringParameters") or {}
    action = qs.get("action", "")
    source = qs.get("source", "club")
    if source not in ("club", "public"):
        source = "club"

    conn = get_conn()

    # --- Публичный чат: без авторизации ---
    if source == "public":
        if action == "messages":
            limit = min(int(qs.get("limit", 60)), 100)
            with conn.cursor() as cur:
                cur.execute("""
                    SELECT id, text, created_at, reply_to_nickname AS nickname,
                           'member' AS role, NULL AS user_id,
                           reply_to_id, reply_to_nickname, reply_to_text,
                           public_nickname
                    FROM club_chat
                    WHERE source = 'public' AND is_hidden = FALSE
                    ORDER BY created_at ASC LIMIT %s
                """, (limit,))
                rows = cur.fetchall()
            messages = [{
                "id": r[0], "text": r[1], "created_at": r[2].isoformat(),
                "nickname": r[9] or "Аноним", "role": "member", "user_id": None,
                "reply_to_id": r[6], "reply_to_nickname": r[7], "reply_to_text": r[8]
            } for r in rows]
            return ok({"messages": messages})

        if action == "send":
            body = json.loads(event.get("body") or "{}")
            text = body.get("text", "").strip()
            nickname = (body.get("nickname") or "Аноним").strip()[:32]
            reply_to_id = body.get("reply_to_id")
            if not text:
                return err("Сообщение не может быть пустым")
            if len(text) > 1000:
                return err("Сообщение слишком длинное")

            reply_to_nickname = None
            reply_to_text = None
            if reply_to_id:
                with conn.cursor() as cur:
                    cur.execute("SELECT text, public_nickname FROM club_chat WHERE id = %s AND is_hidden = FALSE", (reply_to_id,))
                    ref = cur.fetchone()
                    if ref:
                        reply_to_text = ref[0][:200]
                        reply_to_nickname = ref[1] or "Аноним"

            with conn.cursor() as cur:
                cur.execute("""
                    INSERT INTO club_chat (channel, text, source, public_nickname, reply_to_id, reply_to_nickname, reply_to_text)
                    VALUES ('chat', %s, 'public', %s, %s, %s, %s)
                """, (text, nickname, reply_to_id or None, reply_to_nickname, reply_to_text))
                conn.commit()
            return ok({"message": "Отправлено"})

        return err("Неизвестное действие", 400)

    # --- VIP-клуб: требует авторизацию ---
    token = event.get("headers", {}).get("X-Auth-Token", "")
    user = get_user_by_token(conn, token)
    if not user:
        return err("Не авторизован", 401)
    if user["is_blocked"]:
        return err("Аккаунт заблокирован", 403)

    is_privileged = user["role"] in ("owner", "admin")
    if not is_privileged and not has_active_subscription(conn, user["id"]):
        return err("Нет доступа. Требуется активная подписка.", 403)

    if action == "messages":
        channel = qs.get("channel", "chat")
        if channel not in VALID_CHANNELS:
            return err("Неверный канал")
        limit = min(int(qs.get("limit", 60)), 100)
        with conn.cursor() as cur:
            cur.execute("""
                SELECT m.id, m.text, m.created_at, u.nickname, u.role, m.user_id,
                       m.reply_to_id, m.reply_to_nickname, m.reply_to_text
                FROM club_chat m
                JOIN club_users u ON m.user_id = u.id
                WHERE m.channel = %s AND m.source = 'club' AND m.is_hidden = FALSE
                ORDER BY m.created_at ASC LIMIT %s
            """, (channel, limit))
            rows = cur.fetchall()
        messages = [{
            "id": r[0], "text": r[1], "created_at": r[2].isoformat(),
            "nickname": r[3], "role": r[4], "user_id": r[5],
            "reply_to_id": r[6], "reply_to_nickname": r[7], "reply_to_text": r[8]
        } for r in rows]
        return ok({"messages": messages})

    if action == "send":
        body = json.loads(event.get("body") or "{}")
        channel = body.get("channel", "")
        text = body.get("text", "").strip()
        reply_to_id = body.get("reply_to_id")
        if channel not in VALID_CHANNELS:
            return err("Неверный канал")
        if not text:
            return err("Сообщение не может быть пустым")
        if len(text) > 2000:
            return err("Сообщение слишком длинное")
        if channel in READONLY_CHANNELS and not is_privileged:
            return err("Этот канал только для чтения")

        reply_to_nickname = None
        reply_to_text = None
        if reply_to_id:
            with conn.cursor() as cur:
                cur.execute("""
                    SELECT m.text, u.nickname FROM club_chat m
                    JOIN club_users u ON m.user_id = u.id
                    WHERE m.id = %s AND m.is_hidden = FALSE
                """, (reply_to_id,))
                ref = cur.fetchone()
                if ref:
                    reply_to_text = ref[0][:200]
                    reply_to_nickname = ref[1]

        with conn.cursor() as cur:
            cur.execute("""
                INSERT INTO club_chat (user_id, channel, text, source, reply_to_id, reply_to_nickname, reply_to_text)
                VALUES (%s, %s, %s, 'club', %s, %s, %s)
            """, (user["id"], channel, text, reply_to_id or None, reply_to_nickname, reply_to_text))
            conn.commit()
        return ok({"message": "Отправлено"})

    if action == "delete":
        body = json.loads(event.get("body") or "{}")
        message_id = body.get("message_id")
        if not message_id:
            return err("message_id обязателен")
        with conn.cursor() as cur:
            cur.execute("SELECT user_id FROM club_chat WHERE id = %s AND is_hidden = FALSE", (message_id,))
            row = cur.fetchone()
            if not row:
                return err("Сообщение не найдено", 404)
            if not is_privileged and row[0] != user["id"]:
                return err("Нет прав", 403)
            cur.execute("UPDATE club_chat SET is_hidden = TRUE WHERE id = %s", (message_id,))
            conn.commit()
        return ok({"message": "Удалено"})

    conn.close()
    return err("Неизвестное действие", 400)
