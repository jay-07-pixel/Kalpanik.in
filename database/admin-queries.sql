-- Kalpanik waitlist — admin SQL queries
-- Connect to your MySQL database and run these as needed.

USE kalpanik;

-- All subscribers (newest first)
SELECT id, email, created_at
FROM waitlist
ORDER BY created_at DESC;

-- Total subscriber count
SELECT COUNT(*) AS total_subscribers FROM waitlist;

-- Subscribers who joined today
SELECT id, email, created_at
FROM waitlist
WHERE DATE(created_at) = CURDATE()
ORDER BY created_at DESC;

-- Subscribers in the last 7 days
SELECT id, email, created_at
FROM waitlist
WHERE created_at >= NOW() - INTERVAL 7 DAY
ORDER BY created_at DESC;

-- Daily signups (last 30 days)
SELECT DATE(created_at) AS signup_date, COUNT(*) AS signups
FROM waitlist
WHERE created_at >= NOW() - INTERVAL 30 DAY
GROUP BY DATE(created_at)
ORDER BY signup_date DESC;

-- Check if a specific email exists
SELECT id, email, created_at
FROM waitlist
WHERE email = 'user@example.com';

-- Export-friendly CSV-style list
SELECT email, created_at
FROM waitlist
ORDER BY created_at ASC;

-- Remove a subscriber (use with care)
-- DELETE FROM waitlist WHERE email = 'user@example.com';
