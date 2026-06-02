const { ok } = require('./_utils');

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return ok({ ok: true });
  let body = {};
  try { body = JSON.parse(event.body || '{}'); } catch (_) {}
  const prompt = String(body.prompt || '').toLowerCase();

  let answer = 'I can read live market data from server environment providers, check risk, and prepare protected SoDEX actions without exposing keys.';
  if (prompt.includes('rebalance')) answer = 'Rebalance view: use live prices from configured providers, keep core exposure in major assets, and avoid live execution until server env credentials are verified.';
  if (prompt.includes('risk')) answer = 'Risk view: crypto is volatile. Watch 24h change, volume, and position concentration before any SoDEX action.';
  if (prompt.includes('gas')) answer = 'Execution view: check chain, account, orderbook, and fee assumptions from server-side env before submitting an on-chain order.';
  if (prompt.includes('buy') || prompt.includes('sell') || prompt.includes('order')) answer = 'Order intent detected. The server will only submit if LIVE_TRADING=true and SoDEX order env variables are configured.';

  return ok({ ok: true, answer });
};
