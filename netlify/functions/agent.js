const { ok, compact, pct } = require('./_utils');

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return ok({ ok: true });
  if (event.httpMethod !== 'POST') return ok({ ok: false, answer: 'Please send a POST request to the AI Agent.' });

  let body = {};
  try { body = JSON.parse(event.body || '{}'); } catch (_) {}
  const prompt = String(body.prompt || '').trim();
  const market = Array.isArray(body.market) ? body.market : [];
  const meta = body.meta || {};
  const geminiKey = process.env.GEMINI_API_KEY || '';
  const geminiModel = process.env.GEMINI_MODEL || 'gemini-1.5-flash';

  if (geminiKey && prompt) {
    try {
      const answer = await askGemini({ prompt, market, meta, apiKey: geminiKey, model: geminiModel });
      if (answer) return ok({ ok: true, provider: 'ai', answer });
    } catch (_) {
      // Silent fallback. Do not leak upstream errors to the frontend.
    }
  }
  return ok({ ok: true, provider: 'local-pro', answer: proLocalAnswer(prompt, market, meta) });
};

async function askGemini({ prompt, market, meta, apiKey, model }) {
  const snapshot = buildSnapshot(market, meta);
  const marketText = JSON.stringify(snapshot).slice(0, 7000);
  const systemPrompt = `You are SoDEX Agent Console, a professional Web3 market intelligence and execution-readiness assistant.\n\nHard rules:\n- Always answer in English only, even if the user writes Vietnamese or another language.\n- Sound polished, confident, and demo-ready.\n- Do not say you are a generic chatbot. You are the SoDEX Agent.\n- Use the market snapshot and signal confluence context when relevant.\n- Do not provide guaranteed financial advice. Use cautious terms such as "consider", "risk-aware", and "execution check".\n- Never reveal or discuss API keys, private keys, endpoints, environment variables, or internal provider errors.\n- If the user asks to buy/sell, provide an execution plan and safety checks, not a direct command to trade.\n- Keep the answer concise but premium: usually 4-7 short bullets or a short executive paragraph.\n\nMarket snapshot:\n${marketText}\n\nUser request: ${prompt}`;
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents: [{ parts: [{ text: systemPrompt }] }] })
  });
  const data = await res.json();
  return data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

function buildSnapshot(market = [], meta = {}) {
  const items = Array.isArray(market) ? market : [];
  const avg = items.length ? items.reduce((s, x) => s + Number(x.change24h || 0), 0) / items.length : 0;
  const topVolume = [...items].sort((a, b) => Number(b.volume24h || 0) - Number(a.volume24h || 0)).slice(0, 8);
  const gainers = [...items].sort((a, b) => Number(b.change24h || 0) - Number(a.change24h || 0)).slice(0, 5);
  const losers = [...items].sort((a, b) => Number(a.change24h || 0) - Number(b.change24h || 0)).slice(0, 5);
  return {
    universe: meta.universe || 'protected',
    primary: meta.primary || 'live',
    trackedAssets: Number(meta.totalAssets || items.length || 0),
    strategyModules: Number(meta.strategies || 0),
    topSignals: Array.isArray(meta.signals) ? meta.signals.slice(0, 5) : [],
    average24hChange: avg,
    topVolume,
    gainers,
    losers
  };
}

function proLocalAnswer(promptText = '', market = [], meta = {}) {
  const p = String(promptText || '').toLowerCase();
  const s = buildSnapshot(market, meta);
  const topVol = s.topVolume[0];
  const strongest = s.gainers[0];
  const weakest = s.losers[0];
  const riskTone = s.average24hChange < -2 ? 'defensive' : s.average24hChange > 2 ? 'momentum-positive' : 'selective and risk-controlled';
  const tracked = s.trackedAssets || market.length || 0;

  if (!p || p.includes('hello') || p.includes('hi') || p.includes('xin chào')) {
    return `Hello — I am SoDEX Agent. I am tracking ${tracked} live assets from the protected market layer. Ask me for a market brief, signal confluence read, risk read, rebalance plan, orderbook checklist, or execution readiness review.`;
  }

  if (hasAny(p, ['buy', 'sell', 'order', 'trade', 'mua', 'bán', 'lệnh', 'tư vấn mua'])) {
    return [
      `Execution intent detected. I would treat this as a protected pre-trade review, not an automatic trade.`,
      `Market tone is currently ${riskTone}, with average 24h change at ${pct(s.average24hChange)} across ${tracked} tracked assets.`,
      topVol ? `Liquidity focus: ${topVol.symbol} is the highest-volume asset in the current snapshot at about $${compact(topVol.volume24h)}.` : `Liquidity focus: wait for a deeper SoDEX orderbook read before sizing the order.`,
      `Recommended flow: check spread, depth, slippage, account balance, nonce/signature, then only enable live execution after the order format is verified server-side.`,
      `Protected Mode remains the right setting for demo and verification.`
    ].join('\n');
  }

  if (hasAny(p, ['rebalance', 'portfolio', 'risk', 'allocation', 'cân bằng', 'danh mục', 'rủi ro', 'phân bổ'])) {
    return [
      `Portfolio read: the current market universe is ${riskTone}, tracking ${tracked} assets with an average 24h move of ${pct(s.average24hChange)}.`,
      strongest ? `Momentum leader: ${strongest.symbol} at ${pct(strongest.change24h)}.` : '',
      weakest ? `Main drag: ${weakest.symbol} at ${pct(weakest.change24h)}.` : '',
      `Risk-aware rebalance: keep core exposure in the deepest/liquid pairs, reduce concentration in weak high-volatility names, and size satellite tokens smaller.`,
      `Before any SoDEX action, confirm orderbook depth and slippage; do not switch LIVE_TRADING on during a public demo.`
    ].filter(Boolean).join('\n');
  }

  if (hasAny(p, ['signal', 'market', 'trend', 'price', 'giá', 'thị trường'])) {
    return [
      `Market signal: ${tracked} live assets are loaded, with average 24h change at ${pct(s.average24hChange)}.`,
      topVol ? `Volume anchor: ${topVol.symbol} leads the current universe at about $${compact(topVol.volume24h)} in 24h volume.` : '',
      strongest ? `Best short-term performer: ${strongest.symbol} at ${pct(strongest.change24h)}.` : '',
      weakest ? `Weakest short-term performer: ${weakest.symbol} at ${pct(weakest.change24h)}.` : '',
      `My read: use volume plus 24h change together. Price alone is not enough for a trading decision.`
    ].filter(Boolean).join('\n');
  }

  if (hasAny(p, ['gas', 'fee', 'slippage', 'spread', 'phí'])) {
    return [
      `Execution cost checklist: review spread, orderbook depth, estimated slippage, network fees, account balance, and signing status before submitting anything.`,
      `For SoDEX execution, the safest demo flow is: market signal → orderbook check → protected order verification → manual approval.`,
      `Keep secrets server-side and keep LIVE_TRADING=false until the signing flow is confirmed against the official API format.`
    ].join('\n');
  }

  return [
    `Here is the current SoDEX Agent view: ${tracked} live assets are loaded and the market tone is ${riskTone}.`,
    topVol ? `The strongest liquidity anchor is ${topVol.symbol}, with about $${compact(topVol.volume24h)} in 24h volume.` : '',
    strongest ? `Top momentum: ${strongest.symbol} at ${pct(strongest.change24h)}.` : '',
    `Ask me for a “market brief”, “safe rebalance”, “orderbook checklist”, or “execution readiness plan” for a sharper response.`
  ].filter(Boolean).join('\n');
}
function hasAny(text, words) { return words.some((w) => text.includes(w)); }
