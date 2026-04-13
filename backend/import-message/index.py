"""
Внешний API для импорта сообщений в чат клуба из Telegram-канала.
POST / — публикует сообщение от имени бота в указанный канал клуба.
Авторизация: заголовок X-Api-Key со значением из секрета IMPORT_API_KEY.
"""
import json
import os
import psycopg2

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Api-Key",
}

VALID_CHANNELS = {"intraday", "chat", "metals", "oil", "products", "video", "tech", "access_info", "knowledge"}

BOT_NICKNAME = "TG-канал"
BOT_ROLE = "admin"

OWNER_NICKNAMES = {"RTrader11", "RTrading", "RTrader11_4Ever"}


def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def ok(data):
    return {
        "statusCode": 200,
        "headers": {**CORS, "Content-Type": "application/json"},
        "body": json.dumps(data, ensure_ascii=False, default=str),
    }


def err(msg, status=400):
    return {
        "statusCode": status,
        "headers": {**CORS, "Content-Type": "application/json"},
        "body": json.dumps({"error": msg}, ensure_ascii=False),
    }


def handler(event: dict, context) -> dict:
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    if event.get("httpMethod") != "POST":
        return err("Метод не поддерживается", 405)

    api_key = event.get("headers", {}).get("X-Api-Key", "")
    expected_key = os.environ.get("IMPORT_API_KEY", "")
    if not expected_key or api_key != expected_key:
        return err("Неверный API-ключ", 401)

    body = json.loads(event.get("body") or "{}")

    channel = body.get("channel", "").strip()
    text = body.get("text", "").strip()
    nickname = body.get("nickname", BOT_NICKNAME).strip()[:64]
    image_url = body.get("image_url", None)

    if not channel:
        return err("Поле 'channel' обязательно")
    if channel not in VALID_CHANNELS:
        return err(f"Недопустимый канал. Допустимые: {', '.join(sorted(VALID_CHANNELS))}")
    if not text and not image_url:
        return err("Необходимо передать 'text' или 'image_url'")
    if text and len(text) > 4000:
        return err("Текст слишком длинный (макс. 4000 символов)")

    conn = get_conn()
    with conn.cursor() as cur:
        cur.execute(
            """
            INSERT INTO club_chat
                (channel, text, source, public_nickname, public_role, image_url, is_hidden)
            VALUES
                (%s, %s, 'club', %s, %s, %s, FALSE)
            RETURNING id, created_at
            """,
            (channel, text or None, nickname, "owner" if nickname in OWNER_NICKNAMES else BOT_ROLE, image_url or None),
        )
        row = cur.fetchone()
        conn.commit()

    return ok({
        "ok": True,
        "message_id": row[0],
        "created_at": row[1].isoformat(),
        "channel": channel,
    })