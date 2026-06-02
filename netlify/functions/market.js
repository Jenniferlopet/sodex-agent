const { ok, safeFetchJson, env, csv, normalizeMarketItem } = require('./_utils');

function sosovalueHeaders() {
  const key = env('SOSOVALUE_API_KEY');
  const headerName = env('SOSOVALUE_API_HEADER_NAME', 'X-API-Key');
  const authMode = env('SOSOVALUE_AUTH_MODE', 'header'); // header | bearer
  const headers = { accept: 'application/json' };
  if (!key) return headers;
  if (authMode === 'bearer') headers.Authorization = `Bearer ${key}`;
  else headers[headerName] = key;
  return headers;
}

function unwrapArray(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.data?.list)) return payload.data.list;
  if (Array.isArray(payload?.result)) return payload.result;
  if (Array.isArray(payload?.result?.list)) return payload.result.list;
  if (Array.isArray(payload?.coins)) return payload.coins;
  if (Array.isArray(payload?.tokens)) return payload.tokens;
  return [];
}

async function fromSoSoValue() {
  const key = env('SOSOVALUE_API_KEY');
  const url = env('SOSOVALUE_MARKET_URL');
  if (!key || !url) throw new Error('sosovalue env missing');
  const payload = await safeFetchJson(url, { headers: sosovalueHeaders() });
  const rows = unwrapArray(payload).map(normalizeMarketItem).filter((x) => x.price > 0);
  if (!rows.length) throw new Error('sosovalue empty');
  return rows.slice(0, Number(env('MARKET_LIMIT', '8')));
}

async function fromCoinGecko() {
  const ids = csv('COINGECKO_IDS', 'bitcoin,ethereum,solana,chainlink,arbitrum');
  const apiKey = env('COINGECKO_API_KEY');
  const url = 'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=' +
    encodeURIComponent(ids.join(',')) +
    '&order=market_cap_desc&per_page=' + Number(env('MARKET_LIMIT', '8')) +
    '&page=1&sparkline=false&price_change_percentage=24h';
  const headers = { accept: 'application/json' };
  if (apiKey) headers['x-cg-demo-api-key'] = apiKey;
  const data = await safeFetchJson(url, { headers });
  const rows = unwrapArray(data).map(normalizeMarketItem).filter((x) => x.price > 0);
  if (!rows.length) throw new Error('coingecko empty');
  return rows;
}

async function fromBinance() {
  const pairs = csv('BINANCE_PAIRS', 'BTCUSDT,ETHUSDT,SOLUSDT,LINKUSDT,ARBUSDT');
  const rows = await Promise.all(pairs.map(async (pair) => {
    const data = await safeFetchJson(`https://api.binance.com/api/v3/ticker/24hr?symbol=${encodeURIComponent(pair)}`);
    return normalizeMarketItem({
      symbol: pair.replace('USDT', ''),
      name: pair.replace('USDT', ''),
      lastPrice: data.lastPrice,
      priceChangePercent: data.priceChangePercent,
      quoteVolume: data.quoteVolume
    });
  }));
  return rows.filter((x) => x.price > 0);
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return ok({ ok: true });

  const providers = [fromSoSoValue, fromCoinGecko, fromBinance];
  for (const provider of providers) {
    try {
      const data = await provider();
      return ok({ ok: true, provider: 'live', data });
    } catch (_) {
      // Silent failover: do not expose provider errors or env names to the deployed UI.
    }
  }

  return ok({
    ok: false,
    provider: 'protected',
    data: [],
    message: 'Live market data is temporarily unavailable.'
  });
};
