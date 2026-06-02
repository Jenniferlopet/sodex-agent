import { readJson } from "@/lib/http";

export type MarketItem = {
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  marketCap: number;
  volume24h: number;
};

const STATIC_SAFE_MARKET: MarketItem[] = [
  { symbol: "BTC", name: "Bitcoin", price: 0, change24h: 0, marketCap: 0, volume24h: 0 },
  { symbol: "ETH", name: "Ethereum", price: 0, change24h: 0, marketCap: 0, volume24h: 0 },
  { symbol: "SOL", name: "Solana", price: 0, change24h: 0, marketCap: 0, volume24h: 0 },
  { symbol: "LINK", name: "Chainlink", price: 0, change24h: 0, marketCap: 0, volume24h: 0 }
];

function toNumber(value: unknown) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

async function fetchSoSoValue(): Promise<MarketItem[]> {
  const apiKey = process.env.SOSOVALUE_API_KEY;
  const customUrl = process.env.SOSOVALUE_MARKET_URL;
  if (!apiKey || !customUrl) throw new Error("Primary market provider not configured");

  const res = await fetch(customUrl, {
    headers: {
      "accept": "application/json",
      "x-api-key": apiKey,
      "Authorization": `Bearer ${apiKey}`
    },
    cache: "no-store"
  });

  if (!res.ok) throw new Error("Primary market provider unavailable");
  const raw = await readJson<any>(res);
  const rows = Array.isArray(raw) ? raw : Array.isArray(raw?.data) ? raw.data : [];
  if (!rows.length) throw new Error("Primary market provider returned empty data");

  return rows.slice(0, 8).map((item: any) => ({
    symbol: String(item.symbol || item.ticker || item.name || "ASSET").replace("USDT", "").toUpperCase(),
    name: String(item.name || item.symbol || item.ticker || "Asset"),
    price: toNumber(item.price || item.current_price || item.close || item.last),
    change24h: toNumber(item.change24h || item.price_change_percentage_24h || item.change_24h),
    marketCap: toNumber(item.marketCap || item.market_cap),
    volume24h: toNumber(item.volume24h || item.total_volume || item.volume)
  }));
}

async function fetchCoinGecko(): Promise<MarketItem[]> {
  const url = "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=bitcoin,ethereum,solana,chainlink,arbitrum,optimism&order=market_cap_desc&per_page=6&page=1&sparkline=false&price_change_percentage=24h";
  const res = await fetch(url, { headers: { accept: "application/json" }, next: { revalidate: 60 } });
  if (!res.ok) throw new Error("Fallback market provider unavailable");
  const data = await readJson<any[]>(res);
  if (!Array.isArray(data) || !data.length) throw new Error("Fallback data empty");

  return data.map((coin: any) => ({
    symbol: String(coin.symbol || "").toUpperCase(),
    name: String(coin.name || coin.symbol || "Asset"),
    price: toNumber(coin.current_price),
    change24h: toNumber(coin.price_change_percentage_24h),
    marketCap: toNumber(coin.market_cap),
    volume24h: toNumber(coin.total_volume)
  }));
}

async function fetchBinance(): Promise<MarketItem[]> {
  const pairs = ["BTCUSDT", "ETHUSDT", "SOLUSDT", "LINKUSDT", "ARBUSDT", "OPUSDT"];
  const rows = await Promise.all(pairs.map(async (pair) => {
    const res = await fetch(`https://api.binance.com/api/v3/ticker/24hr?symbol=${pair}`, { next: { revalidate: 60 } });
    if (!res.ok) throw new Error("Secondary fallback unavailable");
    const item = await readJson<any>(res);
    const symbol = pair.replace("USDT", "");
    return {
      symbol,
      name: symbol,
      price: toNumber(item?.lastPrice),
      change24h: toNumber(item?.priceChangePercent),
      marketCap: 0,
      volume24h: toNumber(item?.quoteVolume)
    };
  }));
  return rows;
}

export async function getMarketOverview() {
  const providers = [fetchSoSoValue, fetchCoinGecko, fetchBinance];
  for (const provider of providers) {
    try {
      const data = await provider();
      if (data.length) return { ok: true, source: "protected" as const, data };
    } catch {
      // Silent fallback: never expose provider/API failure details to the UI.
    }
  }
  return { ok: true, source: "protected" as const, data: STATIC_SAFE_MARKET };
}
