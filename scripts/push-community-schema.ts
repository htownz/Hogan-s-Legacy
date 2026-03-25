import { db } from "../server/db";
import { billSuggestions, billSuggestionCategories, billSuggestionUpvotes, billSuggestionComments } from "../shared/schema-community";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import dotenv from "dotenv";

dotenv.config();

/**
 * Push community schema to the database
 */
async function main() {
  console.log("Pushing community schema to the database...");

  // We need to use the raw postgres client for schema creation
  const migrationClient = postgres(process.env.DATABASE_URL!, { max: 1 });
  
  try {
    console.log("Creating community tables...");
    
    // Create tables using db object
    await db.execute(/*sql*/`
      CREATE TABLE IF NOT EXISTS "bill_suggestions" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "title" TEXT NOT NULL,
        "description" TEXT NOT NULL,
        "bill_id" TEXT NOT NULL,
        "user_id" UUID NOT NULL,
        "status" TEXT NOT NULL DEFAULT 'pending',
        "upvotes" INTEGER NOT NULL DEFAULT 0,
        "is_featured" BOOLEAN NOT NULL DEFAULT false,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now()
      );
    `);

    await db.execute(/*sql*/`
      CREATE TABLE IF NOT EXISTS "bill_suggestion_categories" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "suggestion_id" UUID NOT NULL REFERENCES "bill_suggestions"("id") ON DELETE CASCADE,
        "category_name" TEXT NOT NULL
      );
    `);

    await db.execute(/*sql*/`
      CREATE TABLE IF NOT EXISTS "bill_suggestion_upvotes" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "suggestion_id" UUID NOT NULL REFERENCES "bill_suggestions"("id") ON DELETE CASCADE,
        "user_id" UUID NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        UNIQUE("suggestion_id", "user_id")
      );
    `);

    await db.execute(/*sql*/`
      CREATE TABLE IF NOT EXISTS "bill_suggestion_comments" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "suggestion_id" UUID NOT NULL REFERENCES "bill_suggestions"("id") ON DELETE CASCADE,
        "user_id" UUID NOT NULL,
        "content" TEXT NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now()
      );
    `);

    console.log("✅ Successfully created community tables");
    
    // Create indexes for better performance
    await db.execute(/*sql*/`
      CREATE INDEX IF NOT EXISTS idx_bill_suggestions_status ON "bill_suggestions"("status");
      CREATE INDEX IF NOT EXISTS idx_bill_suggestions_bill_id ON "bill_suggestions"("bill_id");
      CREATE INDEX IF NOT EXISTS idx_bill_suggestions_upvotes ON "bill_suggestions"("upvotes" DESC);
      CREATE INDEX IF NOT EXISTS idx_bill_suggestion_categories_name ON "bill_suggestion_categories"("category_name");
      CREATE INDEX IF NOT EXISTS idx_bill_suggestion_upvotes_suggestion ON "bill_suggestion_upvotes"("suggestion_id");
      CREATE INDEX IF NOT EXISTS idx_bill_suggestion_upvotes_user ON "bill_suggestion_upvotes"("user_id");
      CREATE INDEX IF NOT EXISTS idx_bill_suggestion_comments_suggestion ON "bill_suggestion_comments"("suggestion_id");
    `);
    
    console.log("✅ Successfully created indexes");

  } catch (error) {
    console.error("Error pushing community schema:", error);
    throw error;
  } finally {
    await migrationClient.end();
    console.log("Database connection closed");
  }
}

main()
  .then(() => {
    console.log("✅ Community schema pushed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Failed to push community schema:", error);
    process.exit(1);
  });