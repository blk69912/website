import { kvSetNx, storageKind } from "@/lib/kv";
import { badRequest, checkValue, randomId, reply } from "@/lib/webget";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const text = url.searchParams.get("text");
  if (text === null || !text.length) return badRequest(req, "add ?text= with the content to paste");
  const vErr = checkValue(text);
  if (vErr) return badRequest(req, vErr);
  for (let i = 0; i < 5; i++) {
    const id = randomId();
    if (await kvSetNx(`w:paste:${id}`, text)) {
      const link = `${url.origin}/w/p/${id}`;
      return reply(req, { ok: true, id, url: link, storage: storageKind }, link);
    }
  }
  return reply(req, { ok: false, error: "could not allocate an id, try again" }, "error: could not allocate an id, try again", 503);
}
