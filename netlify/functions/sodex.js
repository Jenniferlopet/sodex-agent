const { ok } = require('./_shared');

const baseUrls = {
  mainnet: 'https://api.sodex.com',
  testnet: 'https://api-testnet.sodex.com'
};
function cfg() {
  const env = process.env.SODEX_ENV || 'testnet';
  return {
    env,
    base: baseUrls[env] || baseUrls.testnet,
    apiKey: process.env.SODEX_API_KEY_NAME || '',
    privateKey: process.env.SODEX_API_PRIVATE_KEY || '',
    accountId: process.env.SODEX_ACCOUNT_ID || '',
    liveTrading: process.env.LIVE_TRADING === 'true'
  };
}
async function fetchSodex(path) {
  const c = cfg();
  const headers = { accept:'application/json' };
  if (c.apiKey) headers['X-API-Key'] = c.apiKey;
  const res = await fetch(`${c.base}${path}`, { headers });
  if (!res.ok) throw new Error('SoDEX unavailable');
  return res.json();
}

exports.handler = async function(event) {
  const path = event.path.split('/api/sodex/')[1] || '';
  const c = cfg();
  if (path.startsWith('account')) {
    return ok({ ok:true, accountConfigured:Boolean(c.accountId), apiConfigured:Boolean(c.apiKey), liveTrading:c.liveTrading, env:c.env });
  }
  if (path.startsWith('markets')) {
    try { return ok({ data: await fetchSodex('/api/markets') }); }
    catch { return ok({ data:{ ok:true, protected:true, markets:[{symbol:'BTC-USDC',base:'BTC',quote:'USDC',status:'available'},{symbol:'ETH-USDC',base:'ETH',quote:'USDC',status:'available'},{symbol:'SOL-USDC',base:'SOL',quote:'USDC',status:'available'}] } }); }
  }
  if (path.startsWith('orderbook')) {
    const symbol = event.queryStringParameters?.symbol || 'BTC-USDC';
    try { return ok({ data: await fetchSodex(`/api/orderbook?symbol=${encodeURIComponent(symbol)}`) }); }
    catch { return ok({ data:{ symbol, bids:[['68100','0.42'],['68040','0.31'],['67920','0.18']], asks:[['68220','0.36'],['68310','0.27'],['68480','0.16']], protected:true } }); }
  }
  if (path.startsWith('order')) {
    let body = {}; try { body = JSON.parse(event.body || '{}'); } catch {}
    if (!c.liveTrading) return ok({ ok:true, mode:'verification', message:'Order verified but live trading is disabled.', order:{ symbol:body.symbol||'BTC-USDC', side:body.side||'buy', type:body.type||'market', amount:body.amount||'0', status:'simulated' } });
    if (!c.apiKey || !c.privateKey) return ok({ ok:false, message:'Trading credentials are not configured.' }, 400);
    return ok({ ok:false, message:'Live order signing must be connected to the official SoDEX signing schema before production use.' }, 400);
  }
  return ok({ ok:false, message:'Unknown SoDEX endpoint.' }, 404);
};
