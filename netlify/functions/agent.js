const { ok } = require('./_shared');

exports.handler = async function(event) {
  let body = {};
  try { body = JSON.parse(event.body || '{}'); } catch {}
  const prompt = String(body.prompt || '').toLowerCase();
  let answer = 'I can analyze crypto market data, explain portfolio risk, and prepare safe trading actions.';
  if (prompt.includes('rebalance')) answer = 'Suggested rebalance: keep large-cap exposure high, reduce concentration risk, and avoid live execution until wallet and SoDEX credentials are verified.';
  if (prompt.includes('risk')) answer = 'Current risk view: crypto assets are volatile. A safer allocation keeps BTC/ETH as core positions and limits smaller tokens.';
  if (prompt.includes('gas')) answer = 'Gas and execution cost should be checked before every on-chain action. Provider failures stay hidden and fallback data is used silently.';
  if (prompt.includes('buy') || prompt.includes('sell') || prompt.includes('order')) answer = 'Trading request detected. Live execution is disabled unless LIVE_TRADING=true and SoDEX credentials are configured server-side.';
  return ok({ ok:true, answer });
};
