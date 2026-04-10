-- Migration: Create found_matches table
-- This table stores AI match scores between found reports and missing reports

CREATE TABLE IF NOT EXISTS `found_matches` (
    `id`                BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `found_report_id`   BIGINT UNSIGNED NOT NULL,
    `missing_report_id` BIGINT UNSIGNED NOT NULL,

    -- AI Score Breakdown
    `total_score`       DECIMAL(5,2) NOT NULL DEFAULT 0.00 COMMENT '0-100',
    `name_score`        DECIMAL(5,2) NOT NULL DEFAULT 0.00 COMMENT '0-35',
    `district_score`    DECIMAL(5,2) NOT NULL DEFAULT 0.00 COMMENT '0-25',
    `location_score`    DECIMAL(5,2) NOT NULL DEFAULT 0.00 COMMENT '0-20',
    `age_score`         DECIMAL(5,2) NOT NULL DEFAULT 0.00 COMMENT '0-10',
    `gender_score`      DECIMAL(5,2) NOT NULL DEFAULT 0.00 COMMENT '0-5',
    `description_score` DECIMAL(5,2) NOT NULL DEFAULT 0.00 COMMENT '0-5',

    `ai_reasoning`      TEXT NULL COMMENT 'Human-readable explanation from AI',
    `match_level`       VARCHAR(20) DEFAULT 'low' COMMENT 'high|medium|low',

    `created_at`        TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at`        TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT `fk_fm_found_report`
        FOREIGN KEY (`found_report_id`) REFERENCES `found_reports` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_fm_missing_report`
        FOREIGN KEY (`missing_report_id`) REFERENCES `missing_reports` (`id`) ON DELETE CASCADE,

    UNIQUE KEY `uq_found_missing` (`found_report_id`, `missing_report_id`),
    INDEX `idx_fm_total_score`  (`total_score`),
    INDEX `idx_fm_match_level`  (`match_level`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
