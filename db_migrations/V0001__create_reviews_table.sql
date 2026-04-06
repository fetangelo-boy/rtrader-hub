CREATE TABLE IF NOT EXISTS t_p67093308_rtrader_hub.reviews (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    status VARCHAR(100) DEFAULT '',
    text TEXT NOT NULL,
    is_approved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);