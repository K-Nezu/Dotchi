-- Comments table for voter reactions
CREATE TABLE comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  device_id text NOT NULL,
  choice text NOT NULL CHECK (choice IN ('a', 'b')),
  body text NOT NULL CHECK (char_length(body) <= 100),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- One comment per vote (same constraint as votes)
CREATE UNIQUE INDEX idx_comments_unique_vote ON comments (post_id, device_id);

-- For fetching comments by post
CREATE INDEX idx_comments_post_id ON comments (post_id, created_at ASC);

-- RLS
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read comments" ON comments FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Public insert comments" ON comments FOR INSERT TO anon, authenticated WITH CHECK (true);

-- Grant access
GRANT SELECT, INSERT ON comments TO anon, authenticated;

-- Enable realtime for comments
ALTER PUBLICATION supabase_realtime ADD TABLE comments;
