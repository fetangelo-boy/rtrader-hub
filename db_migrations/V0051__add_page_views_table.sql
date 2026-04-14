CREATE TABLE IF NOT EXISTS t_p67093308_rtrader_hub.page_views (
    id BIGSERIAL PRIMARY KEY,
    session_id TEXT NOT NULL,
    page TEXT NOT NULL DEFAULT '/',
    user_id INTEGER NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_page_views_created_at ON t_p67093308_rtrader_hub.page_views (created_at);
CREATE INDEX IF NOT EXISTS idx_page_views_session_id ON t_p67093308_rtrader_hub.page_views (session_id);
