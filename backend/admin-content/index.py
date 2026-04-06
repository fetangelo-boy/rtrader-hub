"""
Admin API для управления текстовым контентом сайта.
GET /  — все записи контента (можно фильтровать ?section=home)
PUT /  — { "section": "home", "key": "hero_title", "value": "..." }
Все запросы требуют заголовок X-Admin-Token.
"""

import json
import os
import psycopg2
import psycopg2.extras

CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, PUT, OPTIONS",
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
        section = params.get("section")
        if section:
            cur.execute(
                f"SELECT id, section, key, value, label, to_char(updated_at, 'DD.MM.YYYY HH24:MI') as updated_at "
                f"FROM {SCHEMA}.site_content WHERE section = %s ORDER BY section, key",
                (section,),
            )
        else:
            cur.execute(
                f"SELECT id, section, key, value, label, to_char(updated_at, 'DD.MM.YYYY HH24:MI') as updated_at "
                f"FROM {SCHEMA}.site_content ORDER BY section, key"
            )
        items = [dict(r) for r in cur.fetchall()]
        cur.close()
        conn.close()
        return {
            "statusCode": 200,
            "headers": {**CORS_HEADERS, "Content-Type": "application/json"},
            "body": json.dumps({"content": items}, ensure_ascii=False),
        }

    if method == "PUT":
        body = json.loads(event.get("body") or "{}")
        section = (body.get("section") or "").strip()
        key = (body.get("key") or "").strip()
        value = body.get("value", "")

        if not section or not key:
            return {
                "statusCode": 400,
                "headers": {**CORS_HEADERS, "Content-Type": "application/json"},
                "body": json.dumps({"error": "section и key обязательны"}),
            }

        conn = get_connection()
        cur = conn.cursor()
        cur.execute(
            f"UPDATE {SCHEMA}.site_content SET value = %s, updated_at = NOW() "
            f"WHERE section = %s AND key = %s",
            (str(value), section, key),
        )
        if cur.rowcount == 0:
            conn.close()
            return {
                "statusCode": 404,
                "headers": {**CORS_HEADERS, "Content-Type": "application/json"},
                "body": json.dumps({"error": "Запись не найдена"}),
            }
        conn.commit()
        cur.close()
        conn.close()
        return {"statusCode": 200, "headers": {**CORS_HEADERS, "Content-Type": "application/json"},
                "body": json.dumps({"ok": True})}

    return {"statusCode": 405, "headers": CORS_HEADERS,
            "body": json.dumps({"error": "Method not allowed"})}
