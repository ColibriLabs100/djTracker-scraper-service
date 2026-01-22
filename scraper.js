const puppeteer = require('puppeteer');

async function scrapeTrumpTruth() {
  const browser = await puppeteer.launch({ timeout: 60000 });
  const page = await browser.newPage();
  await page.goto('https://trumpstruth.org', { waitUntil: 'networkidle2' });

  // Wait for the posts to be loaded
  await page.waitForSelector('.status');

  const posts = await page.$$eval('.status', (statuses) => {
    return statuses.map((status) => {
      const textElement = status.querySelector('.status__content');
      const dateElement = status.querySelector('.status-info__meta-item:last-child');
      return {
        text: textElement ? textElement.innerText : '',
        date: dateElement ? dateElement.innerText : '',
      };
    });
  });

  await browser.close();
  return posts.filter(post => post.text.trim() !== '');
}

async function scrapeTelegramWeb() {
  const browser = await puppeteer.launch({ timeout: 60000 });
  const page = await browser.newPage();
  await page.goto('https://t.me/s/walterbloomberg', { waitUntil: 'networkidle2' });

  await page.waitForSelector('.tgme_widget_message_text');

  const posts = await page.$$eval('.tgme_widget_message_text', (messages) => {
    return messages.map((message) => {
      return message.innerText;
    });
  });

  await browser.close();
  return posts.map(post => ({ text: post, date: new Date().toISOString() }));
}

module.exports = { scrapeTrumpTruth, scrapeTelegramWeb };