import { json } from "@/lib/http";
import { getSodexOrderbook } from "@/lib/sodex";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const symbol = searchParams.get("symbol") || "BTC-USDC";
  return json(await getSodexOrderbook(symbol));
}
