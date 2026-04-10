CREATE TABLE t_p67093308_rtrader_hub.consent_log (
  id SERIAL PRIMARY KEY,
  user_id INTEGER,
  email VARCHAR(255) NOT NULL,
  ip_address VARCHAR(64),
  doc_key VARCHAR(64) NOT NULL,
  doc_version VARCHAR(32) NOT NULL DEFAULT '1.0',
  accepted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_consent_log_user_id ON t_p67093308_rtrader_hub.consent_log(user_id);
CREATE INDEX idx_consent_log_email ON t_p67093308_rtrader_hub.consent_log(email);
CREATE INDEX idx_consent_log_accepted_at ON t_p67093308_rtrader_hub.consent_log(accepted_at);