-- Add committee meeting summary fields to the committee_meetings table

ALTER TABLE committee_meetings 
ADD COLUMN IF NOT EXISTS summary_summary TEXT,
ADD COLUMN IF NOT EXISTS summary_transcript TEXT,
ADD COLUMN IF NOT EXISTS summary_key_points JSONB,
ADD COLUMN IF NOT EXISTS summary_bill_discussions JSONB,
ADD COLUMN IF NOT EXISTS summary_public_testimonies JSONB,
ADD COLUMN IF NOT EXISTS summary_status VARCHAR(30),
ADD COLUMN IF NOT EXISTS summary_last_updated TIMESTAMP;