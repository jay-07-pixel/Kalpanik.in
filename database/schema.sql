-- Kalpanik waitlist schema
-- Run once against your MySQL database before starting the API server.

CREATE DATABASE IF NOT EXISTS kalpanik
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE kalpanik;

CREATE TABLE IF NOT EXISTS waitlist (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  email VARCHAR(255) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_waitlist_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
