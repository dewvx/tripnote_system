-- CreateTable
CREATE TABLE `users` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `email` VARCHAR(255) NOT NULL,
    `password_hash` VARCHAR(255) NOT NULL,
    `display_name` VARCHAR(100) NOT NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NOT NULL,

    UNIQUE INDEX `users_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `refresh_tokens` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER UNSIGNED NOT NULL,
    `token_hash` CHAR(64) NOT NULL,
    `expires_at` DATETIME(0) NOT NULL,
    `revoked_at` DATETIME(0) NULL,
    `user_agent` VARCHAR(255) NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `refresh_tokens_token_hash_key`(`token_hash`),
    INDEX `refresh_tokens_user_id_idx`(`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `trips` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `created_by_user_id` INTEGER UNSIGNED NOT NULL,
    `name` VARCHAR(150) NOT NULL,
    `description` TEXT NULL,
    `origin_name` VARCHAR(150) NULL,
    `destination_name` VARCHAR(150) NOT NULL,
    `destination_lat` DECIMAL(9, 6) NULL,
    `destination_lng` DECIMAL(9, 6) NULL,
    `start_date` DATE NOT NULL,
    `end_date` DATE NOT NULL,
    `timezone` VARCHAR(64) NOT NULL DEFAULT 'Asia/Bangkok',
    `currency` CHAR(3) NOT NULL DEFAULT 'THB',
    `budget_amount` DECIMAL(12, 2) NULL,
    `status` ENUM('planning', 'active', 'completed', 'cancelled') NOT NULL DEFAULT 'planning',
    `started_at` DATETIME(0) NULL,
    `completed_at` DATETIME(0) NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NOT NULL,
    `deleted_at` DATETIME(0) NULL,

    INDEX `trips_created_by_user_id_idx`(`created_by_user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `trip_members` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `trip_id` INTEGER UNSIGNED NOT NULL,
    `user_id` INTEGER UNSIGNED NULL,
    `display_name` VARCHAR(100) NOT NULL,
    `role` ENUM('owner', 'editor', 'viewer') NOT NULL DEFAULT 'editor',
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NOT NULL,

    INDEX `trip_members_user_id_idx`(`user_id`),
    UNIQUE INDEX `trip_members_trip_id_user_id_key`(`trip_id`, `user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `places` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `trip_id` INTEGER UNSIGNED NOT NULL,
    `name` VARCHAR(150) NOT NULL,
    `category` ENUM('attraction', 'accommodation', 'food', 'event', 'shopping', 'transport_hub', 'other') NOT NULL DEFAULT 'other',
    `address` VARCHAR(255) NULL,
    `lat` DECIMAL(9, 6) NULL,
    `lng` DECIMAL(9, 6) NULL,
    `external_source` VARCHAR(30) NULL,
    `external_id` VARCHAR(255) NULL,
    `note` TEXT NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NOT NULL,

    INDEX `places_trip_id_idx`(`trip_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `itinerary_items` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `trip_id` INTEGER UNSIGNED NOT NULL,
    `day_date` DATE NOT NULL,
    `start_time` TIME(0) NULL,
    `end_time` TIME(0) NULL,
    `type` ENUM('activity', 'transport') NOT NULL DEFAULT 'activity',
    `title` VARCHAR(150) NOT NULL,
    `place_id` INTEGER UNSIGNED NULL,
    `transport_mode` ENUM('bus', 'train', 'car', 'motorcycle', 'taxi', 'flight', 'boat', 'walk', 'other') NULL,
    `from_label` VARCHAR(150) NULL,
    `to_label` VARCHAR(150) NULL,
    `estimated_cost` DECIMAL(12, 2) NULL,
    `note` TEXT NULL,
    `status` ENUM('planned', 'done', 'skipped') NOT NULL DEFAULT 'planned',
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NOT NULL,

    INDEX `itinerary_items_trip_id_day_date_sort_order_idx`(`trip_id`, `day_date`, `sort_order`),
    INDEX `itinerary_items_place_id_idx`(`place_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `expense_categories` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `code` VARCHAR(30) NOT NULL,
    `name_th` VARCHAR(50) NOT NULL,
    `name_en` VARCHAR(50) NOT NULL,
    `icon` VARCHAR(30) NOT NULL,
    `color` CHAR(7) NOT NULL,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `is_active` BOOLEAN NOT NULL DEFAULT true,

    UNIQUE INDEX `expense_categories_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `expenses` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `trip_id` INTEGER UNSIGNED NOT NULL,
    `category_id` INTEGER UNSIGNED NOT NULL,
    `paid_by_member_id` INTEGER UNSIGNED NOT NULL,
    `created_by_user_id` INTEGER UNSIGNED NOT NULL,
    `amount` DECIMAL(12, 2) NOT NULL,
    `description` VARCHAR(255) NULL,
    `spent_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `place_id` INTEGER UNSIGNED NULL,
    `journal_entry_id` INTEGER UNSIGNED NULL,
    `client_id` CHAR(36) NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NOT NULL,
    `deleted_at` DATETIME(0) NULL,

    INDEX `expenses_trip_id_spent_at_idx`(`trip_id`, `spent_at`),
    INDEX `expenses_trip_id_category_id_idx`(`trip_id`, `category_id`),
    INDEX `expenses_trip_id_paid_by_member_id_idx`(`trip_id`, `paid_by_member_id`),
    INDEX `expenses_category_id_idx`(`category_id`),
    INDEX `expenses_paid_by_member_id_idx`(`paid_by_member_id`),
    INDEX `expenses_place_id_idx`(`place_id`),
    INDEX `expenses_journal_entry_id_idx`(`journal_entry_id`),
    UNIQUE INDEX `expenses_trip_id_client_id_key`(`trip_id`, `client_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `journal_entries` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `trip_id` INTEGER UNSIGNED NOT NULL,
    `created_by_user_id` INTEGER UNSIGNED NOT NULL,
    `body` TEXT NULL,
    `place_id` INTEGER UNSIGNED NULL,
    `location_label` VARCHAR(150) NULL,
    `lat` DECIMAL(9, 6) NULL,
    `lng` DECIMAL(9, 6) NULL,
    `rating` TINYINT UNSIGNED NULL,
    `occurred_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `client_id` CHAR(36) NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NOT NULL,
    `deleted_at` DATETIME(0) NULL,

    INDEX `journal_entries_trip_id_occurred_at_idx`(`trip_id`, `occurred_at`),
    INDEX `journal_entries_trip_id_place_id_idx`(`trip_id`, `place_id`),
    INDEX `journal_entries_place_id_idx`(`place_id`),
    UNIQUE INDEX `journal_entries_trip_id_client_id_key`(`trip_id`, `client_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `photos` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `trip_id` INTEGER UNSIGNED NOT NULL,
    `uploaded_by_user_id` INTEGER UNSIGNED NOT NULL,
    `kind` ENUM('memory', 'receipt') NOT NULL DEFAULT 'memory',
    `journal_entry_id` INTEGER UNSIGNED NULL,
    `expense_id` INTEGER UNSIGNED NULL,
    `storage_key` VARCHAR(255) NOT NULL,
    `thumb_key` VARCHAR(255) NOT NULL,
    `mime_type` VARCHAR(50) NOT NULL,
    `size_bytes` INTEGER UNSIGNED NOT NULL,
    `width` INTEGER UNSIGNED NOT NULL,
    `height` INTEGER UNSIGNED NOT NULL,
    `caption` VARCHAR(255) NULL,
    `taken_at` DATETIME(0) NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `deleted_at` DATETIME(0) NULL,

    INDEX `photos_trip_id_taken_at_idx`(`trip_id`, `taken_at`),
    INDEX `photos_journal_entry_id_idx`(`journal_entry_id`),
    INDEX `photos_expense_id_idx`(`expense_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `refresh_tokens` ADD CONSTRAINT `refresh_tokens_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `trips` ADD CONSTRAINT `trips_created_by_user_id_fkey` FOREIGN KEY (`created_by_user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `trip_members` ADD CONSTRAINT `trip_members_trip_id_fkey` FOREIGN KEY (`trip_id`) REFERENCES `trips`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `trip_members` ADD CONSTRAINT `trip_members_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `places` ADD CONSTRAINT `places_trip_id_fkey` FOREIGN KEY (`trip_id`) REFERENCES `trips`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `itinerary_items` ADD CONSTRAINT `itinerary_items_trip_id_fkey` FOREIGN KEY (`trip_id`) REFERENCES `trips`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `itinerary_items` ADD CONSTRAINT `itinerary_items_place_id_fkey` FOREIGN KEY (`place_id`) REFERENCES `places`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `expenses` ADD CONSTRAINT `expenses_trip_id_fkey` FOREIGN KEY (`trip_id`) REFERENCES `trips`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `expenses` ADD CONSTRAINT `expenses_category_id_fkey` FOREIGN KEY (`category_id`) REFERENCES `expense_categories`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `expenses` ADD CONSTRAINT `expenses_paid_by_member_id_fkey` FOREIGN KEY (`paid_by_member_id`) REFERENCES `trip_members`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `expenses` ADD CONSTRAINT `expenses_created_by_user_id_fkey` FOREIGN KEY (`created_by_user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `expenses` ADD CONSTRAINT `expenses_place_id_fkey` FOREIGN KEY (`place_id`) REFERENCES `places`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `expenses` ADD CONSTRAINT `expenses_journal_entry_id_fkey` FOREIGN KEY (`journal_entry_id`) REFERENCES `journal_entries`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `journal_entries` ADD CONSTRAINT `journal_entries_trip_id_fkey` FOREIGN KEY (`trip_id`) REFERENCES `trips`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `journal_entries` ADD CONSTRAINT `journal_entries_created_by_user_id_fkey` FOREIGN KEY (`created_by_user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `journal_entries` ADD CONSTRAINT `journal_entries_place_id_fkey` FOREIGN KEY (`place_id`) REFERENCES `places`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `photos` ADD CONSTRAINT `photos_trip_id_fkey` FOREIGN KEY (`trip_id`) REFERENCES `trips`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `photos` ADD CONSTRAINT `photos_uploaded_by_user_id_fkey` FOREIGN KEY (`uploaded_by_user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `photos` ADD CONSTRAINT `photos_journal_entry_id_fkey` FOREIGN KEY (`journal_entry_id`) REFERENCES `journal_entries`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `photos` ADD CONSTRAINT `photos_expense_id_fkey` FOREIGN KEY (`expense_id`) REFERENCES `expenses`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
