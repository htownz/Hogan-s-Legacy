import { db } from "../server/db";
import { sql } from "drizzle-orm";

/**
 * This script adds new columns to the bill_summaries table for enhanced bill analysis
 * It will set default values for existing records
 */
async function migrateBillSummaries() {
  console.log("Migrating bill_summaries table to add enhanced analysis fields...");
  
  try {
    // Check if the implementation_timeline column already exists
    const checkResult = await db.execute(sql`
      SELECT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'bill_summaries' AND column_name = 'implementation_timeline'
      ) as column_exists
    `);
    
    // Check if the column exists
    const columnExists = checkResult?.[0]?.column_exists === true || 
                        checkResult?.[0]?.column_exists === 't' || 
                        checkResult?.[0]?.column_exists === '1';
    
    if (columnExists) {
      console.log("Migration already applied - implementation_timeline column exists");
      return;
    }

    // Add implementation_timeline column
    await db.execute(sql`
      ALTER TABLE bill_summaries 
      ADD COLUMN implementation_timeline JSONB DEFAULT '[]'
    `);
    console.log("Added implementation_timeline column");

    // Add fiscal_considerations column
    await db.execute(sql`
      ALTER TABLE bill_summaries 
      ADD COLUMN fiscal_considerations TEXT
    `);
    console.log("Added fiscal_considerations column");

    // Add citizen_action_guide column
    await db.execute(sql`
      ALTER TABLE bill_summaries 
      ADD COLUMN citizen_action_guide TEXT
    `);
    console.log("Added citizen_action_guide column");

    // Update version number for existing summaries to indicate they don't have the new fields
    await db.execute(sql`
      UPDATE bill_summaries 
      SET version = '1.2' 
      WHERE version = '1.0' OR version = '1.1'
    `);
    console.log("Updated version numbers for existing summaries");

    console.log("Migration completed successfully");
  } catch (error) {
    console.error("Error during migration:", error);
    process.exit(1);
  }
}

// Run the migration
migrateBillSummaries()
  .then(() => {
    console.log("Bill summaries migration script finished");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Migration failed:", error);
    process.exit(1);
  });