"""
Публичный API для чтения контента сайта (без авторизации).
GET /?section=reflections  — список видимых материалов
"""

import json
import os
import psycopg2
import psycopg2.extras

CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
}

SCHEMA = "t_p67093308_rtrader_hub"
ALLOWED = {"reflections", "analytics", "education", "tournaments", "author"}


def get_connection():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def handler(event: dict, context) -> dict:
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS_HEADERS, "body": ""}

    params = event.get("queryStringParameters") or {}
    section = (params.get("section") or "").strip()

    if section not in ALLOWED:
        return {
            "statusCode": 400,
            "headers": {**CORS_HEADERS, "Content-Type": "application/json"},
            "body": json.dumps({"error": "Unknown section"}),
        }

    conn = get_connection()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

    if section == "author":
        cur.execute(f"SELECT * FROM {SCHEMA}.author ORDER BY id LIMIT 1")
        row = cur.fetchone()
        cur.close(); conn.close()
        return {
            "statusCode": 200,
            "headers": {**CORS_HEADERS, "Content-Type": "application/json"},
            "body": json.dumps({"item": dict(row) if row else None},
                               ensure_ascii=False, default=str),
        }

    order_map = {
        "reflections": "sort_order ASC, created_at DESC",
        "analytics":   "sort_order ASC, created_at DESC",
        "education":   "sort_order ASC, created_at DESC",
        "tournaments": "sort_order ASC, created_at DESC",
    }
    cur.execute(
        f"SELECT * FROM {SCHEMA}.{section} WHERE is_visible = TRUE ORDER BY {order_map[section]}"
    )
    rows = [dict(r) for r in cur.fetchall()]
    cur.close(); conn.close()

    return {
        "statusCode": 200,
        "headers": {**CORS_HEADERS, "Content-Type": "application/json"},
        "body": json.dumps({"items": rows}, ensure_ascii=False, default=str),
    }
