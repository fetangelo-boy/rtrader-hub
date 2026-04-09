CREATE TABLE IF NOT EXISTS pricing_plans (
  id SERIAL PRIMARY KEY,
  plan_key VARCHAR(32) NOT NULL UNIQUE,
  name VARCHAR(64) NOT NULL,
  price INTEGER NOT NULL,
  days INTEGER NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO pricing_plans (plan_key, name, price, days) VALUES
  ('week',     'Неделя',      990,   7),
  ('month',    'Месяц',      2490,  30),
  ('quarter',  'Квартал',    5990,  90),
  ('halfyear', 'Полгода',    9990, 180),
  ('loyal',    'Лояльный',   1990,  30)
ON CONFLICT (plan_key) DO NOTHING;
