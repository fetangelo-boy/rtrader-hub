"""
Финансовая статистика для владельца/админа.
?action=overview        — сводка: активные подписки, выручка, регистрации
?action=expiring        — кто скоро теряет доступ (ближайшие 30 дней)
?action=revenue         — выручка по периоду: ?days=30|90|365
?action=registrations   — регистрации по дням за период: ?days=30
"""
import json
import os
import psycopg2

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Auth-Token",
}

PLAN_PRICE = {"week": 990, "month": 2490, "quarter": 5990, "halfyear": 9990, "loyal": 1990}

def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])

def ok(data):
    return {"statusCode": 200, "headers": {**CORS, "Content-Type": "application/json"}, "body": json.dumps(data, ensure_ascii=False, default=str)}

def err(msg, status=400):
    return {"statusCode": status, "headers": {**CORS, "Content-Type": "application/json"}, "body": json.dumps({"error": msg}, ensure_ascii=False)}

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

    token = event.get("headers", {}).get("X-Auth-Token", "")
    conn = get_conn()
    admin = get_admin(conn, token)
    if not admin:
        return err("Нет доступа", 403)

    qs = event.get("queryStringParameters") or {}
    action = qs.get("action", "overview")

    if action == "overview":
        with conn.cursor() as cur:
            # Активные подписки
            cur.execute("SELECT COUNT(*) FROM club_subscriptions WHERE status='active' AND (expires_at IS NULL OR expires_at > NOW())")
            active_subs = cur.fetchone()[0]

            # Всего пользователей
            cur.execute("SELECT COUNT(*) FROM club_users")
            total_users = cur.fetchone()[0]

            # Новых за 30 дней
            cur.execute("SELECT COUNT(*) FROM club_users WHERE created_at > NOW() - INTERVAL '30 days'")
            new_users_30d = cur.fetchone()[0]

            # Оплаты за 30 дней (одобренные)
            cur.execute("""
                SELECT plan, COUNT(*) FROM club_subscriptions
                WHERE status IN ('active','expired') AND created_at > NOW() - INTERVAL '30 days'
                GROUP BY plan
            """)
            plans_30d = cur.fetchall()

            # Выручка за 30 дней (из pricing_plans)
            cur.execute("SELECT plan_key, price FROM pricing_plans")
            prices = {r[0]: r[1] for r in cur.fetchall()}

            revenue_30d = sum(prices.get(p, PLAN_PRICE.get(p, 0)) * cnt for p, cnt in plans_30d)
            payments_30d = sum(cnt for _, cnt in plans_30d)

            # Ожидают одобрения (исключаем owner-ов)
            cur.execute("""
                SELECT COUNT(*) FROM club_subscriptions s
                JOIN club_users u ON s.user_id = u.id
                WHERE s.status = 'pending' AND u.role NOT IN ('owner', 'admin')
            """)
            pending = cur.fetchone()[0]

            # Истекают в течение 7 дней
            cur.execute("""
                SELECT COUNT(*) FROM club_subscriptions
                WHERE status='active' AND expires_at BETWEEN NOW() AND NOW() + INTERVAL '7 days'
            """)
            expiring_7d = cur.fetchone()[0]

        return ok({
            "active_subscriptions": active_subs,
            "total_users": total_users,
            "new_users_30d": new_users_30d,
            "payments_30d": payments_30d,
            "revenue_30d": revenue_30d,
            "pending_payments": pending,
            "expiring_7d": expiring_7d,
        })

    if action == "expiring":
        days = min(int(qs.get("days", 30)), 90)
        with conn.cursor() as cur:
            cur.execute("""
                SELECT u.nickname, u.email, s.plan, s.expires_at, s.id
                FROM club_subscriptions s
                JOIN club_users u ON s.user_id = u.id
                WHERE s.status = 'active'
                  AND s.expires_at BETWEEN NOW() AND NOW() + INTERVAL '%s days'
                ORDER BY s.expires_at ASC
            """ % days)
            rows = cur.fetchall()
        return ok({"expiring": [
            {"nickname": r[0], "email": r[1], "plan": r[2], "expires_at": r[3].isoformat() if r[3] else None, "subscription_id": r[4]}
            for r in rows
        ]})

    if action == "revenue":
        days = int(qs.get("days", 30))
        with conn.cursor() as cur:
            cur.execute("SELECT plan_key, price FROM pricing_plans")
            prices = {r[0]: r[1] for r in cur.fetchall()}

            cur.execute("""
                SELECT plan, COUNT(*) FROM club_subscriptions
                WHERE status IN ('active','expired')
                  AND created_at > NOW() - INTERVAL '%s days'
                GROUP BY plan ORDER BY COUNT(*) DESC
            """ % days)
            rows = cur.fetchall()

        breakdown = [{"plan": r[0], "count": r[1], "revenue": prices.get(r[0], PLAN_PRICE.get(r[0], 0)) * r[1]} for r in rows]
        total = sum(b["revenue"] for b in breakdown)
        total_count = sum(b["count"] for b in breakdown)
        return ok({"total_revenue": total, "total_payments": total_count, "breakdown": breakdown, "days": days})

    if action == "registrations":
        days = min(int(qs.get("days", 30)), 365)
        with conn.cursor() as cur:
            cur.execute("""
                SELECT DATE(created_at) AS day, COUNT(*) FROM club_users
                WHERE created_at > NOW() - INTERVAL '%s days'
                GROUP BY day ORDER BY day ASC
            """ % days)
            rows = cur.fetchall()
        return ok({"registrations": [{"date": str(r[0]), "count": r[1]} for r in rows], "days": days})

    if action == "subscribers_csv":
        with conn.cursor() as cur:
            cur.execute("""
                SELECT u.nickname, u.email, u.telegram_username, u.role,
                       s.plan, s.status, s.expires_at, s.created_at
                FROM club_users u
                LEFT JOIN LATERAL (
                    SELECT plan, status, expires_at, created_at FROM club_subscriptions
                    WHERE user_id = u.id ORDER BY created_at DESC LIMIT 1
                ) s ON true
                WHERE u.role != 'owner'
                ORDER BY s.created_at DESC NULLS LAST
            """)
            rows = cur.fetchall()
        PLAN_LABELS = {"week": "1 неделя", "month": "1 месяц", "quarter": "3 месяца", "halfyear": "6 месяцев", "loyal": "Лояльный"}
        STATUS_LABELS = {"active": "Активна", "expired": "Истекла", "pending": "Ожидает", "rejected": "Отклонено"}
        lines = ["Никнейм,Email,Telegram,Роль,Тариф,Статус,Действует до,Дата подписки"]
        for r in rows:
            expires = r[6].strftime("%d.%m.%Y") if r[6] else ""
            created = r[7].strftime("%d.%m.%Y") if r[7] else ""
            plan = PLAN_LABELS.get(r[4] or "", r[4] or "")
            status = STATUS_LABELS.get(r[5] or "", r[5] or "")
            tg = f"@{r[2]}" if r[2] else ""
            lines.append(f'"{r[0] or ""}","{r[1]}","{tg}","{r[3] or ""}","{plan}","{status}","{expires}","{created}"')
        return {
            "statusCode": 200,
            "headers": {**CORS, "Content-Type": "text/csv; charset=utf-8",
                        "Content-Disposition": "attachment; filename=subscribers.csv"},
            "body": "\n".join(lines),
        }

    if action == "payments_csv":
        days = int(qs.get("days", 365))
        with conn.cursor() as cur:
            cur.execute("SELECT plan_key, price FROM pricing_plans")
            prices = {r[0]: r[1] for r in cur.fetchall()}
            cur.execute("""
                SELECT u.nickname, u.email, u.telegram_username,
                       s.plan, s.created_at, s.status
                FROM club_subscriptions s
                JOIN club_users u ON s.user_id = u.id
                WHERE s.status IN ('active', 'expired')
                  AND s.created_at > NOW() - INTERVAL '{days} days'
                  AND u.role NOT IN ('owner', 'admin')
                ORDER BY s.created_at DESC
            """.replace("{days}", str(days)))
            rows = cur.fetchall()
        PLAN_LABELS = {"week": "1 неделя", "month": "1 месяц", "quarter": "3 месяца", "halfyear": "6 месяцев", "loyal": "Лояльный"}
        lines = ["Никнейм,Email,Telegram,Тариф,Сумма (₽),Дата"]
        for r in rows:
            amount = prices.get(r[3] or "", PLAN_PRICE.get(r[3] or "", 0))
            created = r[4].strftime("%d.%m.%Y") if r[4] else ""
            plan = PLAN_LABELS.get(r[3] or "", r[3] or "")
            tg = f"@{r[2]}" if r[2] else ""
            lines.append(f'"{r[0] or ""}","{r[1]}","{tg}","{plan}","{amount}","{created}"')
        return {
            "statusCode": 200,
            "headers": {**CORS, "Content-Type": "text/csv; charset=utf-8",
                        "Content-Disposition": "attachment; filename=payments.csv"},
            "body": "\n".join(lines),
        }

    if action == "users_csv":
        with conn.cursor() as cur:
            cur.execute("""
                SELECT nickname, email, telegram_username, role, created_at
                FROM club_users
                WHERE role != 'owner'
                ORDER BY created_at DESC
            """)
            rows = cur.fetchall()
        lines = ["Никнейм,Email,Telegram,Роль,Дата регистрации"]
        for r in rows:
            created = r[4].strftime("%d.%m.%Y") if r[4] else ""
            tg = f"@{r[2]}" if r[2] else ""
            lines.append(f'"{r[0] or ""}","{r[1]}","{tg}","{r[3] or ""}","{created}"')
        return {
            "statusCode": 200,
            "headers": {**CORS, "Content-Type": "text/csv; charset=utf-8",
                        "Content-Disposition": "attachment; filename=users.csv"},
            "body": "\n".join(lines),
        }

    if action == "consents_csv":
        with conn.cursor() as cur:
            cur.execute("""
                SELECT c.id, c.email, c.ip_address, c.doc_key, c.doc_version,
                       c.accepted_at, c.user_id
                FROM consent_log c
                ORDER BY c.accepted_at DESC
            """)
            rows = cur.fetchall()
        lines = ["id,email,ip_address,doc_key,doc_version,accepted_at,user_id"]
        for r in rows:
            lines.append(f'{r[0]},"{r[1]}","{r[2] or ""}",{r[3]},{r[4]},{r[5].isoformat() if r[5] else ""},{r[6] or ""}')
        csv_body = "\n".join(lines)
        return {
            "statusCode": 200,
            "headers": {
                **CORS,
                "Content-Type": "text/csv; charset=utf-8",
                "Content-Disposition": "attachment; filename=consents.csv",
            },
            "body": csv_body,
        }

    return err("Неизвестное действие", 400)