-- AYSHA CONSTRUCTION & ENGINEERING SOLUTIONS LLP — payment received
-- Invoice KLP-20260820-8341 · TM-ACS · ₹33,870.72
-- Run on VPS: mysql -u kalpanik -p kalpanik < database/mark-paid-KLP-20260820-8341.sql
-- Then activate via admin "Mark Paid" or: node dist-server/scripts/markInvoicePaid.js KLP-20260820-8341

USE kalpanik;

INSERT INTO renewals (
  invoice_no, instance, site, company, email, phone, users, plan, months, extra_gb,
  amount_inr, billing_address, gstin, contact_person, buyer_state, buyer_state_code,
  source, status, utr, paid_at, activated_at, activation_status, activation_note,
  trial_end_extend_to
) VALUES (
  'KLP-20260820-8341',
  'TM-ACS',
  'https://acs.kalpanik.in',
  'AYSHA CONSTRUCTION & ENGINEERING SOLUTIONS LLP',
  'namra@ayshaconstructionsolutions.com',
  '9940500938',
  8,
  'task_management',
  12,
  0,
  33870.72,
  '9/5, 4TH WEST CROSS STREET, SHENOY NAGAR WEST CHENNAI 600030',
  '33ACHFA1060B1Z8',
  'NAMRA PAUN',
  'Tamil Nadu',
  '33',
  'task_manager',
  'pending',
  'MANUAL-PAYMENT-RECEIVED',
  NULL,
  NULL,
  'pending',
  NULL,
  '2027-08-20'
)
ON DUPLICATE KEY UPDATE
  company = VALUES(company),
  email = VALUES(email),
  phone = VALUES(phone),
  users = VALUES(users),
  plan = VALUES(plan),
  months = VALUES(months),
  amount_inr = VALUES(amount_inr),
  billing_address = VALUES(billing_address),
  gstin = VALUES(gstin),
  contact_person = VALUES(contact_person),
  buyer_state = VALUES(buyer_state),
  buyer_state_code = VALUES(buyer_state_code),
  utr = COALESCE(utr, VALUES(utr)),
  trial_end_extend_to = VALUES(trial_end_extend_to),
  updated_at = NOW();

SELECT id, invoice_no, company, status, utr, amount_inr FROM renewals WHERE invoice_no = 'KLP-20260820-8341';
