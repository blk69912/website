import { kvDel, kvGet, kvSet, storageKind } from "@/lib/kv";
import { badRequest, checkNs, checkValue, KEY_RE, reply } from "@/lib/webget";

export async function GET(req: Request, ctx: RouteContext<"/w/kv/[ns]/[key]">) {
  const { ns, key } = await ctx.params;
  const nsErr = checkNs(ns);
  if (nsErr) return badRequest(req, nsErr);
  if (!KEY_RE.test(key)) return badRequest(req, "key must be 1-64 characters of letters, digits, dot, dash, or underscore");
  const sp = new URL(req.url).searchParams;
  const k = `w:kv:${ns}:${key}`;
  if (sp.has("delete")) {
    await kvDel(k);
    return reply(req, { ok: true, key, deleted: true, storage: storageKind }, `deleted ${key}`);
  }
  const set = sp.get("set");
  if (set !== null) {
    const vErr = checkValue(set);
    if (vErr) return badRequest(req, vErr);
    await kvSet(k, set);
    return reply(req, { ok: true, key, value: set, storage: storageKind }, `stored ${key}`);
  }
  const value = await kvGet(k);
  if (value === null) return reply(req, { ok: false, key, value: null }, `not found: ${key}`, 404);
  return reply(req, { ok: true, key, value }, value);
}
