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
function pct(n) {
  const num = Number(n || 0);
  if (!Number.isFinite(num)) return '0.00%';
  return (num >= 0 ? '+' : '') + num.toFixed(2) + '%';
}
async function fetchJson(url, options = {}, timeoutMs = 12000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    const text = await res.text();
    let data = {};
    try { data = text ? JSON.parse(text) : {}; } catch (_) { data = { raw: text }; }
    if (!res.ok) throw new Error(data.message || 'request failed');
    return data;
  } finally {
    clearTimeout(timer);
  }
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
    return `<tr><td><span class="coin">${escapeHtml(x.symbol)}</span><span class="sub">${escapeHtml(x.name)}</span></td><td>${money(x.price)}</td><td class="${cls}">${pct(x.change24h)}</td><td>$${compact(x.volume24h)}</td></tr>`;
  }).join('');
  $('marketRows').innerHTML = rows || '<tr><td colspan="4">No data available.</td></tr>';
}
function drawChart() {
  const canvas = $('chart');
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  const w = Math.max(rect.width, 320);
  const h = 240;
  canvas.width = w * dpr;
  canvas.height = h * dpr;
  canvas.style.height = h + 'px';
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, w, h);

  const rows = state.market.map(x => ({
    label: String(x.symbol || ''),
    price: Number(x.price || 0),
    change: Number(x.change24h || 0),
    volume: Number(x.volume24h || 0)
  })).filter(x => x.label);

  if (!rows.length) return;

  // Important fix: do NOT chart raw prices. BTC is much larger than ETH/SOL/LINK/ARB,
  // so the old line looked flat/weird. This chart shows 24h % change instead.
  const padL = 48, padR = 24, padT = 24, padB = 40;
  const chartW = w - padL - padR;
  const chartH = h - padT - padB;
  const values = rows.map(x => x.change);
  const minRaw = Math.min(...values, 0);
  const maxRaw = Math.max(...values, 0);
  const span = Math.max(Math.abs(minRaw), Math.abs(maxRaw), 1);
  const min = -span;
  const max = span;
  const yFor = (v) => padT + ((max - v) / (max - min)) * chartH;
  const zeroY = yFor(0);

  ctx.strokeStyle = 'rgba(148,163,184,.18)';
  ctx.lineWidth = 1;
  ctx.fillStyle = 'rgba(203,213,225,.72)';
  ctx.font = '11px Arial';
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';

  for (let i = 0; i <= 4; i++) {
    const val = max - (i * (max - min)) / 4;
    const y = yFor(val);
    ctx.beginPath(); ctx.moveTo(padL, y); ctx.lineTo(w - padR, y); ctx.stroke();
    ctx.fillText(val.toFixed(1) + '%', padL - 8, y);
  }

  ctx.strokeStyle = 'rgba(34,211,238,.55)';
  ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(padL, zeroY); ctx.lineTo(w - padR, zeroY); ctx.stroke();

  const gap = 16;
  const barW = Math.max(22, (chartW - gap * (rows.length - 1)) / rows.length);
  rows.forEach((item, i) => {
    const x = padL + i * (barW + gap);
    const y = yFor(item.change);
    const barTop = Math.min(y, zeroY);
    const barH = Math.max(Math.abs(zeroY - y), 3);

    const grad = ctx.createLinearGradient(0, barTop, 0, barTop + barH);
    if (item.change >= 0) {
      grad.addColorStop(0, 'rgba(52,211,153,.95)');
      grad.addColorStop(1, 'rgba(34,211,238,.35)');
    } else {
      grad.addColorStop(0, 'rgba(251,113,133,.95)');
      grad.addColorStop(1, 'rgba(251,113,133,.28)');
    }
    roundRect(ctx, x, barTop, barW, barH, 8);
    ctx.fillStyle = grad;
    ctx.fill();

    ctx.fillStyle = 'rgba(226,232,240,.95)';
    ctx.font = 'bold 11px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText(pct(item.change), x + barW / 2, barTop - 6);

    ctx.fillStyle = 'rgba(203,213,225,.82)';
    ctx.font = 'bold 12px Arial';
    ctx.textBaseline = 'top';
    ctx.fillText(item.label, x + barW / 2, h - padB + 14);
  });
}
function roundRect(ctx, x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
}
function escapeHtml(s) { return String(s || '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c])); }

function localAgentAnswer(promptText) {
  const p = String(promptText || '').toLowerCase();
  const items = state.market || [];
  const avg = items.length ? items.reduce((s, x) => s + Number(x.change24h || 0), 0) / items.length : 0;
  const worst = [...items].sort((a, b) => Number(a.change24h || 0) - Number(b.change24h || 0))[0];
  const best = [...items].sort((a, b) => Number(b.volume24h || 0) - Number(a.volume24h || 0))[0];
  if (p.includes('xin chào') || p.includes('hello') || p.includes('hi')) {
    return 'Hello! I am SoDEX Agent. You can ask about risk, rebalance, market signals, gas fees, or orderbook checks.';
  }
  if (p.includes('rebalance') || p.includes('portfolio') || p.includes('risk')) {
    return `Risk summary: average 24h change is ${avg.toFixed(2)}%. ${worst ? worst.symbol + ' is the weakest tracked asset at ' + pct(worst.change24h) + '. ' : ''}A safer rebalance keeps BTC/ETH as core exposure, limits smaller tokens, and checks SoDEX orderbook before execution.`;
  }
  if (p.includes('gas') || p.includes('fee')) {
    return 'Execution note: check network, account, orderbook depth, and fees before submitting any action. LIVE_TRADING should stay false during verification.';
  }
  if (p.includes('buy') || p.includes('sell') || p.includes('order')) {
    return 'Order intent detected. I can prepare a protected order check, but live execution only works when LIVE_TRADING=true and SoDEX signing ENV is correctly configured.';
  }
  if (p.includes('signal') || p.includes('market')) {
    return `Market signal: ${items.length} assets loaded from live providers. ${best ? best.symbol + ' has the largest tracked volume at $' + compact(best.volume24h) + '. ' : ''}Use 24h change and volume together, not only price.`;
  }
  return 'I can answer questions about market data, risk, rebalance, gas fees, trading signals, and SoDEX execution. Try: “Analyze portfolio risk and suggest a safe rebalance.”';
}
async function askAgent() {
  const btn = $('askBtn');
  const userPrompt = $('prompt').value.trim();
  $('agentAnswer').textContent = 'Thinking...';
  btn.disabled = true;
  try {
    const data = await fetchJson('/api/agent', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt: userPrompt, market: state.market }) }, 10000);
    $('agentAnswer').textContent = data.answer || localAgentAnswer(userPrompt);
  } catch (_) {
    // Client-side fallback, so the button always answers even if the function route is delayed.
    $('agentAnswer').textContent = localAgentAnswer(userPrompt);
  } finally {
    btn.disabled = false;
  }
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

document.addEventListener('DOMContentLoaded', () => {
  $('refreshBtn').addEventListener('click', loadMarket);
  $('askBtn').addEventListener('click', askAgent);
  $('verifyBtn').addEventListener('click', verifyOrder);
  $('healthBtn').addEventListener('click', checkHealth);
  window.addEventListener('resize', drawChart);
  loadMarket();
  checkHealth();
});
