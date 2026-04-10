ALTER TABLE tg_link_tokens ALTER COLUMN user_id SET DEFAULT NULL;
UPDATE tg_link_tokens SET user_id = NULL WHERE for_registration = TRUE AND user_id IS NOT NULL;