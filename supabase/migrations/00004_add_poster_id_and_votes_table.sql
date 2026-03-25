-- Add poster_id to track which device created the post
ALTER TABLE posts ADD COLUMN poster_id TEXT;

-- Votes table to track individual votes and prevent duplicates
CREATE TABLE votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  device_id TEXT NOT NULL,
  choice TEXT NOT NULL CHECK (choice IN ('a', 'b')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (post_id, device_id)
);

CREATE INDEX idx_votes_post_id ON votes (post_id);

-- RLS for votes
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Votes are publicly readable"
  ON votes FOR SELECT USING (true);

CREATE POLICY "Anyone can insert votes"
  ON votes FOR INSERT WITH CHECK (true);

-- Allow deleting votes (for cascade from posts deletion)
CREATE POLICY "System can delete votes"
  ON votes FOR DELETE USING (true);
