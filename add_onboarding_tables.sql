-- Create tables for the personalized user onboarding wizard

-- Table: onboarding_progress
CREATE TABLE IF NOT EXISTS onboarding_progress (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  step VARCHAR(50) NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table: civic_interests
CREATE TABLE IF NOT EXISTS civic_interests (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  interest_category VARCHAR(100) NOT NULL,
  interest_value VARCHAR(100) NOT NULL,
  priority_level INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table: engagement_preferences
CREATE TABLE IF NOT EXISTS engagement_preferences (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  notifications_enabled BOOLEAN DEFAULT TRUE,
  email_frequency VARCHAR(20) DEFAULT 'weekly',
  push_notifications_enabled BOOLEAN DEFAULT TRUE,
  sms_enabled BOOLEAN DEFAULT FALSE,
  location_sharing_enabled BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table: tutorial_progress
CREATE TABLE IF NOT EXISTS tutorial_progress (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  tutorial_id VARCHAR(50) NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_onboarding_progress_user_id ON onboarding_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_civic_interests_user_id ON civic_interests(user_id);
CREATE INDEX IF NOT EXISTS idx_engagement_preferences_user_id ON engagement_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_tutorial_progress_user_id ON tutorial_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_tutorial_progress_tutorial_id ON tutorial_progress(tutorial_id);

-- Add unique constraint for one set of engagement preferences per user
ALTER TABLE engagement_preferences
ADD CONSTRAINT unique_user_engagement_preferences UNIQUE (user_id);

-- Add unique constraint for onboarding step per user
ALTER TABLE onboarding_progress
ADD CONSTRAINT unique_user_step UNIQUE (user_id, step);

-- Add unique constraint for tutorial per user
ALTER TABLE tutorial_progress
ADD CONSTRAINT unique_user_tutorial UNIQUE (user_id, tutorial_id);