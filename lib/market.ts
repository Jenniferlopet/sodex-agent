import { safeJson } from './http';

type BinanceTicker = { symbol: string; lastPrice: string; priceChangePercent: string; volume: string; quoteVolume: string };
type CoinGeckoMarket = { id: string; symbol: string; name: string; current_price: number; price_change_percentage_24h: number; market_cap: number; total_volume: number };

export type MarketItem = { symbol: string; name: string; price: number; change24h: number; volume: number; marketCap?: number };

function normalizeSoSoValue(raw: any): MarketItem[] {
  const rows = Array.isArray(raw?.data) ? raw.data : Array.isArray(raw?.data?.list) ? raw.data.list : Array.isArray(raw) ? raw : [];
  return rows.slice(0, 20).map((x: any) => ({
    symbol: String(x.symbol || x.baseCurrency || x.ticker || '').toUpperCase(),
    name: String(x.name || x.symbol || x.ticker || ''),
    price: Number(x.price || x.current_price || x.close || x.lastPrice || 0),
    change24h: Number(x.change24h || x.priceChangePercent || x.price_change_percentage_24h || 0),
    volume: Number(x.volume || x.total_volume || x.quoteVolume || 0),
    marketCap: Number(x.marketCap || x.market_cap || 0) || undefined
  })).filter((x: MarketItem) => x.symbol && x.price > 0);
}

export async function getMarketOverview(): Promise<MarketItem[]> {
  const base = process.env.SOSOVALUE_BASE_URL;
  const path = process.env.SOSOVALUE_MARKET_PATH;
  const key = process.env.SOSOVALUE_API_KEY;
  if (base && path && key) {
    const r = await safeJson<any>(`${base}${path}`, { headers: { Authorization: `Bearer ${key}`, 'x-api-key': key } });
    if (r.ok) {
      const rows = normalizeSoSoValue(r.data);
      if (rows.length) return rows;
    }
  }

  const cg = await safeJson<CoinGeckoMarket[]>('https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=12&page=1&sparkline=false&price_change_percentage=24h');
  if (cg.ok && Array.isArray(cg.data) && cg.data.length) {
    return cg.data.map(x => ({ symbol: x.symbol.toUpperCase(), name: x.name, price: x.current_price, change24h: x.price_change_percentage_24h, volume: x.total_volume, marketCap: x.market_cap }));
  }

  const symbols = ['BTCUSDT','ETHUSDT','SOLUSDT','BNBUSDT','XRPUSDT','DOGEUSDT','ADAUSDT','AVAXUSDT'];
  const bz = await safeJson<BinanceTicker[]>('https://api.binance.com/api/v3/ticker/24hr');
  if (bz.ok && Array.isArray(bz.data)) {
    return bz.data.filter(x => symbols.includes(x.symbol)).map(x => ({ symbol: x.symbol.replace('USDT',''), name: x.symbol.replace('USDT',''), price: Number(x.lastPrice), change24h: Number(x.priceChangePercent), volume: Number(x.quoteVolume) }));
  }
  return [];
}
