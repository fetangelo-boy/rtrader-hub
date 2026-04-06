CREATE TABLE IF NOT EXISTS t_p67093308_rtrader_hub.admin_users (
  id SERIAL PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Добавляем поле username в admin_sessions
ALTER TABLE t_p67093308_rtrader_hub.admin_sessions
  ADD COLUMN IF NOT EXISTS username TEXT;
