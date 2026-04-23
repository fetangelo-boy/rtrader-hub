-- Adds demo user as participant to all chats.
-- Replace the email in WHERE clause if your demo account differs.
-- Safe to run multiple times due to ON CONFLICT.

INSERT INTO chat_participants (chat_id, user_id, unread_count)
SELECT c.id, p.id, 0
FROM chats c
JOIN profiles p ON p.email = 'test@rtrader.com'
ON CONFLICT (chat_id, user_id) DO UPDATE
SET unread_count = EXCLUDED.unread_count;
