/**
 * Script to push the extended Scout Bot schema to the database
 * This adds additional tables to track various datasets and entity relationships
 */

import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { sql } from "drizzle-orm";
import dotenv from "dotenv";

dotenv.config();

/**
 * Creates enum types in the database
 */
async function createEnumTypes(migrationClient: postgres.Sql<{}>) {
  try {
    console.log("Creating enum types for extended Scout Bot schema...");
    
    // Add data source enum
    await migrationClient`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'data_source_type') THEN
          CREATE TYPE data_source_type AS ENUM (
            'lobbyist_report',
            'campaign_finance',
            'filing_correction',
            'firm_registration',
            'family_appointment',
            'pac_leadership',
            'legislative_calendar',
            'news_feed',
            'manual_entry'
          );
        END IF;
      END $$;
    `;
    
    // Add entity relationship enum
    await migrationClient`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'entity_relationship_type') THEN
          CREATE TYPE entity_relationship_type AS ENUM (
            'employer',
            'client',
            'donor',
            'recipient',
            'family_member',
            'partner',
            'sponsor',
            'affiliated'
          );
        END IF;
      END $$;
    `;
    
    // Add flag type enum
    await migrationClient`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'flag_type') THEN
          CREATE TYPE flag_type AS ENUM (
            'late_filing',
            'correction',
            'conflict_of_interest',
            'multi_dataset_match',
            'family_connection',
            'pac_firm_connection'
          );
        END IF;
      END $$;
    `;
    
    console.log("Enum types created successfully");
  } catch (error) {
    console.error("Error creating enum types:", error);
    throw error;
  }
}

/**
 * Creates extended Scout Bot tables in the database
 */
async function createExtendedScoutBotTables(dbClient: ReturnType<typeof drizzle>) {
  try {
    console.log("Creating Scout Bot lobbyist reports table...");
    await dbClient.execute(sql`
      CREATE TABLE IF NOT EXISTS scout_bot_lobbyist_reports (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        profile_id UUID NOT NULL REFERENCES scout_bot_profiles(id) ON DELETE CASCADE,
        client_name TEXT NOT NULL,
        amount DECIMAL(10, 2),
        filing_date DATE,
        quarter TEXT,
        year INTEGER,
        description TEXT,
        category TEXT,
        official_document_url TEXT,
        verified BOOLEAN DEFAULT FALSE,
        source_dataset data_source_type NOT NULL DEFAULT 'lobbyist_report',
        confidence_score INTEGER DEFAULT 70,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    console.log("Scout Bot lobbyist reports table created successfully");

    console.log("Creating Scout Bot campaign finance table...");
    await dbClient.execute(sql`
      CREATE TABLE IF NOT EXISTS scout_bot_campaign_finance (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        profile_id UUID NOT NULL REFERENCES scout_bot_profiles(id) ON DELETE CASCADE,
        committee_name TEXT NOT NULL,
        candidate_name TEXT,
        transaction_type TEXT,
        amount DECIMAL(10, 2),
        filing_date DATE,
        transaction_date DATE,
        purpose TEXT,
        election_cycle TEXT,
        official_document_url TEXT,
        verified BOOLEAN DEFAULT FALSE,
        source_dataset data_source_type NOT NULL DEFAULT 'campaign_finance',
        confidence_score INTEGER DEFAULT 70,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    console.log("Scout Bot campaign finance table created successfully");

    console.log("Creating Scout Bot filing corrections table...");
    await dbClient.execute(sql`
      CREATE TABLE IF NOT EXISTS scout_bot_filing_corrections (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        profile_id UUID NOT NULL REFERENCES scout_bot_profiles(id) ON DELETE CASCADE,
        original_filing_id TEXT NOT NULL,
        correction_date DATE,
        filing_type TEXT NOT NULL,
        reason TEXT,
        days_late INTEGER,
        penalty_amount DECIMAL(10, 2),
        official_document_url TEXT,
        verified BOOLEAN DEFAULT FALSE,
        source_dataset data_source_type NOT NULL DEFAULT 'filing_correction',
        confidence_score INTEGER DEFAULT 80,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    console.log("Scout Bot filing corrections table created successfully");

    console.log("Creating Scout Bot firm registrations table...");
    await dbClient.execute(sql`
      CREATE TABLE IF NOT EXISTS scout_bot_firm_registrations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        profile_id UUID NOT NULL REFERENCES scout_bot_profiles(id) ON DELETE CASCADE,
        firm_name TEXT NOT NULL,
        role TEXT NOT NULL,
        registration_date DATE,
        registration_type TEXT,
        ownership_stake DECIMAL(5, 2),
        parent_company TEXT,
        official_document_url TEXT,
        verified BOOLEAN DEFAULT FALSE,
        source_dataset data_source_type NOT NULL DEFAULT 'firm_registration',
        confidence_score INTEGER DEFAULT 80,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    console.log("Scout Bot firm registrations table created successfully");

    console.log("Creating Scout Bot family appointments table...");
    await dbClient.execute(sql`
      CREATE TABLE IF NOT EXISTS scout_bot_family_appointments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        profile_id UUID NOT NULL REFERENCES scout_bot_profiles(id) ON DELETE CASCADE,
        related_name TEXT NOT NULL,
        relationship TEXT NOT NULL,
        appointed_position TEXT NOT NULL,
        appointing_entity TEXT,
        appointment_date DATE,
        term_end_date DATE,
        compensation TEXT,
        official_document_url TEXT,
        verified BOOLEAN DEFAULT FALSE,
        source_dataset data_source_type NOT NULL DEFAULT 'family_appointment',
        confidence_score INTEGER DEFAULT 70,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    console.log("Scout Bot family appointments table created successfully");

    console.log("Creating Scout Bot PAC leadership table...");
    await dbClient.execute(sql`
      CREATE TABLE IF NOT EXISTS scout_bot_pac_leadership (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        profile_id UUID NOT NULL REFERENCES scout_bot_profiles(id) ON DELETE CASCADE,
        pac_name TEXT NOT NULL,
        role TEXT NOT NULL,
        appointment_date DATE,
        term_end_date DATE,
        pac_type TEXT,
        pac_focus TEXT,
        official_document_url TEXT,
        verified BOOLEAN DEFAULT FALSE,
        source_dataset data_source_type NOT NULL DEFAULT 'pac_leadership',
        confidence_score INTEGER DEFAULT 85,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    console.log("Scout Bot PAC leadership table created successfully");

    console.log("Creating Scout Bot legislative appearances table...");
    await dbClient.execute(sql`
      CREATE TABLE IF NOT EXISTS scout_bot_legislative_appearances (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        profile_id UUID NOT NULL REFERENCES scout_bot_profiles(id) ON DELETE CASCADE,
        event_name TEXT NOT NULL,
        committee TEXT,
        appearance_date DATE,
        bill_id TEXT,
        position TEXT,
        testimony_url TEXT,
        official_document_url TEXT,
        verified BOOLEAN DEFAULT FALSE,
        source_dataset data_source_type NOT NULL DEFAULT 'legislative_calendar',
        confidence_score INTEGER DEFAULT 75,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    console.log("Scout Bot legislative appearances table created successfully");

    console.log("Creating Scout Bot entity relationships table...");
    await dbClient.execute(sql`
      CREATE TABLE IF NOT EXISTS scout_bot_entity_relationships (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        source_profile_id UUID NOT NULL REFERENCES scout_bot_profiles(id) ON DELETE CASCADE,
        target_entity_name TEXT NOT NULL,
        target_entity_id UUID REFERENCES scout_bot_profiles(id) ON DELETE SET NULL,
        relationship_type entity_relationship_type NOT NULL,
        relationship_description TEXT,
        start_date DATE,
        end_date DATE,
        is_active BOOLEAN DEFAULT TRUE,
        monetary_value DECIMAL(12, 2),
        source_dataset data_source_type NOT NULL,
        source_url TEXT,
        verified BOOLEAN DEFAULT FALSE,
        confidence_score INTEGER DEFAULT 70,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    console.log("Scout Bot entity relationships table created successfully");

    console.log("Creating Scout Bot flags table...");
    await dbClient.execute(sql`
      CREATE TABLE IF NOT EXISTS scout_bot_flags (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        profile_id UUID NOT NULL REFERENCES scout_bot_profiles(id) ON DELETE CASCADE,
        flag_type flag_type NOT NULL,
        description TEXT NOT NULL,
        severity INTEGER DEFAULT 1,
        detection_date TIMESTAMP DEFAULT NOW(),
        related_entities JSONB DEFAULT '[]'::JSONB,
        evidence_urls JSONB DEFAULT '[]'::JSONB,
        reviewed BOOLEAN DEFAULT FALSE,
        reviewed_by UUID,
        resolution_notes TEXT,
        source_dataset data_source_type NOT NULL,
        confidence_score INTEGER DEFAULT 60,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    console.log("Scout Bot flags table created successfully");

    // Create indexes for better query performance
    console.log("Creating indexes...");
    
    // Lobbyist reports indexes
    await dbClient.execute(sql`CREATE INDEX IF NOT EXISTS idx_scout_bot_lobbyist_reports_profile_id ON scout_bot_lobbyist_reports(profile_id)`);
    await dbClient.execute(sql`CREATE INDEX IF NOT EXISTS idx_scout_bot_lobbyist_reports_client ON scout_bot_lobbyist_reports(client_name)`);
    
    // Campaign finance indexes
    await dbClient.execute(sql`CREATE INDEX IF NOT EXISTS idx_scout_bot_campaign_finance_profile_id ON scout_bot_campaign_finance(profile_id)`);
    await dbClient.execute(sql`CREATE INDEX IF NOT EXISTS idx_scout_bot_campaign_finance_committee ON scout_bot_campaign_finance(committee_name)`);
    
    // Filing corrections indexes
    await dbClient.execute(sql`CREATE INDEX IF NOT EXISTS idx_scout_bot_filing_corrections_profile_id ON scout_bot_filing_corrections(profile_id)`);
    
    // Firm registrations indexes
    await dbClient.execute(sql`CREATE INDEX IF NOT EXISTS idx_scout_bot_firm_registrations_profile_id ON scout_bot_firm_registrations(profile_id)`);
    await dbClient.execute(sql`CREATE INDEX IF NOT EXISTS idx_scout_bot_firm_registrations_firm ON scout_bot_firm_registrations(firm_name)`);
    
    // Family appointments indexes
    await dbClient.execute(sql`CREATE INDEX IF NOT EXISTS idx_scout_bot_family_appointments_profile_id ON scout_bot_family_appointments(profile_id)`);
    await dbClient.execute(sql`CREATE INDEX IF NOT EXISTS idx_scout_bot_family_appointments_related ON scout_bot_family_appointments(related_name)`);
    
    // PAC leadership indexes
    await dbClient.execute(sql`CREATE INDEX IF NOT EXISTS idx_scout_bot_pac_leadership_profile_id ON scout_bot_pac_leadership(profile_id)`);
    await dbClient.execute(sql`CREATE INDEX IF NOT EXISTS idx_scout_bot_pac_leadership_pac ON scout_bot_pac_leadership(pac_name)`);
    
    // Legislative appearances indexes
    await dbClient.execute(sql`CREATE INDEX IF NOT EXISTS idx_scout_bot_legislative_appearances_profile_id ON scout_bot_legislative_appearances(profile_id)`);
    await dbClient.execute(sql`CREATE INDEX IF NOT EXISTS idx_scout_bot_legislative_appearances_bill ON scout_bot_legislative_appearances(bill_id)`);
    
    // Entity relationships indexes
    await dbClient.execute(sql`CREATE INDEX IF NOT EXISTS idx_scout_bot_entity_relationships_source ON scout_bot_entity_relationships(source_profile_id)`);
    await dbClient.execute(sql`CREATE INDEX IF NOT EXISTS idx_scout_bot_entity_relationships_target ON scout_bot_entity_relationships(target_entity_id)`);
    await dbClient.execute(sql`CREATE INDEX IF NOT EXISTS idx_scout_bot_entity_relationships_type ON scout_bot_entity_relationships(relationship_type)`);
    
    // Flags indexes
    await dbClient.execute(sql`CREATE INDEX IF NOT EXISTS idx_scout_bot_flags_profile_id ON scout_bot_flags(profile_id)`);
    await dbClient.execute(sql`CREATE INDEX IF NOT EXISTS idx_scout_bot_flags_type ON scout_bot_flags(flag_type)`);
    
    console.log("Indexes created successfully");
    
    // Update the scout_bot_profiles table to add new fields for the enhanced features
    console.log("Updating scout_bot_profiles table with additional fields...");
    await dbClient.execute(sql`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'scout_bot_profiles' AND column_name = 'transparency_score') THEN
          ALTER TABLE scout_bot_profiles ADD COLUMN transparency_score INTEGER;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'scout_bot_profiles' AND column_name = 'flag_count') THEN
          ALTER TABLE scout_bot_profiles ADD COLUMN flag_count INTEGER DEFAULT 0;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'scout_bot_profiles' AND column_name = 'last_crawler_run') THEN
          ALTER TABLE scout_bot_profiles ADD COLUMN last_crawler_run TIMESTAMP;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'scout_bot_profiles' AND column_name = 'datasets_found_in') THEN
          ALTER TABLE scout_bot_profiles ADD COLUMN datasets_found_in JSONB DEFAULT '[]'::JSONB;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'scout_bot_profiles' AND column_name = 'related_entities_count') THEN
          ALTER TABLE scout_bot_profiles ADD COLUMN related_entities_count INTEGER DEFAULT 0;
        END IF;
      END $$;
    `);
    console.log("Scout Bot profiles table updated successfully");

  } catch (error) {
    console.error("Error creating extended Scout Bot tables:", error);
    throw error;
  }
}

/**
 * Main function to push the extended Scout Bot schema to the database
 */
async function main() {
  console.log("Starting extended Scout Bot schema migration...");

  // Set up DB clients
  const migrationClient = postgres(process.env.DATABASE_URL!, { max: 1 });
  const db = drizzle(migrationClient);

  try {
    // Create enum types first
    await createEnumTypes(migrationClient);

    // Create tables
    await createExtendedScoutBotTables(db);

    console.log("Extended Scout Bot schema migration completed successfully");
  } catch (error) {
    console.error("Error during migration:", error);
  } finally {
    await migrationClient.end();
  }
}

main();