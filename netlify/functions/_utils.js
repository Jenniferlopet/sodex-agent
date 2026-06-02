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
function toNumber(value, fallback = 0) {
  if (typeof value === 'string') {
    const cleaned = value.replace(/[$,% ,]/g, '');
    const n = Number(cleaned);
    return Number.isFinite(n) ? n : fallback;
  }
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}
async function safeFetchJson(url, options = {}, timeoutMs = Number(env('PROVIDER_TIMEOUT_MS', '9000'))) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    const text = await res.text();
    let payload = null;
    try { payload = text ? JSON.parse(text) : null; } catch (_) { payload = { raw: text }; }
    if (!res.ok) throw new Error('provider unavailable');
    return payload;
  } finally {
    clearTimeout(timer);
  }
}
function unwrapArray(payload) {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== 'object') return [];
  const directKeys = ['data', 'result', 'results', 'rows', 'items', 'list', 'markets', 'tickers', 'symbols', 'tokens', 'coins'];
  for (const key of directKeys) {
    if (Array.isArray(payload[key])) return payload[key];
    if (payload[key] && typeof payload[key] === 'object') {
      const nested = unwrapArray(payload[key]);
      if (nested.length) return nested;
    }
  }
  // Some APIs return object maps: { BTC_USDC: {...}, ETH_USDC: {...} }
  const vals = Object.entries(payload)
    .filter(([, v]) => v && typeof v === 'object')
    .map(([k, v]) => ({ symbol: k, ...v }));
  return vals.length ? vals : [];
}
function firstDefined(item, keys) {
  for (const key of keys) {
    if (item && item[key] !== undefined && item[key] !== null && item[key] !== '') return item[key];
  }
  return undefined;
}
function cleanSymbol(raw) {
  let s = String(raw || '').trim();
  if (!s) return '';
  s = s.replace(/USDT$/i, '')
    .replace(/_USDC$/i, '')
    .replace(/-USDC$/i, '')
    .replace(/\/USDC$/i, '')
    .replace(/_USD$/i, '')
    .replace(/-USD$/i, '')
    .replace(/\/USD$/i, '');
  return s.toUpperCase();
}
function normalizeMarketItem(item) {
  const rawSymbol = firstDefined(item, [
    'symbol', 'market', 'marketSymbol', 'ticker', 'pair', 'name', 'asset', 'base', 'baseSymbol', 'baseAsset', 'coin', 'tokenSymbol'
  ]);
  const symbol = cleanSymbol(rawSymbol) || 'ASSET';
  const name = String(firstDefined(item, ['fullName', 'assetName', 'tokenName', 'baseName', 'name', 'displayName']) || symbol);

  const price = toNumber(firstDefined(item, [
    'price', 'current_price', 'lastPrice', 'last', 'close', 'markPrice', 'usdPrice', 'last_price', 'p'
  ]));
  const change24h = toNumber(firstDefined(item, [
    'change24h', 'price_change_percentage_24h', 'priceChangePercent', 'percentChange24h', 'changePercent', 'change', 'priceChangePercentage', 'change24hPercent', 'percent_change_24h'
  ]));
  const marketCap = toNumber(firstDefined(item, ['marketCap', 'market_cap', 'market_cap_usd', 'fdv', 'fullyDilutedValuation']));
  const volume24h = toNumber(firstDefined(item, [
    'volume24h', 'total_volume', 'quoteVolume', 'volume_24h', 'volume', 'turnover', 'quote_volume', 'amount24h', 'baseVolume'
  ]));
  return {
    symbol,
    rawSymbol: String(rawSymbol || symbol),
    name,
    price,
    change24h,
    marketCap,
    volume24h
  };
}
function sortAndLimit(rows, limit = 250) {
  const seen = new Set();
  return rows
    .filter((x) => x && x.symbol && (x.price > 0 || x.volume24h > 0 || Math.abs(x.change24h) > 0))
    .filter((x) => {
      const key = x.rawSymbol || x.symbol;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((a, b) => Number(b.volume24h || 0) - Number(a.volume24h || 0))
    .slice(0, limit);
}
function compact(n) {
  const num = Number(n || 0);
  if (!Number.isFinite(num)) return '0';
  if (Math.abs(num) >= 1e9) return (num / 1e9).toFixed(2) + 'B';
  if (Math.abs(num) >= 1e6) return (num / 1e6).toFixed(2) + 'M';
  if (Math.abs(num) >= 1e3) return (num / 1e3).toFixed(2) + 'K';
  return num.toFixed(2);
}
function pct(n) {
  const num = Number(n || 0);
  return (num >= 0 ? '+' : '') + num.toFixed(2) + '%';
}
exports.response = response;
exports.ok = ok;
exports.bad = bad;
exports.env = env;
exports.csv = csv;
exports.toNumber = toNumber;
exports.safeFetchJson = safeFetchJson;
exports.unwrapArray = unwrapArray;
exports.normalizeMarketItem = normalizeMarketItem;
exports.sortAndLimit = sortAndLimit;
exports.compact = compact;
exports.pct = pct;
