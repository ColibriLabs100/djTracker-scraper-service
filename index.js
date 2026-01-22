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



app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
