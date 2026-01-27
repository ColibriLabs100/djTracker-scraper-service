const axios = require('axios');

async function getMarketData() {
  const API_KEY = process.env.ALPHA_VANTAGE_API_KEY;
  if (!API_KEY) {
    throw new Error('Alpha Vantage API key not found. Please add it to your .env file.');
  }

  const sp500Symbol = 'SPY';
  const nasdaq100Symbol = 'QQQ';

  const sp500Url = `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${sp500Symbol}&apikey=${API_KEY}`;
  const nasdaq100Url = `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${nasdaq100Symbol}&apikey=${API_KEY}`;

  try {
    const [sp500Response, nasdaq100Response] = await Promise.all([
      axios.get(sp500Url),
      axios.get(nasdaq100Url)
    ]);

    const sp500Data = sp500Response.data['Time Series (Daily)'];
    const nasdaq100Data = nasdaq100Response.data['Time Series (Daily)'];

    if (!sp500Data || !nasdaq100Data) {
      console.error('Error fetching data from Alpha Vantage:', sp500Response.data, nasdaq100Response.data);
      throw new Error('Failed to fetch data from Alpha Vantage.');
    }
    
    const sp500LatestDate = Object.keys(sp500Data)[0];
    const nasdaq100LatestDate = Object.keys(nasdaq100Data)[0];

    const sp500LatestData = sp500Data[sp500LatestDate];
    const nasdaq100LatestData = nasdaq100Data[nasdaq100LatestDate];

    return {
      sp500: {
        date: sp500LatestDate,
        ...sp500LatestData
      },
      nasdaq100: {
        date: nasdaq100LatestDate,
        ...nasdaq100LatestData
      }
    };
  } catch (error) {
    console.error('Error fetching market data:', error);
    throw error;
  }
}

module.exports = { getMarketData };
