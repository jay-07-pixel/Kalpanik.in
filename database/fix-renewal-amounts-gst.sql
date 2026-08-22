-- Fix legacy renewals where amount_inr was stored pre-GST (taxable only).
-- Run: mysql -u kalpanik -p kalpanik < database/fix-renewal-amounts-gst.sql

USE kalpanik;

UPDATE renewals r
SET amount_inr = ROUND(
  (
    CASE r.plan
      WHEN 'task_management' THEN 299
      WHEN 'task_attendance' THEN 349
      ELSE 0
    END * r.users * r.months
    + r.extra_gb * 100 * r.months
  ) * 1.18,
  2
)
WHERE ABS(
  amount_inr - (
    CASE r.plan
      WHEN 'task_management' THEN 299
      WHEN 'task_attendance' THEN 349
      ELSE 0
    END * r.users * r.months
    + r.extra_gb * 100 * r.months
  )
) < 0.02;

SELECT invoice_no, company, users, plan, months, amount_inr, status
FROM renewals
ORDER BY created_at DESC
LIMIT 20;
