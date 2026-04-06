-- Добавляем image_url во все разделы где его нет
ALTER TABLE t_p67093308_rtrader_hub.analytics
    ADD COLUMN IF NOT EXISTS image_url TEXT DEFAULT '';

ALTER TABLE t_p67093308_rtrader_hub.education
    ADD COLUMN IF NOT EXISTS image_url TEXT DEFAULT '';

ALTER TABLE t_p67093308_rtrader_hub.tournaments
    ADD COLUMN IF NOT EXISTS image_url TEXT DEFAULT '';

-- Для рефлексий добавляем поле tags (несколько тегов через запятую)
ALTER TABLE t_p67093308_rtrader_hub.reflections
    ADD COLUMN IF NOT EXISTS tags TEXT DEFAULT '';

-- Поле для полного текста статьи
ALTER TABLE t_p67093308_rtrader_hub.reflections
    ADD COLUMN IF NOT EXISTS body TEXT DEFAULT '';