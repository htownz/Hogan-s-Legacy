-- Create the RSS legislative updates table
CREATE TABLE IF NOT EXISTS rss_legislative_updates (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  link TEXT NOT NULL,
  source_type TEXT NOT NULL DEFAULT 'rss',
  source_name TEXT NOT NULL,
  category TEXT NOT NULL,
  bill_id TEXT,
  publication_date TIMESTAMP NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS rss_updates_category_idx ON rss_legislative_updates (category);
CREATE INDEX IF NOT EXISTS rss_updates_bill_id_idx ON rss_legislative_updates (bill_id);
CREATE INDEX IF NOT EXISTS rss_updates_pub_date_idx ON rss_legislative_updates (publication_date);
CREATE INDEX IF NOT EXISTS rss_updates_is_read_idx ON rss_legislative_updates (is_read);