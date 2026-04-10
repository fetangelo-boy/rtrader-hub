CREATE TABLE IF NOT EXISTS chat_stop_words (
    id SERIAL PRIMARY KEY,
    word VARCHAR(128) NOT NULL,
    category VARCHAR(32) NOT NULL DEFAULT 'profanity',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    added_by INTEGER REFERENCES club_users(id),
    added_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_chat_stop_words_word ON chat_stop_words(LOWER(word));

INSERT INTO chat_stop_words (word, category) VALUES
('http://', 'spam'),
('https://', 'spam'),
('t.me/', 'spam'),
('telegram.me', 'spam'),
('vk.com', 'spam'),
('whatsapp', 'spam'),
('бесплатно', 'spam'),
('заработок', 'spam'),
('криптовалюта', 'spam'),
('инвестиции гарантированы', 'spam')
ON CONFLICT DO NOTHING;