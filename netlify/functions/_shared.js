function ok(data, statusCode = 200) {
  return {
    statusCode,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store'
    },
    body: JSON.stringify(data)
  };
}
function protectedError() {
  return ok({ ok: true, protected: true, data: [] });
}
const fallbackAssets = [
  { symbol:'BTC', name:'Bitcoin', price:0, change24h:0, marketCap:0, volume24h:0 },
  { symbol:'ETH', name:'Ethereum', price:0, change24h:0, marketCap:0, volume24h:0 },
  { symbol:'SOL', name:'Solana', price:0, change24h:0, marketCap:0, volume24h:0 }
];
exports.ok = ok;
exports.protectedError = protectedError;
exports.fallbackAssets = fallbackAssets;
