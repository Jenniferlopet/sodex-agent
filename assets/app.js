const state = { market: [] };
const $ = (id) => document.getElementById(id);
const compact = (n) => Number.isFinite(Number(n)) ? new Intl.NumberFormat('en', { notation:'compact', maximumFractionDigits:2 }).format(Number(n)) : '0';
const money = (n) => Number.isFinite(Number(n)) ? new Intl.NumberFormat('en', { maximumFractionDigits: Number(n)>1000 ? 0 : 4 }).format(Number(n)) : '0';

async function api(path, options = {}) {
  const res = await fetch(path, { cache:'no-store', ...options });
  if (!res.ok) throw new Error('Request failed');
  return res.json();
}

async function loadMarket() {
  $('assetRows').innerHTML = '<tr><td colspan="4">Loading market data...</td></tr>';
  try {
    const data = await api('/api/market/overview');
    state.market = Array.isArray(data.data) ? data.data : [];
  } catch {
    state.market = [];
  }
  renderMarket();
}

function renderMarket() {
  const market = state.market;
  $('assetCount').textContent = String(market.length);
  const avg = market.length ? market.reduce((s,x)=>s+Number(x.change24h||0),0)/market.length : 0;
  const vol = market.reduce((s,x)=>s+Number(x.volume24h||0),0);
  $('avgChange').textContent = `${avg.toFixed(2)}%`;
  $('volume').textContent = `$${compact(vol)}`;
  $('assetRows').innerHTML = market.length ? market.map(item => `
    <tr>
      <td><span class="asset-name">${escapeHtml(item.symbol)}</span><span class="sub">${escapeHtml(item.name)}</span></td>
      <td>$${money(item.price)}</td>
      <td class="${Number(item.change24h)>=0?'up':'down'}">${Number(item.change24h||0).toFixed(2)}%</td>
      <td>$${compact(item.volume24h)}</td>
    </tr>`).join('') : '<tr><td colspan="4">Market provider unavailable. Protected fallback returned no assets.</td></tr>';
  drawChart(market);
}

function drawChart(market) {
  const canvas = $('marketChart');
  const ctx = canvas.getContext('2d');
  const w = canvas.width, h = canvas.height;
  ctx.clearRect(0,0,w,h);
  ctx.fillStyle = 'rgba(2,6,23,.25)';
  ctx.fillRect(0,0,w,h);
  for (let i=0;i<5;i++) {
    ctx.strokeStyle = 'rgba(148,163,184,.12)';
    ctx.beginPath(); ctx.moveTo(48, 24+i*(h-70)/4); ctx.lineTo(w-18, 24+i*(h-70)/4); ctx.stroke();
  }
  if (!market.length) return;
  const vals = market.map(x=>Number(x.price||0));
  const max = Math.max(...vals,1), min = Math.min(...vals,0);
  const range = Math.max(max-min,1);
  const pts = vals.map((v,i)=>({x:60 + i*((w-110)/Math.max(vals.length-1,1)), y: 24 + (max-v)/range*(h-78)}));
  const grad = ctx.createLinearGradient(0,20,0,h-40); grad.addColorStop(0,'rgba(34,211,238,.34)'); grad.addColorStop(1,'rgba(34,211,238,0)');
  ctx.beginPath(); pts.forEach((p,i)=> i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y)); ctx.lineTo(pts[pts.length-1].x,h-38); ctx.lineTo(pts[0].x,h-38); ctx.closePath(); ctx.fillStyle=grad; ctx.fill();
  ctx.beginPath(); pts.forEach((p,i)=> i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y)); ctx.strokeStyle='#22d3ee'; ctx.lineWidth=3; ctx.stroke();
  pts.forEach((p,i)=>{ ctx.fillStyle='#22d3ee'; ctx.beginPath(); ctx.arc(p.x,p.y,5,0,Math.PI*2); ctx.fill(); ctx.fillStyle='#94a3b8'; ctx.font='13px Arial'; ctx.textAlign='center'; ctx.fillText(market[i].symbol,p.x,h-14); });
}

async function askAgent() {
  const box = $('answer'); box.classList.remove('hidden'); box.textContent = 'Thinking...';
  try {
    const data = await api('/api/agent', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({prompt:$('prompt').value}) });
    box.textContent = data.answer || 'No response.';
  } catch { box.textContent = 'Agent is temporarily unavailable.'; }
}

async function verifyOrder() {
  const box = $('orderStatus'); box.classList.remove('hidden'); box.textContent = 'Preparing order...';
  try {
    const data = await api('/api/sodex/order', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({symbol:'BTC-USDC', side:'buy', type:'market', amount:'0.01'}) });
    box.textContent = data.message || 'Order verified.';
  } catch { box.textContent = 'Order module unavailable.'; }
}

function escapeHtml(str) { return String(str || '').replace(/[&<>"]/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[s])); }

$('refreshBtn').addEventListener('click', loadMarket);
$('askBtn').addEventListener('click', askAgent);
$('orderBtn').addEventListener('click', verifyOrder);
loadMarket();
