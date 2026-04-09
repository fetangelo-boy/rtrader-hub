"""
Универсальный CMS-API для управления контентом разделов сайта.
Все запросы требуют заголовок X-Admin-Token.

GET  /?section=reflections          — список
POST /                              — создать  { section, ...fields }
PUT  /?section=reflections&id=N     — обновить { ...fields }
DELETE /?section=reflections&id=N   — удалить
PATCH /?section=reflections&id=N    — { is_visible: bool } скрыть/показать

Разделы: reflections | analytics | education | tournaments | author
"""

import json
import os
import psycopg2
import psycopg2.extras

CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Admin-Token",
}
SCHEMA = "t_p67093308_rtrader_hub"

ALLOWED_SECTIONS = {"reflections", "analytics", "education", "tournaments", "author"}

FIELDS = {
    "reflections": ["title", "tag", "tags", "read_time", "preview", "body", "image_url", "media_items", "is_visible", "sort_order"],
    "analytics":   ["type", "instrument", "title", "category", "direction", "entry", "target",
                    "stop", "risk", "description", "body", "tags", "video_url",
                    "image_url", "media_items", "is_visible", "sort_order"],
    "education":   ["number", "title", "description", "body", "lessons", "duration", "level",
                    "topics", "tags", "video_url", "image_url", "media_items", "is_free", "is_visible", "sort_order"],
    "tournaments": ["name", "status", "start_date", "end_date", "instrument",
                    "description", "body", "tags", "video_url", "prize", "participants", "winner", "result",
                    "image_url", "media_items", "is_visible", "sort_order"],
    "author":      ["heading", "body", "tags",
                    "reflections_cta_eyebrow", "reflections_cta_title",
                    "reflections_cta_text", "reflections_cta_btn", "reflections_cta_url"],
}

SECTION_LABELS = {
    "reflections": "Рефлексии",
    "analytics": "Аналитика",
    "education": "Обучение",
    "tournaments": "Конкурсы",
    "author": "Об авторе",
}


def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def get_username(c, token: str) -> str:
    cur = c.cursor()
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
        f"SELECT username FROM {SCHEMA}.admin_sessions WHERE token=%s AND expires_at>NOW()",
        (token,)
    )
    row = cur.fetchone()
    cur.close()
    return row[0] if row else ""


def log_action(c, username: str, action: str, details: dict):
    cur = c.cursor()
    cur.execute(
        f"INSERT INTO {SCHEMA}.admin_activity_log (username, action, details) VALUES (%s, %s, %s)",
        (username, action, json.dumps(details, ensure_ascii=False, default=str))
    )
    cur.close()


def ok(data):
    return {"statusCode": 200,
            "headers": {**CORS_HEADERS, "Content-Type": "application/json"},
            "body": json.dumps(data, ensure_ascii=False, default=str)}


def err(code, msg):
    return {"statusCode": code,
            "headers": {**CORS_HEADERS, "Content-Type": "application/json"},
            "body": json.dumps({"error": msg})}


def handler(event: dict, context) -> dict:
    """CMS: создание, редактирование, удаление материалов разделов сайта."""
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS_HEADERS, "body": ""}

    token = (event.get("headers") or {}).get("X-Admin-Token", "").strip()
    if not token:
        return err(401, "Unauthorized")

    c = get_conn()
    username = get_username(c, token)
    if not username:
        c.close()
        return err(401, "Unauthorized")

    method = event.get("httpMethod", "GET")
    params = event.get("queryStringParameters") or {}
    section = (params.get("section") or "").strip()
    item_id = params.get("id")

    if section and section not in ALLOWED_SECTIONS:
        c.close()
        return err(400, f"Unknown section: {section}")

    # ── GET ────────────────────────────────────────────────────────────────────
    if method == "GET":
        if not section:
            c.close()
            return err(400, "section required")
        cur = c.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        if section == "author":
            cur.execute(f"SELECT * FROM {SCHEMA}.author ORDER BY id LIMIT 1")
            row = cur.fetchone()
            cur.close(); c.close()
            return ok({"item": dict(row) if row else None})
        order = "sort_order ASC, created_at DESC"
        cur.execute(f"SELECT * FROM {SCHEMA}.{section} ORDER BY {order}")
        rows = [dict(r) for r in cur.fetchall()]
        cur.close(); c.close()
        return ok({"items": rows})

    body = json.loads(event.get("body") or "{}")
    if not section:
        section = (body.get("section") or "").strip()
    if section not in ALLOWED_SECTIONS:
        c.close()
        return err(400, "section required")

    allowed = FIELDS[section]
    section_label = SECTION_LABELS.get(section, section)

    # ── POST ───────────────────────────────────────────────────────────────────
    if method == "POST":
        data = {k: body[k] for k in allowed if k in body}
        if not data:
            c.close()
            return err(400, "No fields provided")
        if "media_items" in data and isinstance(data["media_items"], (list, dict)):
            data["media_items"] = json.dumps(data["media_items"], ensure_ascii=False)
        cols = ", ".join(data.keys())
        placeholders = ", ".join(["%s"] * len(data))
        vals = list(data.values())
        cur = c.cursor()
        cur.execute(
            f"INSERT INTO {SCHEMA}.{section} ({cols}) VALUES ({placeholders}) RETURNING id",
            vals
        )
        new_id = cur.fetchone()[0]
        log_action(c, username, "cms_create",
                   {"section": section, "section_label": section_label, "id": new_id,
                    "title": str(data.get("title") or data.get("name") or "")[:100]})
        c.commit(); cur.close(); c.close()
        return ok({"ok": True, "id": new_id})

    # ── PUT ────────────────────────────────────────────────────────────────────
    if method == "PUT":
        if not item_id:
            c.close()
            return err(400, "id required")
        if section == "author":
            data = {k: body[k] for k in allowed if k in body}
            if not data:
                c.close()
                return err(400, "No fields provided")
            cur = c.cursor()
            cur.execute(f"SELECT id FROM {SCHEMA}.author LIMIT 1")
            existing = cur.fetchone()
            if existing:
                sets = ", ".join(f"{k}=%s" for k in data)
                cur.execute(f"UPDATE {SCHEMA}.author SET {sets}, updated_at=NOW() WHERE id=%s",
                            list(data.values()) + [existing[0]])
            else:
                cols = ", ".join(data.keys())
                ph = ", ".join(["%s"] * len(data))
                cur.execute(f"INSERT INTO {SCHEMA}.author ({cols}) VALUES ({ph})", list(data.values()))
            log_action(c, username, "cms_update",
                       {"section": section, "section_label": section_label, "fields": list(data.keys())})
            c.commit(); cur.close(); c.close()
            return ok({"ok": True})
        data = {k: body[k] for k in allowed if k in body}
        if not data:
            c.close()
            return err(400, "No fields provided")
        if "media_items" in data and isinstance(data["media_items"], (list, dict)):
            data["media_items"] = json.dumps(data["media_items"], ensure_ascii=False)
        sets = ", ".join(f"{k}=%s" for k in data)
        cur = c.cursor()
        cur.execute(f"UPDATE {SCHEMA}.{section} SET {sets} WHERE id=%s",
                    list(data.values()) + [int(item_id)])
        log_action(c, username, "cms_update",
                   {"section": section, "section_label": section_label,
                    "id": int(item_id), "fields": list(data.keys()),
                    "title": str(data.get("title") or data.get("name") or "")[:100]})
        c.commit(); cur.close(); c.close()
        return ok({"ok": True})

    # ── PATCH (is_visible) ─────────────────────────────────────────────────────
    if method == "PATCH":
        if not item_id:
            c.close()
            return err(400, "id required")
        is_visible = body.get("is_visible")
        if is_visible is None:
            c.close()
            return err(400, "is_visible required")
        cur = c.cursor()
        cur.execute(f"UPDATE {SCHEMA}.{section} SET is_visible=%s WHERE id=%s",
                    (bool(is_visible), int(item_id)))
        log_action(c, username, "cms_visibility",
                   {"section": section, "section_label": section_label,
                    "id": int(item_id), "is_visible": bool(is_visible)})
        c.commit(); cur.close(); c.close()
        return ok({"ok": True})

    # ── DELETE ─────────────────────────────────────────────────────────────────
    if method == "DELETE":
        if not item_id:
            c.close()
            return err(400, "id required")
        cur = c.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute(f"SELECT * FROM {SCHEMA}.{section} WHERE id=%s", (int(item_id),))
        old = cur.fetchone()
        cur.close()
        cur = c.cursor()
        cur.execute(f"DELETE FROM {SCHEMA}.{section} WHERE id=%s", (int(item_id),))
        log_action(c, username, "cms_delete",
                   {"section": section, "section_label": section_label,
                    "id": int(item_id),
                    "title": str((old or {}).get("title") or (old or {}).get("name") or "")[:100]})
        c.commit(); cur.close(); c.close()
        return ok({"ok": True})

    c.close()
    return err(405, "Method not allowed")