// Shared validation and response helpers for the GET-only services.
export const NS_RE = /^[A-Za-z0-9_-]{8,64}$/;
export const KEY_RE = /^[A-Za-z0-9_.-]{1,64}$/;
export const MAX_VALUE = 4096;

export function textResponse(body: string, status = 200, extra: Record<string, string> = {}) {
  return new Response(body.endsWith("\n") ? body : body + "\n", {
    status,
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "no-store",
      "x-robots-tag": "noindex",
      "access-control-allow-origin": "*",
      ...extra,
    },
  });
}

export function reply(req: Request, data: Record<string, unknown>, text: string, status = 200) {
  const format = new URL(req.url).searchParams.get("format");
  if (format === "json")
    return new Response(JSON.stringify(data, null, 2) + "\n", {
      status,
      headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", "x-robots-tag": "noindex", "access-control-allow-origin": "*" },
    });
  return textResponse(text, status);
}

export function badRequest(req: Request, message: string) {
  return reply(req, { ok: false, error: message }, `error: ${message}`, 400);
}

export function checkNs(ns: string): string | null {
  return NS_RE.test(ns) ? null : "namespace must be 8-64 characters of letters, digits, dash, or underscore. Pick something hard to guess.";
}

export function checkValue(v: string): string | null {
  return new TextEncoder().encode(v).length > MAX_VALUE ? `value is larger than ${MAX_VALUE} bytes` : null;
}

export function randomId(len = 10): string {
  const abc = "abcdefghijkmnpqrstuvwxyz23456789";
  const bytes = crypto.getRandomValues(new Uint8Array(len));
  return [...bytes].map((b) => abc[b % abc.length]).join("");
}
