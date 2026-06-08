-- Kalpanik analytics & admin tracking
-- Run after schema.sql

USE kalpanik;

CREATE TABLE IF NOT EXISTS page_visits (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  visitor_id VARCHAR(36) NOT NULL,
  device_type ENUM('mobile', 'desktop', 'tablet', 'unknown') NOT NULL DEFAULT 'unknown',
  browser VARCHAR(64) NOT NULL DEFAULT 'Unknown',
  country VARCHAR(64) DEFAULT NULL,
  referrer VARCHAR(512) DEFAULT NULL,
  traffic_source VARCHAR(32) NOT NULL DEFAULT 'direct',
  path VARCHAR(255) NOT NULL DEFAULT '/',
  user_agent VARCHAR(512) DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_visitor_id (visitor_id),
  KEY idx_created_at (created_at),
  KEY idx_device_type (device_type),
  KEY idx_browser (browser),
  KEY idx_country (country),
  KEY idx_traffic_source (traffic_source)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
