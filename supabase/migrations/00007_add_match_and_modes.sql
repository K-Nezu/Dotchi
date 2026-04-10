-- マッチシステム用カラム追加
ALTER TABLE posts ADD COLUMN status TEXT NOT NULL DEFAULT 'active';
ALTER TABLE posts ADD COLUMN challenger_id TEXT;
ALTER TABLE posts ADD COLUMN matched_at TIMESTAMPTZ;

-- モード制約を拡張（movie, game 追加）
ALTER TABLE posts DROP CONSTRAINT posts_mode_check;
ALTER TABLE posts ADD CONSTRAINT posts_mode_check CHECK (mode IN ('text', 'image', 'music', 'movie', 'game'));

-- ステータス制約
ALTER TABLE posts ADD CONSTRAINT posts_status_check CHECK (status IN ('open', 'active', 'expired'));

-- openポスト検索用の部分インデックス
CREATE INDEX idx_posts_status_open ON posts (status, created_at DESC) WHERE status = 'open';
