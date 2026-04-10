"""
Уведомления через @rtrader_vip_bot + email (Unisend fallback).
POST ?action=reminders  — отправить напоминания об истечении (запускать по крону)
POST ?action=broadcast  — массовая рассылка всем привязанным пользователям (только owner/admin)
GET  ?action=stats      — сколько пользователей привязали TG

Маршрутизация:
  - Есть telegram_id → Telegram (приоритет)
  - Нет telegram_id + есть email → Email через Unisend
"""
import json
import os
import urllib.request
import psycopg2

SITE_URL = "https://rtrader11.ru"

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

def email_send(to_email: str, subject: str, html_body: str) -> bool:
    api_key = os.environ.get("UNISEND_API_KEY", "")
    if not api_key:
        return False
    payload = json.dumps({
        "message": {
            "recipients": [{"email": to_email}],
            "from_email": "noreply@rtrader11.ru",
            "from_name": "RTrader Club",
            "subject": subject,
            "body": {"html": html_body},
        }
    }).encode()
    req = urllib.request.Request(
        "https://go1.unisender.ru/ru/transactional/api/v1/email/send.json",
        data=payload,
        headers={"Content-Type": "application/json", "X-API-KEY": api_key},
    )
    try:
        with urllib.request.urlopen(req, timeout=10) as r:
            result = json.loads(r.read())
            return "job_id" in result or result.get("status") == "success"
    except Exception:
        return False

def smart_notify(telegram_id, email: str, tg_text: str, email_subject: str, email_html: str) -> bool:
    if telegram_id:
        return tg_send(telegram_id, tg_text)
    elif email:
        return email_send(email, email_subject, email_html)
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

    if action == "reminders":
        admin = get_admin(conn, auth_token)
        if not admin:
            return err("Нет доступа", 403)

        with conn.cursor() as cur:
            cur.execute("""
                SELECT u.telegram_id, u.email, u.nickname, s.expires_at, s.plan
                FROM club_subscriptions s
                JOIN club_users u ON s.user_id = u.id
                WHERE s.status = 'active'
                  AND s.expires_at BETWEEN NOW() + INTERVAL '2 days 12 hours'
                                       AND NOW() + INTERVAL '3 days 12 hours'
            """)
            three_day = cur.fetchall()

            cur.execute("""
                SELECT u.telegram_id, u.email, u.nickname, s.expires_at, s.plan
                FROM club_subscriptions s
                JOIN club_users u ON s.user_id = u.id
                WHERE s.status = 'active'
                  AND s.expires_at BETWEEN NOW() + INTERVAL '12 hours'
                                       AND NOW() + INTERVAL '1 day 12 hours'
            """)
            one_day = cur.fetchall()

            cur.execute("""
                SELECT u.telegram_id, u.email, u.nickname, s.expires_at, s.plan
                FROM club_subscriptions s
                JOIN club_users u ON s.user_id = u.id
                WHERE s.status = 'active'
                  AND s.expires_at BETWEEN NOW() AND NOW() + INTERVAL '12 hours'
            """)
            today = cur.fetchall()

        sent = 0

        for row in three_day:
            tg_id, email, nickname, expires_at, plan = row
            date_str = expires_at.strftime("%d.%m.%Y")
            tg_text = (
                f"⏰ <b>Через 3 дня истекает подписка</b>\n\n"
                f"Привет, <b>{nickname}</b>!\n"
                f"Тариф <b>{plan}</b> заканчивается <b>{date_str}</b>.\n\n"
                f"Не забудь продлить на сайте 👉 {SITE_URL}"
            )
            email_html = (
                f"<p>Привет, <b>{nickname}</b>!</p>"
                f"<p>Твоя подписка на тариф <b>{plan}</b> заканчивается <b>{date_str}</b> (через 3 дня).</p>"
                f"<p><a href='{SITE_URL}/subscribe'>Продлить подписку</a></p>"
            )
            if smart_notify(tg_id, email, tg_text, f"Через 3 дня истекает подписка RTrader", email_html):
                sent += 1

        for row in one_day:
            tg_id, email, nickname, expires_at, plan = row
            date_str = expires_at.strftime("%d.%m.%Y")
            tg_text = (
                f"⚠️ <b>Завтра истекает подписка</b>\n\n"
                f"Привет, <b>{nickname}</b>!\n"
                f"Тариф <b>{plan}</b> заканчивается завтра <b>{date_str}</b>.\n\n"
                f"Продли прямо сейчас 👉 {SITE_URL}"
            )
            email_html = (
                f"<p>Привет, <b>{nickname}</b>!</p>"
                f"<p>Твоя подписка на тариф <b>{plan}</b> заканчивается <b>завтра ({date_str})</b>.</p>"
                f"<p><a href='{SITE_URL}/subscribe'>Продлить подписку</a></p>"
            )
            if smart_notify(tg_id, email, tg_text, f"Завтра истекает подписка RTrader", email_html):
                sent += 1

        for row in today:
            tg_id, email, nickname, expires_at, plan = row
            tg_text = (
                f"🔴 <b>Сегодня истекает подписка</b>\n\n"
                f"Привет, <b>{nickname}</b>!\n"
                f"Тариф <b>{plan}</b> истекает сегодня.\n\n"
                f"Продли подписку, чтобы сохранить доступ 👉 {SITE_URL}"
            )
            email_html = (
                f"<p>Привет, <b>{nickname}</b>!</p>"
                f"<p>Твоя подписка на тариф <b>{plan}</b> <b>истекает сегодня</b>.</p>"
                f"<p><a href='{SITE_URL}/subscribe'>Продлить подписку прямо сейчас</a></p>"
            )
            if smart_notify(tg_id, email, tg_text, f"Сегодня истекает подписка RTrader", email_html):
                sent += 1

        return ok({
            "sent": sent,
            "three_day": len(three_day),
            "one_day": len(one_day),
            "today": len(today),
        })

    if action == "broadcast":
        admin = get_admin(conn, auth_token)
        if not admin:
            return err("Нет доступа", 403)

        body = json.loads(event.get("body") or "{}")
        text = (body.get("text") or "").strip()
        target = body.get("target", "all")

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