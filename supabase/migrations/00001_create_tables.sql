-- Posts table
CREATE TABLE posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mode TEXT NOT NULL CHECK (mode IN ('text', 'image')),
  option_a_text TEXT,
  option_b_text TEXT,
  option_a_image_url TEXT,
  option_b_image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  vote_count_a INTEGER NOT NULL DEFAULT 0,
  vote_count_b INTEGER NOT NULL DEFAULT 0,
  is_expired BOOLEAN NOT NULL DEFAULT false
);

-- Index for timeline query (active posts sorted by newest)
CREATE INDEX idx_posts_expires_at ON posts (expires_at DESC);
CREATE INDEX idx_posts_created_at ON posts (created_at DESC);

-- RPC to atomically increment vote count
CREATE OR REPLACE FUNCTION increment_vote(p_post_id UUID, p_column TEXT)
RETURNS VOID AS $$
BEGIN
  IF p_column = 'vote_count_a' THEN
    UPDATE posts SET vote_count_a = vote_count_a + 1 WHERE id = p_post_id;
  ELSIF p_column = 'vote_count_b' THEN
    UPDATE posts SET vote_count_b = vote_count_b + 1 WHERE id = p_post_id;
  ELSE
    RAISE EXCEPTION 'Invalid column: %', p_column;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable realtime for posts
ALTER PUBLICATION supabase_realtime ADD TABLE posts;

-- Row Level Security
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- Anyone can read posts
CREATE POLICY "Posts are publicly readable"
  ON posts FOR SELECT
  USING (true);

-- Anyone can insert posts (anonymous usage)
CREATE POLICY "Anyone can create posts"
  ON posts FOR INSERT
  WITH CHECK (true);

-- Only the system can update posts (via RPC)
CREATE POLICY "System can update posts"
  ON posts FOR UPDATE
  USING (true);

-- Storage bucket for post images
INSERT INTO storage.buckets (id, name, public)
VALUES ('post-images', 'post-images', true)
ON CONFLICT (id) DO NOTHING;

-- Anyone can upload images
CREATE POLICY "Anyone can upload post images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'post-images');

-- Anyone can view post images
CREATE POLICY "Anyone can view post images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'post-images');
