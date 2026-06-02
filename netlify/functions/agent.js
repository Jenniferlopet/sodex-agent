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
  const systemPrompt = `You are SoDEX Agent Console, a practical AI Web3 trading intelligence assistant.\n\nRules:\n- Answer the user's language. If the user asks in Vietnamese, answer in Vietnamese.\n- Be concise, practical, and specific.\n- Use the market data if provided.\n- Do not claim certainty about prices.\n- Do not reveal API keys, environment variables, server details, or hidden provider errors.\n- Do not encourage unsafe live trading.\n- Mention that LIVE_TRADING should stay disabled unless signing and order flow are verified.\n\nMarket data JSON:\n${marketText}\n\nUser question:\n${prompt}`;

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
    return 'Xin chào! Tôi là SoDEX Agent. Bạn có thể hỏi về market signal, risk, rebalance, gas fee, orderbook hoặc cách chuẩn bị lệnh SoDEX an toàn.';
  }

  if (p.includes('risk') || p.includes('rủi ro') || p.includes('portfolio') || p.includes('danh mục')) {
    return `Tóm tắt rủi ro: ${items.length || 0} tài sản đang được theo dõi, biến động 24h trung bình là ${pct(avg)}. ${weakest ? weakest.symbol + ' yếu nhất ở ' + pct(weakest.change24h) + '. ' : ''}${topVol ? topVol.symbol + ' có volume lớn nhất khoảng $' + compact(topVol.volume24h) + '. ' : ''}Nên giữ BTC/ETH làm lõi nếu muốn an toàn hơn, hạn chế tỷ trọng token biến động mạnh, và chưa bật LIVE_TRADING khi chưa verify signing.`;
  }

  if (p.includes('rebalance') || p.includes('cân bằng') || p.includes('phan bo') || p.includes('phân bổ')) {
    return `Gợi ý rebalance an toàn: ưu tiên BTC/ETH làm core, giảm tỷ trọng token có 24h change âm mạnh, và chỉ dùng SOL/LINK/ARB như phần vệ tinh nhỏ hơn. ${strongest ? 'Asset mạnh nhất hiện tại là ' + strongest.symbol + ' với ' + pct(strongest.change24h) + '. ' : ''}Trước khi đặt lệnh thật, kiểm tra orderbook depth và giữ LIVE_TRADING=false trong giai đoạn demo.`;
  }

  if (p.includes('gas') || p.includes('fee') || p.includes('phí')) {
    return 'Execution note: trước khi gửi lệnh on-chain, cần kiểm tra network, account, orderbook depth, gas/fee assumption và nonce/signature. Với demo/verify, nên giữ LIVE_TRADING=false để chỉ chuẩn bị lệnh, không execute thật.';
  }

  if (p.includes('buy') || p.includes('sell') || p.includes('order') || p.includes('mua') || p.includes('bán') || p.includes('lệnh')) {
    return 'Tôi phát hiện intent giao dịch. Tool có thể chuẩn bị protected order check, nhưng không gửi lệnh thật trừ khi LIVE_TRADING=true và SoDEX API key name/private key đã cấu hình server-side đúng format.';
  }

  if (p.includes('signal') || p.includes('market') || p.includes('thị trường') || p.includes('gia') || p.includes('giá')) {
    return `Market signal: dữ liệu live đang có ${items.length || 0} assets. Avg 24h change là ${pct(avg)}. ${topVol ? topVol.symbol + ' đang có volume lớn nhất khoảng $' + compact(topVol.volume24h) + '. ' : ''}Nên đọc 24h change + volume cùng nhau, không chỉ nhìn giá tuyệt đối.`;
  }

  return 'Tôi có thể trả lời về market, risk, rebalance, gas fee, trading signal và SoDEX execution. Ví dụ: “Analyze portfolio risk and suggest a safe rebalance.”';
}
