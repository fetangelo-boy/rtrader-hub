"""
Загрузка видео в S3.
GET  /?action=presign&filename=video.mp4&mime=video/mp4&token=...
     → { upload_url, cdn_url, key }  — presigned PUT URL, браузер льёт напрямую в S3
POST / (legacy, малые файлы)
     → { url, cdn_url }
Требует X-Auth-Token (club owner/admin) или token= в query.
"""
import json
import os
import uuid
import base64
import psycopg2
import boto3
from botocore.config import Config

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Auth-Token, X-Admin-Token",
}

VIDEO_EXTS = {"mp4", "webm", "mov", "avi", "mkv"}

MIME_MAP = {
    "mp4": "video/mp4",
    "webm": "video/webm",
    "mov": "video/quicktime",
    "avi": "video/x-msvideo",
    "mkv": "video/x-matroska",
}

def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])

def ok(data):
    return {"statusCode": 200, "headers": {**CORS, "Content-Type": "application/json"}, "body": json.dumps(data)}

def err(msg, status=400):
    return {"statusCode": status, "headers": {**CORS, "Content-Type": "application/json"}, "body": json.dumps({"error": msg})}

def check_token(token: str) -> bool:
    if not token:
        return False
    conn = get_conn()
    try:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT u.id FROM club_users u
                JOIN club_sessions s ON u.id = s.user_id
                WHERE s.token = %s AND s.expires_at > NOW()
                  AND u.is_blocked = FALSE AND u.role IN ('owner', 'admin')
            """, (token,))
            if cur.fetchone():
                return True
            cur.execute("""
                SELECT id FROM admin_sessions
                WHERE token = %s AND expires_at > NOW()
            """, (token,))
            if cur.fetchone():
                return True
        return False
    finally:
        conn.close()

def make_s3():
    return boto3.client(
        "s3",
        endpoint_url="https://bucket.poehali.dev",
        aws_access_key_id=os.environ["AWS_ACCESS_KEY_ID"],
        aws_secret_access_key=os.environ["AWS_SECRET_ACCESS_KEY"],
        config=Config(signature_version="s3v4"),
    )

def handler(event: dict, context) -> dict:
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    headers = {k: v for k, v in (event.get("headers") or {}).items()}
    qs = event.get("queryStringParameters") or {}

    token = qs.get("token") or headers.get("X-Auth-Token", "") or headers.get("X-Admin-Token", "")

    if not check_token(token.strip()):
        return err("Нет прав", 403)

    # === GET ?action=presign — возвращает presigned PUT URL ===
    if event.get("httpMethod") == "GET" or qs.get("action") == "presign":
        filename = (qs.get("filename") or "video.mp4").strip()
        ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else "mp4"
        if ext not in VIDEO_EXTS:
            return err(f"Недопустимый формат. Разрешены: {', '.join(sorted(VIDEO_EXTS)).upper()}")

        mime = qs.get("mime") or MIME_MAP.get(ext, "video/mp4")
        key = f"videos/{uuid.uuid4().hex}.{ext}"

        s3 = make_s3()
        upload_url = s3.generate_presigned_url(
            "put_object",
            Params={"Bucket": "files", "Key": key, "ContentType": mime},
            ExpiresIn=3600,
        )
        cdn_url = f"https://cdn.poehali.dev/projects/{os.environ['AWS_ACCESS_KEY_ID']}/bucket/{key}"
        return ok({"upload_url": upload_url, "cdn_url": cdn_url, "key": key})

    # === POST — legacy малые файлы ===
    body_raw = event.get("body") or ""
    content_type = headers.get("Content-Type", "")

    if "application/json" in content_type:
        try:
            body_json = json.loads(body_raw)
        except Exception:
            return err("Невалидный JSON")

        filename = (body_json.get("filename") or "video.mp4").strip()
        ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else "mp4"
        if ext not in VIDEO_EXTS:
            return err(f"Недопустимый формат. Разрешены: {', '.join(sorted(VIDEO_EXTS)).upper()}")

        mime = body_json.get("mime") or MIME_MAP.get(ext, "video/mp4")
        file_b64 = body_json.get("file_b64") or body_json.get("file") or ""
        if not file_b64:
            return err("file_b64 обязателен")
        if "," in file_b64:
            file_b64 = file_b64.split(",", 1)[1]
        file_data = base64.b64decode(file_b64)
    else:
        filename = (qs.get("filename") or "video.mp4").strip()
        ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else "mp4"
        if ext not in VIDEO_EXTS:
            return err(f"Недопустимый формат. Разрешены: {', '.join(sorted(VIDEO_EXTS)).upper()}")
        mime = qs.get("mime") or MIME_MAP.get(ext, "video/mp4")
        if event.get("isBase64Encoded"):
            file_data = base64.b64decode(body_raw)
        else:
            file_data = body_raw.encode("latin-1") if isinstance(body_raw, str) else body_raw

    key = f"videos/{uuid.uuid4().hex}.{ext}"
    s3 = make_s3()
    s3.put_object(Bucket="files", Key=key, Body=file_data, ContentType=mime)
    cdn_url = f"https://cdn.poehali.dev/projects/{os.environ['AWS_ACCESS_KEY_ID']}/bucket/{key}"
    return ok({"url": cdn_url, "cdn_url": cdn_url})
