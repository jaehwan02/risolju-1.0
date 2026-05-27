ALTER TABLE analytics_events ADD COLUMN prompt_text TEXT;
ALTER TABLE analytics_events ADD COLUMN response_text TEXT;
ALTER TABLE analytics_events ADD COLUMN error_text TEXT;

