-- Daily active users by message activity.
SELECT
  date(created_at) AS day,
  COUNT(DISTINCT COALESCE(visitor_hash, ip_hash, session_hash)) AS dau
FROM analytics_events
WHERE event_type IN ('chat_exchange', 'chat_error')
GROUP BY day
ORDER BY day DESC;

-- Monthly active users by message activity.
SELECT
  substr(created_at, 1, 7) AS month,
  COUNT(DISTINCT COALESCE(visitor_hash, ip_hash, session_hash)) AS mau
FROM analytics_events
WHERE event_type IN ('chat_exchange', 'chat_error')
GROUP BY month
ORDER BY month DESC;

-- Unique visitors by page open.
SELECT
  date(created_at) AS day,
  COUNT(DISTINCT COALESCE(visitor_hash, ip_hash, session_hash)) AS unique_visitors
FROM analytics_events
WHERE event_type = 'app_open'
GROUP BY day
ORDER BY day DESC;

-- Daily product funnel.
SELECT
  date(created_at) AS day,
  SUM(CASE WHEN event_type = 'app_open' THEN 1 ELSE 0 END) AS page_opens,
  SUM(CASE WHEN event_type = 'model_load_clicked' THEN 1 ELSE 0 END) AS model_load_clicks,
  SUM(CASE WHEN event_type = 'model_loaded' THEN 1 ELSE 0 END) AS model_load_successes,
  SUM(CASE WHEN event_type = 'model_load_error' THEN 1 ELSE 0 END) AS model_load_errors,
  SUM(CASE WHEN event_type = 'chat_exchange' THEN 1 ELSE 0 END) AS chat_successes,
  SUM(CASE WHEN event_type = 'chat_error' THEN 1 ELSE 0 END) AS chat_errors,
  COUNT(DISTINCT COALESCE(visitor_hash, ip_hash, session_hash)) AS unique_users
FROM analytics_events
GROUP BY day
ORDER BY day DESC;

-- Recent stored conversation logs.
SELECT
  created_at,
  event_type,
  prompt_text,
  response_text,
  error_text,
  visitor_hash,
  country,
  device_type,
  os,
  browser
FROM analytics_events
WHERE event_type IN ('chat_exchange', 'chat_error')
ORDER BY created_at DESC
LIMIT 50;
