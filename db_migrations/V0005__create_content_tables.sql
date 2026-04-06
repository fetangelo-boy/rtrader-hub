-- Рефлексии
CREATE TABLE IF NOT EXISTS t_p67093308_rtrader_hub.reflections (
    id SERIAL PRIMARY KEY,
    title VARCHAR(300) NOT NULL,
    tag VARCHAR(50) DEFAULT 'Психология',
    read_time VARCHAR(20) DEFAULT '5 мин',
    preview TEXT NOT NULL DEFAULT '',
    is_visible BOOLEAN DEFAULT TRUE,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Аналитика / торговые идеи
CREATE TABLE IF NOT EXISTS t_p67093308_rtrader_hub.analytics (
    id SERIAL PRIMARY KEY,
    instrument VARCHAR(50) NOT NULL,
    title VARCHAR(300) NOT NULL,
    category VARCHAR(50) DEFAULT 'Акции РФ',
    direction VARCHAR(5) DEFAULT 'long',
    entry VARCHAR(50) DEFAULT '',
    target VARCHAR(50) DEFAULT '',
    stop VARCHAR(50) DEFAULT '',
    risk VARCHAR(20) DEFAULT 'средний',
    description TEXT DEFAULT '',
    is_visible BOOLEAN DEFAULT TRUE,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Обучение
CREATE TABLE IF NOT EXISTS t_p67093308_rtrader_hub.education (
    id SERIAL PRIMARY KEY,
    number VARCHAR(5) NOT NULL,
    title VARCHAR(300) NOT NULL,
    description TEXT DEFAULT '',
    lessons INT DEFAULT 0,
    duration VARCHAR(30) DEFAULT '',
    level VARCHAR(50) DEFAULT 'Начинающий',
    topics TEXT DEFAULT '',
    is_free BOOLEAN DEFAULT FALSE,
    is_visible BOOLEAN DEFAULT TRUE,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Конкурсы
CREATE TABLE IF NOT EXISTS t_p67093308_rtrader_hub.tournaments (
    id SERIAL PRIMARY KEY,
    name VARCHAR(300) NOT NULL,
    status VARCHAR(20) DEFAULT 'upcoming',
    start_date VARCHAR(20) DEFAULT '',
    end_date VARCHAR(20) DEFAULT '',
    instrument VARCHAR(200) DEFAULT '',
    description TEXT DEFAULT '',
    prize VARCHAR(200) DEFAULT '',
    participants INT DEFAULT 0,
    winner VARCHAR(100) DEFAULT '',
    result VARCHAR(50) DEFAULT '',
    is_visible BOOLEAN DEFAULT TRUE,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Об авторе
CREATE TABLE IF NOT EXISTS t_p67093308_rtrader_hub.author (
    id SERIAL PRIMARY KEY,
    heading VARCHAR(200) DEFAULT 'RTrader — это живой опыт',
    body TEXT DEFAULT '',
    tags TEXT DEFAULT '',
    updated_at TIMESTAMP DEFAULT NOW()
);