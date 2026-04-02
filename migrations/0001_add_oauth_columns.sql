-- Add OAuth provider columns to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS oauth_provider TEXT;
ALTER TABLE users
ADD COLUMN IF NOT EXISTS oauth_id TEXT;
-- Allow NULL password for OAuth-only users (password is a random hash for them)
-- No schema change needed since password remains NOT NULL (we store a random hash).
-- Index for fast OAuth lookups
CREATE INDEX IF NOT EXISTS idx_users_oauth ON users (oauth_provider, oauth_id)
WHERE oauth_provider IS NOT NULL;