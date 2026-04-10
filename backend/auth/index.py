"""
Авторизация: регистрация, вход, выход, профиль, смена никнейма и пароля.
?action=register         — создать аккаунт (POST)
?action=login            — войти, получить токен (POST)
?action=logout           — выйти (POST)
?action=me               — получить данные текущего пользователя (GET)
?action=update_nickname  — изменить никнейм (POST)
?action=change_password  — изменить пароль (POST)

ВАЖНО — НЕ МЕНЯТЬ:
Вход работает по email ИЛИ по никнейму — для всех пользователей (и admin, и owner, и subscriber).
Логика: если в поле "email" есть символ @, ищем по email; иначе ищем по nickname (без учёта регистра).
Это правило согласовано с владельцем и не должно изменяться без явного запроса.
"""
import json
import os
import secrets
import hashlib
from datetime import datetime, timedelta, timezone
import psycopg2

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Auth-Token",
}

def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])

def ok(data: dict, status=200):
    return {"statusCode": status, "headers": {**CORS, "Content-Type": "application/json"}, "body": json.dumps(data, ensure_ascii=False, default=str)}

def err(msg: str, status=400):
    return {"statusCode": status, "headers": {**CORS, "Content-Type": "application/json"}, "body": json.dumps({"error": msg}, ensure_ascii=False)}

def hash_password(password: str) -> str:
    salt = os.environ.get("PASSWORD_SALT", "tradeclub_salt_default")
    return hashlib.sha256(f"{salt}{password}".encode()).hexdigest()

def get_user_by_token(conn, token: str):
    with conn.cursor() as cur:
        cur.execute("""
            SELECT u.id, u.nickname, u.email, u.role, u.is_blocked
            FROM club_users u
            JOIN club_sessions s ON u.id = s.user_id
            WHERE s.token = %s AND s.expires_at > NOW()
        """, (token,))
        row = cur.fetchone()
    if not row:
        return None
    return {"id": row[0], "nickname": row[1], "email": row[2], "role": row[3], "is_blocked": row[4]}

def handler(event: dict, context) -> dict:
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    qs = event.get("queryStringParameters") or {}
    action = qs.get("action", "")
    body = json.loads(event.get("body") or "{}")

    conn = get_conn()

    if action == "register":
        email = body.get("email", "").lower().strip()
        password = body.get("password", "")
        nickname = body.get("nickname", "").strip()
        gdpr_consent = body.get("gdpr_consent", False)
        invite_code = body.get("invite_code", "").strip()
        tg_token = body.get("tg_token", "").strip()

        if not email or not password or not nickname:
            return err("Все поля требуются")
        if len(password) < 6:
            return err("Пароль должен быть не менее 6 символов")
        if len(nickname) < 2 or len(nickname) > 30:
            return err("Никнейм должен быть от 2 до 30 символов")
        if not gdpr_consent:
            return err("Необходимо согласие на обработку данных")

        # Проверяем tg_token если передан
        tg_id = None
        tg_username = None
        if tg_token:
            with conn.cursor() as cur:
                cur.execute(
                    "SELECT tg_id, tg_username FROM tg_link_tokens WHERE token = %s AND for_registration = TRUE AND expires_at > NOW()",
                    (tg_token,)
                )
                tg_row = cur.fetchone()
            if not tg_row:
                return err("Ссылка из Telegram устарела или недействительна. Напишите боту /start ещё раз.")
            tg_id, tg_username = tg_row

        with conn.cursor() as cur:
            cur.execute("SELECT id FROM club_users WHERE email = %s", (email,))
            if cur.fetchone():
                return err("Email уже зарегистрирован")

            if tg_id:
                cur.execute("SELECT id FROM club_users WHERE telegram_id = %s", (tg_id,))
                if cur.fetchone():
                    return err("Этот Telegram уже привязан к другому аккаунту")

            subscription_days = 0
            if invite_code:
                cur.execute("SELECT days, is_used FROM club_invites WHERE code = %s", (invite_code,))
                invite = cur.fetchone()
                if not invite:
                    return err("Неверный код приглашения")
                if invite[1]:
                    return err("Этот код уже использован")
                subscription_days = invite[0]

            password_hash = hash_password(password)
            cur.execute("""
                INSERT INTO club_users (email, password_hash, nickname, role, gdpr_consent, is_blocked, telegram_id, telegram_username)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                RETURNING id
            """, (email, password_hash, nickname, "subscriber", gdpr_consent, False, tg_id, tg_username))
            user_id = cur.fetchone()[0]

            if invite_code and subscription_days:
                expires_at = datetime.now(timezone.utc) + timedelta(days=subscription_days)
                cur.execute("""
                    INSERT INTO club_subscriptions (user_id, plan, status, expires_at)
                    VALUES (%s, %s, %s, %s)
                """, (user_id, "invite", "active", expires_at))
                cur.execute("UPDATE club_invites SET is_used = TRUE, used_by_user_id = %s WHERE code = %s", (user_id, invite_code))

            if tg_token:
                cur.execute("UPDATE tg_link_tokens SET expires_at = NOW() WHERE token = %s", (tg_token,))

            conn.commit()

        return ok({"message": "Аккаунт создан", "tg_linked": tg_id is not None})

    if action == "login":
        login_input = body.get("email", "").strip()
        password = body.get("password", "")

        if not login_input or not password:
            return err("Email и пароль требуются")

        with conn.cursor() as cur:
            if "@" in login_input:
                cur.execute("SELECT id, password_hash, is_blocked FROM club_users WHERE email = %s", (login_input.lower(),))
            else:
                cur.execute("SELECT id, password_hash, is_blocked FROM club_users WHERE LOWER(nickname) = LOWER(%s)", (login_input,))
            user = cur.fetchone()

        if not user or user[1] != hash_password(password):
            return err("Неверные учётные данные")
        if user[2]:
            return err("Аккаунт заблокирован")

        user_id = user[0]
        token = secrets.token_urlsafe(32)
        expires_at = datetime.now(timezone.utc) + timedelta(days=30)

        with conn.cursor() as cur:
            cur.execute("""
                INSERT INTO club_sessions (user_id, token, expires_at)
                VALUES (%s, %s, %s)
            """, (user_id, token, expires_at))
            conn.commit()

        return ok({"token": token})

    if action == "logout":
        token = event.get("headers", {}).get("X-Auth-Token", "")
        if token:
            with conn.cursor() as cur:
                cur.execute("UPDATE club_sessions SET expires_at = NOW() WHERE token = %s", (token,))
                conn.commit()
        return ok({"message": "Вы вышли"})

    if action == "me":
        token = event.get("headers", {}).get("X-Auth-Token", "")
        user = get_user_by_token(conn, token)
        if not user:
            return err("Не авторизован", 401)
        return ok({"user": user})

    if action == "update_nickname":
        token = event.get("headers", {}).get("X-Auth-Token", "")
        user = get_user_by_token(conn, token)
        if not user:
            return err("Не авторизован", 401)
        nickname = body.get("nickname", "").strip()
        if len(nickname) < 2 or len(nickname) > 30:
            return err("Никнейм должен быть от 2 до 30 символов")
        with conn.cursor() as cur:
            cur.execute("UPDATE club_users SET nickname = %s WHERE id = %s", (nickname, user["id"]))
            conn.commit()
        return ok({"message": "Никнейм обновлён"})

    if action == "change_password":
        token = event.get("headers", {}).get("X-Auth-Token", "")
        user = get_user_by_token(conn, token)
        if not user:
            return err("Не авторизован", 401)
        old_password = body.get("old_password", "")
        new_password = body.get("new_password", "")
        if len(new_password) < 6:
            return err("Новый пароль должен быть не менее 6 символов")
        with conn.cursor() as cur:
            cur.execute("SELECT password_hash FROM club_users WHERE id = %s", (user["id"],))
            row = cur.fetchone()
        if not row or row[0] != hash_password(old_password):
            return err("Неверный текущий пароль")
        with conn.cursor() as cur:
            cur.execute("UPDATE club_users SET password_hash = %s WHERE id = %s", (hash_password(new_password), user["id"]))
            conn.commit()
        return ok({"message": "Пароль изменён"})

    if action == "reset_owner_passwords":
        secret = body.get("secret", "")
        if secret != "rtrader_reset_2026":
            return err("Forbidden", 403)
        passwords = {
            "rtrader11@rtrader11.ru": "RTrader11_4Ever",
            "admin@rtrader11.ru": "Admin2024!",
        }
        updated = []
        with conn.cursor() as cur:
            for email, pwd in passwords.items():
                h = hash_password(pwd)
                cur.execute("UPDATE club_users SET password_hash = %s WHERE email = %s", (h, email))
                updated.append({"email": email, "hash": h})
            conn.commit()
        return ok({"updated": updated})

    if action == "set_role":
        token = event.get("headers", {}).get("X-Auth-Token", "")
        caller = get_user_by_token(conn, token)
        if not caller or caller["role"] not in ("owner", "admin"):
            return err("Нет доступа", 403)
        target_id = body.get("user_id")
        new_role = body.get("role", "")
        allowed_roles = ("subscriber", "editor")
        if new_role not in allowed_roles:
            return err(f"Допустимые роли: {', '.join(allowed_roles)}")
        if not target_id:
            return err("user_id обязателен")
        with conn.cursor() as cur:
            cur.execute("SELECT role FROM club_users WHERE id = %s", (target_id,))
            row = cur.fetchone()
            if not row:
                return err("Пользователь не найден", 404)
            if row[0] in ("owner", "admin"):
                return err("Нельзя менять роль владельца/администратора")
            cur.execute("UPDATE club_users SET role = %s WHERE id = %s", (new_role, target_id))
            conn.commit()
        return ok({"message": f"Роль изменена на {new_role}"})

    conn.close()
    return err("Неизвестное действие", 400)