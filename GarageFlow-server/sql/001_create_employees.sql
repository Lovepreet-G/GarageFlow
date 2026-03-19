-- 001_create_employees.sql
-- Creates employees and employee_schedules tables

CREATE TABLE IF NOT EXISTS `employees` (
  `id` int NOT NULL AUTO_INCREMENT,
  `shop_id` int NOT NULL,
  `first_name` varchar(255) NOT NULL,
  `last_name` varchar(255) DEFAULT NULL,
  `mobile` varchar(50) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `hourly_rate` decimal(10,2) DEFAULT NULL,
  `job_type` varchar(32) DEFAULT 'Part-time',
  'department_id' int DEFAULT NULL,
  `sin_number` varchar(50) DEFAULT NULL,
  `status` varchar(32) DEFAULT 'Active',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  INDEX (`shop_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- employee_schedules: one row per shift (work_date)
CREATE TABLE IF NOT EXISTS `employee_schedules` (
  `id` int NOT NULL AUTO_INCREMENT,
  `shop_id` int NOT NULL,
  `employee_id` int NOT NULL,
  `work_date` date NOT NULL,
  `start_time` time NOT NULL,
  `end_time` time NOT NULL,
  `break_start` time DEFAULT NULL,
  `break_end` time DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `status` varchar(32) DEFAULT 'scheduled',
  `created_by_user_id` int DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `u_employee_day` (`employee_id`, `work_date`, `start_time`),
  INDEX (`shop_id`),
  INDEX (`employee_id`),
  INDEX (`work_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- attendance generated from schedule
CREATE TABLE IF NOT EXISTS `attendance` (
  `id` int NOT NULL AUTO_INCREMENT,
  `shop_id` int NOT NULL,
  `employee_id` int NOT NULL,
  `work_date` date NOT NULL,
  `scheduled_start` time NOT NULL,
  `scheduled_end` time NOT NULL,
  `punch_in` time NOT NULL,
  `punch_out` time NOT NULL,
  `source` varchar(32) NOT NULL DEFAULT 'schedule',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `u_attendance_emp_day` (`employee_id`, `work_date`),
  INDEX (`shop_id`),
  INDEX (`employee_id`),
  INDEX (`work_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- departments
CREATE TABLE IF NOT EXISTS `departments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `shop_id` int NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  INDEX (`shop_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- roles (simple seedable table)
CREATE TABLE IF NOT EXISTS `roles` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(64) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT IGNORE INTO roles (id, name) VALUES
(1, 'Owner'), (2, 'Admin'), (3, 'Manager'), (4, 'Technician'), (5, 'ServiceAdvisor');

ALTER TABLE employees
  ADD COLUMN address_street VARCHAR(255) NULL AFTER sin_number,
  ADD COLUMN address_unit VARCHAR(50) NULL AFTER address_street,
  ADD COLUMN address_city VARCHAR(100) NULL AFTER address_unit,
  ADD COLUMN address_province VARCHAR(100) NULL AFTER address_city,
  ADD COLUMN address_country VARCHAR(100) NULL AFTER address_province,
  ADD COLUMN address_postal_code VARCHAR(20) NULL AFTER address_country;

ALTER TABLE employees
  ADD COLUMN dob DATE NULL AFTER last_name,
  ADD COLUMN password_hash VARCHAR(255) NULL AFTER email,
  ADD COLUMN must_reset_password TINYINT(1) NOT NULL DEFAULT 1 AFTER password_hash;

ALTER TABLE attendance
  ADD COLUMN break_start TIME NULL AFTER punch_out,
  ADD COLUMN break_end TIME NULL AFTER break_start;

CREATE TABLE IF NOT EXISTS `payroll_runs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `shop_id` int NOT NULL,
  `period_type` varchar(32) NOT NULL,
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `status` varchar(32) NOT NULL DEFAULT 'draft',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `u_payroll_run_period` (`shop_id`, `period_type`, `start_date`, `end_date`),
  INDEX (`shop_id`),
  INDEX (`start_date`),
  INDEX (`end_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `payroll_items` (
  `id` int NOT NULL AUTO_INCREMENT,
  `payroll_run_id` int NOT NULL,
  `employee_id` int NOT NULL,
  `worked_days` int NOT NULL DEFAULT 0,
  `worked_hours` decimal(10,2) NOT NULL DEFAULT 0.00,
  `hourly_rate` decimal(10,2) NOT NULL DEFAULT 0.00,
  `gross_pay` decimal(12,2) NOT NULL DEFAULT 0.00,
  `bonus_amount` decimal(12,2) NOT NULL DEFAULT 0.00,
  `penalty_amount` decimal(12,2) NOT NULL DEFAULT 0.00,
  `manual_adjustment` decimal(12,2) NOT NULL DEFAULT 0.00,
  `final_pay` decimal(12,2) NOT NULL DEFAULT 0.00,
  `notes` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `u_payroll_item_emp` (`payroll_run_id`, `employee_id`),
  INDEX (`employee_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `payroll_audit_logs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `payroll_run_id` int NOT NULL,
  `shop_id` int NOT NULL,
  `action` varchar(64) NOT NULL,
  `actor_label` varchar(255) DEFAULT NULL,
  `details` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX (`payroll_run_id`),
  INDEX (`shop_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
