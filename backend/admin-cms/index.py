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

# Поля разрешённые к записи для каждого раздела
FIELDS = {
    "reflections": ["title", "tag", "read_time", "preview", "is_visible", "sort_order"],
    "analytics":   ["instrument", "title", "category", "direction", "entry", "target",
                    "stop", "risk", "description", "is_visible", "sort_order"],
    "education":   ["number", "title", "description", "lessons", "duration", "level",
                    "topics", "is_free", "is_visible", "sort_order"],
    "tournaments": ["name", "status", "start_date", "end_date", "instrument",
                    "description", "prize", "participants", "winner", "result",
                    "is_visible", "sort_order"],
    "author":      ["heading", "body", "tags"],
}


def conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def check_token(event):
    token = (event.get("headers") or {}).get("X-Admin-Token", "").strip()
    if not token:
        return False
    c = conn()
    cur = c.cursor()
    cur.execute(
        f"SELECT id FROM {SCHEMA}.admin_sessions WHERE token=%s AND expires_at>NOW()",
        (token,)
    )
    row = cur.fetchone()
    cur.close(); c.close()
    return row is not None


def ok(data):
    return {"statusCode": 200,
            "headers": {**CORS_HEADERS, "Content-Type": "application/json"},
            "body": json.dumps(data, ensure_ascii=False, default=str)}


def err(code, msg):
    return {"statusCode": code,
            "headers": {**CORS_HEADERS, "Content-Type": "application/json"},
            "body": json.dumps({"error": msg})}


def handler(event: dict, context) -> dict:
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS_HEADERS, "body": ""}

    if not check_token(event):
        return err(401, "Unauthorized")

    method = event.get("httpMethod", "GET")
    params = event.get("queryStringParameters") or {}
    section = (params.get("section") or "").strip()
    item_id = params.get("id")

    if section and section not in ALLOWED_SECTIONS:
        return err(400, f"Unknown section: {section}")

    # ── GET ────────────────────────────────────────────────────────────────────
    if method == "GET":
        if not section:
            return err(400, "section required")
        c = conn()
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
        return err(400, "section required")

    allowed = FIELDS[section]

    # ── POST ───────────────────────────────────────────────────────────────────
    if method == "POST":
        data = {k: body[k] for k in allowed if k in body}
        if not data:
            return err(400, "No fields provided")
        cols = ", ".join(data.keys())
        placeholders = ", ".join(["%s"] * len(data))
        vals = list(data.values())
        c = conn()
        cur = c.cursor()
        cur.execute(
            f"INSERT INTO {SCHEMA}.{section} ({cols}) VALUES ({placeholders}) RETURNING id",
            vals
        )
        new_id = cur.fetchone()[0]
        conn_commit = c; conn_commit.commit()
        cur.close(); c.close()
        return ok({"ok": True, "id": new_id})

    # ── PUT ────────────────────────────────────────────────────────────────────
    if method == "PUT":
        if not item_id:
            return err(400, "id required")
        if section == "author":
            data = {k: body[k] for k in allowed if k in body}
            if not data:
                return err(400, "No fields provided")
            c = conn()
            cur = c.cursor()
            # upsert для author (одна строка)
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
            c.commit(); cur.close(); c.close()
            return ok({"ok": True})
        data = {k: body[k] for k in allowed if k in body}
        if not data:
            return err(400, "No fields provided")
        sets = ", ".join(f"{k}=%s" for k in data)
        c = conn()
        cur = c.cursor()
        cur.execute(f"UPDATE {SCHEMA}.{section} SET {sets} WHERE id=%s",
                    list(data.values()) + [int(item_id)])
        c.commit(); cur.close(); c.close()
        return ok({"ok": True})

    # ── PATCH (is_visible) ─────────────────────────────────────────────────────
    if method == "PATCH":
        if not item_id:
            return err(400, "id required")
        is_visible = body.get("is_visible")
        if is_visible is None:
            return err(400, "is_visible required")
        c = conn()
        cur = c.cursor()
        cur.execute(f"UPDATE {SCHEMA}.{section} SET is_visible=%s WHERE id=%s",
                    (bool(is_visible), int(item_id)))
        c.commit(); cur.close(); c.close()
        return ok({"ok": True})

    # ── DELETE ─────────────────────────────────────────────────────────────────
    if method == "DELETE":
        if not item_id:
            return err(400, "id required")
        c = conn()
        cur = c.cursor()
        cur.execute(f"DELETE FROM {SCHEMA}.{section} WHERE id=%s", (int(item_id),))
        c.commit(); cur.close(); c.close()
        return ok({"ok": True})

    return err(405, "Method not allowed")
