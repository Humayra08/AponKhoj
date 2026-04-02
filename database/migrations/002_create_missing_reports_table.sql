-- Migration: Create missing_reports table
-- This table stores missing person reports submitted by users

CREATE TABLE IF NOT EXISTS `missing_reports` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `user_id` BIGINT UNSIGNED NOT NULL,
    
    -- Missing Person Information
    `name` VARCHAR(255) NOT NULL,
    `age` INT NULL,
    `gender` VARCHAR(50) NULL,
    `height` VARCHAR(100) NULL,
    
    -- Photo/Image Information
    `photo_url` VARCHAR(500) NULL,
    `cloudinary_public_id` VARCHAR(255) NULL,
    
    -- Last Seen Information
    `last_seen_date` DATE NULL,
    `last_seen_time` TIME NULL,
    `district` VARCHAR(100) NULL,
    `address` TEXT NULL,
    
    -- Additional Details
    `clothing_description` TEXT NULL,
    `additional_info` TEXT NULL,
    
    -- Contact Information
    `contact_person_name` VARCHAR(255) NULL,
    `contact_phone` VARCHAR(20) NULL,
    
    -- Status Management
    `status` VARCHAR(50) DEFAULT 'pending',
    `approved` TINYINT(1) DEFAULT 0,
    `rejection_reason` TEXT NULL,
    
    -- Timestamps
    `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Foreign Keys
    CONSTRAINT `fk_missing_reports_user_id` 
        FOREIGN KEY (`user_id`) 
        REFERENCES `users` (`id`) 
        ON DELETE CASCADE,
    
    -- Indexes
    INDEX `idx_user_id` (`user_id`),
    INDEX `idx_status` (`status`),
    INDEX `idx_approved` (`approved`),
    INDEX `idx_district` (`district`),
    INDEX `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
