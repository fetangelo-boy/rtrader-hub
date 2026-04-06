"""
Загрузка изображения в S3. Принимает base64 или multipart.
POST / — { "image": "<base64>", "filename": "photo.jpg" }
Требует заголовок X-Admin-Token.
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


def get_db():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def check_token(event: dict) -> bool:
    token = (event.get("headers") or {}).get("X-Admin-Token", "").strip()
    if not token:
        return False
    c = get_db()
    cur = c.cursor()
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
    image_b64 = body.get("image", "")
    filename = body.get("filename", "image.jpg")

    if not image_b64:
        return {
            "statusCode": 400,
            "headers": {**CORS_HEADERS, "Content-Type": "application/json"},
            "body": json.dumps({"error": "image (base64) required"}),
        }

    # Убираем data:image/jpeg;base64, префикс если есть
    if "," in image_b64:
        image_b64 = image_b64.split(",", 1)[1]

    image_data = base64.b64decode(image_b64)

    ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else "jpg"
    ext = ext if ext in ("jpg", "jpeg", "png", "gif", "webp") else "jpg"
    content_type_map = {"jpg": "image/jpeg", "jpeg": "image/jpeg",
                        "png": "image/png", "gif": "image/gif", "webp": "image/webp"}
    content_type = content_type_map.get(ext, "image/jpeg")

    key = f"cms/{uuid.uuid4().hex}.{ext}"

    s3 = get_s3()
    s3.put_object(
        Bucket="files",
        Key=key,
        Body=image_data,
        ContentType=content_type,
    )

    access_key = os.environ["AWS_ACCESS_KEY_ID"]
    cdn_url = f"https://cdn.poehali.dev/projects/{access_key}/bucket/{key}"

    return {
        "statusCode": 200,
        "headers": {**CORS_HEADERS, "Content-Type": "application/json"},
        "body": json.dumps({"ok": True, "url": cdn_url}),
    }
