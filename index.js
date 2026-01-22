require('dotenv').config();
const express = require('express');
const { scrapeTrumpTruth, scrapeTelegramWeb } = require('./scraper.js');
const { sql } = require('@vercel/postgres');

const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send('Hello from your new backend server!');
});

app.get('/posts/trump', async (req, res) => {
  try {
    const posts = await scrapeTrumpTruth();
    res.json(posts);
  } catch (error) {
    console.error('Error scraping posts:', error);
    res.status(500).send('Failed to scrape posts.');
  }
});

app.get('/posts/telegram', async (req, res) => {
  try {
    const posts = await scrapeTelegramWeb();
    res.json(posts);
  } catch (error) {
    console.error('Error scraping Telegram:', error);
    res.status(500).send('Failed to scrape Telegram.');
  }
});

app.get('/posts/all', async (req, res) => {
  try {
    // 1. Scrape sources
    const [trumpPosts, telegramPosts] = await Promise.all([
      scrapeTrumpTruth(),
      scrapeTelegramWeb()
    ]);

    const allScrapedPosts = [
      ...trumpPosts.map(p => ({ ...p, source: 'Trump Truth' })),
      ...telegramPosts.map(p => ({ ...p, source: 'Telegram' }))
    ];

    // 2. Insert new posts into the database
    for (const post of allScrapedPosts) {
      const postDate = new Date(post.date);
      if (isNaN(postDate.getTime())) {
        console.warn('Skipping invalid date:', post.date);
        continue;
      }
      // The sql template helper automatically sanitizes inputs
      await sql`
        INSERT INTO posts (text, date, source)
        VALUES (${post.text}, ${postDate.toISOString()}, ${post.source})
        ON CONFLICT (text, date, source) DO NOTHING;
      `;
    }

    // 3. Fetch all posts from the database
    const { rows } = await sql`SELECT * FROM posts ORDER BY date DESC;`;

    // 4. Return results
    res.json(rows);
  } catch (error) {
    console.error('Error fetching all posts:', error);
    res.status(500).send('Failed to fetch all posts.');
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
