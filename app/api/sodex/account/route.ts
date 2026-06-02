import { json } from "@/lib/http";
import { sodexConfig } from "@/lib/sodex";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return json({
    ok: true,
    source: "protected",
    accountConfigured: Boolean(sodexConfig.accountId),
    apiConfigured: Boolean(sodexConfig.apiKeyName),
    liveTrading: sodexConfig.liveTrading,
    env: sodexConfig.env
  });
}
