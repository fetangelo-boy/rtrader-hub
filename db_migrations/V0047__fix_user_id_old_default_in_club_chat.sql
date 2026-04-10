ALTER TABLE club_chat ALTER COLUMN user_id_old SET DEFAULT 0;
UPDATE club_chat SET user_id_old = 0 WHERE user_id_old IS NULL;