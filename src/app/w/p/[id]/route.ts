import { kvGet } from "@/lib/kv";
import { reply } from "@/lib/webget";

export async function GET(req: Request, ctx: RouteContext<"/w/p/[id]">) {
  const { id } = await ctx.params;
  if (!/^[a-z0-9]{6,20}$/.test(id)) return reply(req, { ok: false, error: "bad id" }, "error: bad id", 400);
  const text = await kvGet(`w:paste:${id}`);
  if (text === null) return reply(req, { ok: false, id }, `not found: ${id}`, 404);
  return reply(req, { ok: true, id, text }, text);
}
