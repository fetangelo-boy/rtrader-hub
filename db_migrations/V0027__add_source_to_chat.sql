ALTER TABLE club_chat ADD COLUMN IF NOT EXISTS source VARCHAR(16) NOT NULL DEFAULT 'club';
UPDATE club_chat SET source = 'club' WHERE source IS NULL OR source = '';
