const chromium = require('chrome-aws-lambda');
const puppeteer = require('puppeteer-core');

async function getBrowser() {
  return puppeteer.launch({
    args: chromium.args,
    executablePath: await chromium.executablePath,
    headless: chromium.headless,
  });
}

async function scrapeTrumpTruth(browser) {
  const page = await browser.newPage();
  try {
    page.setDefaultNavigationTimeout(60000);
    await page.goto('https://t.me/s/real_DonaldJTrump', { waitUntil: 'networkidle2' });

    await page.waitForSelector('.tgme_widget_message_wrap');

    const posts = await page.$$eval('.tgme_widget_message_wrap', (messages) => {
      return messages.map((message) => {
        const textElement = message.querySelector('.tgme_widget_message_text');
        const dateElement = message.querySelector('time.time');
        return {
          text: textElement ? textElement.innerText.trim() : '',
          date: dateElement ? dateElement.getAttribute('datetime') : new Date().toISOString(),
        };
      });
    });
    
    return posts.filter(post => post.text.trim() !== '');
  } finally {
    await page.close();
  }
}

async function scrapeTelegramWeb(browser) {
  const page = await browser.newPage();
  try {
    page.setDefaultNavigationTimeout(60000);
    await page.goto('https://t.me/s/walterbloomberg', { waitUntil: 'networkidle2' });

    await page.waitForSelector('.tgme_widget_message_text');

    const posts = await page.$$eval('.tgme_widget_message_text', (messages) => {
      return messages.map((message) => {
        return message.innerText;
      });
    });

    const keywords = ['trump:', 'trump-', 'trump -', 'trump - ', '*trump', '*trump:', '*trump -', '*trump -', 'trump says he', 'trump says he\'ll', 'trump says hell'];
    
    const filteredPosts = posts
      .filter(post => {
        const lowerCasePost = post.toLowerCase();
        return keywords.some(keyword => lowerCasePost.includes(keyword.replace('*', '')));
      })
      .map(post => {
        let cleanPost = post;
        keywords.forEach(keyword => {
          // Create a regex to remove the keyword, ignoring case and handling the wildcard '*'
          const regex = new RegExp(keyword.replace('*', ''), 'gi');
          cleanPost = cleanPost.replace(regex, '');
        });
        cleanPost = cleanPost.replace(/\(@WalterBloomberg\)/gi, '');
        return { text: cleanPost.trim(), date: new Date().toISOString() };
      });

    return filteredPosts;
  } finally {
    await page.close();
  }
}

module.exports = { getBrowser, scrapeTrumpTruth, scrapeTelegramWeb };