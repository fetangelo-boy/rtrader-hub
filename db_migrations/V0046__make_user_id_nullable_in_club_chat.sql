ALTER TABLE club_chat ADD COLUMN user_id_new INTEGER;
UPDATE club_chat SET user_id_new = user_id;
ALTER TABLE club_chat RENAME COLUMN user_id TO user_id_old;
ALTER TABLE club_chat RENAME COLUMN user_id_new TO user_id;