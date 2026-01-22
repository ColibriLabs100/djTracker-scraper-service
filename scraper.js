const chromium = require('chrome-aws-lambda');
const puppeteer = require('puppeteer-core');

async function getBrowser() {
  return puppeteer.launch({
    args: chromium.args,
    defaultViewport: chromium.defaultViewport,
    executablePath: await chromium.executablePath,
    headless: chromium.headless,
    ignoreHTTPSErrors: true,
    timeout: 60000,
  });
}

async function scrapeTrumpTruth() {
  let browser = null;
  try {
    browser = await getBrowser();
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
    
    return posts.filter(post => post.text.trim() !== '');
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

async function scrapeTelegramWeb() {
  let browser = null;
  try {
    browser = await getBrowser();
    const page = await browser.newPage();
    await page.goto('https://t.me/s/walterbloomberg', { waitUntil: 'networkidle2' });

    await page.waitForSelector('.tgme_widget_message_text');

    const posts = await page.$$eval('.tgme_widget_message_text', (messages) => {
      return messages.map((message) => {
        return message.innerText;
      });
    });

    return posts.map(post => ({ text: post, date: new Date().toISOString() }));
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

module.exports = { scrapeTrumpTruth, scrapeTelegramWeb };