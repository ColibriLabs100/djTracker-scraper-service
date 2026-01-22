const express = require('express');
const { scrapeTrumpTruth, scrapeTelegramWeb } = require('./scraper.js');

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
    const [trumpPosts, telegramPosts] = await Promise.all([
      scrapeTrumpTruth(),
      scrapeTelegramWeb()
    ]);

    const processedTrumpPosts = trumpPosts.map(post => ({
      ...post,
      source: 'Trump Truth',
      date: new Date(post.date).toISOString()
    }));

    const processedTelegramPosts = telegramPosts.map(post => ({
      ...post,
      source: 'Telegram',
      date: new Date(post.date).toISOString()
    }));

    const allPosts = [...processedTrumpPosts, ...processedTelegramPosts];

    allPosts.sort((a, b) => new Date(b.date) - new Date(a.date));

    res.json(allPosts);
  } catch (error) {
    console.error('Error fetching all posts:', error);
    res.status(500).send('Failed to fetch all posts.');
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
