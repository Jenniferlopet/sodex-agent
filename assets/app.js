const state = { market: [], meta: {}, filtered: [] };
const $ = (id) => document.getElementById(id);
function compact(n) { const num = Number(n || 0); if (!Number.isFinite(num)) return '0'; return Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 2 }).format(num); }
function money(n) { const num = Number(n || 0); if (!Number.isFinite(num)) return '$0'; return '$' + Intl.NumberFormat('en', { maximumFractionDigits: num > 1000 ? 0 : 5 }).format(num); }
function pct(n) { const num = Number(n || 0); if (!Number.isFinite(num)) return '0.00%'; return (num >= 0 ? '+' : '') + num.toFixed(2) + '%'; }
function escapeHtml(s) { return String(s || '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c])); }
async function fetchJson(url, options = {}, timeoutMs = 14000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    const text = await res.text();
    let data = {}; try { data = text ? JSON.parse(text) : {}; } catch (_) { data = { raw: text }; }
    if (!res.ok) throw new Error(data.message || 'request failed');
    return data;
  } finally { clearTimeout(timer); }
}
async function loadMarket() {
  $('marketStatus').textContent = 'loading';
  try {
    const data = await fetchJson('/api/market/overview', { cache: 'no-store' });
    state.market = Array.isArray(data.data) ? data.data : [];
    state.meta = { primary: data.primary, universe: data.universe, totalAssets: data.totalAssets || state.market.length, chartLimit: data.chartLimit || 28, tableLimit: data.tableLimit || 120 };
    $('marketStatus').textContent = data.ok ? `${data.universe || 'live'} universe` : 'unavailable';
  } catch (_) {
    state.market = []; state.meta = {}; $('marketStatus').textContent = 'unavailable';
  }
  renderAll();
}
function renderAll(){ renderStats(); applyFilters(); drawChart(); }
function renderStats() {
  const items = state.market;
  const avg = items.length ? items.reduce((s, x) => s + Number(x.change24h || 0), 0) / items.length : 0;
  const vol = items.reduce((s, x) => s + Number(x.volume24h || 0), 0);
  $('assetCount').textContent = String(state.meta.totalAssets || items.length || 0);
  $('universeLabel').textContent = `${state.meta.primary || 'Live'} • ${state.meta.universe || 'protected'}`;
  $('avgChange').textContent = pct(avg);
  $('avgChange').className = avg >= 0 ? 'green' : 'red';
  $('totalVolume').textContent = '$' + compact(vol);
  if (items[0]?.rawSymbol) $('orderPair').textContent = items[0].rawSymbol;
}
function applyFilters(){
  const q = ($('searchBox')?.value || '').toLowerCase().trim();
  const sort = $('sortBox')?.value || 'volume';
  let rows = [...state.market];
  if (q) rows = rows.filter(x => String(x.symbol + ' ' + x.name + ' ' + x.rawSymbol).toLowerCase().includes(q));
  if (sort === 'changeDesc') rows.sort((a,b)=>Number(b.change24h||0)-Number(a.change24h||0));
  else if (sort === 'changeAsc') rows.sort((a,b)=>Number(a.change24h||0)-Number(b.change24h||0));
  else if (sort === 'price') rows.sort((a,b)=>Number(b.price||0)-Number(a.price||0));
  else rows.sort((a,b)=>Number(b.volume24h||0)-Number(a.volume24h||0));
  state.filtered = rows;
  renderTable(rows.slice(0, Number(state.meta.tableLimit || 120)));
}
function renderTable(rows) {
  $('marketRows').innerHTML = rows.map((x, i) => {
    const cls = Number(x.change24h || 0) >= 0 ? 'green' : 'red';
    return `<tr><td class="rank">${i+1}</td><td><span class="coin">${escapeHtml(x.symbol)}</span><span class="sub">${escapeHtml(x.rawSymbol || x.name)}</span></td><td>${money(x.price)}</td><td class="${cls}">${pct(x.change24h)}</td><td>$${compact(x.volume24h)}</td></tr>`;
  }).join('') || '<tr><td colspan="5">No data available.</td></tr>';
}
function drawChart() {
  const canvas = $('chart'); const ctx = canvas.getContext('2d'); const dpr = window.devicePixelRatio || 1;
  const chartLimit = Math.min(Number(state.meta.chartLimit || 60), 200);
  const rows = [...state.market].sort((a,b)=>Number(b.volume24h||0)-Number(a.volume24h||0)).slice(0, chartLimit);
  const containerW = canvas.parentElement?.clientWidth || 700;
  const w = Math.max(containerW, 980, rows.length * 50);
  const h = 320; canvas.width = w * dpr; canvas.height = h * dpr; canvas.style.width = w + 'px'; canvas.style.height = h + 'px';
  ctx.setTransform(dpr,0,0,dpr,0,0); ctx.clearRect(0,0,w,h);
  if (!rows.length) { $('chartNote').textContent = 'No live market data available yet.'; return; }
  $('chartNote').textContent = `Showing top ${rows.length} liquid assets by 24h volume. Bars show 24h % change, not raw price.`;
  const padL = 58, padR = 30, padT = 26, padB = 64;
  const vals = rows.map(x => Number(x.change24h || 0));
  const absMax = Math.max(4, ...vals.map(v => Math.abs(v)));
  const max = absMax, min = -absMax;
  const chartH = h - padT - padB, chartW = w - padL - padR;
  const zeroY = padT + (max / (max - min)) * chartH;
  const yFor = (v) => padT + ((max - v) / (max - min)) * chartH;
  ctx.strokeStyle='rgba(148,163,184,.16)'; ctx.fillStyle='rgba(203,213,225,.82)'; ctx.font='11px Arial'; ctx.textAlign='right'; ctx.textBaseline='middle';
  for(let i=0;i<=4;i++){ const val=max-(i*(max-min))/4; const y=yFor(val); ctx.beginPath(); ctx.moveTo(padL,y); ctx.lineTo(w-padR,y); ctx.stroke(); ctx.fillText(val.toFixed(1)+'%', padL-8, y); }
  ctx.strokeStyle='rgba(34,211,238,.55)'; ctx.beginPath(); ctx.moveTo(padL,zeroY); ctx.lineTo(w-padR,zeroY); ctx.stroke();
  const gap=12; const barW=Math.max(24,(chartW-gap*(rows.length-1))/rows.length);
  rows.forEach((item,i)=>{ const x=padL+i*(barW+gap); const val=Number(item.change24h||0); const y=yFor(val); const barTop=Math.min(y,zeroY); const barH=Math.max(Math.abs(zeroY-y),3); const grad=ctx.createLinearGradient(0,barTop,0,barTop+barH); if(val>=0){grad.addColorStop(0,'rgba(52,211,153,.95)');grad.addColorStop(1,'rgba(34,211,238,.35)');} else {grad.addColorStop(0,'rgba(251,113,133,.95)');grad.addColorStop(1,'rgba(251,113,133,.28)');} roundRect(ctx,x,barTop,barW,barH,7); ctx.fillStyle=grad; ctx.fill(); ctx.fillStyle='rgba(226,232,240,.95)'; ctx.font='bold 10px Arial'; ctx.textAlign='center'; ctx.textBaseline=val>=0?'bottom':'top'; ctx.fillText(pct(val), x+barW/2, val>=0?barTop-5:barTop+barH+5); ctx.save(); ctx.translate(x+barW/2,h-padB+18); ctx.rotate(-Math.PI/5); ctx.fillStyle='rgba(203,213,225,.85)'; ctx.font='bold 11px Arial'; ctx.textAlign='right'; ctx.textBaseline='middle'; ctx.fillText(String(item.symbol).slice(0,10),0,0); ctx.restore(); });
}
function roundRect(ctx,x,y,width,height,radius){const r=Math.min(radius,width/2,height/2);ctx.beginPath();ctx.moveTo(x+r,y);ctx.arcTo(x+width,y,x+width,y+height,r);ctx.arcTo(x+width,y+height,x,y+height,r);ctx.arcTo(x,y+height,x,y,r);ctx.arcTo(x,y,x+width,y,r);ctx.closePath();}
function localProAnswer(promptText){
  const items=state.market||[]; const avg=items.length?items.reduce((s,x)=>s+Number(x.change24h||0),0)/items.length:0; const top=[...items].sort((a,b)=>Number(b.volume24h||0)-Number(a.volume24h||0))[0]; const gain=[...items].sort((a,b)=>Number(b.change24h||0)-Number(a.change24h||0))[0]; const loss=[...items].sort((a,b)=>Number(a.change24h||0)-Number(b.change24h||0))[0];
  const p=String(promptText||'').toLowerCase(); const tone=avg<-2?'defensive':avg>2?'momentum-positive':'selective and risk-controlled';
  if(p.includes('buy')||p.includes('sell')||p.includes('mua')||p.includes('bán')||p.includes('trade')||p.includes('order')) return `Execution intent detected. I would treat this as a protected pre-trade review, not an automatic trade.\nMarket tone is ${tone}, with average 24h change at ${pct(avg)} across ${items.length} loaded assets.\n${top?`Liquidity anchor: ${top.symbol} has about $${compact(top.volume24h)} in 24h volume.`:''}\nRecommended flow: check spread, depth, slippage, account balance, nonce/signature, then only enable live execution after the order format is verified server-side.\nProtected Mode is the correct setting for demo and verification.`;
  return `Premium market brief: the loaded universe contains ${items.length} assets and currently looks ${tone}, with average 24h change at ${pct(avg)}.\n${top?`Liquidity anchor: ${top.symbol} leads by volume at about $${compact(top.volume24h)}.`:''}\n${gain?`Momentum leader: ${gain.symbol} at ${pct(gain.change24h)}.`:''}\n${loss?`Main risk drag: ${loss.symbol} at ${pct(loss.change24h)}.`:''}\nSafe rebalance approach: keep exposure concentrated in deeper/liquid pairs, reduce weak high-volatility names, and verify orderbook depth before any SoDEX execution.`;
}
async function askAgent(){ const btn=$('askBtn'); const userPrompt=$('prompt').value.trim(); $('agentAnswer').textContent='Analyzing live market universe...'; btn.disabled=true; try{ const data=await fetchJson('/api/agent',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({prompt:userPrompt,market:state.market,meta:state.meta})},14000); $('agentAnswer').textContent=data.answer||localProAnswer(userPrompt);}catch(_){$('agentAnswer').textContent=localProAnswer(userPrompt);}finally{btn.disabled=false;} }
async function verifyOrder(){ $('orderStatus').textContent='Checking protected execution layer...'; try{ const symbol=state.market[0]?.rawSymbol||'vBTC_vUSDC'; const data=await fetchJson('/api/sodex/order',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({symbol,side:'buy',type:'market',amount:'0.01'})}); $('orderStatus').textContent=data.message||'Protected order verified.';}catch(_){$('orderStatus').textContent='Execution layer unavailable.';} }
async function checkHealth(){ $('healthBox').textContent='checking...'; try{ const data=await fetchJson('/api/health',{cache:'no-store'}); $('healthBox').textContent=JSON.stringify(data,null,2); $('mode').textContent=data.mode==='live'?'Live':'Protected'; }catch(_){$('healthBox').textContent='health check unavailable';} }
document.addEventListener('DOMContentLoaded',()=>{ $('refreshBtn').addEventListener('click',loadMarket); $('askBtn').addEventListener('click',askAgent); $('verifyBtn').addEventListener('click',verifyOrder); $('healthBtn').addEventListener('click',checkHealth); $('searchBox').addEventListener('input',applyFilters); $('sortBox').addEventListener('change',applyFilters); window.addEventListener('resize',drawChart); loadMarket(); checkHealth(); });
