-- Добавляем роль editor через constraint (если есть) или просто обновляем существующих
-- Роли: owner, admin, editor, subscriber
-- Никаких структурных изменений — поле role TEXT уже существует, просто документируем новые значения
-- Добавляем индекс для быстрого поиска по роли
CREATE INDEX IF NOT EXISTS idx_club_users_role ON club_users(role);
