const puppeteer = require('puppeteer');

async function scrapeTrumpTruth() {
  const browser = await puppeteer.launch({ timeout: 60000 });
  const page = await browser.newPage();
  await page.goto('https://trumpstruth.org/', { waitUntil: 'networkidle2' });

  // Wait for the posts to be loaded
  await page.waitForSelector('.status', { timeout: 60000 });

  const posts = await page.$$eval('.status', (statuses) => {
    return statuses.map((status) => {
      const textElement = status.querySelector('.status__content');
      const dateElement = status.querySelector('.status-info__meta-item:nth-child(2)');
      
      return {
        text: textElement ? textElement.innerText.trim() : '',
        date: dateElement ? dateElement.innerText.trim() : ''
      };
    });
  });

  await browser.close();
  return posts.filter(post => post.text !== '');
}

async function scrapeTelegramWeb() {
  const browser = await puppeteer.launch({ timeout: 60000 });
  const page = await browser.newPage();
  await page.goto('https://t.me/s/walterbloomberg', { waitUntil: 'networkidle2' });

  await page.waitForSelector('.tgme_widget_message_wrap', { timeout: 60000 });

  const posts = await page.$$eval('.tgme_widget_message_wrap', (messages) => {
    return messages.map((message) => {
      const textElement = message.querySelector('.tgme_widget_message_text');
      const dateElement = message.querySelector('.tgme_widget_message_date time');

      return {
        text: textElement ? textElement.innerText.trim() : '',
        date: dateElement ? dateElement.getAttribute('datetime') : ''
      };
    });
  });

  await browser.close();
  return posts.filter(post => post.text !== '');
}

module.exports = { scrapeTrumpTruth, scrapeTelegramWeb };