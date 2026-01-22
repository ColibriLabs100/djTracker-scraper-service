require('dotenv').config();

const { sql } = require('@vercel/postgres');

async function setupDatabase() {
  try {
    const result = await sql`
      CREATE TABLE IF NOT EXISTS posts (
        id SERIAL PRIMARY KEY,
        text TEXT NOT NULL,
        date TIMESTAMPTZ NOT NULL,
        source VARCHAR(255) NOT NULL,
        UNIQUE(text, date, source)
      );
    `;
    console.log('Database table setup complete.', result);
  } catch (error) {
    console.error('Error setting up database:', error);
  }
}

setupDatabase();
