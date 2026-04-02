-- Add avatar fields to users table
ALTER TABLE `users`
    ADD COLUMN `avatar_url` VARCHAR(2048) NULL AFTER `district`,
    ADD COLUMN `avatar_public_id` VARCHAR(255) NULL AFTER `avatar_url`;
