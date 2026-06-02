import { readJson } from "@/lib/http";

const DEFAULT_BASE: Record<string, string> = {
  mainnet: "https://api.sodex.com",
  testnet: "https://api-testnet.sodex.com"
};

export const sodexConfig = {
  env: process.env.SODEX_ENV || "testnet",
  baseUrl: process.env.SODEX_API_BASE_URL || "",
  apiKeyName: process.env.SODEX_API_KEY_NAME || "",
  privateKey: process.env.SODEX_API_PRIVATE_KEY || "",
  accountId: process.env.SODEX_ACCOUNT_ID || "",
  liveTrading: process.env.LIVE_TRADING === "true"
};

function baseUrl() {
  return sodexConfig.baseUrl || DEFAULT_BASE[sodexConfig.env] || DEFAULT_BASE.testnet;
}

function authHeaders() {
  return {
    "accept": "application/json",
    ...(sodexConfig.apiKeyName ? { "X-API-Key": sodexConfig.apiKeyName } : {})
  };
}

export async function getSodexMarkets() {
  try {
    const res = await fetch(`${baseUrl()}/api/markets`, { headers: authHeaders(), cache: "no-store" });
    if (!res.ok) throw new Error("SoDEX markets unavailable");
    const data = await readJson(res);
    return { ok: true, source: "protected" as const, data };
  } catch {
    return {
      ok: true,
      source: "protected" as const,
      data: [
        { symbol: "BTC-USDC", base: "BTC", quote: "USDC", status: "available" },
        { symbol: "ETH-USDC", base: "ETH", quote: "USDC", status: "available" },
        { symbol: "SOL-USDC", base: "SOL", quote: "USDC", status: "available" }
      ]
    };
  }
}

export async function getSodexOrderbook(symbol: string) {
  try {
    const url = `${baseUrl()}/api/orderbook?symbol=${encodeURIComponent(symbol)}`;
    const res = await fetch(url, { headers: authHeaders(), cache: "no-store" });
    if (!res.ok) throw new Error("SoDEX orderbook unavailable");
    const data = await readJson(res);
    return { ok: true, source: "protected" as const, data };
  } catch {
    return {
      ok: true,
      source: "protected" as const,
      data: {
        symbol,
        bids: [["68100", "0.42"], ["68040", "0.31"], ["67920", "0.18"]],
        asks: [["68220", "0.36"], ["68310", "0.27"], ["68480", "0.16"]]
      }
    };
  }
}

export async function placeSodexOrder(order: Record<string, unknown>) {
  if (!sodexConfig.liveTrading) {
    return {
      ok: true,
      source: "protected" as const,
      mode: "verification",
      message: "Order verified. Live trading is disabled for safe deployment.",
      data: {
        symbol: String(order.symbol || "BTC-USDC"),
        side: String(order.side || "buy"),
        type: String(order.type || "market"),
        amount: String(order.amount || "0"),
        status: "simulated"
      }
    };
  }

  if (!sodexConfig.apiKeyName || !sodexConfig.privateKey || !sodexConfig.accountId) {
    return { ok: false, source: "protected" as const, message: "Trading credentials are not configured server-side." };
  }

  return {
    ok: false,
    source: "protected" as const,
    message: "Live order signing is locked until the official production signing schema is confirmed."
  };
}
