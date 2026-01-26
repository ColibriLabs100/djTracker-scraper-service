const cheerio = require('cheerio');

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
};

async function fetchPage(url) {
  try {
    const response = await fetch(url, { 
      headers: HEADERS,
      timeout: 10000 
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.text();
  } catch (error) {
    console.error(`Failed to fetch ${url}:`, error);
    throw error;
  }
}

async function scrapeTrumpTruth(lastScrapeTime) {
  try {
    const html = await fetchPage('https://t.me/s/real_DonaldJTrump');
    const $ = cheerio.load(html);
    
    const posts = [];
    $('.tgme_widget_message_wrap').each((i, elem) => {
      const textElement = $(elem).find('.tgme_widget_message_text');
      const dateElement = $(elem).find('time.time');
      const text = textElement.text().trim();
      const date = dateElement.attr('datetime') || new Date().toISOString();
      
      // Only include posts newer than last scrape time
      if (text && new Date(date) > new Date(lastScrapeTime)) {
        posts.push({ text, date });
      }
    });
    
    return posts;
  } catch (error) {
    console.error('Error scraping Trump Truth:', error);
    return [];
  }
}

async function scrapeTelegramWeb(lastScrapeTime) {
  try {
    const html = await fetchPage('https://t.me/s/walterbloomberg');
    const $ = cheerio.load(html);
    
    const keywords = ['trump:', 'trump-', 'trump -', 'trump - ', '*trump', '*trump:', '*trump -', 'trump says he', 'trump says he\'ll', 'trump says hell'];
    
    const posts = [];
    $('.tgme_widget_message_text').each((i, elem) => {
      const text = $(elem).text().trim();
      const lowerCaseText = text.toLowerCase();
      
      // Check if post contains any trump-related keywords
      if (keywords.some(keyword => lowerCaseText.includes(keyword.replace('*', '')))) {
        let cleanText = text;
        
        // Remove keywords
        keywords.forEach(keyword => {
          const regex = new RegExp(keyword.replace('*', ''), 'gi');
          cleanText = cleanText.replace(regex, '');
        });
        
        // Remove @WalterBloomberg mention
        cleanText = cleanText.replace(/\(@WalterBloomberg\)/gi, '').trim();
        
        const date = new Date().toISOString();
        // Only include posts newer than last scrape time
        if (cleanText && new Date(date) > new Date(lastScrapeTime)) {
          posts.push({ text: cleanText, date });
        }
      }
    });
    
    return posts;
  } catch (error) {
    console.error('Error scraping Telegram Web:', error);
    return [];
  }
}

module.exports = { scrapeTrumpTruth, scrapeTelegramWeb };