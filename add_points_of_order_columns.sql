-- Add enhanced fields to the points_of_order table
ALTER TABLE points_of_order
ADD COLUMN IF NOT EXISTS rule_citation TEXT,
ADD COLUMN IF NOT EXISTS text_location TEXT,
ADD COLUMN IF NOT EXISTS precedents TEXT,
ADD COLUMN IF NOT EXISTS suggested_fix TEXT,
ADD COLUMN IF NOT EXISTS resolution TEXT;