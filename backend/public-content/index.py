"""
Публичный API для чтения контента сайта (без авторизации).
GET /?section=reflections          — список видимых материалов
GET /?action=sections              — видимость разделов навигации
GET /?action=content&section=home  — тексты site_content по секции
GET /?action=legal&doc=terms|privacy|rules — текст юридического документа
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

    if params.get("action") == "sections":
        conn = get_connection()
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute(f"SELECT key, label, is_visible FROM {SCHEMA}.site_sections ORDER BY key")
        sections = [dict(r) for r in cur.fetchall()]
        cur.close(); conn.close()
        return {
            "statusCode": 200,
            "headers": {**CORS_HEADERS, "Content-Type": "application/json"},
            "body": json.dumps({"sections": sections}, ensure_ascii=False),
        }

    if params.get("action") == "legal":
        doc = (params.get("doc") or "").strip()
        if doc not in ("terms", "privacy", "rules"):
            return {
                "statusCode": 400,
                "headers": {**CORS_HEADERS, "Content-Type": "application/json"},
                "body": json.dumps({"error": "Unknown doc"}),
            }
        conn = get_connection()
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute(
            f"SELECT value FROM {SCHEMA}.site_content WHERE section = 'legal' AND key = %s",
            (f"{doc}_text",)
        )
        row = cur.fetchone()
        cur.execute(
            f"SELECT value FROM {SCHEMA}.site_content WHERE section = 'legal' AND key = %s",
            (f"{doc}_version",)
        )
        ver = cur.fetchone()
        cur.close(); conn.close()
        return {
            "statusCode": 200,
            "headers": {**CORS_HEADERS, "Content-Type": "application/json"},
            "body": json.dumps({
                "text": row["value"] if row else "",
                "version": ver["value"] if ver else "1.0",
            }, ensure_ascii=False),
        }

    if params.get("action") == "content":
        section_name = (params.get("section") or "").strip()
        conn = get_connection()
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute(
            f"SELECT key, value, label FROM {SCHEMA}.site_content WHERE section = %s ORDER BY key",
            (section_name,)
        )
        items = [dict(r) for r in cur.fetchall()]
        cur.close(); conn.close()
        return {
            "statusCode": 200,
            "headers": {**CORS_HEADERS, "Content-Type": "application/json"},
            "body": json.dumps({"content": items}, ensure_ascii=False),
        }

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