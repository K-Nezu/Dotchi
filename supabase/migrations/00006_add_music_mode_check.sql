-- Allow 'music' in mode check constraint
ALTER TABLE posts DROP CONSTRAINT posts_mode_check;
ALTER TABLE posts ADD CONSTRAINT posts_mode_check CHECK (mode IN ('text', 'image', 'music'));
