import { config } from 'dotenv';
import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import * as schema from '../shared/schema-power-influencers';

const { Pool } = pg;
config();

async function main() {
  // Create and setup the database connection
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL
  });
  
  const db = drizzle(pool, { schema });
  
  console.log('Creating power influencers tables...');
  
  try {
    // Create the influencer_type enum
    await pool.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'influencer_type') THEN
          CREATE TYPE influencer_type AS ENUM ('consultant', 'mega_influencer');
        END IF;
      END
      $$;
    `);
    
    // Create the power_influencers table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS power_influencers (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        type influencer_type NOT NULL,
        image_url TEXT,
        biography TEXT,
        title TEXT,
        organization TEXT,
        website TEXT,
        email TEXT,
        phone TEXT,
        social_media JSONB,
        active BOOLEAN DEFAULT TRUE,
        influence_score INTEGER,
        policy_areas JSONB,
        last_updated TIMESTAMP DEFAULT NOW(),
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `);
    
    // Create the consultants table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS consultants (
        id SERIAL PRIMARY KEY,
        influencer_id INTEGER NOT NULL REFERENCES power_influencers(id),
        firm TEXT,
        certifications JSONB,
        specialties JSONB,
        consulting_focus JSONB,
        years_active INTEGER,
        average_contract_size DECIMAL(12, 2),
        registered_lobbyist BOOLEAN DEFAULT FALSE,
        transparency_rating INTEGER,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `);
    
    // Create the mega_influencers table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS mega_influencers (
        id SERIAL PRIMARY KEY,
        influencer_id INTEGER NOT NULL REFERENCES power_influencers(id),
        net_worth DECIMAL(14, 2),
        companies JSONB,
        industry_focus JSONB,
        political_affiliation TEXT,
        influence_radius TEXT,
        philanthropic_focus JSONB,
        total_donations DECIMAL(12, 2),
        transparency_rating INTEGER,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `);
    
    // Create the consultant_clients table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS consultant_clients (
        id SERIAL PRIMARY KEY,
        consultant_id INTEGER NOT NULL REFERENCES consultants(id),
        client_name TEXT NOT NULL,
        client_type TEXT,
        relationship_start TIMESTAMP,
        relationship_end TIMESTAMP,
        service_description TEXT,
        contract_value DECIMAL(12, 2),
        client_image_url TEXT,
        contract_link TEXT,
        success_rate INTEGER,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `);
    
    // Create the consultant_campaigns table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS consultant_campaigns (
        id SERIAL PRIMARY KEY,
        consultant_id INTEGER NOT NULL REFERENCES consultants(id),
        campaign_name TEXT NOT NULL,
        candidate_name TEXT,
        office TEXT,
        election_year INTEGER,
        election_cycle TEXT,
        result TEXT,
        campaign_budget DECIMAL(12, 2),
        role TEXT,
        highlighted_achievements JSONB,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `);
    
    // Create the bill_topic_influence table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS bill_topic_influence (
        id SERIAL PRIMARY KEY,
        influencer_id INTEGER NOT NULL REFERENCES power_influencers(id),
        topic TEXT NOT NULL,
        bills_influenced INTEGER,
        total_spent DECIMAL(12, 2),
        success_rate INTEGER,
        documented BOOLEAN DEFAULT FALSE,
        influence TEXT NOT NULL,
        influence_strength INTEGER,
        first_activity TIMESTAMP,
        last_activity TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `);
    
    // Create the bill_influence_records table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS bill_influence_records (
        id SERIAL PRIMARY KEY,
        influencer_id INTEGER NOT NULL REFERENCES power_influencers(id),
        bill_id TEXT NOT NULL REFERENCES bills(id),
        position TEXT NOT NULL,
        activity_type TEXT NOT NULL,
        amount_spent DECIMAL(12, 2),
        activity_date TIMESTAMP,
        activity_description TEXT,
        success_metric BOOLEAN,
        evidence_url TEXT,
        evidence_type TEXT,
        verified BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `);
    
    // Create the influencer_connections table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS influencer_connections (
        id SERIAL PRIMARY KEY,
        influencer_id INTEGER NOT NULL REFERENCES power_influencers(id),
        connected_to_id INTEGER,
        connected_to_type TEXT NOT NULL,
        connected_to_name TEXT NOT NULL,
        relationship_type TEXT NOT NULL,
        relationship_strength INTEGER,
        connection_start TIMESTAMP,
        connection_end TIMESTAMP,
        connection_description TEXT,
        financial_value DECIMAL(12, 2),
        documented_source TEXT,
        verified BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `);
    
    // Create the influencer_donations table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS influencer_donations (
        id SERIAL PRIMARY KEY,
        influencer_id INTEGER NOT NULL REFERENCES power_influencers(id),
        recipient_name TEXT NOT NULL,
        recipient_type TEXT NOT NULL,
        amount DECIMAL(12, 2) NOT NULL,
        donation_date TIMESTAMP,
        election_cycle TEXT,
        donation_method TEXT,
        report_url TEXT,
        donation_purpose TEXT,
        declared BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `);
    
    // Create the influence_heatmap_data table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS influence_heatmap_data (
        id SERIAL PRIMARY KEY,
        influencer_id INTEGER NOT NULL REFERENCES power_influencers(id),
        entity TEXT NOT NULL,
        entity_type TEXT NOT NULL,
        influence_score INTEGER NOT NULL,
        activity_count INTEGER,
        money_spent DECIMAL(12, 2),
        bills_influenced INTEGER,
        success_rate INTEGER,
        last_activity TIMESTAMP,
        relationship_evidence_url TEXT,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `);
    
    console.log('Power influencers tables created successfully!');
    
    // Sample data could be added here for testing
    
  } catch (error) {
    console.error('Error creating power influencers tables:', error);
  } finally {
    await pool.end();
  }
}

main().catch(console.error);