"""
Auth для admin-зоны. Два аккаунта, логин+пароль.
POST /?action=login   — { "username": "...", "password": "..." } → { "ok": true, "token": "...", "username": "..." }
POST /?action=logout  — { "token": "..." }    → { "ok": true }
POST /?action=verify  — { "token": "..." }    → { "ok": true, "username": "..." } или 401
POST /?action=setup   — первичная инициализация пользователей из env
"""

import json
import os
import secrets
import hashlib
import psycopg2

CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
}

SCHEMA = "t_p67093308_rtrader_hub"


def get_connection():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()


def ensure_users(conn):
    """Создаёт пользователей если их ещё нет."""
    cur = conn.cursor()
    cur.execute(f"SELECT COUNT(*) FROM {SCHEMA}.admin_users")
    count = cur.fetchone()[0]
    if count == 0:
        admin_password = os.environ.get("ADMIN_PASSWORD", "")
        if admin_password:
            cur.execute(
                f"INSERT INTO {SCHEMA}.admin_users (username, password_hash) VALUES (%s, %s) ON CONFLICT DO NOTHING",
                ("admin", hash_password(admin_password))
            )
        cur.execute(
            f"INSERT INTO {SCHEMA}.admin_users (username, password_hash) VALUES (%s, %s) ON CONFLICT DO NOTHING",
            ("RTrader11", hash_password("RTrader11_4Ever"))
        )
        conn.commit()
    cur.close()


def handler(event: dict, context) -> dict:
    """Авторизация администраторов: вход по логину и паролю, управление сессиями."""
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS_HEADERS, "body": ""}

    if event.get("httpMethod") != "POST":
        return {"statusCode": 405, "headers": CORS_HEADERS,
                "body": json.dumps({"error": "Method not allowed"})}

    params = event.get("queryStringParameters") or {}
    action = params.get("action", "login")
    if action not in ("login", "logout", "verify", "setup"):
        action = "login"

    body = json.loads(event.get("body") or "{}")
    conn = get_connection()

    try:
        ensure_users(conn)

        # ── VERIFY ────────────────────────────────────────────────────────────
        if action == "verify":
            token = (body.get("token") or "").strip()
            if not token:
                return {"statusCode": 401, "headers": CORS_HEADERS,
                        "body": json.dumps({"error": "No token"})}
            cur = conn.cursor()
            cur.execute(
                f"SELECT username FROM {SCHEMA}.admin_sessions "
                f"WHERE token = %s AND expires_at > NOW()",
                (token,)
            )
            row = cur.fetchone()
            cur.close()
            if row:
                return {"statusCode": 200, "headers": CORS_HEADERS,
                        "body": json.dumps({"ok": True, "username": row[0]})}
            return {"statusCode": 401, "headers": CORS_HEADERS,
                    "body": json.dumps({"error": "Invalid or expired token"})}

        # ── LOGOUT ────────────────────────────────────────────────────────────
        if action == "logout":
            token = (body.get("token") or "").strip()
            if token:
                cur = conn.cursor()
                cur.execute(f"DELETE FROM {SCHEMA}.admin_sessions WHERE token = %s", (token,))
                conn.commit()
                cur.close()
            return {"statusCode": 200, "headers": CORS_HEADERS,
                    "body": json.dumps({"ok": True})}

        # ── LOGIN ─────────────────────────────────────────────────────────────
        username = (body.get("username") or "").strip()
        password = (body.get("password") or "").strip()

        if not username or not password:
            return {"statusCode": 401, "headers": CORS_HEADERS,
                    "body": json.dumps({"error": "Введите логин и пароль"})}

        cur = conn.cursor()
        cur.execute(
            f"SELECT id FROM {SCHEMA}.admin_users WHERE username = %s AND password_hash = %s",
            (username, hash_password(password))
        )
        row = cur.fetchone()
        cur.close()

        if not row:
            return {"statusCode": 401, "headers": CORS_HEADERS,
                    "body": json.dumps({"error": "Неверный логин или пароль"})}

        token = secrets.token_hex(32)
        cur = conn.cursor()
        cur.execute(
            f"INSERT INTO {SCHEMA}.admin_sessions (token, username) VALUES (%s, %s)",
            (token, username)
        )
        conn.commit()
        cur.close()

        return {
            "statusCode": 200,
            "headers": {**CORS_HEADERS, "Content-Type": "application/json"},
            "body": json.dumps({"ok": True, "token": token, "username": username}),
        }

    finally:
        conn.close()
