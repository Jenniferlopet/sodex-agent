const { ok, env } = require('./_utils');
exports.handler = async () => ok({
  ok: true,
  service: 'sodex-agent-pro-final',
  mode: env('LIVE_TRADING', 'false') === 'true' ? 'live' : 'protected',
  env: env('SODEX_ENV', 'testnet'),
  universe: 'sodex-first',
  ts: new Date().toISOString()
});
