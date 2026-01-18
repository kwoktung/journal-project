-- Add thumbHash column to existing attachments table
ALTER TABLE `attachments` ADD COLUMN `thumb_hash` text;
