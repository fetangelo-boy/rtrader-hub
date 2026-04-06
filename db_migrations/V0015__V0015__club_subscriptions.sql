CREATE TABLE IF NOT EXISTS club_subscriptions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    plan TEXT NOT NULL DEFAULT 'month',
    status TEXT NOT NULL DEFAULT 'pending',
    receipt_url TEXT,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
)
