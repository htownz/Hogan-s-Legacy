import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import * as dotenv from "dotenv";
import { sql } from "drizzle-orm";
import {
  scoutBotAffiliations,
  scoutBotMediaMentions,
  scoutBotProfiles,
  profileTypeEnum,
  profileStatusEnum,
} from "../shared/schema-scout-bot";

dotenv.config();

// Make sure database URL is defined
if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL environment variable is not defined");
  process.exit(1);
}

/**
 * Creates enum types in the database
 */
async function createEnumTypes(migrationClient: postgres.Sql<{}>) {
  // Create profile type enum if it doesn't exist
  try {
    await migrationClient`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'profile_type') THEN
          CREATE TYPE profile_type AS ENUM ('consultant', 'influencer', 'strategist', 'corporate');
        END IF;
      END
      $$;
    `;
    console.log("Created or verified profile_type enum");
  } catch (error) {
    console.error("Error creating profile_type enum:", error);
    throw error;
  }

  // Create profile status enum if it doesn't exist
  try {
    await migrationClient`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'profile_status') THEN
          CREATE TYPE profile_status AS ENUM ('pending', 'approved', 'rejected');
        END IF;
      END
      $$;
    `;
    console.log("Created or verified profile_status enum");
  } catch (error) {
    console.error("Error creating profile_status enum:", error);
    throw error;
  }
}

/**
 * Creates Scout Bot tables in the database
 */
async function createScoutBotTables(dbClient: ReturnType<typeof drizzle>) {
  try {
    console.log("Creating Scout Bot profiles table...");
    await dbClient.execute(sql`
      CREATE TABLE IF NOT EXISTS scout_bot_profiles (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        type profile_type NOT NULL,
        summary TEXT,
        source_urls JSONB NOT NULL,
        status profile_status NOT NULL DEFAULT 'pending',
        submitted_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
        reviewed_by UUID,
        review_notes TEXT,
        crawl_status TEXT DEFAULT 'pending',
        auto_categorized BOOLEAN DEFAULT FALSE,
        confidence_score INTEGER,
        source_trigger TEXT,
        influence_topics JSONB DEFAULT '[]'::JSONB
      )
    `);
    console.log("Scout Bot profiles table created successfully");

    console.log("Creating Scout Bot affiliations table...");
    await dbClient.execute(sql`
      CREATE TABLE IF NOT EXISTS scout_bot_affiliations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        profile_id UUID NOT NULL REFERENCES scout_bot_profiles(id) ON DELETE CASCADE,
        organization TEXT NOT NULL,
        role TEXT NOT NULL,
        dates TEXT,
        verified BOOLEAN DEFAULT FALSE,
        source_url TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    console.log("Scout Bot affiliations table created successfully");

    console.log("Creating Scout Bot media mentions table...");
    await dbClient.execute(sql`
      CREATE TABLE IF NOT EXISTS scout_bot_media_mentions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        profile_id UUID NOT NULL REFERENCES scout_bot_profiles(id) ON DELETE CASCADE,
        headline TEXT NOT NULL,
        source TEXT NOT NULL,
        url TEXT NOT NULL,
        date TEXT,
        snippet TEXT,
        sentiment TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    console.log("Scout Bot media mentions table created successfully");

    // Create indexes for better query performance
    console.log("Creating indexes...");
    await dbClient.execute(sql`CREATE INDEX IF NOT EXISTS idx_scout_bot_profiles_status ON scout_bot_profiles(status)`);
    await dbClient.execute(sql`CREATE INDEX IF NOT EXISTS idx_scout_bot_profiles_type ON scout_bot_profiles(type)`);
    await dbClient.execute(sql`CREATE INDEX IF NOT EXISTS idx_scout_bot_profiles_name ON scout_bot_profiles(name)`);
    await dbClient.execute(sql`CREATE INDEX IF NOT EXISTS idx_scout_bot_affiliations_profile_id ON scout_bot_affiliations(profile_id)`);
    await dbClient.execute(sql`CREATE INDEX IF NOT EXISTS idx_scout_bot_media_mentions_profile_id ON scout_bot_media_mentions(profile_id)`);
    console.log("Indexes created successfully");

  } catch (error) {
    console.error("Error creating Scout Bot tables:", error);
    throw error;
  }
}

/**
 * Main function to push the Scout Bot schema to the database
 */
async function main() {
  console.log("Starting Scout Bot schema migration...");

  // Set up DB clients
  const migrationClient = postgres(process.env.DATABASE_URL!, { max: 1 });
  const db = drizzle(migrationClient);

  try {
    // Create enum types first
    await createEnumTypes(migrationClient);

    // Create tables
    await createScoutBotTables(db);

    console.log("Scout Bot schema migration completed successfully");
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  } finally {
    // Cleanup
    await migrationClient.end();
  }
}

main();