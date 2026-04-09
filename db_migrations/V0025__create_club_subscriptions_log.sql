CREATE TABLE IF NOT EXISTS t_p67093308_rtrader_hub.club_subscriptions_log (
    id SERIAL PRIMARY KEY,
    subscription_id INTEGER,
    admin_id INTEGER REFERENCES t_p67093308_rtrader_hub.club_users(id),
    action VARCHAR(50) NOT NULL,
    details JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW()
);