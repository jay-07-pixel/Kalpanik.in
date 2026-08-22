-- Rewrite legacy activation notes that contain raw HTML error pages.
-- Run: mysql -u kalpanik -p kalpanik < database/clean-activation-notes.sql

USE kalpanik;

UPDATE renewals
SET activation_note = CONCAT(
  'Site error ',
  SUBSTRING_INDEX(SUBSTRING_INDEX(activation_note, 'Webhook ', -1), ':', 1),
  ': Cannot POST /api/company/subscription/activate. Manual: set COMPANY_TRIAL_END=',
  COALESCE(DATE(trial_end_extend_to), trial_end_extend_to),
  ' on Task_manager instance folder'
)
WHERE activation_note LIKE '%<!DOCTYPE html>%'
  AND activation_note LIKE '%Cannot POST%';

SELECT invoice_no, activation_status, LEFT(activation_note, 120) AS note_preview
FROM renewals
WHERE activation_note IS NOT NULL
ORDER BY updated_at DESC
LIMIT 10;
