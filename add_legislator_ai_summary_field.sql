-- Add ai_summary and gender columns to legislators table for enhanced profiles
ALTER TABLE legislators 
ADD COLUMN IF NOT EXISTS ai_summary TEXT,
ADD COLUMN IF NOT EXISTS gender TEXT;

-- Comment on columns to add documentation
COMMENT ON COLUMN legislators.ai_summary IS 'AI-generated summary of legislator profile and key information';
COMMENT ON COLUMN legislators.gender IS 'Gender of legislator for proper pronoun usage in AI-generated summaries';