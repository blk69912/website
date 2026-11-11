import { listPush, listRange, storageKind } from "@/lib/kv";
import { badRequest, checkNs, checkValue, reply } from "@/lib/webget";

interface Note { at: string; text: string }

export async function GET(req: Request, ctx: RouteContext<"/w/note/[ns]">) {
  const { ns } = await ctx.params;
  const nsErr = checkNs(ns);
  if (nsErr) return badRequest(req, nsErr);
  const add = new URL(req.url).searchParams.get("add");
  const k = `w:note:${ns}`;
  if (add !== null) {
    if (!add.trim()) return badRequest(req, "add must not be empty");
    const vErr = checkValue(add);
    if (vErr) return badRequest(req, vErr);
    const note: Note = { at: new Date().toISOString(), text: add };
    const n = await listPush(k, JSON.stringify(note));
    return reply(req, { ok: true, count: n, note, storage: storageKind }, `added note ${n}`);
  }
  const notes = (await listRange(k)).map((s) => JSON.parse(s) as Note);
  const text = notes.length ? notes.map((n, i) => `${i + 1}. [${n.at}] ${n.text}`).join("\n") : "no notes yet";
  return reply(req, { ok: true, count: notes.length, notes }, text);
}
