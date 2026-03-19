-- Add question field to posts
ALTER TABLE posts ADD COLUMN question TEXT;

-- Allow delete for testing/cleanup
CREATE POLICY "Anyone can delete posts"
  ON posts FOR DELETE
  USING (true);
