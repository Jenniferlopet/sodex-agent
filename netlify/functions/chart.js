const { ok, safeFetchJson, env, unwrapArray, toNumber } = require('./_utils');

function envName(){ return env('SODEX_ENV','testnet'); }
function baseUrl(){ if(env('SODEX_API_BASE_URL')) return env('SODEX_API_BASE_URL').replace(/\/$/,''); return envName()==='mainnet'?'https://api.sodex.com':'https://api-testnet.sodex.com'; }
function headers(){ const key=env('SODEX_API_KEY_NAME')||env('SODEX_API_KEY'); const h={accept:'application/json'}; if(key) h[env('SODEX_API_HEADER_NAME','X-API-Key')]=key; return h; }
function intervalFor(range){ if(range==='1D') return { binance:'1h', sodex:'1h', limit:30 }; if(range==='1W') return {binance:'4h',sodex:'4h',limit:48}; if(range==='1M') return {binance:'1d',sodex:'1d',limit:32}; if(range==='3M') return {binance:'1d',sodex:'1d',limit:96}; return {binance:'1w',sodex:'1w',limit:60}; }
function clean(sym){ return String(sym||'BTC').toUpperCase().replace(/^V/,'').replace(/[^A-Z0-9]/g,'').replace(/USDT$/,'').replace(/USDC$/,'') || 'BTC'; }
function normalizeKlineRows(payload){
  const arr=unwrapArray(payload);
  return arr.map((x)=>{
    if(Array.isArray(x)) return { t:Number(x[0]), open:toNumber(x[1]), high:toNumber(x[2]), low:toNumber(x[3]), close:toNumber(x[4]), volume:toNumber(x[5]) };
    return { t:toNumber(x.t||x.time||x.timestamp||x.openTime||x.startTime||Date.now()), open:toNumber(x.open||x.o), high:toNumber(x.high||x.h), low:toNumber(x.low||x.l), close:toNumber(x.close||x.c||x.price), volume:toNumber(x.volume||x.v||x.vol) };
  }).filter(x=>x.close>0).sort((a,b)=>a.t-b.t);
}
async function fromSodex(raw, range){
  const cfg=intervalFor(range); const template=env('SODEX_KLINES_PATH','/markets/{symbol}/klines');
  const paths=[template.replace('{symbol}', encodeURIComponent(raw)), template.replace('{symbol}', encodeURIComponent(raw)).replace('{interval}', cfg.sodex), `/markets/${encodeURIComponent(raw)}/klines`];
  for(const p0 of [...new Set(paths)]){
    const join=p0.includes('?')?'&':'?'; const url=`${baseUrl()}${p0}${join}interval=${encodeURIComponent(cfg.sodex)}&limit=${cfg.limit}`;
    try{ const payload=await safeFetchJson(url,{headers:headers()}); const rows=normalizeKlineRows(payload); if(rows.length>2) return rows; }catch(_){}
  }
  throw new Error('sodex chart unavailable');
}
async function fromBinance(symbol, range){
  const cfg=intervalFor(range); const s=clean(symbol); const pair=s.endsWith('USDT')?s:`${s}USDT`;
  const payload=await safeFetchJson(`https://api.binance.com/api/v3/klines?symbol=${encodeURIComponent(pair)}&interval=${cfg.binance}&limit=${cfg.limit}`);
  const rows=normalizeKlineRows(payload); if(!rows.length) throw new Error('binance chart unavailable'); return rows;
}
exports.handler=async(event)=>{
  if(event.httpMethod==='OPTIONS') return ok({ok:true});
  const qs=new URLSearchParams(event.rawQuery||'');
  const symbol=clean(qs.get('symbol')||env('DEFAULT_FOCUS_SYMBOL','BTC'));
  const raw=qs.get('raw')||qs.get('symbol')||symbol;
  const range=(qs.get('range')||'1D').toUpperCase();
  const providers=[()=>fromSodex(raw,range),()=>fromBinance(symbol,range)];
  for(const fn of providers){
    try{ const rows=await fn(); return ok({ok:true,provider:'live',symbol,range,data:rows}); }catch(_){}
  }
  return ok({ok:false,provider:'protected',symbol,range,data:[]});
};
