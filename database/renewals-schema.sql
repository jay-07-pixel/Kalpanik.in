-- Kalpanik subscription renewals
-- Run: mysql -u kalpanik -p kalpanik < database/renewals-schema.sql

USE kalpanik;

CREATE TABLE IF NOT EXISTS renewals (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  invoice_no VARCHAR(32) NOT NULL,
  instance VARCHAR(64) DEFAULT NULL,
  site VARCHAR(512) DEFAULT NULL,
  company VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(64) DEFAULT NULL,
  users INT UNSIGNED NOT NULL DEFAULT 1,
  plan ENUM('task_management', 'task_attendance') NOT NULL,
  months INT UNSIGNED NOT NULL DEFAULT 1,
  extra_gb INT UNSIGNED NOT NULL DEFAULT 0,
  amount_inr DECIMAL(12, 2) NOT NULL,
  trial_end DATE DEFAULT NULL,
  billing_address TEXT DEFAULT NULL,
  gstin VARCHAR(32) DEFAULT NULL,
  source VARCHAR(64) DEFAULT 'website',
  status ENUM('draft', 'pending', 'paid', 'failed', 'cancelled') NOT NULL DEFAULT 'pending',
  utr VARCHAR(128) DEFAULT NULL,
  screenshot_path VARCHAR(512) DEFAULT NULL,
  paid_at DATETIME DEFAULT NULL,
  activated_at DATETIME DEFAULT NULL,
  activation_status ENUM('pending', 'webhook_ok', 'webhook_failed', 'manual') DEFAULT 'pending',
  activation_note TEXT DEFAULT NULL,
  trial_end_extend_to DATE DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_invoice_no (invoice_no),
  KEY idx_status (status),
  KEY idx_instance (instance),
  KEY idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
