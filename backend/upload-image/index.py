"""
Загрузка медиафайлов в S3: изображения, аудио, видео.
POST / — { "image": "<base64>", "filename": "photo.jpg" }
Требует заголовок X-Admin-Token.
Лимиты: изображения до 10 МБ, аудио до 20 МБ, видео до 50 МБ.
"""

import json
import os
import base64
import uuid
import psycopg2

import boto3

CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Admin-Token",
}

SCHEMA = "t_p67093308_rtrader_hub"

IMAGE_EXTS = {"jpg", "jpeg", "png", "gif", "webp"}
AUDIO_EXTS = {"mp3", "ogg", "wav", "m4a", "aac"}
VIDEO_EXTS = {"mp4", "webm", "mov", "avi"}

CONTENT_TYPE_MAP = {
    "jpg": "image/jpeg", "jpeg": "image/jpeg", "png": "image/png",
    "gif": "image/gif", "webp": "image/webp",
    "mp3": "audio/mpeg", "ogg": "audio/ogg", "wav": "audio/wav",
    "m4a": "audio/mp4", "aac": "audio/aac",
    "mp4": "video/mp4", "webm": "video/webm",
    "mov": "video/quicktime", "avi": "video/x-msvideo",
}

SIZE_LIMITS = {
    "image": 10 * 1024 * 1024,
    "audio": 20 * 1024 * 1024,
    "video": 50 * 1024 * 1024,
}


def get_db():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def check_token(event: dict) -> bool:
    token = (event.get("headers") or {}).get("X-Admin-Token", "").strip()
    if not token:
        return False
    c = get_db()
    cur = c.cursor()
    cur.execute(
        f"SELECT u.id FROM {SCHEMA}.club_sessions s "
        f"JOIN {SCHEMA}.club_users u ON u.id = s.user_id "
        f"WHERE s.token=%s AND s.expires_at>NOW() AND u.role IN ('owner','admin')",
        (token,)
    )
    row = cur.fetchone()
    if not row:
        cur.execute(
            f"SELECT id FROM {SCHEMA}.admin_sessions WHERE token=%s AND expires_at>NOW()",
            (token,)
        )
        row = cur.fetchone()
    cur.close(); c.close()
    return row is not None


def get_s3():
    return boto3.client(
        "s3",
        endpoint_url="https://bucket.poehali.dev",
        aws_access_key_id=os.environ["AWS_ACCESS_KEY_ID"],
        aws_secret_access_key=os.environ["AWS_SECRET_ACCESS_KEY"],
    )


def handler(event: dict, context) -> dict:
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS_HEADERS, "body": ""}

    if not check_token(event):
        return {
            "statusCode": 401,
            "headers": {**CORS_HEADERS, "Content-Type": "application/json"},
            "body": json.dumps({"error": "Unauthorized"}),
        }

    body = json.loads(event.get("body") or "{}")
    file_b64 = body.get("image", "") or body.get("file", "")
    filename = body.get("filename", "file.jpg")

    if not file_b64:
        return {
            "statusCode": 400,
            "headers": {**CORS_HEADERS, "Content-Type": "application/json"},
            "body": json.dumps({"error": "file (base64) required"}),
        }

    if "," in file_b64:
        file_b64 = file_b64.split(",", 1)[1]

    file_data = base64.b64decode(file_b64)

    ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else "jpg"

    if ext in IMAGE_EXTS:
        media_type = "image"
        folder = "cms"
    elif ext in AUDIO_EXTS:
        media_type = "audio"
        folder = "cms/audio"
    elif ext in VIDEO_EXTS:
        media_type = "video"
        folder = "cms/video"
    else:
        ext = "jpg"
        media_type = "image"
        folder = "cms"

    size_limit = SIZE_LIMITS[media_type]
    if len(file_data) > size_limit:
        limit_mb = size_limit // (1024 * 1024)
        return {
            "statusCode": 400,
            "headers": {**CORS_HEADERS, "Content-Type": "application/json"},
            "body": json.dumps({"error": f"Файл слишком большой. Максимум {limit_mb} МБ для {media_type}"}),
        }

    content_type = CONTENT_TYPE_MAP.get(ext, "application/octet-stream")
    key = f"{folder}/{uuid.uuid4().hex}.{ext}"

    s3 = get_s3()
    s3.put_object(
        Bucket="files",
        Key=key,
        Body=file_data,
        ContentType=content_type,
    )

    access_key = os.environ["AWS_ACCESS_KEY_ID"]
    cdn_url = f"https://cdn.poehali.dev/projects/{access_key}/bucket/{key}"

    return {
        "statusCode": 200,
        "headers": {**CORS_HEADERS, "Content-Type": "application/json"},
        "body": json.dumps({"ok": True, "url": cdn_url, "type": media_type}),
    }