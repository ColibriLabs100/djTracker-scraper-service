 require('dotenv').config();
const express = require('express');
const { scrapeTrumpTruth, scrapeTelegramWeb } = require('./scraper.js');
const { sql } = require('@vercel/postgres');
const { sendPushNotification } = require('./firebase.js');

const app = express();
app.use(express.json());
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

async function scrapeAndStorePosts() {
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

    let newPostsFound = false;

    // 2. Insert new posts into the database
    for (const post of allScrapedPosts) {
      const postDate = new Date(post.date);
      if (isNaN(postDate.getTime())) {
        console.warn('Skipping invalid date:', post.date);
        continue;
      }
      // The sql template helper automatically sanitizes inputs
      const result = await sql`
        INSERT INTO posts (text, date, source)
        VALUES (${post.text}, ${postDate.toISOString()}, ${post.source})
        ON CONFLICT (text, date, source) DO NOTHING;
      `;

      if (result.rowCount > 0) {
        newPostsFound = true;
      }
    }

    if (newPostsFound) {
      console.log('New posts found, sending notifications...');
      // 3. Fetch all device tokens
      const { rows: devices } = await sql`SELECT push_token FROM devices;`;
      const tokens = devices.map(d => d.push_token);

      // 4. Send notifications
      for (const token of tokens) {
        await sendPushNotification(token, 'New DJT Post!', 'A new post has been detected.');
      }
    } else {
      console.log('No new posts found.');
    }
  } catch (error) {
    console.error('Error scraping and storing posts:', error);
  }
}

app.post('/api/devices', async (req, res) => {
  const { deviceId, pushToken } = req.body;

  if (!deviceId || !pushToken) {
    return res.status(400).send('deviceId and pushToken are required.');
  }

  try {
    await sql`
      INSERT INTO devices (device_id, push_token)
      VALUES (${deviceId}, ${pushToken})
      ON CONFLICT (device_id)
      DO UPDATE SET push_token = ${pushToken};
    `;
    res.status(201).send('Device registered.');
  } catch (error) {
    console.error('Error registering device:', error);
    res.status(500).send('Failed to register device.');
  }
});

app.post('/api/posts/:id/react', async (req, res) => {
  const { id } = req.params;
  const { deviceId, reactionType } = req.body;

  if (!deviceId || !reactionType) {
    return res.status(400).send('deviceId and reactionType are required.');
  }

  try {
    await sql`
      INSERT INTO reactions (post_id, device_id, reaction_type)
      VALUES (${id}, ${deviceId}, ${reactionType})
      ON CONFLICT (post_id, device_id)
      DO UPDATE SET reaction_type = ${reactionType};
    `;
    res.status(201).send('Reaction saved.');
  } catch (error) {
    console.error('Error saving reaction:', error);
    res.status(500).send('Failed to save reaction.');
  }
});

app.get('/posts/all', async (req, res) => {
  try {
    await scrapeAndStorePosts();
    // 3. Fetch all posts from the database with reaction counts
    const { rows } = await sql`
      SELECT
        p.*,
        COALESCE(SUM(CASE WHEN r.reaction_type = 'like' THEN 1 ELSE 0 END), 0)::int AS likes,
        COALESCE(SUM(CASE WHEN r.reaction_type = 'laugh' THEN 1 ELSE 0 END), 0)::int AS laughs
      FROM posts p
      LEFT JOIN reactions r ON p.id = r.post_id
      GROUP BY p.id
      ORDER BY p.date DESC;
    `;

    // 4. Return results
    res.json(rows);
  } catch (error) {
    console.error('Error fetching all posts:', error);
    res.status(500).send('Failed to fetch all posts.');
  }
});

app.get('/api/cron', async (req, res) => {
  try {
    await scrapeAndStorePosts();
    res.status(200).send('Cron job completed successfully.');
  } catch (error) {
    console.error('Error running cron job:', error);
    res.status(500).send('Cron job failed.');
  }
});

const server = app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

process.on('SIGINT', function() {
  console.log( "\nGracefully shutting down from SIGINT (Ctrl-C)" );
  process.exit(1);
});

process.on('exit', (code) => {
  console.log(`About to exit with code: ${code}`);
});

server.on('close', () => {
  console.log('Server closed');
});
