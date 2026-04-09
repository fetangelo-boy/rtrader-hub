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
    """Управление текстовым контентом сайта: чтение и обновление."""
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
            conn.close()
            return {
                "statusCode": 400,
                "headers": {**CORS_HEADERS, "Content-Type": "application/json"},
                "body": json.dumps({"error": "section и key обязательны"}),
            }

        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute(
            f"SELECT value FROM {SCHEMA}.site_content WHERE section = %s AND key = %s",
            (section, key)
        )
        old_row = cur.fetchone()
        old_value = old_row["value"] if old_row else ""
        cur.close()

        cur = conn.cursor()
        cur.execute(
            f"UPDATE {SCHEMA}.site_content SET value = %s, updated_at = NOW() "
            f"WHERE section = %s AND key = %s",
            (str(value), section, key),
        )
        if cur.rowcount == 0:
            cur.close()
            conn.close()
            return {
                "statusCode": 404,
                "headers": {**CORS_HEADERS, "Content-Type": "application/json"},
                "body": json.dumps({"error": "Запись не найдена"}),
            }
        log_action(conn, username, "content_update",
                   {"section": section, "key": key,
                    "old_value": str(old_value)[:200], "new_value": str(value)[:200]})
        conn.commit()
        cur.close()
        conn.close()
        return {"statusCode": 200, "headers": {**CORS_HEADERS, "Content-Type": "application/json"},
                "body": json.dumps({"ok": True})}

    # --- Управление видимостью разделов сайта ---
    if method == "GET" and params.get("action") == "sections":
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute(f"SELECT key, label, is_visible FROM {SCHEMA}.site_sections ORDER BY key")
        sections = [dict(r) for r in cur.fetchall()]
        cur.close()
        conn.close()
        return {"statusCode": 200, "headers": {**CORS_HEADERS, "Content-Type": "application/json"},
                "body": json.dumps({"sections": sections}, ensure_ascii=False)}

    if method == "PATCH" and params.get("action") == "sections":
        body = json.loads(event.get("body") or "{}")
        key = (body.get("key") or "").strip()
        is_visible = bool(body.get("is_visible", True))
        if not key:
            conn.close()
            return {"statusCode": 400, "headers": {**CORS_HEADERS, "Content-Type": "application/json"},
                    "body": json.dumps({"error": "key обязателен"})}
        cur = conn.cursor()
        cur.execute(f"UPDATE {SCHEMA}.site_sections SET is_visible = %s, updated_at = NOW() WHERE key = %s",
                    (is_visible, key))
        log_action(conn, username, "section_visibility", {"key": key, "is_visible": is_visible})
        conn.commit()
        cur.close()
        conn.close()
        return {"statusCode": 200, "headers": {**CORS_HEADERS, "Content-Type": "application/json"},
                "body": json.dumps({"ok": True})}

    conn.close()
    return {"statusCode": 405, "headers": CORS_HEADERS,
            "body": json.dumps({"error": "Method not allowed"})}