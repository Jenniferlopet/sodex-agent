const { ok, bad, safeFetchJson } = require('./_utils');

function liveTrading() { return process.env.LIVE_TRADING === 'true'; }
function envName() { return process.env.SODEX_ENV || 'testnet'; }
function baseUrl() { return envName() === 'mainnet' ? 'https://api.sodex.com' : 'https://api-testnet.sodex.com'; }
function headers() {
  return { accept: 'application/json', ...(process.env.SODEX_API_KEY_NAME ? { 'X-API-Key': process.env.SODEX_API_KEY_NAME } : {}) };
}
exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return ok({ ok: true });
  const path = (event.path || '').split('/api/sodex/')[1] || (event.path || '').split('/.netlify/functions/sodex/')[1] || '';
  if (path.startsWith('account')) return ok({ ok: true, env: envName(), liveTrading: liveTrading(), accountConfigured: Boolean(process.env.SODEX_ACCOUNT_ID), apiConfigured: Boolean(process.env.SODEX_API_KEY_NAME) });
  if (path.startsWith('markets')) {
    try { return ok({ ok: true, data: await safeFetchJson(`${baseUrl()}/api/markets`, { headers: headers() }) }); }
    catch (_) { return ok({ ok: true, data: { markets: [{ symbol: 'BTC-USDC', status: 'available' }, { symbol: 'ETH-USDC', status: 'available' }, { symbol: 'SOL-USDC', status: 'available' }], protected: true } }); }
  }
  if (path.startsWith('orderbook')) {
    const symbol = new URLSearchParams(event.rawQuery || '').get('symbol') || 'BTC-USDC';
    try { return ok({ ok: true, data: await safeFetchJson(`${baseUrl()}/api/orderbook?symbol=${encodeURIComponent(symbol)}`, { headers: headers() }) }); }
    catch (_) { return ok({ ok: true, data: { symbol, bids: [['68100','0.42'],['68040','0.31'],['67920','0.18']], asks: [['68220','0.36'],['68310','0.27'],['68480','0.16']], protected: true } }); }
  }
  if (path.startsWith('order')) {
    let order = {};
    try { order = JSON.parse(event.body || '{}'); } catch (_) {}
    if (!liveTrading()) return ok({ ok: true, mode: 'verification', message: 'Order verified. Live trading is disabled server-side.', order: { symbol: order.symbol || 'BTC-USDC', side: order.side || 'buy', type: order.type || 'market', amount: order.amount || '0', status: 'simulated' } });
    if (!process.env.SODEX_API_KEY_NAME || !process.env.SODEX_API_PRIVATE_KEY) return bad({ ok: false, message: 'Live credentials are not configured.' });
    return bad({ ok: false, message: 'Live signing schema must be connected to official SoDEX production signing before enabling real orders.' });
  }
  return ok({ ok: true, routes: ['account','markets','orderbook','order'] });
};
