-- Custom SQL migration file, put your code below! ---- Custom SQL: Relationship constraints and triggers
-- This file contains custom SQL that should be applied after schema migrations
-- When regenerating migrations from scratch, re-run: yarn db:generate --custom
-- Then copy this content into the generated custom migration file

-- Add composite indexes for efficient querying of relationships
CREATE INDEX IF NOT EXISTS `relationships_user1_id_status_idx` ON `relationships` (`user1_id`, `status`);
CREATE INDEX IF NOT EXISTS `relationships_user2_id_status_idx` ON `relationships` (`user2_id`, `status`);

-- Trigger to enforce single relationship (any status) on INSERT
-- Prevents users from having multiple relationships regardless of status
CREATE TRIGGER IF NOT EXISTS `enforce_single_relationship_insert`
BEFORE INSERT ON `relationships`
BEGIN
  SELECT RAISE(ABORT, 'User already has a relationship')
  WHERE EXISTS (
    SELECT 1 FROM relationships
    WHERE (user1_id = NEW.user1_id OR user2_id = NEW.user1_id
           OR user1_id = NEW.user2_id OR user2_id = NEW.user2_id)
  );
END;

-- Trigger to enforce single relationship (any status) on UPDATE
-- Prevents changing user IDs if it would violate the constraint
CREATE TRIGGER IF NOT EXISTS `enforce_single_relationship_update`
BEFORE UPDATE OF user1_id, user2_id ON `relationships`
BEGIN
  SELECT RAISE(ABORT, 'User already has a relationship')
  WHERE EXISTS (
    SELECT 1 FROM relationships
    WHERE id != NEW.id
    AND (user1_id = NEW.user1_id OR user2_id = NEW.user1_id
         OR user1_id = NEW.user2_id OR user2_id = NEW.user2_id)
  );
END;

-- Custom SQL: FTS5 Full-Text Search for Posts
-- This file contains FTS5 setup for efficient text search on post content
-- When regenerating migrations from scratch, re-run: yarn db:generate --custom
-- Then copy this content into the generated custom migration file

-- Create FTS5 virtual table for posts full-text search
-- Uses 'content' option to avoid duplicating post text
-- content_rowid links to posts.id
-- Uses trigram tokenizer for multi-language support (English, Chinese, etc.)
CREATE VIRTUAL TABLE IF NOT EXISTS posts_fts USING fts5(
  text,
  content='posts',
  content_rowid='id',
  tokenize='trigram'
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
