export type ApiEnvelope<T> = {
  ok: boolean;
  data?: T;
  message?: string;
  source?: "protected";
};

export function json<T>(payload: ApiEnvelope<T> | Record<string, unknown>, status = 200) {
  return Response.json(payload, {
    status,
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      "Pragma": "no-cache",
      "Expires": "0"
    }
  });
}

export async function readJson<T = unknown>(res: Response): Promise<T | null> {
  try {
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export function publicError(message = "Service temporarily unavailable") {
  return { ok: false, message, source: "protected" as const };
}
