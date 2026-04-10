"""
Webhook и API для @rtrader_vip_bot.
POST /                — update от Telegram
GET  ?action=gen_link — генерирует deep-link токен
GET  ?action=status   — статус привязки
POST ?action=unlink   — отвязать Telegram
"""
import json, os, secrets, urllib.request, traceback
SITE_URL = "https://rtrader11.ru"
import psycopg2

CORS = {"Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET, POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type, X-Auth-Token"}
BOT_NAME = "rtrader_vip_bot"

def get_conn(): return psycopg2.connect(os.environ["DATABASE_URL"])
def ok(d): return {"statusCode": 200, "headers": {**CORS, "Content-Type": "application/json"}, "body": json.dumps(d, ensure_ascii=False, default=str)}
def err(m, s=400): return {"statusCode": s, "headers": {**CORS, "Content-Type": "application/json"}, "body": json.dumps({"error": m}, ensure_ascii=False)}

def tg(method, payload):
    token = os.environ["TELEGRAM_VIP_BOT_TOKEN"]
    data = json.dumps(payload).encode()
    req = urllib.request.Request(f"https://api.telegram.org/bot{token}/{method}", data=data, headers={"Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=10) as r: return json.loads(r.read())
    except Exception as e:
        print(f"TG API error [{method}]: {e}\n{traceback.format_exc()}")
        return {"tg_error": str(e)}

def send(chat_id, text): tg("sendMessage", {"chat_id": chat_id, "text": text, "parse_mode": "HTML"})

def get_user(conn, token):
    with conn.cursor() as cur:
        cur.execute("SELECT u.id, u.nickname, u.telegram_id, u.telegram_username FROM club_users u JOIN club_sessions s ON u.id = s.user_id WHERE s.token = %s AND s.expires_at > NOW()", (token,))
        r = cur.fetchone()
    return {"id": r[0], "nickname": r[1], "telegram_id": r[2], "telegram_username": r[3]} if r else None

def handler(event: dict, context) -> dict:
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    method = event.get("httpMethod", "GET")
    qs = event.get("queryStringParameters") or {}
    action = qs.get("action", "")
    auth_token = event.get("headers", {}).get("X-Auth-Token", "")
    conn = get_conn()

    # Webhook от Telegram
    if method == "POST" and not action:
        body = json.loads(event.get("body") or "{}")
        msg = body.get("message") or body.get("edited_message")
        if not msg: return ok({"ok": True})
        chat_id = msg["chat"]["id"]
        text = msg.get("text", "").strip()
        tg_id = msg["from"]["id"]
        tg_uname = msg["from"].get("username", "")

        if text.startswith("/start "):
            link_token = text.split(" ", 1)[1].strip()
            with conn.cursor() as cur:
                cur.execute("SELECT user_id FROM tg_link_tokens WHERE token = %s AND expires_at > NOW()", (link_token,))
                row = cur.fetchone()
                if not row:
                    send(chat_id, "❌ Ссылка устарела. Сгенерируйте новую в личном кабинете.")
                    return ok({"ok": True})
                cur.execute("UPDATE club_users SET telegram_id = %s, telegram_username = %s WHERE id = %s RETURNING nickname", (tg_id, tg_uname, row[0]))
                nick = cur.fetchone()
                cur.execute("UPDATE tg_link_tokens SET expires_at = NOW() WHERE token = %s", (link_token,))
                conn.commit()
            send(chat_id, f"✅ <b>Telegram привязан!</b>\n\nПривет, <b>{nick[0] if nick else 'пользователь'}</b>!\nТеперь ты будешь получать уведомления о подписке.\n\n/status — статус подписки")
            return ok({"ok": True})

        if text == "/start":
            # Проверяем — может пользователь уже зарегистрирован
            with conn.cursor() as cur:
                cur.execute("SELECT id, nickname FROM club_users WHERE telegram_id = %s", (tg_id,))
                existing = cur.fetchone()
            if existing:
                send(chat_id, f"👋 Привет, <b>{existing[1]}</b>! Твой аккаунт уже привязан.\n\n/status — статус подписки\n🌐 {SITE_URL}")
            else:
                # Создаём регистрационный токен
                reg_token = secrets.token_urlsafe(24)
                with conn.cursor() as cur:
                    cur.execute(
                        "INSERT INTO tg_link_tokens (token, user_id, expires_at, for_registration, tg_id, tg_username) VALUES (%s, 0, NOW() + INTERVAL '30 minutes', TRUE, %s, %s)",
                        (reg_token, tg_id, tg_uname)
                    )
                    conn.commit()
                reg_url = f"{SITE_URL}/register?tg_token={reg_token}"
                send(chat_id, (
                    f"👋 Привет! Это бот <b>RTrading CLUB</b>.\n\n"
                    f"Для получения доступа зарегистрируйся на сайте — твой Telegram уже будет привязан автоматически:\n\n"
                    f"👉 <a href=\"{reg_url}\">Зарегистрироваться</a>\n\n"
                    f"Ссылка действует 30 минут."
                ))
            return ok({"ok": True})

        if text == "/status":
            with conn.cursor() as cur:
                cur.execute("SELECT u.nickname, s.plan, s.expires_at, s.status FROM club_users u LEFT JOIN club_subscriptions s ON s.user_id = u.id AND s.status = 'active' WHERE u.telegram_id = %s ORDER BY s.expires_at DESC NULLS LAST LIMIT 1", (tg_id,))
                row = cur.fetchone()
            if not row:
                send(chat_id, "❌ Аккаунт не привязан. Зайди в личный кабинет на rtrader11.ru")
            elif row[2]:
                from datetime import timezone as tz
                import datetime
                days = (row[2].replace(tzinfo=tz.utc) - datetime.datetime.now(tz.utc)).days
                send(chat_id, f"📊 <b>{row[0]}</b> | тариф <b>{row[1]}</b>\n✅ До {row[2].strftime('%d.%m.%Y')} (осталось {max(days,0)} дн.)")
            else:
                send(chat_id, f"👤 <b>{row[0]}</b>\n❌ Активной подписки нет.\n\nОформи на rtrader11.ru")
            return ok({"ok": True})

        if text == "/help":
            send(chat_id, "📌 <b>Команды:</b>\n/status — статус подписки\n/help — помощь\n\n🌐 rtrader11.ru")
            return ok({"ok": True})

        return ok({"ok": True})

    # Одноразовая регистрация webhook (публичный, без авторизации)
    if action == "setup_webhook":
        webhook_url = "https://functions.poehali.dev/4807e4da-e564-4aba-8072-c30326d968ee"
        result = tg("setWebhook", {"url": webhook_url})
        return ok(result)

    if action == "get_webhook":
        result = tg("getWebhookInfo", {})
        return ok(result)

    # API для фронтенда
    user = get_user(conn, auth_token)
    if not user: return err("Не авторизован", 401)

    if action == "gen_link":
        token = secrets.token_urlsafe(24)
        with conn.cursor() as cur:
            cur.execute("INSERT INTO tg_link_tokens (token, user_id, expires_at) VALUES (%s, %s, NOW() + INTERVAL '15 minutes')", (token, user["id"]))
            conn.commit()
        return ok({"url": f"https://t.me/{BOT_NAME}?start={token}", "expires_in": 900})

    if action == "status":
        return ok({"linked": user["telegram_id"] is not None, "telegram_username": user["telegram_username"]})

    if action == "unlink" and method == "POST":
        with conn.cursor() as cur:
            cur.execute("UPDATE club_users SET telegram_id = NULL, telegram_username = NULL WHERE id = %s", (user["id"],))
            conn.commit()
        return ok({"message": "Telegram отвязан"})

    return err("Неизвестное действие", 400)