"""
Webhook для бота @rttrader_chat_bot.
Принимает апдейты из Telegram-чата и сохраняет сообщения в публичный чат сайта /community.
"""
import json
import os
import urllib.request
import psycopg2

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
}

OWNER_USERNAMES = {"rtrader11", "rtrading", "rtrader11_4ever"}
ADMIN_USERNAMES = {"andrew", "dima"}


def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def ok(data):
    return {"statusCode": 200, "headers": {**CORS, "Content-Type": "application/json"}, "body": json.dumps(data, ensure_ascii=False, default=str)}


def err(msg, status=400):
    return {"statusCode": status, "headers": {**CORS, "Content-Type": "application/json"}, "body": json.dumps({"error": msg}, ensure_ascii=False)}


def get_display_name(tg_user: dict) -> str:
    """Формирует отображаемое имя из данных Telegram-пользователя."""
    first = tg_user.get("first_name", "")
    last = tg_user.get("last_name", "")
    username = tg_user.get("username", "")
    if first or last:
        name = (first + " " + last).strip()
        if username:
            return f"{name} (@{username})"
        return name
    if username:
        return f"@{username}"
    return "Участник"


def get_role(tg_user: dict) -> str:
    username = (tg_user.get("username") or "").lower()
    if username in OWNER_USERNAMES:
        return "owner"
    if username in ADMIN_USERNAMES:
        return "admin"
    return "member"


def save_message(text: str, nickname: str, role: str, image_url: str = None, update_id: int = None):
    conn = get_conn()
    with conn.cursor() as cur:
        cur.execute(
            """
            INSERT INTO club_chat (channel, text, source, public_nickname, public_role, image_url, is_hidden, from_telegram, tg_update_id)
            VALUES ('chat', %s, 'public', %s, %s, %s, FALSE, TRUE, %s)
            RETURNING id
            """,
            (text or "", nickname[:32], role, image_url, update_id),
        )
        msg_id = cur.fetchone()[0]
        conn.commit()
    conn.close()
    return msg_id


def download_tg_file(file_id: str, token: str):
    """Получает публичный URL файла из Telegram."""
    try:
        url = f"https://api.telegram.org/bot{token}/getFile?file_id={file_id}"
        with urllib.request.urlopen(url, timeout=5) as r:
            data = json.loads(r.read())
        if not data.get("ok"):
            return None
        file_path = data["result"]["file_path"]
        return f"https://api.telegram.org/file/bot{token}/{file_path}"
    except Exception:
        return None


def handler(event: dict, context) -> dict:
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    # GET ?action=setup — регистрация webhook
    if event.get("httpMethod") == "GET":
        params = event.get("queryStringParameters") or {}
        if params.get("action") == "setup":
            token = os.environ.get("TELEGRAM_COMMUNITY_BOT_TOKEN", "")
            webhook_url = "https://functions.poehali.dev/42f8f3ec-cb2a-4f88-a3bc-14f990deb7bc"
            api_url = f"https://api.telegram.org/bot{token}/setWebhook"
            payload = json.dumps({"url": webhook_url, "allowed_updates": ["message"]}).encode()
            req = urllib.request.Request(api_url, data=payload, headers={"Content-Type": "application/json"})
            with urllib.request.urlopen(req, timeout=15) as r:
                result = json.loads(r.read())
            return ok({"setup": result, "webhook_url": webhook_url})

        # GET ?action=info — проверка статуса webhook
        if params.get("action") == "info":
            token = os.environ.get("TELEGRAM_COMMUNITY_BOT_TOKEN", "")
            api_url = f"https://api.telegram.org/bot{token}/getWebhookInfo"
            with urllib.request.urlopen(api_url, timeout=10) as r:
                result = json.loads(r.read())
            return ok(result)

        return ok({"status": "tg-community-webhook active"})

    if event.get("httpMethod") != "POST":
        return err("Method not allowed", 405)

    # POST — апдейт от Telegram
    token = os.environ.get("TELEGRAM_COMMUNITY_BOT_TOKEN", "")
    body = json.loads(event.get("body") or "{}")

    # Защита от дублей по update_id
    update_id = body.get("update_id")
    if update_id:
        conn = get_conn()
        with conn.cursor() as cur:
            cur.execute(
                "SELECT 1 FROM club_chat WHERE source = 'public' AND from_telegram = TRUE AND tg_update_id = %s LIMIT 1",
                (update_id,)
            )
            if cur.fetchone():
                conn.close()
                return ok({"ok": True, "skipped": "duplicate"})
        conn.close()

    message = body.get("message")
    if not message:
        return ok({"ok": True, "skipped": "no message"})

    # Только текстовые и фото сообщения
    text = message.get("text") or message.get("caption") or ""
    tg_user = message.get("from") or {}

    # Пропускаем ботов
    if tg_user.get("is_bot"):
        return ok({"ok": True, "skipped": "bot"})

    # Получаем фото если есть
    image_url = None
    photos = message.get("photo")
    if photos:
        largest = max(photos, key=lambda p: p.get("file_size", 0))
        image_url = download_tg_file(largest["file_id"], token)

    # Пропускаем пустые сообщения без фото
    if not text and not image_url:
        return ok({"ok": True, "skipped": "empty"})

    nickname = get_display_name(tg_user)
    role = get_role(tg_user)

    msg_id = save_message(text, nickname, role, image_url, update_id)
    return ok({"ok": True, "message_id": msg_id})