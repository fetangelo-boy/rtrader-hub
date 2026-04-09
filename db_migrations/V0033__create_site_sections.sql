CREATE TABLE IF NOT EXISTS site_sections (
  key VARCHAR(50) PRIMARY KEY,
  label VARCHAR(100) NOT NULL,
  is_visible BOOLEAN DEFAULT TRUE,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO site_sections (key, label, is_visible) VALUES
  ('community',   'Комьюнити',  true),
  ('analytics',   'Аналитика',  true),
  ('reflections', 'Рефлексии',  true),
  ('tournaments', 'Конкурсы',   true),
  ('vip',         'VIP-клуб',   true),
  ('education',   'Обучение',   true),
  ('reviews',     'Отзывы',     true)
ON CONFLICT (key) DO NOTHING;
