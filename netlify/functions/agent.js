const { ok } = require('./_utils');

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return ok({ ok: true });
  let body = {};
  try { body = JSON.parse(event.body || '{}'); } catch (_) {}
  const prompt = String(body.prompt || '').toLowerCase();
  let answer = 'Agent ready. I can analyze risk, rebalance ideas, market signals, gas cost awareness, and SoDEX execution safety.';
  if (prompt.includes('rebalance')) answer = 'Rebalance idea: keep BTC/ETH as core exposure, reduce over-concentration in small caps, and only prepare orders while LIVE_TRADING is disabled for verification.';
  if (prompt.includes('risk')) answer = 'Risk view: crypto portfolios are volatile. Use position sizing, stablecoin buffers, and avoid executing live trades until API credentials and account settings are confirmed.';
  if (prompt.includes('gas')) answer = 'Gas view: always estimate network cost before execution. Provider/API failures are hidden from UI and replaced with protected fallback responses.';
  if (prompt.includes('buy') || prompt.includes('sell') || prompt.includes('order') || prompt.includes('trade')) answer = 'Trading action detected. This console can verify the order flow, but live execution stays blocked unless LIVE_TRADING=true is set server-side.';
  return ok({ ok: true, answer });
};
