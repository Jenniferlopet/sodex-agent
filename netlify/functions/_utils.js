function response(statusCode, body) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key',
      'Access-Control-Allow-Methods': 'GET,POST,OPTIONS'
    },
    body: JSON.stringify(body)
  };
}

function ok(body) { return response(200, body); }
function bad(body) { return response(400, body); }

function env(name, fallback = '') {
  const value = process.env[name];
  return value === undefined || value === null || value === '' ? fallback : value;
}

function csv(name, fallback) {
  return env(name, fallback).split(',').map((x) => x.trim()).filter(Boolean);
}

async function safeFetchJson(url, options = {}, timeoutMs = Number(env('PROVIDER_TIMEOUT_MS', '9000'))) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    if (!res.ok) throw new Error('provider unavailable');
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

function compactProviderName(name) {
  // Never leak exact upstream failure or secret config to the UI.
  return name ? 'live' : 'protected';
}

function toNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function normalizeMarketItem(item) {
  const symbol = String(
    item.symbol || item.baseSymbol || item.ticker || item.coin || item.name || item.asset || ''
  ).replace('USDT', '').replace('-USDC', '').replace('/USDC', '').toUpperCase();

  return {
    symbol: symbol || 'ASSET',
    name: String(item.fullName || item.name || item.assetName || symbol || 'Asset'),
    price: toNumber(item.price ?? item.current_price ?? item.lastPrice ?? item.close ?? item.usdPrice),
    change24h: toNumber(item.change24h ?? item.price_change_percentage_24h ?? item.priceChangePercent ?? item.percentChange24h),
    marketCap: toNumber(item.marketCap ?? item.market_cap ?? item.market_cap_usd),
    volume24h: toNumber(item.volume24h ?? item.total_volume ?? item.quoteVolume ?? item.volume_24h)
  };
}

exports.response = response;
exports.ok = ok;
exports.bad = bad;
exports.env = env;
exports.csv = csv;
exports.safeFetchJson = safeFetchJson;
exports.compactProviderName = compactProviderName;
exports.toNumber = toNumber;
exports.normalizeMarketItem = normalizeMarketItem;
