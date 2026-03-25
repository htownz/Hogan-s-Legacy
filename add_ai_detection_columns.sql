-- Add AI detection fields to the points_of_order table
ALTER TABLE points_of_order
ADD COLUMN IF NOT EXISTS ai_detected BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS validation_status VARCHAR(20) DEFAULT 'pending';

-- Update the ID column type to text for CUID compatibility
-- Note: This is a risky migration and would normally require data backup
-- and more complex migration steps if there's existing data
ALTER TABLE points_of_order
ALTER COLUMN id TYPE TEXT;