-- Add music track fields for Apple Music / iTunes integration
ALTER TABLE posts
  ADD COLUMN option_a_track_id TEXT,
  ADD COLUMN option_b_track_id TEXT,
  ADD COLUMN option_a_artist TEXT,
  ADD COLUMN option_b_artist TEXT,
  ADD COLUMN option_a_preview_url TEXT,
  ADD COLUMN option_b_preview_url TEXT,
  ADD COLUMN option_a_artwork_url TEXT,
  ADD COLUMN option_b_artwork_url TEXT;
