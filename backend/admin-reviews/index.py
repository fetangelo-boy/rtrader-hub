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


def get_username(conn, token: str) -> str:
    cur = conn.cursor()
    cur.execute(
        f"SELECT u.nickname FROM {SCHEMA}.club_sessions s "
        f"JOIN {SCHEMA}.club_users u ON u.id = s.user_id "
        f"WHERE s.token=%s AND s.expires_at>NOW() AND u.role IN ('owner','admin')",
        (token,)
    )
    row = cur.fetchone()
    if row:
        cur.close()
        return row[0]
    cur.execute(
        f"SELECT username FROM {SCHEMA}.admin_sessions WHERE token = %s AND expires_at > NOW()",
        (token,)
    )
    row = cur.fetchone()
    cur.close()
    return row[0] if row else ""


def log_action(conn, username: str, action: str, details: dict):
    cur = conn.cursor()
    cur.execute(
        f"INSERT INTO {SCHEMA}.admin_activity_log (username, action, details) VALUES (%s, %s, %s)",
        (username, action, json.dumps(details, ensure_ascii=False))
    )
    cur.close()


def handler(event: dict, context) -> dict:
    """Модерация отзывов: просмотр, одобрение, удаление."""
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

    method = event.get("httpMethod", "GET")
    params = event.get("queryStringParameters") or {}

    if method == "GET":
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
            conn.close()
            return {"statusCode": 400, "headers": CORS_HEADERS,
                    "body": json.dumps({"error": "id required"})}
        body = json.loads(event.get("body") or "{}")
        is_approved = body.get("is_approved")
        if is_approved is None:
            conn.close()
            return {"statusCode": 400, "headers": CORS_HEADERS,
                    "body": json.dumps({"error": "is_approved required"})}
        cur = conn.cursor()
        cur.execute(
            f"UPDATE {SCHEMA}.reviews SET is_approved = %s WHERE id = %s",
            (bool(is_approved), int(review_id)),
        )
        log_action(conn, username, "review_approve" if is_approved else "review_reject",
                   {"review_id": int(review_id), "is_approved": bool(is_approved)})
        conn.commit()
        cur.close()
        conn.close()
        return {"statusCode": 200, "headers": {**CORS_HEADERS, "Content-Type": "application/json"},
                "body": json.dumps({"ok": True})}

    if method == "DELETE":
        review_id = params.get("id")
        if not review_id:
            conn.close()
            return {"statusCode": 400, "headers": CORS_HEADERS,
                    "body": json.dumps({"error": "id required"})}
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute(f"SELECT id, name, text FROM {SCHEMA}.reviews WHERE id = %s", (int(review_id),))
        review = cur.fetchone()
        cur.close()
        cur = conn.cursor()
        cur.execute(f"DELETE FROM {SCHEMA}.reviews WHERE id = %s", (int(review_id),))
        log_action(conn, username, "review_delete",
                   {"review_id": int(review_id), "name": review["name"] if review else "", "text": (review["text"] or "")[:100] if review else ""})
        conn.commit()
        cur.close()
        conn.close()
        return {"statusCode": 200, "headers": {**CORS_HEADERS, "Content-Type": "application/json"},
                "body": json.dumps({"ok": True})}

    conn.close()
    return {"statusCode": 405, "headers": CORS_HEADERS,
            "body": json.dumps({"error": "Method not allowed"})}