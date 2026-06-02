const { ok, safeFetchJson, env, csv, unwrapArray, normalizeMarketItem, sortAndLimit } = require('./_utils');

function sodexBaseUrl() {
  if (env('SODEX_API_BASE_URL')) return env('SODEX_API_BASE_URL').replace(/\/$/, '');
  return env('SODEX_ENV', 'testnet') === 'mainnet' ? 'https://api.sodex.com' : 'https://api-testnet.sodex.com';
}
function pathEnv(name, fallback) {
  const p = env(name, fallback);
  return p.startsWith('/') ? p : `/${p}`;
}
function sodexHeaders() {
  const headers = { accept: 'application/json' };
  const key = env('SODEX_API_KEY_NAME') || env('SODEX_API_KEY');
  const headerName = env('SODEX_API_HEADER_NAME', 'X-API-Key');
  if (key) headers[headerName] = key;
  return headers;
}
function sosovalueHeaders() {
  const key = env('SOSOVALUE_API_KEY');
  const headerName = env('SOSOVALUE_API_HEADER_NAME', 'X-API-Key');
  const authMode = env('SOSOVALUE_AUTH_MODE', 'header');
  const headers = { accept: 'application/json' };
  if (!key) return headers;
  if (authMode === 'bearer') headers.Authorization = `Bearer ${key}`;
  else headers[headerName] = key;
  return headers;
}

const DEFAULT_SODEX_WATCHLIST = [
  'SOSO','vSOSO','USDC','vUSDC','BTC','vBTC','ETH','vETH','SOL','vSOL','BNB','vBNB','AVAX','vAVAX','ARB','vARB','OP','vOP','MATIC','vMATIC','POL','vPOL','LINK','vLINK','UNI','vUNI','AAVE','vAAVE','SUI','vSUI','APT','vAPT','NEAR','vNEAR','INJ','vINJ','ATOM','vATOM','DOT','vDOT','SEI','vSEI','TIA','vTIA','JUP','vJUP','PYTH','vPYTH','WIF','vWIF','BONK','vBONK','ORDI','vORDI','STX','vSTX','LDO','vLDO','MKR','vMKR','ENA','vENA','ONDO','vONDO','PENDLE','vPENDLE','RENDER','vRENDER','RNDR','vRNDR','FET','vFET','TAO','vTAO','ICP','vICP','GRT','vGRT','IMX','vIMX','STRK','vSTRK','AEVO','vAEVO','ZRO','vZRO','ZK','vZK','WLD','vWLD','FIL','vFIL','ETC','vETC','DOGE','vDOGE','XRP','vXRP','ADA','vADA','TRX','vTRX','TON','vTON','PEPE','vPEPE','SHIB','vSHIB'
];
function watchlistRows(existing = []) {
  const enabled = env('SHOW_SODEX_WATCHLIST', 'true') !== 'false';
  if (!enabled) return [];
  const extra = csv('SODEX_WATCHLIST_TOKENS', DEFAULT_SODEX_WATCHLIST.join(','));
  const seen = new Set(existing.map(x => String(x.symbol || '').toUpperCase()));
  const rows = [];
  for (const raw of extra) {
    const symbol = String(raw || '').trim().toUpperCase();
    if (!symbol || seen.has(symbol)) continue;
    seen.add(symbol);
    rows.push({
      symbol,
      rawSymbol: symbol.includes('_') ? symbol : `${symbol}_vUSDC`,
      name: symbol === 'SOSO' || symbol === 'VSOSO' ? 'SoSoValue Token' : `${symbol} SoDEX Watchlist`,
      price: 0,
      change24h: 0,
      marketCap: 0,
      volume24h: 0,
      watchlist: true
    });
  }
  return rows;
}
function mergeWatchlist(rows) {
  const merged = [...rows, ...watchlistRows(rows)];
  const limit = Number(env('MARKET_LIMIT', '250'));
  return merged.slice(0, limit);
}

async function fromSodex() {
  const limit = Number(env('MARKET_LIMIT', '250'));
  const candidates = [
    pathEnv('SODEX_MARKETS_PATH', '/markets/tickers'),
    pathEnv('SODEX_MINI_TICKERS_PATH', '/markets/miniTickers'),
    '/markets/tickers',
    '/markets/miniTickers',
    '/markets',
    '/symbols',
    '/api/markets/tickers',
    '/api/markets/miniTickers',
    '/api/markets',
    '/api/symbols',
    '/api/v1/markets/tickers',
    '/api/v1/markets/miniTickers',
    '/api/v1/markets',
    '/api/v1/symbols',
    '/api/v1/spot/markets/tickers',
    '/api/v1/spot/markets',
    '/spot/markets/tickers',
    '/spot/markets',
    '/spot/api/v1/markets/tickers',
    '/spot/api/v1/markets'
  ];
  const unique = [...new Set(candidates.filter(Boolean))];
  for (const path of unique) {
    try {
      const payload = await safeFetchJson(`${sodexBaseUrl()}${path}`, { headers: sodexHeaders() });
      const rows = sortAndLimit(unwrapArray(payload).map(normalizeMarketItem), limit);
      if (rows.length) {
        return { rows: mergeWatchlist(rows), meta: { source: 'SoDEX', universe: 'sodex', endpoint: 'protected' } };
      }
    } catch (_) {}
  }
  throw new Error('sodex empty');
}
async function fromSoSoValue() {
  const key = env('SOSOVALUE_API_KEY');
  const url = env('SOSOVALUE_MARKET_URL');
  if (!key || !url) throw new Error('sosovalue env missing');
  const payload = await safeFetchJson(url, { headers: sosovalueHeaders() });
  const rows = sortAndLimit(unwrapArray(payload).map(normalizeMarketItem), Number(env('MARKET_LIMIT', '250')));
  if (!rows.length) throw new Error('sosovalue empty');
  return { rows: mergeWatchlist(rows), meta: { source: 'SoSoValue', universe: 'sosovalue', endpoint: 'protected' } };
}
async function fromCoinGecko() {
  const ids = csv('COINGECKO_IDS', 'bitcoin,ethereum,solana,chainlink,arbitrum,optimism,uniswap,aave,maker,lido-dao,near,render-token,internet-computer,ondo-finance,jupiter-exchange-solana');
  const apiKey = env('COINGECKO_API_KEY');
  const limit = Number(env('MARKET_LIMIT', '250'));
  const url = 'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=' +
    encodeURIComponent(ids.join(',')) +
    '&order=market_cap_desc&per_page=' + Math.min(ids.length, limit) +
    '&page=1&sparkline=false&price_change_percentage=24h';
  const headers = { accept: 'application/json' };
  if (apiKey) headers['x-cg-demo-api-key'] = apiKey;
  const data = await safeFetchJson(url, { headers });
  const rows = sortAndLimit(unwrapArray(data).map(normalizeMarketItem), limit);
  if (!rows.length) throw new Error('coingecko empty');
  return { rows: mergeWatchlist(rows), meta: { source: 'Live fallback + SoDEX watchlist', universe: 'fallback+watchlist', endpoint: 'protected' } };
}
async function fromBinance() {
  const pairs = csv('BINANCE_PAIRS', 'BTCUSDT,ETHUSDT,SOLUSDT,LINKUSDT,ARBUSDT,OPUSDT,UNIUSDT,AAVEUSDT,MKRUSDT,LDOUSDT,NEARUSDT,RNDRUSDT,ICPUSDT,ONDOUSDT,JUPUSDT');
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
  const sorted = sortAndLimit(rows, Number(env('MARKET_LIMIT', '250')));
  if (!sorted.length) throw new Error('binance empty');
  return { rows: mergeWatchlist(sorted), meta: { source: 'Live fallback + SoDEX watchlist', universe: 'fallback+watchlist', endpoint: 'protected' } };
}
exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return ok({ ok: true });

  // SoDEX-first: the dashboard is intended to track the SoDEX market universe.
  const providers = [fromSodex, fromSoSoValue, fromCoinGecko, fromBinance];
  for (const provider of providers) {
    try {
      const { rows, meta } = await provider();
      return ok({
        ok: true,
        provider: 'live',
        primary: meta.source,
        universe: meta.universe,
        totalAssets: rows.length,
        chartLimit: Number(env('CHART_LIMIT', '28')),
        tableLimit: Number(env('TABLE_LIMIT', '120')),
        data: rows
      });
    } catch (_) {
      // Silent failover: never expose provider failures, endpoints, or secret config to UI.
    }
  }
  return ok({ ok: false, provider: 'protected', primary: 'unavailable', universe: 'empty', totalAssets: 0, data: [], message: 'Live market data is temporarily unavailable.' });
};
