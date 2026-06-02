const { ok } = require('./_utils');
exports.handler = async () => ok({ ok: true, service: 'sodex-agent-fresh', mode: process.env.LIVE_TRADING === 'true' ? 'live' : 'protected', env: process.env.SODEX_ENV || 'testnet', ts: new Date().toISOString() });
