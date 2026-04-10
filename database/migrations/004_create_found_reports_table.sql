-- Migration: Create found_reports table
-- This table stores found person reports submitted by users

CREATE TABLE IF NOT EXISTS `found_reports` (
    `id`                    BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `user_id`               BIGINT UNSIGNED NOT NULL,

    -- Found Person Information
    `name`                  VARCHAR(255) NULL COMMENT 'Name if known, else NULL',
    `approximate_age`       INT NULL,
    `gender`                VARCHAR(50) NULL,
    `health_status`         VARCHAR(50) DEFAULT 'unknown' COMMENT 'healthy|sick|unknown',

    -- Photo
    `photo_url`             VARCHAR(500) NULL,
    `cloudinary_public_id`  VARCHAR(255) NULL,

    -- Found Location & Time
    `found_date`            DATE NULL,
    `found_time`            TIME NULL,
    `district`              VARCHAR(100) NOT NULL,
    `address`               TEXT NULL,

    -- Description
    `physical_description`  TEXT NULL COMMENT 'height, clothing, identifying marks',
    `additional_info`       TEXT NULL,

    -- Contact
    `contact_person_name`   VARCHAR(255) NOT NULL,
    `contact_phone`         VARCHAR(20) NOT NULL,

    -- Status Management (same as missing_reports)
    `status`                VARCHAR(50) DEFAULT 'pending',
    `approved`              TINYINT(1) DEFAULT 0,
    `rejection_reason`      TEXT NULL,

    -- Timestamps
    `created_at`            TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at`            TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT `fk_found_reports_user_id`
        FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,

    INDEX `idx_found_user_id`   (`user_id`),
    INDEX `idx_found_status`    (`status`),
    INDEX `idx_found_approved`  (`approved`),
    INDEX `idx_found_district`  (`district`),
    INDEX `idx_found_created`   (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
