CREATE TABLE IF NOT EXISTS t_p67093308_rtrader_hub.admin_activity_log (
  id SERIAL PRIMARY KEY,
  username TEXT NOT NULL,
  action TEXT NOT NULL,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_activity_log_created_at
  ON t_p67093308_rtrader_hub.admin_activity_log (created_at DESC);
