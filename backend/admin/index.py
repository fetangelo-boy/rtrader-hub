"""
Панель управления — только для owner и admin.
?action=stats              — статистика
?action=users              — список пользователей
?action=block_user         — заблокировать пользователя (POST)
?action=unblock_user       — разблокировать пользователя (POST)
?action=set_role           — изменить роль пользователя (POST)
?action=payments           — заявки на подписку
?action=approve_payment    — одобрить заявку (POST)
?action=reject_payment     — отклонить заявку (POST)
?action=invites            — список инвайтов
?action=create_invite      — создать инвайт (POST)
?action=subscribers        — список всех подписчиков с датами (GET)
?action=grant_access       — выдать доступ вручную (POST) {user_id, plan, days}
?action=set_expires        — изменить дату окончания (POST) {subscription_id, expires_at}
?action=deactivate         — деактивировать подписку (POST) {subscription_id}
?action=change_plan        — изменить тариф (POST) {subscription_id, plan}
?action=chat_messages      — сообщения чата для модерации (GET) ?source=public|club&limit=100&offset=0
?action=chat_delete        — удалить сообщение (POST) {message_id}
?action=chat_delete_bulk   — удалить несколько сообщений (POST) {message_ids: []}
?action=chat_ban_nick      — забанить публичный ник (POST) {nickname}  → скрывает все его сообщения
?action=chat_unban_nick    — разбанить публичный ник (POST) {nickname}
?action=chat_banned_nicks  — список забаненных ников (GET)
"""
import json
import os
import secrets
import urllib.request
from datetime import datetime, timedelta, timezone
import psycopg2


def tg_send(chat_id, text):
    token = os.environ.get("TELEGRAM_VIP_BOT_TOKEN", "")
    if not token or not chat_id:
        return
    try:
        data = json.dumps({"chat_id": chat_id, "text": text, "parse_mode": "HTML"}).encode()
        req = urllib.request.Request(
            f"https://api.telegram.org/bot{token}/sendMessage",
            data=data, headers={"Content-Type": "application/json"}
        )
        urllib.request.urlopen(req, timeout=5)
    except Exception:
        pass

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
PLAN_LABELS = {"week": "Неделя", "month": "Месяц", "quarter": "Квартал", "halfyear": "Полгода", "loyal": "Лояльный"}

def notify_user_approved(conn, user_id: int, plan: str, expires_at: datetime):
    with conn.cursor() as cur:
        cur.execute("SELECT telegram_id, nickname FROM club_users WHERE id = %s", (user_id,))
        row = cur.fetchone()
    if not row or not row[0]:
        return
    tg_send(row[0], (
        f"✅ <b>Доступ открыт!</b>\n\n"
        f"Привет, <b>{row[1]}</b>!\n"
        f"Тариф: <b>{PLAN_LABELS.get(plan, plan)}</b>\n"
        f"Действует до: <b>{expires_at.strftime('%d.%m.%Y')}</b>\n\n"
        f"Добро пожаловать в RTrading CLUB 🚀"
    ))

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
        notify_user_approved(conn, user_id, plan, expires_at)
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

    if action == "subscribers":
        search = qs.get("search", "").strip()
        status_filter = qs.get("status", "").strip()
        no_tg_filter = qs.get("no_tg", "").strip() == "1"
        with conn.cursor() as cur:
            query = """
                SELECT u.id, u.email, u.nickname, u.is_blocked, u.role,
                       s.id as sub_id, s.plan, s.status, s.expires_at, s.created_at,
                       u.telegram_id, u.telegram_username
                FROM club_users u
                LEFT JOIN LATERAL (
                    SELECT id, plan, status, expires_at, created_at
                    FROM club_subscriptions
                    WHERE user_id = u.id
                    ORDER BY created_at DESC LIMIT 1
                ) s ON true
                WHERE u.role != 'owner'
            """
            params = []
            if search:
                query += " AND (u.email ILIKE %s OR u.nickname ILIKE %s)"
                params += [f"%{search}%", f"%{search}%"]
            if no_tg_filter:
                query += " AND u.telegram_id IS NULL"
            if status_filter == "active":
                query += " AND s.status = 'active' AND (s.expires_at IS NULL OR s.expires_at > NOW())"
            elif status_filter == "expiring":
                query += " AND s.status = 'active' AND s.expires_at BETWEEN NOW() AND NOW() + INTERVAL '7 days'"
            elif status_filter == "expired":
                query += " AND (s.status != 'active' OR s.expires_at < NOW())"
            elif status_filter == "pending":
                query += " AND s.status = 'pending'"
            query += " ORDER BY s.created_at DESC NULLS LAST LIMIT 200"
            cur.execute(query, params)
            rows = cur.fetchall()

        now = datetime.now(timezone.utc)
        result = []
        for r in rows:
            exp = r[8]
            if exp and exp.tzinfo is None:
                exp = exp.replace(tzinfo=timezone.utc)
            sub_status = r[7]
            computed = "none"
            if sub_status == "active":
                if exp is None:
                    computed = "active"
                elif exp > now + timedelta(days=7):
                    computed = "active"
                elif exp > now:
                    computed = "expiring"
                else:
                    computed = "expired"
            elif sub_status == "pending":
                computed = "pending"
            elif sub_status == "rejected":
                computed = "expired"
            result.append({
                "user_id": r[0], "email": r[1], "nickname": r[2], "is_blocked": r[3], "role": r[4],
                "sub_id": r[5], "plan": r[6], "status": computed,
                "expires_at": exp.isoformat() if exp else None,
                "created_at": r[9].isoformat() if r[9] else None,
                "telegram_id": r[10], "telegram_username": r[11],
            })
        return ok({"subscribers": result})

    if action == "grant_access":
        user_id = body.get("user_id")
        plan = body.get("plan", "month")
        days = int(body.get("days", PLAN_DAYS.get(plan, 30)))
        if not user_id:
            return err("user_id обязателен")
        expires_at = datetime.now(timezone.utc) + timedelta(days=days)
        with conn.cursor() as cur:
            cur.execute("""
                INSERT INTO club_subscriptions (user_id, plan, status, expires_at)
                VALUES (%s, %s, 'active', %s)
                RETURNING id
            """, (user_id, plan, expires_at))
            sub_id = cur.fetchone()[0]
            cur.execute("""
                INSERT INTO club_subscriptions_log (subscription_id, admin_id, action, details)
                VALUES (%s, %s, 'grant_access', %s)
            """, (sub_id, user["id"], json.dumps({"plan": plan, "days": days, "expires_at": expires_at.isoformat()})))
            conn.commit()

        notify_user_approved(conn, user_id, plan, expires_at)
        return ok({"message": f"Доступ выдан до {expires_at.strftime('%d.%m.%Y')}", "sub_id": sub_id})

    if action == "set_expires":
        sub_id = body.get("subscription_id")
        new_expires = body.get("expires_at")
        if not sub_id or not new_expires:
            return err("subscription_id и expires_at обязательны")
        with conn.cursor() as cur:
            cur.execute("SELECT s.user_id, s.plan FROM club_subscriptions s WHERE s.id = %s", (sub_id,))
            row = cur.fetchone()
            if not row:
                return err("Подписка не найдена")
            sub_user_id, sub_plan = row
            cur.execute("UPDATE club_subscriptions SET expires_at = %s, status = 'active' WHERE id = %s", (new_expires, sub_id))
            cur.execute("""
                INSERT INTO club_subscriptions_log (subscription_id, admin_id, action, details)
                VALUES (%s, %s, 'set_expires', %s)
            """, (sub_id, user["id"], json.dumps({"expires_at": new_expires})))
            conn.commit()
        expires_dt = datetime.fromisoformat(new_expires.replace("Z", "+00:00")) if isinstance(new_expires, str) else new_expires
        notify_user_approved(conn, sub_user_id, sub_plan or "month", expires_dt)
        return ok({"message": "Дата окончания обновлена"})

    if action == "deactivate":
        sub_id = body.get("subscription_id")
        if not sub_id:
            return err("subscription_id обязателен")
        with conn.cursor() as cur:
            cur.execute("SELECT id FROM club_subscriptions WHERE id = %s", (sub_id,))
            if not cur.fetchone():
                return err("Подписка не найдена")
            cur.execute("UPDATE club_subscriptions SET status = 'rejected', expires_at = NOW() WHERE id = %s", (sub_id,))
            cur.execute("""
                INSERT INTO club_subscriptions_log (subscription_id, admin_id, action, details)
                VALUES (%s, %s, 'deactivate', %s)
            """, (sub_id, user["id"], json.dumps({"deactivated_by": user["nickname"]})))
            conn.commit()
        return ok({"message": "Доступ деактивирован"})

    if action == "change_plan":
        sub_id = body.get("subscription_id")
        new_plan = body.get("plan")
        if not sub_id or not new_plan:
            return err("subscription_id и plan обязательны")
        if new_plan not in PLAN_DAYS:
            return err("Неверный тариф")
        with conn.cursor() as cur:
            cur.execute("SELECT id FROM club_subscriptions WHERE id = %s", (sub_id,))
            if not cur.fetchone():
                return err("Подписка не найдена")
            cur.execute("UPDATE club_subscriptions SET plan = %s WHERE id = %s", (new_plan, sub_id))
            cur.execute("""
                INSERT INTO club_subscriptions_log (subscription_id, admin_id, action, details)
                VALUES (%s, %s, 'change_plan', %s)
            """, (sub_id, user["id"], json.dumps({"plan": new_plan})))
            conn.commit()
        return ok({"message": "Тариф изменён"})

    if action == "sub_history":
        user_id = qs.get("user_id")
        if not user_id:
            return err("user_id обязателен")
        with conn.cursor() as cur:
            cur.execute("""
                SELECT l.id, l.action, l.details, l.created_at, a.nickname as admin_nick
                FROM club_subscriptions_log l
                JOIN club_subscriptions s ON l.subscription_id = s.id
                LEFT JOIN club_users a ON l.admin_id = a.id
                WHERE s.user_id = %s
                ORDER BY l.created_at DESC LIMIT 50
            """, (int(user_id),))
            rows = cur.fetchall()
        history = [{"id": r[0], "action": r[1], "details": r[2], "created_at": r[3].isoformat(), "admin": r[4]} for r in rows]
        return ok({"history": history})

    # ── Модерация чата ──────────────────────────────────────────────────────────

    if action == "chat_messages":
        source = qs.get("source", "public")
        if source not in ("public", "club"):
            source = "public"
        limit = min(int(qs.get("limit", 100)), 200)
        offset = int(qs.get("offset", 0))
        search = qs.get("search", "").strip()
        with conn.cursor() as cur:
            if source == "public":
                if search:
                    cur.execute("""
                        SELECT id, text, public_nickname, public_role, created_at, is_hidden, image_url
                        FROM club_chat
                        WHERE source = 'public' AND (text ILIKE %s OR public_nickname ILIKE %s)
                        ORDER BY created_at DESC LIMIT %s OFFSET %s
                    """, (f"%{search}%", f"%{search}%", limit, offset))
                else:
                    cur.execute("""
                        SELECT id, text, public_nickname, public_role, created_at, is_hidden, image_url
                        FROM club_chat WHERE source = 'public'
                        ORDER BY created_at DESC LIMIT %s OFFSET %s
                    """, (limit, offset))
                rows = cur.fetchall()
                messages = [{"id": r[0], "text": r[1], "nickname": r[2] or "Аноним", "role": r[3] or "member",
                             "created_at": r[4].isoformat(), "is_hidden": r[5], "image_url": r[6],
                             "source": "public", "user_id": None} for r in rows]
            else:
                if search:
                    cur.execute("""
                        SELECT m.id, m.text, u.nickname, u.role, m.created_at, m.is_hidden, m.image_url, m.channel, u.id
                        FROM club_chat m JOIN club_users u ON m.user_id = u.id
                        WHERE m.source = 'club' AND (m.text ILIKE %s OR u.nickname ILIKE %s)
                        ORDER BY m.created_at DESC LIMIT %s OFFSET %s
                    """, (f"%{search}%", f"%{search}%", limit, offset))
                else:
                    cur.execute("""
                        SELECT m.id, m.text, u.nickname, u.role, m.created_at, m.is_hidden, m.image_url, m.channel, u.id
                        FROM club_chat m JOIN club_users u ON m.user_id = u.id
                        WHERE m.source = 'club'
                        ORDER BY m.created_at DESC LIMIT %s OFFSET %s
                    """, (limit, offset))
                rows = cur.fetchall()
                messages = [{"id": r[0], "text": r[1], "nickname": r[2], "role": r[3],
                             "created_at": r[4].isoformat(), "is_hidden": r[5], "image_url": r[6],
                             "channel": r[7], "source": "club", "user_id": r[8]} for r in rows]
        return ok({"messages": messages, "source": source, "total": len(messages)})

    if action == "chat_delete":
        msg_id = body.get("message_id")
        if not msg_id:
            return err("message_id обязателен")
        with conn.cursor() as cur:
            cur.execute("UPDATE club_chat SET is_hidden = TRUE WHERE id = %s RETURNING id", (msg_id,))
            if not cur.fetchone():
                return err("Сообщение не найдено")
            conn.commit()
        return ok({"message": "Сообщение скрыто"})

    if action == "chat_delete_bulk":
        ids = body.get("message_ids", [])
        if not ids or not isinstance(ids, list):
            return err("message_ids обязателен (список)")
        ids = [int(i) for i in ids[:100]]
        with conn.cursor() as cur:
            cur.execute("UPDATE club_chat SET is_hidden = TRUE WHERE id = ANY(%s)", (ids,))
            count = cur.rowcount
            conn.commit()
        return ok({"message": f"Скрыто {count} сообщений", "count": count})

    if action == "chat_ban_nick":
        nickname = (body.get("nickname") or "").strip()
        if not nickname:
            return err("nickname обязателен")
        with conn.cursor() as cur:
            cur.execute("""
                INSERT INTO chat_banned_nicks (nickname, banned_by, banned_at, is_active)
                VALUES (%s, %s, NOW(), TRUE)
                ON CONFLICT (nickname) DO UPDATE SET banned_by = EXCLUDED.banned_by, banned_at = NOW(), is_active = TRUE
            """, (nickname, user["id"]))
            cur.execute("UPDATE club_chat SET is_hidden = TRUE WHERE source = 'public' AND public_nickname = %s", (nickname,))
            conn.commit()
        return ok({"message": f"Ник «{nickname}» забанен, все его сообщения скрыты"})

    if action == "chat_unban_nick":
        nickname = (body.get("nickname") or "").strip()
        if not nickname:
            return err("nickname обязателен")
        with conn.cursor() as cur:
            cur.execute("UPDATE chat_banned_nicks SET is_active = FALSE WHERE nickname = %s", (nickname,))
            conn.commit()
        return ok({"message": f"Ник «{nickname}» разбанен"})

    if action == "chat_banned_nicks":
        with conn.cursor() as cur:
            cur.execute("""
                SELECT b.nickname, b.banned_at, u.nickname as admin_nick
                FROM chat_banned_nicks b
                LEFT JOIN club_users u ON b.banned_by = u.id
                WHERE b.is_active = TRUE
                ORDER BY b.banned_at DESC
            """)
            rows = cur.fetchall()
        bans = [{"nickname": r[0], "banned_at": r[1].isoformat(), "banned_by": r[2]} for r in rows]
        return ok({"bans": bans})

    conn.close()
    return err("Неизвестное действие", 400)