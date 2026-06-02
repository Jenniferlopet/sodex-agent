const { ok } = require('./_shared');
exports.handler = async function() { return ok({ ok:true, service:'sodex-agent-console', ts:Date.now() }); };
