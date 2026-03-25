import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import pkg from 'pg';
const { Pool } = pkg;

// Use environment variables for database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const db = drizzle(pool);

async function main() {
  console.log('Starting document schema migration...');
  
  try {
    // Create the documents table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS documents (
        id SERIAL PRIMARY KEY,
        owner_id INTEGER NOT NULL REFERENCES users(id),
        title TEXT NOT NULL,
        description TEXT,
        file_key TEXT NOT NULL UNIQUE,
        file_url TEXT,
        file_type TEXT NOT NULL,
        file_name TEXT NOT NULL,
        file_size INTEGER NOT NULL,
        is_public BOOLEAN NOT NULL DEFAULT FALSE,
        allow_comments BOOLEAN NOT NULL DEFAULT TRUE,
        tags TEXT[],
        category TEXT,
        download_count INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('✅ Documents table created successfully');

    // Create document shares table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS document_shares (
        id SERIAL PRIMARY KEY,
        document_id INTEGER NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
        shared_by_id INTEGER NOT NULL REFERENCES users(id),
        shared_with_id INTEGER REFERENCES users(id),
        access_link TEXT,
        access_permission TEXT NOT NULL DEFAULT 'view',
        created_at TIMESTAMP DEFAULT NOW(),
        expires_at TIMESTAMP,
        is_active BOOLEAN NOT NULL DEFAULT TRUE
      );
    `);
    console.log('✅ Document shares table created successfully');

    // Create document comments table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS document_comments (
        id SERIAL PRIMARY KEY,
        document_id INTEGER NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
        user_id INTEGER NOT NULL REFERENCES users(id),
        content TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        parent_id INTEGER REFERENCES document_comments(id)
      );
    `);
    console.log('✅ Document comments table created successfully');

    // Create document collections table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS document_collections (
        id SERIAL PRIMARY KEY,
        owner_id INTEGER NOT NULL REFERENCES users(id),
        title TEXT NOT NULL,
        description TEXT,
        is_public BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('✅ Document collections table created successfully');

    // Create collection items table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS collection_items (
        id SERIAL PRIMARY KEY,
        collection_id INTEGER NOT NULL REFERENCES document_collections(id) ON DELETE CASCADE,
        document_id INTEGER NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
        added_at TIMESTAMP DEFAULT NOW(),
        display_order INTEGER NOT NULL DEFAULT 0
      );
    `);
    console.log('✅ Collection items table created successfully');

    console.log('🎉 Document management schema migration completed successfully');
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await pool.end();
  }
}

main();