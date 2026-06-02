import { json } from '@/lib/http';
export const runtime = 'nodejs';
export async function GET() { return json({ ok: true, ts: Date.now() }); }
