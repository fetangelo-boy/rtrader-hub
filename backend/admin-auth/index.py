"""
Auth для admin-зоны. Вариант 2 — токен сессии.
POST /        — { "password": "..." } → { "ok": true, "token": "..." }
POST /logout  — { "token": "..." }    → { "ok": true }  (инвалидирует токен)
POST /verify  — { "token": "..." }    → { "ok": true } или 401
"""

import json
import os
import secrets
import psycopg2

CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
}

SCHEMA = "t_p67093308_rtrader_hub"


def get_connection():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def handler(event: dict, context) -> dict:
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS_HEADERS, "body": ""}

    if event.get("httpMethod") != "POST":
        return {"statusCode": 405, "headers": CORS_HEADERS,
                "body": json.dumps({"error": "Method not allowed"})}

    params = event.get("queryStringParameters") or {}
    action = params.get("action", "login")
    if action not in ("login", "logout", "verify"):
        action = "login"

    body = json.loads(event.get("body") or "{}")

    # ── VERIFY TOKEN ──────────────────────────────────────────────────────────
    if action == "verify":
        token = (body.get("token") or "").strip()
        if not token:
            return {"statusCode": 401, "headers": CORS_HEADERS,
                    "body": json.dumps({"error": "No token"})}
        conn = get_connection()
        cur = conn.cursor()
        cur.execute(
            f"SELECT id FROM {SCHEMA}.admin_sessions "
            f"WHERE token = %s AND expires_at > NOW()",
            (token,)
        )
        row = cur.fetchone()
        cur.close()
        conn.close()
        if row:
            return {"statusCode": 200, "headers": CORS_HEADERS,
                    "body": json.dumps({"ok": True})}
        return {"statusCode": 401, "headers": CORS_HEADERS,
                "body": json.dumps({"error": "Invalid or expired token"})}

    # ── LOGOUT ────────────────────────────────────────────────────────────────
    if action == "logout":
        token = (body.get("token") or "").strip()
        if token:
            conn = get_connection()
            cur = conn.cursor()
            cur.execute(f"DELETE FROM {SCHEMA}.admin_sessions WHERE token = %s", (token,))
            conn.commit()
            cur.close()
            conn.close()
        return {"statusCode": 200, "headers": CORS_HEADERS,
                "body": json.dumps({"ok": True})}

    # ── LOGIN ─────────────────────────────────────────────────────────────────
    admin_password = os.environ.get("ADMIN_PASSWORD", "")
    if not admin_password:
        return {"statusCode": 500, "headers": CORS_HEADERS,
                "body": json.dumps({"error": "ADMIN_PASSWORD не настроен"})}

    password = (body.get("password") or "").strip()
    if password != admin_password:
        return {"statusCode": 401, "headers": CORS_HEADERS,
                "body": json.dumps({"error": "Неверный пароль"})}

    token = secrets.token_hex(32)
    conn = get_connection()
    cur = conn.cursor()
    cur.execute(
        f"INSERT INTO {SCHEMA}.admin_sessions (token) VALUES (%s)",
        (token,)
    )
    conn.commit()
    cur.close()
    conn.close()

    return {
        "statusCode": 200,
        "headers": {**CORS_HEADERS, "Content-Type": "application/json"},
        "body": json.dumps({"ok": True, "token": token}),
    }