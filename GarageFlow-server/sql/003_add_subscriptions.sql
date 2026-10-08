CREATE TABLE IF NOT EXISTS `subscriptions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `shop_id` int NOT NULL,
  `stripe_customer_id` varchar(255) DEFAULT NULL,
  `stripe_subscription_id` varchar(255) DEFAULT NULL,
  `plan` varchar(32) NOT NULL DEFAULT 'pro',
  `status` varchar(32) NOT NULL DEFAULT 'trialing',
  `trial_start` datetime DEFAULT NULL,
  `trial_end` datetime DEFAULT NULL,
  `current_period_end` datetime DEFAULT NULL,
  `is_lifetime` tinyint(1) NOT NULL DEFAULT 0,
  `is_overridden` tinyint(1) NOT NULL DEFAULT 0,
  `override_plan` varchar(32) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `u_subscription_shop` (`shop_id`),
  UNIQUE KEY `u_subscription_customer` (`stripe_customer_id`),
  UNIQUE KEY `u_subscription_stripe_sub` (`stripe_subscription_id`),
  INDEX (`plan`),
  INDEX (`status`),
  INDEX (`is_lifetime`),
  INDEX (`is_overridden`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

ALTER TABLE `subscriptions`
  ADD COLUMN IF NOT EXISTS `is_lifetime` tinyint(1) NOT NULL DEFAULT 0 AFTER `current_period_end`,
  ADD COLUMN IF NOT EXISTS `is_overridden` tinyint(1) NOT NULL DEFAULT 0 AFTER `is_lifetime`,
  ADD COLUMN IF NOT EXISTS `override_plan` varchar(32) DEFAULT NULL AFTER `is_overridden`;

CREATE TABLE IF NOT EXISTS `admins` (
  `id` int NOT NULL AUTO_INCREMENT,
  `email` varchar(255) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `role` varchar(64) NOT NULL DEFAULT 'super_admin',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `u_admin_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `admin_logs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `admin_id` int NOT NULL,
  `action` varchar(64) NOT NULL,
  `shop_id` int NOT NULL,
  `reason` text DEFAULT NULL,
  `metadata_json` json DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX (`admin_id`),
  INDEX (`shop_id`),
  INDEX (`action`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
