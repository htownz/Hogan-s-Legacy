import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import * as schema from '../shared/schema-timeline';
import dotenv from 'dotenv';

dotenv.config();

async function main() {
  // Establish connection
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL is not defined');
  }

  // Create connection
  const sql = postgres(connectionString, { max: 1 });
  const db = drizzle(sql, { schema });

  try {
    console.log('Creating timeline tables if they do not exist...');
    
    // Create bills table if it doesn't exist (this might already exist in your schema)
    await sql`
      CREATE TABLE IF NOT EXISTS bills (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        session_id TEXT,
        status TEXT,
        chamber TEXT,
        authors TEXT[],
        subjects TEXT[],
        full_text TEXT,
        summary TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `;
    
    console.log('Bills table created or already exists.');

    // Create timeline_stages table
    await sql`
      CREATE TABLE IF NOT EXISTS timeline_stages (
        id SERIAL PRIMARY KEY,
        bill_id TEXT NOT NULL REFERENCES bills(id),
        stage_type TEXT NOT NULL,
        stage_title TEXT NOT NULL,
        stage_description TEXT,
        stage_action TEXT,
        stage_order INTEGER NOT NULL,
        stage_date TIMESTAMP,
        completed BOOLEAN DEFAULT FALSE,
        active BOOLEAN DEFAULT FALSE,
        vote_data JSONB,
        metadata JSONB,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `;
    
    console.log('Timeline stages table created or already exists.');

    // Create timeline_events table
    await sql`
      CREATE TABLE IF NOT EXISTS timeline_events (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        bill_id TEXT NOT NULL REFERENCES bills(id),
        user_id INTEGER,
        title TEXT NOT NULL,
        description TEXT,
        event_date TIMESTAMP NOT NULL,
        event_type TEXT NOT NULL,
        is_public BOOLEAN DEFAULT TRUE,
        metadata JSONB,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `;
    
    console.log('Timeline events table created or already exists.');

    // Create indexes
    await sql`CREATE INDEX IF NOT EXISTS timeline_stages_bill_id_idx ON timeline_stages(bill_id);`;
    await sql`CREATE INDEX IF NOT EXISTS timeline_stages_stage_type_idx ON timeline_stages(stage_type);`;
    await sql`CREATE INDEX IF NOT EXISTS timeline_events_bill_id_idx ON timeline_events(bill_id);`;
    await sql`CREATE INDEX IF NOT EXISTS timeline_events_user_id_idx ON timeline_events(user_id);`;
    
    console.log('Indexes created or already exist.');
    
    console.log('Timeline schema successfully pushed to database!');
  } catch (error) {
    console.error('Error pushing timeline schema:', error);
    throw error;
  } finally {
    await sql.end();
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Schema push error:', err);
    process.exit(1);
  });