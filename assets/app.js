const state = { market: [] };
const $ = (id) => document.getElementById(id);

function compact(n) {
  const num = Number(n || 0);
  if (!Number.isFinite(num)) return '0';
  return Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 2 }).format(num);
}
function money(n) {
  const num = Number(n || 0);
  if (!Number.isFinite(num)) return '$0';
  return '$' + Intl.NumberFormat('en', { maximumFractionDigits: num > 1000 ? 0 : 4 }).format(num);
}
async function fetchJson(url, options) {
  const res = await fetch(url, options);
  if (!res.ok) throw new Error('request failed');
  return res.json();
}
async function loadMarket() {
  $('marketStatus').textContent = 'loading';
  try {
    const data = await fetchJson('/api/market/overview', { cache: 'no-store' });
    state.market = Array.isArray(data.data) ? data.data : [];
    $('marketStatus').textContent = data.ok ? 'live env' : 'unavailable';
  } catch (_) {
    state.market = [];
    $('marketStatus').textContent = 'unavailable';
  }
  renderStats();
  renderTable();
  drawChart();
}
function renderStats() {
  const items = state.market;
  $('assetCount').textContent = String(items.length);
  const avg = items.length ? items.reduce((s, x) => s + Number(x.change24h || 0), 0) / items.length : 0;
  const vol = items.reduce((s, x) => s + Number(x.volume24h || 0), 0);
  $('avgChange').textContent = avg.toFixed(2) + '%';
  $('avgChange').className = avg >= 0 ? 'green' : 'red';
  $('totalVolume').textContent = '$' + compact(vol);
}
function renderTable() {
  const rows = state.market.map((x) => {
    const cls = Number(x.change24h || 0) >= 0 ? 'green' : 'red';
    return `<tr><td><span class="coin">${escapeHtml(x.symbol)}</span><span class="sub">${escapeHtml(x.name)}</span></td><td>${money(x.price)}</td><td class="${cls}">${Number(x.change24h || 0).toFixed(2)}%</td><td>$${compact(x.volume24h)}</td></tr>`;
  }).join('');
  $('marketRows').innerHTML = rows || '<tr><td colspan="4">No data available.</td></tr>';
}
function drawChart() {
  const canvas = $('chart');
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * dpr;
  canvas.height = 220 * dpr;
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, rect.width, 220);
  const data = state.market.map(x => Number(x.price || 0));
  const labels = state.market.map(x => x.symbol || '');
  if (!data.length) return;
  const pad = 28;
  const w = rect.width;
  const h = 220;
  const max = Math.max(...data) || 1;
  const min = Math.min(...data);
  const range = Math.max(max - min, 1);
  ctx.strokeStyle = 'rgba(148,163,184,.22)';
  ctx.lineWidth = 1;
  for (let i = 0; i < 4; i++) {
    const y = pad + (i * (h - pad * 2)) / 3;
    ctx.beginPath(); ctx.moveTo(pad, y); ctx.lineTo(w - pad, y); ctx.stroke();
  }
  const points = data.map((v, i) => {
    const x = pad + (i * (w - pad * 2)) / Math.max(data.length - 1, 1);
    const y = h - pad - ((v - min) / range) * (h - pad * 2);
    return { x, y, v };
  });
  const grad = ctx.createLinearGradient(0, pad, 0, h - pad);
  grad.addColorStop(0, 'rgba(34,211,238,.35)');
  grad.addColorStop(1, 'rgba(34,211,238,0)');
  ctx.beginPath();
  points.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y));
  ctx.lineTo(points[points.length - 1].x, h - pad); ctx.lineTo(points[0].x, h - pad); ctx.closePath();
  ctx.fillStyle = grad; ctx.fill();
  ctx.beginPath();
  points.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y));
  ctx.strokeStyle = '#22d3ee'; ctx.lineWidth = 3; ctx.stroke();
  ctx.fillStyle = '#cbd5e1'; ctx.font = '12px Arial'; ctx.textAlign = 'center';
  points.forEach((p, i) => { ctx.beginPath(); ctx.arc(p.x, p.y, 4, 0, Math.PI * 2); ctx.fillStyle = '#22d3ee'; ctx.fill(); ctx.fillStyle = '#cbd5e1'; ctx.fillText(labels[i], p.x, h - 6); });
}
function escapeHtml(s) { return String(s || '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c])); }
async function askAgent() {
  $('agentAnswer').textContent = 'Thinking...';
  try {
    const data = await fetchJson('/api/agent', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt: $('prompt').value }) });
    $('agentAnswer').textContent = data.answer || 'No response.';
  } catch (_) { $('agentAnswer').textContent = 'Agent unavailable. Fallback UI remains active.'; }
}
async function verifyOrder() {
  $('orderStatus').textContent = 'Checking server env order layer...';
  try {
    const data = await fetchJson('/api/sodex/order', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ symbol: 'BTC-USDC', side: 'buy', type: 'market', amount: '0.01' }) });
    $('orderStatus').textContent = data.message || 'Order verified.';
  } catch (_) { $('orderStatus').textContent = 'Execution layer unavailable.'; }
}
async function checkHealth() {
  $('healthBox').textContent = 'checking...';
  try { const data = await fetchJson('/api/health', { cache: 'no-store' }); $('healthBox').textContent = JSON.stringify(data, null, 2); }
  catch (_) { $('healthBox').textContent = 'health check unavailable'; }
}
$('refreshBtn').addEventListener('click', loadMarket);
$('askBtn').addEventListener('click', askAgent);
$('verifyBtn').addEventListener('click', verifyOrder);
$('healthBtn').addEventListener('click', checkHealth);
window.addEventListener('resize', drawChart);
loadMarket();
checkHealth();
