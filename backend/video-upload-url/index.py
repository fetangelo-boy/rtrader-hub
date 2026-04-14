"""
Загрузка видео/аудио/фото в S3 через простой PUT (base64 в теле).
POST ?action=upload&token=... body={"filename":"video.mp4","mime":"video/mp4","data":"<base64>"}
  → { cdn_url }
Требует token= в query (club owner/admin или admin_sessions).
"""
import json
import os
import base64
import uuid
import psycopg2
import boto3
from botocore.config import Config

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Auth-Token, X-Admin-Token",
}

ALLOWED_EXTS = {"mp4", "webm", "mov", "avi", "mkv", "mp3", "m4a", "wav", "ogg", "jpg", "jpeg", "png", "gif", "webp"}
MIME_MAP = {
    "mp4": "video/mp4", "webm": "video/webm", "mov": "video/quicktime",
    "avi": "video/x-msvideo", "mkv": "video/x-matroska",
    "mp3": "audio/mpeg", "m4a": "audio/mp4", "wav": "audio/wav", "ogg": "audio/ogg",
    "jpg": "image/jpeg", "jpeg": "image/jpeg", "png": "image/png",
    "gif": "image/gif", "webp": "image/webp",
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
            cur.execute("SELECT id FROM admin_sessions WHERE token = %s AND expires_at > NOW()", (token,))
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
    """Загрузка медиафайлов (видео/аудио/фото) в S3."""
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    headers = event.get("headers") or {}
    qs = event.get("queryStringParameters") or {}

    token = qs.get("token") or headers.get("X-Auth-Token", "") or headers.get("X-Admin-Token", "")
    if not check_token(token.strip()):
        return err("Нет прав", 403)

    action = qs.get("action", "upload")

    if action == "upload":
        try:
            body = json.loads(event.get("body") or "{}")
        except Exception:
            return err("Невалидный JSON")

        filename = (body.get("filename") or "file.mp4").strip()
        ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else "mp4"
        if ext not in ALLOWED_EXTS:
            return err(f"Недопустимый формат. Разрешены: {', '.join(sorted(ALLOWED_EXTS)).upper()}")

        mime = body.get("mime") or MIME_MAP.get(ext, "application/octet-stream")
        data_b64 = body.get("data", "")
        if not data_b64:
            return err("Поле data (base64) обязательно")

        # Определяем папку по типу
        if ext in {"mp4", "webm", "mov", "avi", "mkv"}:
            folder = "videos"
        elif ext in {"mp3", "m4a", "wav", "ogg"}:
            folder = "audio"
        else:
            folder = "photos"

        file_bytes = base64.b64decode(data_b64)
        key = f"{folder}/{uuid.uuid4().hex}.{ext}"

        s3 = make_s3()
        s3.put_object(Bucket="files", Key=key, Body=file_bytes, ContentType=mime)

        cdn_url = f"https://cdn.poehali.dev/projects/{os.environ['AWS_ACCESS_KEY_ID']}/bucket/{key}"
        return ok({"cdn_url": cdn_url, "url": cdn_url, "key": key})

    return err("Неизвестный action. Используй: upload")
