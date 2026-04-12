"""
Публичный API для чтения контента сайта (без авторизации).
GET /?section=reflections          — список видимых материалов
GET /?action=sections              — видимость разделов навигации
GET /?action=content&section=home  — тексты site_content по секции
GET /?action=legal&doc=terms|privacy|rules — текст юридического документа
Кеш 5 минут для sections и content, 2 минуты для материалов.
"""

import json
import os
import time
import psycopg2
import psycopg2.extras

CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
}

SCHEMA = "t_p67093308_rtrader_hub"
ALLOWED = {"reflections", "analytics", "education", "tournaments", "author"}

CACHE_TTL_CONTENT = 300   # 5 минут для sections / site_content / legal
CACHE_TTL_ITEMS   = 120   # 2 минуты для списков материалов

_cache: dict = {}


def cache_get(key: str):
    entry = _cache.get(key)
    if entry and time.time() - entry["ts"] < entry["ttl"]:
        return entry["data"]
    return None


def cache_set(key: str, data, ttl: int):
    _cache[key] = {"data": data, "ts": time.time(), "ttl": ttl}


def get_connection():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def json_ok(data, ttl_header: int = 300):
    return {
        "statusCode": 200,
        "headers": {
            **CORS_HEADERS,
            "Content-Type": "application/json",
            "Cache-Control": f"public, max-age={ttl_header}",
        },
        "body": json.dumps(data, ensure_ascii=False, default=str),
    }


def handler(event: dict, context) -> dict:
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS_HEADERS, "body": ""}

    params = event.get("queryStringParameters") or {}

    # --- sections ---
    if params.get("action") == "sections":
        cached = cache_get("sections")
        if cached:
            return json_ok(cached, CACHE_TTL_CONTENT)
        conn = get_connection()
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute(f"SELECT key, label, is_visible FROM {SCHEMA}.site_sections ORDER BY key")
        sections = [dict(r) for r in cur.fetchall()]
        cur.close(); conn.close()
        data = {"sections": sections}
        cache_set("sections", data, CACHE_TTL_CONTENT)
        return json_ok(data, CACHE_TTL_CONTENT)

    # --- legal ---
    if params.get("action") == "legal":
        doc = (params.get("doc") or "").strip()
        if doc not in ("terms", "privacy", "rules"):
            return {
                "statusCode": 400,
                "headers": {**CORS_HEADERS, "Content-Type": "application/json"},
                "body": json.dumps({"error": "Unknown doc"}),
            }
        cache_key = f"legal_{doc}"
        cached = cache_get(cache_key)
        if cached:
            return json_ok(cached, CACHE_TTL_CONTENT)
        conn = get_connection()
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute(
            f"SELECT value FROM {SCHEMA}.site_content WHERE section = 'legal' AND key = '{doc}_text'"
        )
        row = cur.fetchone()
        cur.execute(
            f"SELECT value FROM {SCHEMA}.site_content WHERE section = 'legal' AND key = '{doc}_version'"
        )
        ver = cur.fetchone()
        cur.close(); conn.close()
        data = {
            "text": row["value"] if row else "",
            "version": ver["value"] if ver else "1.0",
        }
        cache_set(cache_key, data, CACHE_TTL_CONTENT)
        return json_ok(data, CACHE_TTL_CONTENT)

    # --- site_content по секции ---
    if params.get("action") == "content":
        section_name = (params.get("section") or "").strip()
        cache_key = f"content_{section_name}"
        cached = cache_get(cache_key)
        if cached:
            return json_ok(cached, CACHE_TTL_CONTENT)
        conn = get_connection()
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute(
            f"SELECT key, value, label FROM {SCHEMA}.site_content WHERE section = '{section_name}' ORDER BY key"
        )
        items = [dict(r) for r in cur.fetchall()]
        cur.close(); conn.close()
        data = {"content": items}
        cache_set(cache_key, data, CACHE_TTL_CONTENT)
        return json_ok(data, CACHE_TTL_CONTENT)

    # --- списки материалов ---
    section = (params.get("section") or "").strip()
    if section not in ALLOWED:
        return {
            "statusCode": 400,
            "headers": {**CORS_HEADERS, "Content-Type": "application/json"},
            "body": json.dumps({"error": "Unknown section"}),
        }

    cache_key = f"section_{section}"
    cached = cache_get(cache_key)
    if cached:
        return json_ok(cached, CACHE_TTL_ITEMS)

    conn = get_connection()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

    if section == "author":
        cur.execute(f"SELECT * FROM {SCHEMA}.author ORDER BY id LIMIT 1")
        row = cur.fetchone()
        cur.close(); conn.close()
        data = {"item": dict(row) if row else None}
        cache_set(cache_key, data, CACHE_TTL_CONTENT)
        return json_ok(data, CACHE_TTL_CONTENT)

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
    data = {"items": rows}
    cache_set(cache_key, data, CACHE_TTL_ITEMS)
    return json_ok(data, CACHE_TTL_ITEMS)
