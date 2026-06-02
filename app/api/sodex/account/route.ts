import { json, safeJson } from '@/lib/http';
import { sodexConfig } from '@/lib/sodex';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export async function GET() {
  const cfg = sodexConfig();
  const address = process.env.SODEX_MASTER_ADDRESS || '';
  if (!address) return json({ configured: false });
  const r = await safeJson<any>(`${cfg.perps}/accounts/${address}/state`, { headers: { Accept: 'application/json' } });
  return json({ configured: true, data: r.ok ? r.data : null });
}
