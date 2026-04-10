CREATE TABLE IF NOT EXISTS chat_banned_nicks (
    id SERIAL PRIMARY KEY,
    nickname VARCHAR(64) UNIQUE NOT NULL,
    banned_by INTEGER REFERENCES club_users(id),
    banned_at TIMESTAMPTZ DEFAULT NOW(),
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);