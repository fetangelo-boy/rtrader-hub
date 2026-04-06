"""
API журнала действий администраторов.
GET / — список последних действий (требует X-Admin-Token)
"""

import json
import os
import psycopg2
import psycopg2.extras

CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Admin-Token",
}

SCHEMA = "t_p67093308_rtrader_hub"


def get_connection():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def get_username(conn, token: str) -> str:
    cur = conn.cursor()
    cur.execute(
        f"SELECT username FROM {SCHEMA}.admin_sessions WHERE token = %s AND expires_at > NOW()",
        (token,)
    )
    row = cur.fetchone()
    cur.close()
    return row[0] if row else ""


def handler(event: dict, context) -> dict:
    """Журнал действий администраторов: кто, что и когда изменил."""
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS_HEADERS, "body": ""}

    token = (event.get("headers") or {}).get("X-Admin-Token", "").strip()
    if not token:
        return {"statusCode": 401, "headers": {**CORS_HEADERS, "Content-Type": "application/json"},
                "body": json.dumps({"error": "Unauthorized"})}

    conn = get_connection()
    username = get_username(conn, token)
    if not username:
        conn.close()
        return {"statusCode": 401, "headers": {**CORS_HEADERS, "Content-Type": "application/json"},
                "body": json.dumps({"error": "Unauthorized"})}

    params = event.get("queryStringParameters") or {}
    limit = min(int(params.get("limit", 100)), 500)

    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    cur.execute(
        f"""
        SELECT id, username, action, details,
               to_char(created_at, 'DD.MM.YYYY HH24:MI:SS') as created_at
        FROM {SCHEMA}.admin_activity_log
        ORDER BY created_at DESC
        LIMIT %s
        """,
        (limit,)
    )
    rows = [dict(r) for r in cur.fetchall()]
    cur.close()
    conn.close()

    return {
        "statusCode": 200,
        "headers": {**CORS_HEADERS, "Content-Type": "application/json"},
        "body": json.dumps({"log": rows}, ensure_ascii=False, default=str),
    }
