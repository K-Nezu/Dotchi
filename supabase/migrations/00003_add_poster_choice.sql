-- Add poster_choice field to track which option the poster prefers
ALTER TABLE posts ADD COLUMN poster_choice TEXT CHECK (poster_choice IN ('a', 'b'));
