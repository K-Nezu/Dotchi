-- Daily themes (お題) table
CREATE TABLE daily_themes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date NOT NULL UNIQUE,
  title text NOT NULL,
  description text,
  examples text[],
  mode text CHECK (mode IN ('text', 'image', 'music', 'movie', 'game')),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Index for looking up today's theme
CREATE INDEX idx_daily_themes_date ON daily_themes (date DESC);

-- Add theme_id to posts (optional)
ALTER TABLE posts ADD COLUMN theme_id uuid REFERENCES daily_themes(id);
CREATE INDEX idx_posts_theme_id ON posts (theme_id) WHERE theme_id IS NOT NULL;

-- RLS
ALTER TABLE daily_themes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read themes" ON daily_themes FOR SELECT USING (true);
