function response(statusCode, body) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Methods': 'GET,POST,OPTIONS'
    },
    body: JSON.stringify(body)
  };
}
function ok(body) { return response(200, body); }
function bad(body) { return response(400, body); }
async function safeFetchJson(url, options = {}, timeoutMs = 8000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    if (!res.ok) throw new Error('provider failed');
    return await res.json();
  } finally { clearTimeout(timer); }
}
const fallbackMarket = [
  { symbol: 'BTC', name: 'Bitcoin', price: 68000, change24h: 1.2, volume24h: 32000000000, marketCap: 1300000000000 },
  { symbol: 'ETH', name: 'Ethereum', price: 3600, change24h: 0.8, volume24h: 15000000000, marketCap: 430000000000 },
  { symbol: 'SOL', name: 'Solana', price: 155, change24h: -0.4, volume24h: 3200000000, marketCap: 72000000000 },
  { symbol: 'LINK', name: 'Chainlink', price: 17, change24h: 2.1, volume24h: 650000000, marketCap: 10000000000 },
  { symbol: 'ARB', name: 'Arbitrum', price: 1.12, change24h: -1.1, volume24h: 420000000, marketCap: 3200000000 }
];
exports.response = response;
exports.ok = ok;
exports.bad = bad;
exports.safeFetchJson = safeFetchJson;
exports.fallbackMarket = fallbackMarket;
