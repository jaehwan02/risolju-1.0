CREATE TABLE IF NOT EXISTS analytics_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  event_type TEXT NOT NULL,
  visitor_hash TEXT,
  session_hash TEXT,
  ip_hash TEXT,
  exchange_id TEXT,
  model_id TEXT,
  model_repo TEXT,
  load_state TEXT,
  country TEXT,
  region TEXT,
  city TEXT,
  timezone TEXT,
  device_type TEXT,
  os TEXT,
  browser TEXT,
  page_url TEXT,
  referrer TEXT,
  prompt_text TEXT,
  response_text TEXT,
  error_text TEXT,
  metadata_json TEXT
);

CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at
  ON analytics_events (created_at);

CREATE INDEX IF NOT EXISTS idx_analytics_events_type_created_at
  ON analytics_events (event_type, created_at);

CREATE INDEX IF NOT EXISTS idx_analytics_events_visitor_created_at
  ON analytics_events (visitor_hash, created_at);
