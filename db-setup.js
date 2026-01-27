const { sql } = require('@vercel/postgres');

async function setupDatabase() {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS posts (
        id SERIAL PRIMARY KEY,
        text TEXT NOT NULL,
        date TIMESTAMP WITH TIME ZONE NOT NULL,
        source VARCHAR(255) NOT NULL,
        UNIQUE (text, date, source)
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
        post_id INTEGER REFERENCES posts(id),
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
  } finally {
    // In a real application, you might close the connection here if it's not managed by Vercel.
    // For Vercel Postgres, the connection is usually managed automatically.
  }
}

// Execute the setup function
setupDatabase();