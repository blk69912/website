import "server-only";

// Storage for the GET-only services. Uses Upstash Redis over REST when configured
// (KV_REST_API_URL/KV_REST_API_TOKEN or UPSTASH_REDIS_REST_URL/UPSTASH_REDIS_REST_TOKEN),
// otherwise an in-process Map that is lost on restart.

export const TTL_SECONDS = 60 * 60 * 24 * 7;

type Cmd = (string | number)[];

const url = process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN;

export const storageKind: "redis" | "memory" = url && token ? "redis" : "memory";

async function redis(cmd: Cmd): Promise<unknown> {
  const res = await fetch(url!, {
    method: "POST",
    headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
    body: JSON.stringify(cmd),
    cache: "no-store",
  });
  const json = (await res.json()) as { result?: unknown; error?: string };
  if (json.error) throw new Error(json.error);
  return json.result;
}

// ---- memory fallback ----
type Entry = { v: string | string[]; exp: number };
const g = globalThis as unknown as { __kv?: Map<string, Entry> };
const mem = (g.__kv ??= new Map());
const live = (k: string) => {
  const e = mem.get(k);
  if (e && e.exp < Date.now()) { mem.delete(k); return undefined; }
  return e;
};

export async function kvGet(key: string): Promise<string | null> {
  if (storageKind === "redis") return ((await redis(["GET", key])) as string | null) ?? null;
  const e = live(key);
  return typeof e?.v === "string" ? e.v : null;
}

export async function kvSet(key: string, value: string): Promise<void> {
  if (storageKind === "redis") { await redis(["SET", key, value, "EX", TTL_SECONDS]); return; }
  mem.set(key, { v: value, exp: Date.now() + TTL_SECONDS * 1000 });
}

/** Set only if absent. Returns true when written. */
export async function kvSetNx(key: string, value: string): Promise<boolean> {
  if (storageKind === "redis") return (await redis(["SET", key, value, "EX", TTL_SECONDS, "NX"])) === "OK";
  if (live(key)) return false;
  mem.set(key, { v: value, exp: Date.now() + TTL_SECONDS * 1000 });
  return true;
}

export async function kvDel(key: string): Promise<void> {
  if (storageKind === "redis") { await redis(["DEL", key]); return; }
  mem.delete(key);
}

export async function kvIncr(key: string, by = 1): Promise<number> {
  if (storageKind === "redis") {
    const n = (await redis(["INCRBY", key, by])) as number;
    await redis(["EXPIRE", key, TTL_SECONDS]);
    return n;
  }
  const n = Number((live(key)?.v as string) ?? "0") + by;
  mem.set(key, { v: String(n), exp: Date.now() + TTL_SECONDS * 1000 });
  return n;
}

export async function listPush(key: string, value: string, max = 200): Promise<number> {
  if (storageKind === "redis") {
    const n = (await redis(["RPUSH", key, value])) as number;
    await redis(["LTRIM", key, -max, -1]);
    await redis(["EXPIRE", key, TTL_SECONDS]);
    return Math.min(n, max);
  }
  const e = live(key);
  const arr = Array.isArray(e?.v) ? e!.v as string[] : [];
  arr.push(value);
  const trimmed = arr.slice(-max);
  mem.set(key, { v: trimmed, exp: Date.now() + TTL_SECONDS * 1000 });
  return trimmed.length;
}

export async function listRange(key: string): Promise<string[]> {
  if (storageKind === "redis") return ((await redis(["LRANGE", key, 0, -1])) as string[]) ?? [];
  const e = live(key);
  return Array.isArray(e?.v) ? [...(e!.v as string[])] : [];
}
