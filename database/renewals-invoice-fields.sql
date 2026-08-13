-- Optional columns for Tally-style tax invoice buyer fields
-- Run: mysql -u kalpanik -p kalpanik < database/renewals-invoice-fields.sql
-- Ignore "Duplicate column" errors if already applied.

USE kalpanik;

ALTER TABLE renewals ADD COLUMN contact_person VARCHAR(255) DEFAULT NULL AFTER gstin;
ALTER TABLE renewals ADD COLUMN buyer_state VARCHAR(128) DEFAULT NULL AFTER contact_person;
ALTER TABLE renewals ADD COLUMN buyer_state_code VARCHAR(8) DEFAULT NULL AFTER buyer_state;
