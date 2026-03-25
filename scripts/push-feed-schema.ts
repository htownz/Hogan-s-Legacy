import { config } from 'dotenv';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import pg from 'pg';
import * as schema from '../shared/schema-feed';

const { Pool } = pg;
config();

async function main() {
  // Create and setup the database connection
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL
  });
  
  const db = drizzle(pool, { schema });
  
  console.log('Creating feed tables...');
  
  try {
    // Create the postType enum and tables
    await pool.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'post_type') THEN
          CREATE TYPE post_type AS ENUM ('news', 'user_post', 'bill_update', 'action_alert', 'event');
        END IF;
      END
      $$;
    `);
    
    // Create the feed posts table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS feed_posts (
        id SERIAL PRIMARY KEY,
        type post_type NOT NULL,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        image_url TEXT,
        external_url TEXT,
        author_id INTEGER REFERENCES users(id),
        tags TEXT[],
        metadata JSONB,
        is_verified BOOLEAN DEFAULT FALSE,
        is_featured BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `);
    
    // Create the user interests table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_interests (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        topics TEXT[],
        representatives TEXT[],
        locations TEXT[],
        committees TEXT[],
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `);
    
    // Create the feed interactions table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS feed_interactions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        post_id INTEGER NOT NULL REFERENCES feed_posts(id),
        interaction_type TEXT NOT NULL,
        interaction_data JSONB,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `);
    
    // Create the feed comments table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS feed_comments (
        id SERIAL PRIMARY KEY,
        post_id INTEGER NOT NULL REFERENCES feed_posts(id),
        user_id INTEGER NOT NULL REFERENCES users(id),
        content TEXT NOT NULL,
        parent_id INTEGER REFERENCES feed_comments(id),
        is_hidden BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `);
    
    // Create the feed reactions table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS feed_reactions (
        id SERIAL PRIMARY KEY,
        post_id INTEGER REFERENCES feed_posts(id),
        comment_id INTEGER REFERENCES feed_comments(id),
        user_id INTEGER NOT NULL REFERENCES users(id),
        type TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `);
    
    console.log('Feed tables created successfully!');
    
    // Insert some sample data for testing
    console.log('Inserting sample feed data...');
    
    // Check if we have sample data already
    const existingPosts = await pool.query('SELECT COUNT(*) FROM feed_posts');
    if (parseInt(existingPosts.rows[0].count) === 0) {
      // Insert sample posts
      await pool.query(`
        INSERT INTO feed_posts (type, title, content, tags, metadata, is_verified, is_featured) VALUES 
        ('news', 'New Voting Rights Bill Introduced', 'A comprehensive voting rights bill has been introduced in Congress today, aiming to expand access to voting and reduce barriers for historically marginalized communities.', ARRAY['voting rights', 'legislation', 'congress'], '{"sourceName": "Associated Press", "sourceUrl": "https://example.com/news"}', TRUE, TRUE),
        
        ('bill_update', 'HR-123 Passes House Committee', 'The Environmental Protection Act (HR-123) has passed the House Environmental Committee with bipartisan support. The bill now moves to a full House vote.', ARRAY['environment', 'committee', 'house'], '{"billId": "HR-123", "priority": 2}', TRUE, FALSE),
        
        ('action_alert', 'Call Your Senator About Healthcare Bill', 'The Healthcare Affordability Act is up for a vote tomorrow. This is your last chance to contact your senators and make your voice heard!', ARRAY['healthcare', 'urgent', 'senate'], '{"priority": 1}', TRUE, FALSE),
        
        ('event', 'Town Hall Meeting on Education Reform', 'Join your local representatives for a town hall discussion on education reform proposals currently being considered by the state legislature.', ARRAY['education', 'town hall', 'local'], '{"eventDate": "2026-01-15", "location": "City Hall Auditorium"}', FALSE, TRUE),
        
        ('user_post', 'My Experience Testifying at Committee Hearing', 'Yesterday I had the opportunity to testify before the Senate Finance Committee about the impact of recent tax legislation on small businesses. Here''s what I learned...', ARRAY['testimony', 'small business', 'taxes'], NULL, FALSE, FALSE)
      `);
      
      console.log('Sample data inserted successfully!');
    } else {
      console.log('Sample data already exists, skipping insertion');
    }
    
  } catch (error) {
    console.error('Error creating feed tables:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

main()
  .then(() => {
    console.log('Feed schema push completed');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Feed schema push failed:', err);
    process.exit(1);
  });