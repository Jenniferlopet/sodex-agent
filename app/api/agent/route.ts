import { json } from '@/lib/http';
import { getMarketOverview } from '@/lib/market';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function decide(prompt: string, market: any[]) {
  const p = prompt.toLowerCase();
  const top = market.slice(0, 6);
  const volatile = top.filter(x => Math.abs(Number(x.change24h)) > 5);
  if (p.includes('rebalance')) return `Rebalance plan: keep BTC/ETH as core, cap high-volatility assets, and avoid over-sizing tokens moving more than 5% in 24h. Current watchlist: ${top.map(x => `${x.symbol} ${Number(x.change24h).toFixed(2)}%`).join(', ')}.`;
  if (p.includes('risk')) return volatile.length ? `Risk alert: ${volatile.map(x => x.symbol).join(', ')} are moving sharply today. Reduce position size or wait for confirmation before execution.` : 'Risk looks moderate across the top tracked assets. Use position sizing and stop rules before placing any order.';
  if (p.includes('buy') || p.includes('sell') || p.includes('order')) return 'I can prepare an order through the server endpoint, but live execution requires LIVE_TRADING=true and valid SoDEX API signing keys in server environment variables.';
  return `Market brief: ${top.map(x => `${x.symbol}: $${Number(x.price).toLocaleString()} (${Number(x.change24h).toFixed(2)}%)`).join(' | ')}. Best next step: define risk budget before any trade.`;
}

export async function POST(req: Request) {
  const { prompt = '' } = await req.json().catch(() => ({}));
  const market = await getMarketOverview();
  return json({ answer: decide(String(prompt), market), market: market.slice(0, 5) });
}
