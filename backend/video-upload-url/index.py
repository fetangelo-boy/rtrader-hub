"""
Генерирует presigned URL для прямой загрузки видео в S3 из браузера.
POST / — { "filename": "video.mkv", "mime": "video/x-matroska" }
Требует X-Auth-Token (owner или admin).
Возвращает { "upload_url": "...", "cdn_url": "..." }
"""
import json
import os
import uuid
import psycopg2
import boto3

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Auth-Token",
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

def get_user_by_token(token: str):
    conn = get_conn()
    with conn.cursor() as cur:
        cur.execute("""
            SELECT u.id, u.role FROM club_users u
            JOIN club_sessions s ON u.id = s.user_id
            WHERE s.token = %s AND s.expires_at > NOW() AND u.is_blocked = FALSE
        """, (token,))
        row = cur.fetchone()
    conn.close()
    if not row:
        return None
    return {"id": row[0], "role": row[1]}

def handler(event: dict, context) -> dict:
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    token = (event.get("headers") or {}).get("X-Auth-Token", "").strip()
    if not token:
        return err("Не авторизован", 401)

    user = get_user_by_token(token)
    if not user or user["role"] not in ("owner", "admin"):
        return err("Нет прав", 403)

    body = json.loads(event.get("body") or "{}")
    filename = (body.get("filename") or "video.mp4").strip()
    ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else "mp4"
    if ext not in VIDEO_EXTS:
        return err(f"Недопустимый формат. Разрешены: {', '.join(sorted(VIDEO_EXTS)).upper()}")

    mime = body.get("mime") or MIME_MAP.get(ext, "video/mp4")
    key = f"videos/{uuid.uuid4().hex}.{ext}"

    s3 = boto3.client(
        "s3",
        endpoint_url="https://bucket.poehali.dev",
        aws_access_key_id=os.environ["AWS_ACCESS_KEY_ID"],
        aws_secret_access_key=os.environ["AWS_SECRET_ACCESS_KEY"],
    )

    upload_url = s3.generate_presigned_url(
        "put_object",
        Params={"Bucket": "files", "Key": key, "ContentType": mime},
        ExpiresIn=3600,
    )

    cdn_url = f"https://cdn.poehali.dev/projects/{os.environ['AWS_ACCESS_KEY_ID']}/bucket/{key}"

    return ok({"upload_url": upload_url, "cdn_url": cdn_url})
