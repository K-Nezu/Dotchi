-- Drop existing policies and recreate properly
DROP POLICY IF EXISTS "Anyone can read themes" ON daily_themes;
DROP POLICY IF EXISTS "Service role can manage themes" ON daily_themes;

-- Allow anyone to read themes
CREATE POLICY "Public read themes" ON daily_themes
  FOR SELECT TO anon, authenticated
  USING (true);

-- Allow anyone to insert themes (for now, will restrict later)
CREATE POLICY "Public insert themes" ON daily_themes
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);
