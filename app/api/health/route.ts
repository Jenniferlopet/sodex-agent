import { json } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return json({ ok: true, service: "sodex-agent-complete", ts: Date.now(), source: "protected" });
}
