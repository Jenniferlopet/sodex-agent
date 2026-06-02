import { json } from '@/lib/http';
import { getMarketOverview } from '@/lib/market';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export async function GET() {
  const data = await getMarketOverview();
  return json({ data, updatedAt: new Date().toISOString() });
}
