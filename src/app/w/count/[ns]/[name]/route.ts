import { kvGet, kvIncr, storageKind } from "@/lib/kv";
import { badRequest, checkNs, KEY_RE, reply } from "@/lib/webget";

export async function GET(req: Request, ctx: RouteContext<"/w/count/[ns]/[name]">) {
  const { ns, name } = await ctx.params;
  const nsErr = checkNs(ns);
  if (nsErr) return badRequest(req, nsErr);
  if (!KEY_RE.test(name)) return badRequest(req, "counter name must be 1-64 characters of letters, digits, dot, dash, or underscore");
  const incRaw = new URL(req.url).searchParams.get("inc");
  const k = `w:count:${ns}:${name}`;
  if (incRaw !== null) {
    const by = incRaw === "" ? 1 : Number(incRaw);
    if (!Number.isInteger(by) || Math.abs(by) > 1_000_000) return badRequest(req, "inc must be a whole number between -1000000 and 1000000");
    const n = await kvIncr(k, by);
    return reply(req, { ok: true, name, value: n, storage: storageKind }, String(n));
  }
  const n = Number((await kvGet(k)) ?? 0);
  return reply(req, { ok: true, name, value: n }, String(n));
}
