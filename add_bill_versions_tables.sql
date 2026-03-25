-- Create bill_versions table
CREATE TABLE IF NOT EXISTS "bill_versions" (
  "id" SERIAL PRIMARY KEY,
  "bill_id" TEXT NOT NULL REFERENCES "bills"("id"),
  "name" TEXT NOT NULL,
  "date" DATE NOT NULL,
  "url" TEXT,
  "content" TEXT,
  "changes_summary" TEXT,
  "created_at" TIMESTAMP DEFAULT NOW()
);

-- Create bill_amendments table
CREATE TABLE IF NOT EXISTS "bill_amendments" (
  "id" SERIAL PRIMARY KEY,
  "bill_id" TEXT NOT NULL REFERENCES "bills"("id"),
  "author" TEXT NOT NULL,
  "date" DATE NOT NULL,
  "description" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "content" TEXT,
  "url" TEXT,
  "created_at" TIMESTAMP DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS "bill_versions_bill_id_idx" ON "bill_versions" ("bill_id");
CREATE INDEX IF NOT EXISTS "bill_amendments_bill_id_idx" ON "bill_amendments" ("bill_id");