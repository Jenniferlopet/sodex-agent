export const runtime = 'nodejs';

export type FetchResult<T> = { ok: true; data: T } | { ok: false; error: string };

export async function safeJson<T>(url: string, init?: RequestInit, timeoutMs = 8000): Promise<FetchResult<T>> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...init, signal: controller.signal, cache: 'no-store', next: { revalidate: 0 } });
    if (!res.ok) return { ok: false, error: `HTTP ${res.status}` };
    return { ok: true, data: await res.json() as T };
  } catch {
    return { ok: false, error: 'FETCH_FAILED' };
  } finally {
    clearTimeout(timer);
  }
}

export function json(data: unknown, status = 200) {
  return Response.json(data, {
    status,
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      'X-Robots-Tag': 'noindex',
      'Referrer-Policy': 'no-referrer'
    }
  });
}
