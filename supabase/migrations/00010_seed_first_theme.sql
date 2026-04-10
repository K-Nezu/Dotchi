-- Allow service_role to insert themes (for admin scripts)
-- anon users can only read
CREATE POLICY "Service role can manage themes" ON daily_themes
  FOR ALL USING (true) WITH CHECK (true);

-- Seed: first daily theme
INSERT INTO daily_themes (date, title, description, examples, mode)
VALUES (
  '2026-04-07',
  '2025年のゲームオブザイヤーは？',
  'あなたが思う2025年最高のゲームを投稿しよう',
  ARRAY['エルデンリング DLC vs モンハンワイルズ', 'GTA6 vs ゼルダ新作', 'FF7R3 vs ペルソナ6'],
  'game'
);
