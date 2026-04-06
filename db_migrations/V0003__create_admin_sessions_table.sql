CREATE TABLE IF NOT EXISTS t_p67093308_rtrader_hub.admin_sessions (
    id SERIAL PRIMARY KEY,
    token VARCHAR(64) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP DEFAULT (NOW() + INTERVAL '30 days')
);

CREATE INDEX IF NOT EXISTS idx_admin_sessions_token
    ON t_p67093308_rtrader_hub.admin_sessions(token);