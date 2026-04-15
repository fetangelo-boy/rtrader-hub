"""
Чат по каналам.
source=club  — VIP-клуб, требует токен + подписку
source=public — публичный чат основного сайта, без авторизации (nickname в теле)

Автомодерация: сообщения проверяются по стоп-словам из chat_stop_words.
При срабатывании: сообщение скрывается, администратор получает уведомление в Telegram.
"""
import json
import os
import base64
import uuid
import re
import urllib.request
import psycopg2

ADMIN_TG_ID = 716116024

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Auth-Token",
}

READONLY_CHANNELS = {"intraday", "video", "access_info", "knowledge"}
VALID_CHANNELS = {"intraday", "chat", "metals", "oil", "products", "video", "tech", "access_info", "knowledge"}

ALLOWED_MIME = {"image/jpeg", "image/png", "image/gif", "image/webp"}
MAX_IMAGE_BYTES = 5 * 1024 * 1024        # 5 МБ после декодирования
MAX_IMAGE_B64_LEN = 7 * 1024 * 1024     # ~7 МБ base64 → соответствует ~5 МБ бинарных данных

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

def tg_send_admin(text: str):
    token = os.environ.get("TELEGRAM_VIP_BOT_TOKEN", "")
    if not token:
        return
    payload = json.dumps({"chat_id": ADMIN_TG_ID, "text": text, "parse_mode": "HTML"}).encode()
    req = urllib.request.Request(
        f"https://api.telegram.org/bot{token}/sendMessage",
        data=payload, headers={"Content-Type": "application/json"}
    )
    try:
        urllib.request.urlopen(req, timeout=5)
    except Exception:
        pass

def get_stop_words(conn) -> list:
    with conn.cursor() as cur:
        cur.execute("SELECT word FROM chat_stop_words WHERE is_active = TRUE")
        return [row[0].lower() for row in cur.fetchall()]

def check_spam(text: str, stop_words: list) -> str | None:
    text_lower = text.lower()
    for word in stop_words:
        if word in text_lower:
            return word
    return None

def notify_admin_spam(nickname: str, source: str, text: str, triggered_word: str, channel: str = ""):
    channel_label = f" (#{channel})" if channel else ""
    src_label = "публичный чат" if source == "public" else f"VIP-клуб{channel_label}"
    preview = text[:200] + ("..." if len(text) > 200 else "")
    msg = (
        f"🚨 <b>Автомодерация сработала</b>\n\n"
        f"👤 Ник: <b>{nickname}</b>\n"
        f"📍 Источник: {src_label}\n"
        f"🔍 Стоп-слово: <code>{triggered_word}</code>\n\n"
        f"💬 Сообщение:\n<i>{preview}</i>\n\n"
        f"Сообщение автоматически скрыто."
    )
    tg_send_admin(msg)

def upload_image_to_s3(image_b64: str, mime: str) -> str:
    import boto3
    if len(image_b64) > MAX_IMAGE_B64_LEN:
        raise ValueError("Файл слишком большой (макс. 5 МБ)")
    if mime not in ALLOWED_MIME:
        raise ValueError("Недопустимый формат. Только JPEG, PNG, GIF, WebP")
    data = base64.b64decode(image_b64)
    if len(data) > MAX_IMAGE_BYTES:
        raise ValueError("Файл слишком большой (макс. 5 МБ)")
    ext = mime.split("/")[1].replace("jpeg", "jpg")
    key = f"chat/{uuid.uuid4().hex}.{ext}"
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
                    SELECT id, text, created_at, public_nickname AS nickname,
                           'member' AS role, NULL AS user_id,
                           reply_to_id, reply_to_nickname, reply_to_text,
                           public_nickname, image_url, public_role, from_telegram
                    FROM club_chat
                    WHERE source = 'public' AND is_hidden = FALSE
                    ORDER BY created_at ASC LIMIT %s
                """, (limit,))
                rows = cur.fetchall()
            messages = [{
                "id": r[0], "text": r[1], "created_at": r[2].isoformat(),
                "nickname": r[9] or "Аноним", "role": r[11] or "member", "user_id": None,
                "reply_to_id": r[6], "reply_to_nickname": r[7], "reply_to_text": r[8],
                "image_url": r[10], "from_telegram": bool(r[12])
            } for r in rows]
            return ok({"messages": messages})

        if action == "send":
            body = json.loads(event.get("body") or "{}")
            text = body.get("text", "").strip()
            reply_to_id = body.get("reply_to_id")
            if not text:
                return err("Сообщение не может быть пустым")
            if len(text) > 1000:
                return err("Сообщение слишком длинное")

            # Если передан токен — берём ник и роль из аккаунта
            pub_token = event.get("headers", {}).get("X-Auth-Token", "")

            pub_role = "member"
            if pub_token:
                vip_user = get_user_by_token(conn, pub_token)
                if vip_user and not vip_user["is_blocked"]:
                    nickname = vip_user["nickname"]
                    raw_role = vip_user["role"]
                    pub_role = "admin" if raw_role in ("owner", "admin") else "vip" if has_active_subscription(conn, vip_user["id"]) else "member"
                else:
                    nickname = (body.get("nickname") or "Аноним").strip()[:32]
            else:
                nickname = (body.get("nickname") or "Аноним").strip()[:32]

            # Проверяем бан ника
            with conn.cursor() as cur:
                cur.execute("SELECT 1 FROM chat_banned_nicks WHERE nickname = %s AND is_active = TRUE", (nickname,))
                if cur.fetchone():
                    return err("Вам запрещено писать в чат")

            # Автомодерация: проверяем стоп-слова
            stop_words = get_stop_words(conn)
            triggered_word = check_spam(text, stop_words)
            is_auto_hidden = triggered_word is not None

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
                    INSERT INTO club_chat (channel, text, source, public_nickname, public_role, reply_to_id, reply_to_nickname, reply_to_text, is_hidden)
                    VALUES ('chat', %s, 'public', %s, %s, %s, %s, %s, %s)
                """, (text, nickname, pub_role, reply_to_id or None, reply_to_nickname, reply_to_text, is_auto_hidden))
                conn.commit()

            if is_auto_hidden:
                notify_admin_spam(nickname, "public", text, triggered_word)
                return ok({"message": "Отправлено", "nickname": nickname, "role": pub_role})

            return ok({"message": "Отправлено", "nickname": nickname, "role": pub_role})

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
                SELECT m.id, m.text, m.created_at,
                       COALESCE(u.nickname, m.public_nickname) AS nickname,
                       COALESCE(u.role, m.public_role) AS role,
                       m.user_id,
                       m.reply_to_id, m.reply_to_nickname, m.reply_to_text, m.image_url,
                       m.video_url, m.video_title
                FROM club_chat m
                LEFT JOIN club_users u ON m.user_id = u.id
                WHERE m.channel = %s AND m.source = 'club' AND m.is_hidden = FALSE
                ORDER BY m.created_at ASC LIMIT %s
            """, (channel, limit))
            rows = cur.fetchall()
        messages = [{
            "id": r[0], "text": r[1], "created_at": r[2].isoformat(),
            "nickname": r[3] or "TG-канал", "role": r[4] or "admin", "user_id": r[5],
            "reply_to_id": r[6], "reply_to_nickname": r[7], "reply_to_text": r[8],
            "image_url": r[9], "video_url": r[10], "video_title": r[11]
        } for r in rows]
        return ok({"messages": messages})

    if action == "upload_image":
        body = json.loads(event.get("body") or "{}")
        image_b64 = body.get("image_base64", "")
        mime = body.get("mime", "image/jpeg")
        if not image_b64:
            return err("image_base64 обязателен")
        try:
            url = upload_image_to_s3(image_b64, mime)
        except ValueError as e:
            return err(str(e))
        return ok({"url": url})

    if action == "send":
        body = json.loads(event.get("body") or "{}")
        channel = body.get("channel", "")
        text = body.get("text", "").strip()
        reply_to_id = body.get("reply_to_id")
        image_url = body.get("image_url") or None
        video_url = body.get("video_url") or None
        video_title = (body.get("video_title") or "").strip()[:200] or None
        if channel not in VALID_CHANNELS:
            return err("Неверный канал")
        if not text and not image_url and not video_url:
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

        # Автомодерация: проверяем стоп-слова (только для не-привилегированных)
        is_auto_hidden = False
        triggered_word = None
        if not is_privileged:
            stop_words = get_stop_words(conn)
            triggered_word = check_spam(text or "", stop_words)
            is_auto_hidden = triggered_word is not None

        with conn.cursor() as cur:
            cur.execute("""
                INSERT INTO club_chat (user_id, channel, text, source, reply_to_id, reply_to_nickname, reply_to_text, image_url, video_url, video_title, is_hidden)
                VALUES (%s, %s, %s, 'club', %s, %s, %s, %s, %s, %s, %s)
            """, (user["id"], channel, text, reply_to_id or None, reply_to_nickname, reply_to_text, image_url, video_url, video_title, is_auto_hidden))
            conn.commit()

        if is_auto_hidden:
            notify_admin_spam(user["nickname"], "club", text or "", triggered_word, channel)

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