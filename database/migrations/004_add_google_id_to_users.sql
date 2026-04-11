-- Add Google OAuth link field to users table
ALTER TABLE `users`
    ADD COLUMN `google_id` VARCHAR(191) NULL AFTER `email`,
    ADD UNIQUE INDEX `users_google_id_unique` (`google_id`);
