"""
Chunked multipart upload видео в S3.
Шаг 1: POST ?action=init&filename=video.mp4&mime=video/mp4&token=...
        → { upload_id, key }
Шаг 2: POST ?action=chunk&key=...&upload_id=...&part=1&token=...  body=<binary chunk>
        → { etag, part }
Шаг 3: POST ?action=complete&key=...&upload_id=...&token=...  body=JSON [{part,etag}...]
        → { cdn_url }
Abort:  POST ?action=abort&key=...&upload_id=...&token=...
Требует token= в query (club owner/admin или admin_sessions).
"""
import json
import os
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

    action = qs.get("action", "")
    s3 = make_s3()

    # === Шаг 1: инициализация multipart upload ===
    if action == "init":
        filename = (qs.get("filename") or "video.mp4").strip()
        ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else "mp4"
        if ext not in VIDEO_EXTS:
            return err(f"Недопустимый формат. Разрешены: {', '.join(sorted(VIDEO_EXTS)).upper()}")
        mime = qs.get("mime") or MIME_MAP.get(ext, "video/mp4")
        import uuid
        key = f"videos/{uuid.uuid4().hex}.{ext}"
        resp = s3.create_multipart_upload(Bucket="files", Key=key, ContentType=mime)
        return ok({"upload_id": resp["UploadId"], "key": key})

    # === Шаг 2: загрузка чанка ===
    if action == "chunk":
        key = qs.get("key", "")
        upload_id = qs.get("upload_id", "")
        part_number = int(qs.get("part", "1"))
        if not key or not upload_id:
            return err("key и upload_id обязательны")

        body_raw = event.get("body") or ""
        if event.get("isBase64Encoded"):
            chunk_data = base64.b64decode(body_raw)
        else:
            chunk_data = body_raw.encode("latin-1") if isinstance(body_raw, str) else body_raw

        resp = s3.upload_part(
            Bucket="files",
            Key=key,
            UploadId=upload_id,
            PartNumber=part_number,
            Body=chunk_data,
        )
        return ok({"etag": resp["ETag"], "part": part_number})

    # === Шаг 3: завершение multipart upload ===
    if action == "complete":
        key = qs.get("key", "")
        upload_id = qs.get("upload_id", "")
        if not key or not upload_id:
            return err("key и upload_id обязательны")

        body_raw = event.get("body") or "[]"
        try:
            parts = json.loads(body_raw)
        except Exception:
            return err("Невалидный JSON")

        s3.complete_multipart_upload(
            Bucket="files",
            Key=key,
            UploadId=upload_id,
            MultipartUpload={"Parts": [{"PartNumber": p["part"], "ETag": p["etag"]} for p in parts]},
        )
        cdn_url = f"https://cdn.poehali.dev/projects/{os.environ['AWS_ACCESS_KEY_ID']}/bucket/{key}"
        return ok({"cdn_url": cdn_url, "url": cdn_url})

    # === Отмена upload ===
    if action == "abort":
        key = qs.get("key", "")
        upload_id = qs.get("upload_id", "")
        if key and upload_id:
            s3.abort_multipart_upload(Bucket="files", Key=key, UploadId=upload_id)
        return ok({"aborted": True})

    return err("Неизвестный action. Используй: init, chunk, complete, abort")
