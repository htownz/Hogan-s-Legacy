-- Champion / Challenger Walk-Forward Retraining Tables
-- Run this against the policy-intel database

-- Feedback outcome enum
DO $$ BEGIN
  CREATE TYPE policy_intel_feedback_outcome AS ENUM ('promoted', 'suppressed', 'strong_positive');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Feedback log: records every reviewer action as training data
CREATE TABLE IF NOT EXISTS policy_intel_feedback_log (
  id SERIAL PRIMARY KEY,
  alert_id INTEGER NOT NULL REFERENCES policy_intel_alerts(id) ON DELETE CASCADE,
  outcome policy_intel_feedback_outcome NOT NULL,
  original_score INTEGER NOT NULL,
  original_confidence DOUBLE PRECISION NOT NULL DEFAULT 0,
  agent_scores_json JSONB NOT NULL DEFAULT '[]',
  weights_json JSONB NOT NULL DEFAULT '{}',
  regime VARCHAR(32) NOT NULL DEFAULT 'interim',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS policy_intel_feedback_log_alert_idx ON policy_intel_feedback_log(alert_id);
CREATE INDEX IF NOT EXISTS policy_intel_feedback_log_outcome_idx ON policy_intel_feedback_log(outcome);
CREATE INDEX IF NOT EXISTS policy_intel_feedback_log_created_idx ON policy_intel_feedback_log(created_at);

-- Champion snapshots: persists promoted weight configurations
CREATE TABLE IF NOT EXISTS policy_intel_champion_snapshots (
  id SERIAL PRIMARY KEY,
  generation INTEGER NOT NULL DEFAULT 1,
  weights_json JSONB NOT NULL,
  escalate_threshold INTEGER NOT NULL DEFAULT 60,
  archive_threshold INTEGER NOT NULL DEFAULT 20,
  accuracy DOUBLE PRECISION NOT NULL DEFAULT 0,
  feedback_count INTEGER NOT NULL DEFAULT 0,
  promoted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata_json JSONB DEFAULT '{}'
);

SELECT 'Champion/Challenger tables created successfully' AS status;
