"""
Уведомления через @rtrader_vip_bot.
POST ?action=reminders  — отправить напоминания об истечении (запускать по крону)
POST ?action=broadcast  — массовая рассылка всем привязанным пользователям (только owner/admin)
GET  ?action=stats      — сколько пользователей привязали TG
"""
import json
import os
import urllib.request
import psycopg2

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Auth-Token",
}

def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])

def ok(data):
    return {"statusCode": 200, "headers": {**CORS, "Content-Type": "application/json"}, "body": json.dumps(data, ensure_ascii=False, default=str)}

def err(msg, status=400):
    return {"statusCode": status, "headers": {**CORS, "Content-Type": "application/json"}, "body": json.dumps({"error": msg}, ensure_ascii=False)}

def tg_send(chat_id, text):
    token = os.environ["TELEGRAM_VIP_BOT_TOKEN"]
    url = f"https://api.telegram.org/bot{token}/sendMessage"
    payload = json.dumps({"chat_id": chat_id, "text": text, "parse_mode": "HTML"}).encode()
    req = urllib.request.Request(url, data=payload, headers={"Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=5) as r:
            return json.loads(r.read()).get("ok", False)
    except Exception:
        return False

def get_admin(conn, token):
    with conn.cursor() as cur:
        cur.execute("""
            SELECT u.id, u.role FROM club_users u
            JOIN club_sessions s ON u.id = s.user_id
            WHERE s.token = %s AND s.expires_at > NOW()
        """, (token,))
        row = cur.fetchone()
    if not row or row[1] not in ("owner", "admin"):
        return None
    return {"id": row[0], "role": row[1]}

def handler(event: dict, context) -> dict:
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    qs = event.get("queryStringParameters") or {}
    action = qs.get("action", "")
    auth_token = event.get("headers", {}).get("X-Auth-Token", "")

    conn = get_conn()

    # --- Напоминания об истечении (вызывается по крону или вручную из админки) ---
    if action == "reminders":
        admin = get_admin(conn, auth_token)
        if not admin:
            return err("Нет доступа", 403)

        with conn.cursor() as cur:
            # Истекают через 3 дня (±12 часов)
            cur.execute("""
                SELECT u.telegram_id, u.nickname, s.expires_at, s.plan
                FROM club_subscriptions s
                JOIN club_users u ON s.user_id = u.id
                WHERE s.status = 'active'
                  AND u.telegram_id IS NOT NULL
                  AND s.expires_at BETWEEN NOW() + INTERVAL '2 days 12 hours'
                                       AND NOW() + INTERVAL '3 days 12 hours'
            """)
            three_day = cur.fetchall()

            # Истекают через 1 день
            cur.execute("""
                SELECT u.telegram_id, u.nickname, s.expires_at, s.plan
                FROM club_subscriptions s
                JOIN club_users u ON s.user_id = u.id
                WHERE s.status = 'active'
                  AND u.telegram_id IS NOT NULL
                  AND s.expires_at BETWEEN NOW() + INTERVAL '12 hours'
                                       AND NOW() + INTERVAL '1 day 12 hours'
            """)
            one_day = cur.fetchall()

            # Истекают сегодня
            cur.execute("""
                SELECT u.telegram_id, u.nickname, s.expires_at, s.plan
                FROM club_subscriptions s
                JOIN club_users u ON s.user_id = u.id
                WHERE s.status = 'active'
                  AND u.telegram_id IS NOT NULL
                  AND s.expires_at BETWEEN NOW() AND NOW() + INTERVAL '12 hours'
            """)
            today = cur.fetchall()

        sent = 0
        for row in three_day:
            tg_id, nickname, expires_at, plan = row
            text = (
                f"⏰ <b>Через 3 дня истекает подписка</b>\n\n"
                f"Привет, <b>{nickname}</b>!\n"
                f"Тариф <b>{plan}</b> заканчивается <b>{expires_at.strftime('%d.%m.%Y')}</b>.\n\n"
                f"Не забудь продлить на сайте 👉 rtrader11.ru"
            )
            if tg_send(tg_id, text):
                sent += 1

        for row in one_day:
            tg_id, nickname, expires_at, plan = row
            text = (
                f"⚠️ <b>Завтра истекает подписка</b>\n\n"
                f"Привет, <b>{nickname}</b>!\n"
                f"Тариф <b>{plan}</b> заканчивается завтра <b>{expires_at.strftime('%d.%m.%Y')}</b>.\n\n"
                f"Продли прямо сейчас 👉 rtrader11.ru"
            )
            if tg_send(tg_id, text):
                sent += 1

        for row in today:
            tg_id, nickname, expires_at, plan = row
            text = (
                f"🔴 <b>Сегодня истекает подписка</b>\n\n"
                f"Привет, <b>{nickname}</b>!\n"
                f"Тариф <b>{plan}</b> истекает сегодня.\n\n"
                f"Продли подписку, чтобы сохранить доступ 👉 rtrader11.ru"
            )
            if tg_send(tg_id, text):
                sent += 1

        return ok({
            "sent": sent,
            "three_day": len(three_day),
            "one_day": len(one_day),
            "today": len(today),
        })

    # --- Массовая рассылка ---
    if action == "broadcast":
        admin = get_admin(conn, auth_token)
        if not admin:
            return err("Нет доступа", 403)

        body = json.loads(event.get("body") or "{}")
        text = (body.get("text") or "").strip()
        target = body.get("target", "all")  # all | active

        if not text:
            return err("Текст сообщения обязателен")
        if len(text) > 3000:
            return err("Текст слишком длинный (максимум 3000 символов)")

        with conn.cursor() as cur:
            if target == "active":
                cur.execute("""
                    SELECT DISTINCT u.telegram_id FROM club_users u
                    JOIN club_subscriptions s ON s.user_id = u.id
                    WHERE u.telegram_id IS NOT NULL
                      AND s.status = 'active'
                      AND (s.expires_at IS NULL OR s.expires_at > NOW())
                """)
            else:
                cur.execute("SELECT telegram_id FROM club_users WHERE telegram_id IS NOT NULL")
            rows = cur.fetchall()

        sent = 0
        failed = 0
        for (tg_id,) in rows:
            if tg_send(tg_id, text):
                sent += 1
            else:
                failed += 1

        return ok({"sent": sent, "failed": failed, "total": len(rows)})

    # --- Статистика привязанных ---
    if action == "stats":
        admin = get_admin(conn, auth_token)
        if not admin:
            return err("Нет доступа", 403)

        with conn.cursor() as cur:
            cur.execute("SELECT COUNT(*) FROM club_users WHERE telegram_id IS NOT NULL")
            linked = cur.fetchone()[0]
            cur.execute("SELECT COUNT(*) FROM club_users")
            total = cur.fetchone()[0]
            cur.execute("""
                SELECT COUNT(DISTINCT u.id) FROM club_users u
                JOIN club_subscriptions s ON s.user_id = u.id
                WHERE u.telegram_id IS NOT NULL AND s.status = 'active'
                  AND (s.expires_at IS NULL OR s.expires_at > NOW())
            """)
            linked_active = cur.fetchone()[0]

        return ok({"linked": linked, "total_users": total, "linked_active": linked_active})

    return err("Неизвестное действие", 400)
