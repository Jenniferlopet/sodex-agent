const { ok, bad, safeFetchJson, env } = require('./_utils');

function liveTrading() { return env('LIVE_TRADING', 'false') === 'true'; }
function envName() { return env('SODEX_ENV', 'testnet'); }
function baseUrl() {
  if (env('SODEX_API_BASE_URL')) return env('SODEX_API_BASE_URL').replace(/\/$/, '');
  return envName() === 'mainnet' ? 'https://api.sodex.com' : 'https://api-testnet.sodex.com';
}
function apiHeaders(extra = {}) {
  const key = env('SODEX_API_KEY_NAME') || env('SODEX_API_KEY');
  const headerName = env('SODEX_API_HEADER_NAME', 'X-API-Key');
  const headers = { accept: 'application/json', 'content-type': 'application/json', ...extra };
  if (key) headers[headerName] = key;
  return headers;
}
function pathEnv(name, fallback) {
  const p = env(name, fallback);
  return p.startsWith('/') ? p : `/${p}`;
}
async function fetchSodex(path, options = {}) {
  return safeFetchJson(`${baseUrl()}${path}`, { ...options, headers: apiHeaders(options.headers || {}) });
}
exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return ok({ ok: true });
  const path = (event.path || '').split('/api/sodex/')[1] || (event.path || '').split('/.netlify/functions/sodex/')[1] || '';
  if (path.startsWith('account')) {
    const accountPath = env('SODEX_ACCOUNT_PATH');
    if (accountPath && (env('SODEX_API_KEY_NAME') || env('SODEX_API_KEY'))) {
      try {
        const data = await fetchSodex(pathEnv('SODEX_ACCOUNT_PATH', accountPath));
        return ok({ ok: true, env: envName(), liveTrading: liveTrading(), data });
      } catch (_) {}
    }
    return ok({
      ok: true,
      env: envName(),
      liveTrading: liveTrading(),
      accountConfigured: Boolean(env('SODEX_ACCOUNT_ID')),
      apiConfigured: Boolean(env('SODEX_API_KEY_NAME') || env('SODEX_API_KEY')),
      dataSource: accountPath ? 'live-configured' : 'env-status'
    });
  }
  if (path.startsWith('markets')) {
    try {
      const data = await fetchSodex(pathEnv('SODEX_MARKETS_PATH', '/markets/tickers'));
      return ok({ ok: true, provider: 'live', data });
    } catch (_) {
      return ok({ ok: false, provider: 'protected', data: [], message: 'SoDEX market data is temporarily unavailable.' });
    }
  }
  if (path.startsWith('orderbook')) {
    const symbol = new URLSearchParams(event.rawQuery || '').get('symbol') || env('DEFAULT_SODEX_SYMBOL', 'vBTC_vUSDC');
    const template = pathEnv('SODEX_ORDERBOOK_PATH', '/markets/{symbol}/orderbook');
    const resolvedPath = template.replace('{symbol}', encodeURIComponent(symbol));
    try {
      const data = await fetchSodex(resolvedPath);
      return ok({ ok: true, provider: 'live', data });
    } catch (_) {
      return ok({ ok: false, provider: 'protected', data: { symbol, bids: [], asks: [] }, message: 'SoDEX orderbook is temporarily unavailable.' });
    }
  }
  if (path.startsWith('order')) {
    let order = {};
    try { order = JSON.parse(event.body || '{}'); } catch (_) {}
    if (!liveTrading()) {
      return ok({
        ok: true,
        mode: 'verification',
        message: 'Protected order check complete. No real order was submitted because LIVE_TRADING=false.',
        order: {
          symbol: order.symbol || env('DEFAULT_SODEX_SYMBOL', 'vBTC_vUSDC'),
          side: order.side || 'buy',
          type: order.type || 'market',
          amount: order.amount || '0',
          status: 'verified-not-submitted'
        }
      });
    }
    const orderPath = env('SODEX_ORDER_PATH');
    if (!orderPath) return bad({ ok: false, message: 'SODEX_ORDER_PATH is not configured.' });
    if (!(env('SODEX_API_KEY_NAME') || env('SODEX_API_KEY'))) return bad({ ok: false, message: 'SoDEX API key is not configured.' });
    try {
      const data = await fetchSodex(pathEnv('SODEX_ORDER_PATH', orderPath), { method: 'POST', body: JSON.stringify(order) });
      return ok({ ok: true, provider: 'live', data });
    } catch (_) {
      return bad({ ok: false, message: 'Live order submission failed.' });
    }
  }
  return ok({ ok: true, routes: ['account', 'markets', 'orderbook', 'order'] });
};
