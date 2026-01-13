-- Custom SQL: FTS5 Full-Text Search for Posts
-- This file contains FTS5 setup for efficient text search on post content
-- When regenerating migrations from scratch, re-run: yarn db:generate --custom
-- Then copy this content into the generated custom migration file

-- Create FTS5 virtual table for posts full-text search
-- Uses 'content' option to avoid duplicating post text
-- content_rowid links to posts.id
-- Uses unicode61 tokenizer for word-based languages (English, etc.)
-- Note: CJK (Chinese/Japanese/Korean) text uses LIKE queries in the service layer
CREATE VIRTUAL TABLE IF NOT EXISTS posts_fts USING fts5(
  text,
  content='posts',
  content_rowid='id',
  tokenize='unicode61'
);

-- Populate FTS5 index with existing posts
INSERT INTO posts_fts(rowid, text)
SELECT id, text FROM posts;

-- Trigger: Keep FTS5 index in sync when posts are inserted
CREATE TRIGGER IF NOT EXISTS posts_fts_insert AFTER INSERT ON posts BEGIN
  INSERT INTO posts_fts(rowid, text) VALUES (new.id, new.text);
END;

-- Trigger: Keep FTS5 index in sync when posts are updated
CREATE TRIGGER IF NOT EXISTS posts_fts_update AFTER UPDATE ON posts BEGIN
  UPDATE posts_fts SET text = new.text WHERE rowid = old.id;
END;

-- Trigger: Keep FTS5 index in sync when posts are deleted
CREATE TRIGGER IF NOT EXISTS posts_fts_delete AFTER DELETE ON posts BEGIN
  DELETE FROM posts_fts WHERE rowid = old.id;
END;
