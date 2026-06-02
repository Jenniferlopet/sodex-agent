const { ok, fallbackAssets } = require('./_shared');

async function coingecko() {
  const url = 'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=bitcoin,ethereum,solana,chainlink,arbitrum&order=market_cap_desc&per_page=5&page=1&sparkline=false&price_change_percentage=24h';
  const res = await fetch(url, { headers: { accept: 'application/json' } });
  if (!res.ok) throw new Error('provider unavailable');
  const data = await res.json();
  return data.map(c => ({ symbol:String(c.symbol||'').toUpperCase(), name:c.name, price:c.current_price||0, change24h:c.price_change_percentage_24h||0, marketCap:c.market_cap||0, volume24h:c.total_volume||0 }));
}

async function binance() {
  const pairs = ['BTCUSDT','ETHUSDT','SOLUSDT','LINKUSDT','ARBUSDT'];
  const data = await Promise.all(pairs.map(async pair => {
    const res = await fetch(`https://api.binance.com/api/v3/ticker/24hr?symbol=${pair}`);
    if (!res.ok) throw new Error('fallback unavailable');
    const d = await res.json();
    const symbol = pair.replace('USDT','');
    return { symbol, name:symbol, price:Number(d.lastPrice||0), change24h:Number(d.priceChangePercent||0), marketCap:0, volume24h:Number(d.quoteVolume||0) };
  }));
  return data;
}

exports.handler = async function() {
  try { return ok({ ok:true, provider:'protected', data: await coingecko() }); }
  catch { try { return ok({ ok:true, provider:'protected', data: await binance() }); }
  catch { return ok({ ok:true, provider:'protected', data: fallbackAssets }); } }
};
