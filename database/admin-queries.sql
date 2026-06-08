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

-- ── Analytics ──

-- Total page visits
SELECT COUNT(*) AS total_visits FROM page_visits;

-- Unique visitors
SELECT COUNT(DISTINCT visitor_id) AS unique_visitors FROM page_visits;

-- Visits today
SELECT COUNT(*) AS visits_today FROM page_visits WHERE DATE(created_at) = CURDATE();

-- Device breakdown
SELECT device_type, COUNT(*) AS visits FROM page_visits GROUP BY device_type ORDER BY visits DESC;

-- Traffic sources
SELECT traffic_source, COUNT(*) AS visits FROM page_visits GROUP BY traffic_source ORDER BY visits DESC;

-- Latest 50 visits
SELECT visitor_id, device_type, browser, country, traffic_source, created_at
FROM page_visits ORDER BY created_at DESC LIMIT 50;
