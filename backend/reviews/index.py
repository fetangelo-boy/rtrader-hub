"""
API для отзывов RTrader.
GET / — получить одобренные отзывы
POST / — отправить новый отзыв (сохраняется на модерацию)
"""

import json
import os
import psycopg2

CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
}


def get_connection():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def handler(event: dict, context) -> dict:
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS_HEADERS, "body": ""}

    method = event.get("httpMethod", "GET")

    if method == "GET":
        conn = get_connection()
        cur = conn.cursor()
        cur.execute(
            """
            SELECT id, name, status, text, created_at
            FROM t_p67093308_rtrader_hub.reviews
            WHERE is_approved = TRUE
            ORDER BY created_at DESC
            LIMIT 50
            """
        )
        rows = cur.fetchall()
        cur.close()
        conn.close()

        reviews = [
            {
                "id": r[0],
                "name": r[1],
                "status": r[2],
                "text": r[3],
                "created_at": r[4].isoformat() if r[4] else None,
            }
            for r in rows
        ]
        return {
            "statusCode": 200,
            "headers": {**CORS_HEADERS, "Content-Type": "application/json"},
            "body": json.dumps({"reviews": reviews}, ensure_ascii=False),
        }

    if method == "POST":
        body = json.loads(event.get("body") or "{}")
        name = (body.get("name") or "").strip()
        status = (body.get("status") or "").strip()
        text = (body.get("text") or "").strip()

        if not name or not text:
            return {
                "statusCode": 400,
                "headers": {**CORS_HEADERS, "Content-Type": "application/json"},
                "body": json.dumps({"error": "Имя и текст обязательны"}),
            }

        if len(text) > 2000:
            return {
                "statusCode": 400,
                "headers": {**CORS_HEADERS, "Content-Type": "application/json"},
                "body": json.dumps({"error": "Текст слишком длинный"}),
            }

        conn = get_connection()
        cur = conn.cursor()
        cur.execute(
            """
            INSERT INTO t_p67093308_rtrader_hub.reviews (name, status, text)
            VALUES (%s, %s, %s)
            RETURNING id
            """,
            (name[:100], status[:100], text),
        )
        new_id = cur.fetchone()[0]
        conn.commit()
        cur.close()
        conn.close()

        return {
            "statusCode": 201,
            "headers": {**CORS_HEADERS, "Content-Type": "application/json"},
            "body": json.dumps({"ok": True, "id": new_id}, ensure_ascii=False),
        }

    return {
        "statusCode": 405,
        "headers": {**CORS_HEADERS, "Content-Type": "application/json"},
        "body": json.dumps({"error": "Method not allowed"}),
    }
