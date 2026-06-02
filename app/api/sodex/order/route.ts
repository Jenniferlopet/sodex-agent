import { json } from '@/lib/http';
import { placeSodexOrder } from '@/lib/sodex';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export async function POST(req: Request) {
  try {
    const input = await req.json();
    const out = await placeSodexOrder(input);
    return json({ ok: true, result: out });
  } catch (e: any) {
    // Do not leak key, signature, endpoint, or provider internals to deployed UI.
    return json({ ok: false, message: e?.message === 'LIVE_TRADING_DISABLED' ? 'Live trading is disabled by server settings.' : 'Order could not be completed.' }, 400);
  }
}
