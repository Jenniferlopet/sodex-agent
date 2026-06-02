import { json } from "@/lib/http";
import { placeSodexOrder } from "@/lib/sodex";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const result = await placeSodexOrder(body);
  return json(result, result.ok ? 200 : 400);
}
