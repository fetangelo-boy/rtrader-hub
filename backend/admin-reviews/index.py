"""
Admin API для модерации отзывов.
GET /        — все отзывы (и одобренные, и нет)
PATCH /?id=N — { "is_approved": true/false }
DELETE /?id=N — удалить отзыв
Все запросы требуют заголовок X-Admin-Token.
"""

import json
import os
import psycopg2
import psycopg2.extras

CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, PATCH, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Admin-Token",
}

SCHEMA = "t_p67093308_rtrader_hub"


def get_connection():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def check_token(event: dict) -> bool:
    token = (event.get("headers") or {}).get("X-Admin-Token", "").strip()
    if not token:
        return False
    conn = get_connection()
    cur = conn.cursor()
    cur.execute(
        f"SELECT id FROM {SCHEMA}.admin_sessions WHERE token = %s AND expires_at > NOW()",
        (token,)
    )
    row = cur.fetchone()
    cur.close()
    conn.close()
    return row is not None


def handler(event: dict, context) -> dict:
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS_HEADERS, "body": ""}

    if not check_token(event):
        return {
            "statusCode": 401,
            "headers": {**CORS_HEADERS, "Content-Type": "application/json"},
            "body": json.dumps({"error": "Unauthorized"}),
        }

    method = event.get("httpMethod", "GET")
    params = event.get("queryStringParameters") or {}

    if method == "GET":
        conn = get_connection()
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute(
            f"""
            SELECT id, name, status, text, is_approved,
                   to_char(created_at, 'DD.MM.YYYY HH24:MI') as created_at
            FROM {SCHEMA}.reviews
            ORDER BY created_at DESC
            """
        )
        reviews = [dict(r) for r in cur.fetchall()]
        cur.close()
        conn.close()
        return {
            "statusCode": 200,
            "headers": {**CORS_HEADERS, "Content-Type": "application/json"},
            "body": json.dumps({"reviews": reviews}, ensure_ascii=False),
        }

    if method == "PATCH":
        review_id = params.get("id")
        if not review_id:
            return {"statusCode": 400, "headers": CORS_HEADERS,
                    "body": json.dumps({"error": "id required"})}
        body = json.loads(event.get("body") or "{}")
        is_approved = body.get("is_approved")
        if is_approved is None:
            return {"statusCode": 400, "headers": CORS_HEADERS,
                    "body": json.dumps({"error": "is_approved required"})}
        conn = get_connection()
        cur = conn.cursor()
        cur.execute(
            f"UPDATE {SCHEMA}.reviews SET is_approved = %s WHERE id = %s",
            (bool(is_approved), int(review_id)),
        )
        conn.commit()
        cur.close()
        conn.close()
        return {"statusCode": 200, "headers": {**CORS_HEADERS, "Content-Type": "application/json"},
                "body": json.dumps({"ok": True})}

    if method == "DELETE":
        review_id = params.get("id")
        if not review_id:
            return {"statusCode": 400, "headers": CORS_HEADERS,
                    "body": json.dumps({"error": "id required"})}
        conn = get_connection()
        cur = conn.cursor()
        cur.execute(f"DELETE FROM {SCHEMA}.reviews WHERE id = %s", (int(review_id),))
        conn.commit()
        cur.close()
        conn.close()
        return {"statusCode": 200, "headers": {**CORS_HEADERS, "Content-Type": "application/json"},
                "body": json.dumps({"ok": True})}

    return {"statusCode": 405, "headers": CORS_HEADERS,
            "body": json.dumps({"error": "Method not allowed"})}
