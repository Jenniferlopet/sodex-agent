import { json } from "@/lib/http";
import { getMarketOverview } from "@/lib/market";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const prompt = String(body.prompt || "").toLowerCase();
  const market = await getMarketOverview();

  let answer = "I can analyze market movement, portfolio risk and protected trading actions using real market data with silent fallback.";

  if (prompt.includes("rebalance")) {
    answer = "Rebalance view: keep BTC and ETH as core exposure, limit smaller-token concentration, and verify liquidity before executing any order.";
  } else if (prompt.includes("risk")) {
    answer = "Risk view: crypto exposure is volatile. A safer portfolio usually uses BTC/ETH as the base, smaller satellite allocations, and clear stop-loss or position-size rules.";
  } else if (prompt.includes("gas") || prompt.includes("fee")) {
    answer = "Execution view: always estimate gas, slippage and route impact before confirming. This deployment keeps provider failures protected and does not expose API details.";
  } else if (prompt.includes("buy") || prompt.includes("sell") || prompt.includes("order")) {
    answer = "Trading intent detected. The system can verify the order payload, but live execution stays disabled unless server-side credentials and LIVE_TRADING=true are configured.";
  } else if (prompt.includes("market") || prompt.includes("trend")) {
    const top = market.data?.[0];
    answer = top ? `Market view: ${top.symbol} is the leading tracked asset here. Current protected price feed shows about $${top.price.toLocaleString("en")}. Watch 24h change and volume before taking risk.` : answer;
  }

  return json({ ok: true, answer, source: "protected", market });
}
