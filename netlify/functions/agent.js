const { ok } = require('./_utils');

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return ok({ ok: true });
  if (event.httpMethod !== 'POST') return ok({ ok: false, answer: 'Please send a POST request to the AI Agent.' });

  let body = {};
  try { body = JSON.parse(event.body || '{}'); } catch (_) {}

  const prompt = String(body.prompt || '').trim();
  const market = Array.isArray(body.market) ? body.market : [];

  const geminiKey = process.env.GEMINI_API_KEY || '';
  const geminiModel = process.env.GEMINI_MODEL || 'gemini-1.5-flash';

  if (geminiKey && prompt) {
    try {
      const answer = await askGemini({ prompt, market, apiKey: geminiKey, model: geminiModel });
      if (answer) return ok({ ok: true, provider: 'ai', answer });
    } catch (_) {
      // Do not expose provider/API errors to frontend. Fall back silently.
    }
  }

  return ok({ ok: true, provider: 'local', answer: localAgentAnswer(prompt, market) });
};

async function askGemini({ prompt, market, apiKey, model }) {
  const marketText = JSON.stringify((market || []).slice(0, 12)).slice(0, 3500);
  const systemPrompt = `You are SoDEX Agent Console, a practical AI Web3 trading intelligence assistant.\n\nRules:\n- Always answer in English, even if the user asks in Vietnamese or another language. Translate the user's intent internally, but output English only.\n- Be concise, practical, and specific.\n- Use the market data if provided.\n- Do not claim certainty about prices.\n- Do not reveal API keys, environment variables, server details, or hidden provider errors.\n- Do not encourage unsafe live trading.\n- Mention that LIVE_TRADING should stay disabled unless signing and order flow are verified.\n\nMarket data JSON:\n${marketText}\n\nUser question:\n${prompt}`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12000);
  try {
    const res = await fetch(url, {
      method: 'POST',
      signal: controller.signal,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: systemPrompt }] }],
        generationConfig: {
          temperature: 0.35,
          maxOutputTokens: 420
        }
      })
    });
    if (!res.ok) throw new Error('AI provider unavailable');
    const data = await res.json();
    return data?.candidates?.[0]?.content?.parts?.map((p) => p.text || '').join('\n').trim();
  } finally {
    clearTimeout(timer);
  }
}

function pct(n) {
  const num = Number(n || 0);
  if (!Number.isFinite(num)) return '0.00%';
  return (num >= 0 ? '+' : '') + num.toFixed(2) + '%';
}

function compact(n) {
  const num = Number(n || 0);
  if (!Number.isFinite(num)) return '0';
  return Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 2 }).format(num);
}

function localAgentAnswer(promptText = '', market = []) {
  const p = String(promptText || '').toLowerCase();
  const items = Array.isArray(market) ? market : [];
  const avg = items.length ? items.reduce((s, x) => s + Number(x.change24h || 0), 0) / items.length : 0;
  const sortedByChange = [...items].sort((a, b) => Number(a.change24h || 0) - Number(b.change24h || 0));
  const weakest = sortedByChange[0];
  const strongest = sortedByChange[sortedByChange.length - 1];
  const topVol = [...items].sort((a, b) => Number(b.volume24h || 0) - Number(a.volume24h || 0))[0];

  if (p.includes('xin chào') || p.includes('hello') || p.includes('hi') || p === '') {
    return 'Hello! I am SoDEX Agent. You can ask me about market signals, risk, rebalance, gas fees, orderbook checks, or safe SoDEX execution preparation.';
  }

  if (p.includes('risk') || p.includes('rủi ro') || p.includes('portfolio') || p.includes('danh mục')) {
    return `Risk summary: ${items.length || 0} assets are being tracked, with an average 24h change of ${pct(avg)}. ${weakest ? weakest.symbol + ' is currently the weakest at ' + pct(weakest.change24h) + '. ' : ''}${topVol ? topVol.symbol + ' has the highest volume at about $' + compact(topVol.volume24h) + '. ' : ''}For a safer allocation, keep BTC/ETH as core positions, limit high-volatility tokens, and keep LIVE_TRADING disabled until signing and order flow are verified.`;
  }

  if (p.includes('rebalance') || p.includes('cân bằng') || p.includes('phan bo') || p.includes('phân bổ')) {
    return `Safe rebalance idea: use BTC/ETH as the core, reduce exposure to assets with weak 24h performance, and keep SOL/LINK/ARB as smaller satellite positions. ${strongest ? 'The strongest asset right now is ' + strongest.symbol + ' at ' + pct(strongest.change24h) + '. ' : ''}Before any real order, check orderbook depth and keep LIVE_TRADING=false during demo or verification.`;
  }

  if (p.includes('gas') || p.includes('fee') || p.includes('phí')) {
    return 'Execution note: before sending any on-chain order, check the network, account, orderbook depth, gas/fee assumptions, nonce, and signature. For demo or verification, keep LIVE_TRADING=false so the system prepares orders without executing them.';
  }

  if (p.includes('buy') || p.includes('sell') || p.includes('order') || p.includes('mua') || p.includes('bán') || p.includes('lệnh')) {
    return 'Trading intent detected. The tool can prepare a protected order check, but it will not send a real order unless LIVE_TRADING=true and the SoDEX API key name/private key are configured server-side in the correct format.';
  }

  if (p.includes('signal') || p.includes('market') || p.includes('thị trường') || p.includes('gia') || p.includes('giá')) {
    return `Market signal: live data currently includes ${items.length || 0} assets. The average 24h change is ${pct(avg)}. ${topVol ? topVol.symbol + ' has the highest volume at about $' + compact(topVol.volume24h) + '. ' : ''}Read 24h change and volume together instead of relying only on absolute price.`;
  }

  return 'I can answer questions about market data, risk, rebalance, gas fees, trading signals, and SoDEX execution. Example: “Analyze portfolio risk and suggest a safe rebalance.”';
}
