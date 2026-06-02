import { json } from "@/lib/http";
import { getSodexMarkets } from "@/lib/sodex";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return json(await getSodexMarkets());
}
