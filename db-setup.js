require('dotenv').config();

const { sql } = require('@vercel/postgres');

async function setupDatabase() {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS posts (
        id SERIAL PRIMARY KEY,
        text TEXT NOT NULL,
        date TIMESTAMPTZ NOT NULL,
        source VARCHAR(255) NOT NULL,
        UNIQUE(text, date, source)
      );
    `;
    await sql`
      CREATE TABLE IF NOT EXISTS reactions (
        id SERIAL PRIMARY KEY,
        post_id INTEGER REFERENCES posts(id) ON DELETE CASCADE,
        device_id VARCHAR(255) NOT NULL,
        reaction_type VARCHAR(50) NOT NULL,
        UNIQUE(post_id, device_id)
      );
    `;
    console.log('Database table setup complete.');
  } catch (error) {
    console.error('Error setting up database:', error);
  }
}

setupDatabase();
