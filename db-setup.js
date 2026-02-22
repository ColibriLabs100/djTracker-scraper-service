require('dotenv').config();
const { sql } = require('@vercel/postgres');

async function setupDatabase() {
  try {
    // Drop tables in reverse order of creation to handle foreign key constraints
    await sql`DROP TABLE IF EXISTS favorites;`;
    await sql`DROP TABLE IF EXISTS reactions;`;
    await sql`DROP TABLE IF EXISTS posts;`;
    await sql`DROP TABLE IF EXISTS devices;`;
    await sql`DROP TABLE IF EXISTS scrape_tracking;`;
    
    // Enable pgcrypto extension for md5 function
    await sql`CREATE EXTENSION IF NOT EXISTS "pgcrypto";`;

    await sql`
      CREATE TABLE IF NOT EXISTS posts (
        id SERIAL PRIMARY KEY,
        text TEXT NOT NULL,
        text_hash VARCHAR(32) NOT NULL,
        date TIMESTAMP WITH TIME ZONE NOT NULL,
        source VARCHAR(255) NOT NULL,
        UNIQUE (text_hash, date, source)
      );
    `;
    await sql`
      CREATE TABLE IF NOT EXISTS devices (
        id SERIAL PRIMARY KEY,
        device_id VARCHAR(255) UNIQUE NOT NULL,
        push_token TEXT NOT NULL
      );
    `;
    await sql`
      CREATE TABLE IF NOT EXISTS reactions (
        id SERIAL PRIMARY KEY,
        post_id INTEGER REFERENCES posts(id) ON DELETE CASCADE,
        device_id VARCHAR(255) NOT NULL,
        reaction_type VARCHAR(50) NOT NULL,
        UNIQUE (post_id, device_id)
      );
    `;
    await sql`
      CREATE TABLE IF NOT EXISTS scrape_tracking (
        id SERIAL PRIMARY KEY,
        source VARCHAR(255) UNIQUE NOT NULL,
        last_scrape_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    await sql`
      CREATE TABLE IF NOT EXISTS favorites (
        id SERIAL PRIMARY KEY,
        post_id INTEGER REFERENCES posts(id) ON DELETE CASCADE,
        device_id VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE (post_id, device_id)
      );
    `;
    console.log('Database setup complete.');
  } catch (error) {
    console.error('Error setting up database:', error);
  }
}

// Execute the setup function
setupDatabase();