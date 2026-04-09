"""
Управление ценами тарифов — только owner/admin.
GET  ?action=list           — список всех тарифов
POST ?action=update         — обновить цену {plan_key, price}
POST ?action=toggle         — включить/выключить тариф {plan_key, is_active}
"""
import json
import os
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
    action = qs.get("action", "list")

    if action == "list":
        with conn.cursor() as cur:
            cur.execute("SELECT plan_key, name, price, days, is_active FROM pricing_plans ORDER BY days ASC")
            rows = cur.fetchall()
        return ok({"plans": [
            {"plan_key": r[0], "name": r[1], "price": r[2], "days": r[3], "is_active": r[4]}
            for r in rows
        ]})

    if action == "update":
        body = json.loads(event.get("body") or "{}")
        plan_key = body.get("plan_key", "")
        price = body.get("price")
        if not plan_key or price is None:
            return err("plan_key и price обязательны")
        price = int(price)
        if price < 0:
            return err("Цена не может быть отрицательной")
        with conn.cursor() as cur:
            cur.execute("UPDATE pricing_plans SET price = %s, updated_at = NOW() WHERE plan_key = %s RETURNING plan_key", (price, plan_key))
            if not cur.fetchone():
                return err("Тариф не найден", 404)
            conn.commit()
        return ok({"message": "Цена обновлена"})

    if action == "toggle":
        body = json.loads(event.get("body") or "{}")
        plan_key = body.get("plan_key", "")
        is_active = body.get("is_active")
        if not plan_key or is_active is None:
            return err("plan_key и is_active обязательны")
        with conn.cursor() as cur:
            cur.execute("UPDATE pricing_plans SET is_active = %s, updated_at = NOW() WHERE plan_key = %s RETURNING plan_key", (bool(is_active), plan_key))
            if not cur.fetchone():
                return err("Тариф не найден", 404)
            conn.commit()
        return ok({"message": "Статус обновлён"})

    return err("Неизвестное действие", 400)
