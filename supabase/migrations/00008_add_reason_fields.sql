-- Add reason text fields for poster and challenger
ALTER TABLE posts ADD COLUMN option_a_reason text;
ALTER TABLE posts ADD COLUMN option_b_reason text;
