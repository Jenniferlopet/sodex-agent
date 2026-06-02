import { json } from '@/lib/http';
import { getSodexOrderbook } from '@/lib/sodex';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  return json({ data: await getSodexOrderbook(searchParams.get('symbolID') || undefined) });
}
