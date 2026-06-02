const { ok, safeFetchJson, fallbackMarket } = require('./_utils');

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return ok({ ok: true });
  try {
    const url = 'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=bitcoin,ethereum,solana,chainlink,arbitrum&order=market_cap_desc&per_page=5&page=1&sparkline=false&price_change_percentage=24h';
    const data = await safeFetchJson(url, { headers: { accept: 'application/json' } });
    return ok({ ok: true, provider: 'protected', data: data.map((coin) => ({
      symbol: String(coin.symbol || '').toUpperCase(),
      name: coin.name || String(coin.symbol || '').toUpperCase(),
      price: Number(coin.current_price || 0),
      change24h: Number(coin.price_change_percentage_24h || 0),
      marketCap: Number(coin.market_cap || 0),
      volume24h: Number(coin.total_volume || 0)
    })) });
  } catch (_) {
    try {
      const pairs = ['BTCUSDT','ETHUSDT','SOLUSDT','LINKUSDT','ARBUSDT'];
      const data = await Promise.all(pairs.map(async (pair) => {
        const x = await safeFetchJson(`https://api.binance.com/api/v3/ticker/24hr?symbol=${pair}`);
        const symbol = pair.replace('USDT','');
        return { symbol, name: symbol, price: Number(x.lastPrice || 0), change24h: Number(x.priceChangePercent || 0), marketCap: 0, volume24h: Number(x.quoteVolume || 0) };
      }));
      return ok({ ok: true, provider: 'protected', data });
    } catch (_) {
      return ok({ ok: true, provider: 'protected', data: fallbackMarket });
    }
  }
};
