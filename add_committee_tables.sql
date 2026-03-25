-- Create the committees table
CREATE TABLE IF NOT EXISTS committees (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  chamber VARCHAR(20) NOT NULL,
  description TEXT,
  chair TEXT,
  vice_chair TEXT,
  members TEXT[],
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create the committee_meetings table
CREATE TABLE IF NOT EXISTS committee_meetings (
  id SERIAL PRIMARY KEY,
  committee_id INTEGER NOT NULL REFERENCES committees(id),
  date TIMESTAMP NOT NULL,
  location TEXT NOT NULL,
  agenda TEXT,
  bills_discussed TEXT[],
  status VARCHAR(30) NOT NULL DEFAULT 'scheduled',
  video_url TEXT,
  transcript_url TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Update bill_history_events to reference committees
ALTER TABLE bill_history_events ADD COLUMN IF NOT EXISTS committee_id INTEGER REFERENCES committees(id);