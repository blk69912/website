import type { NextRequest } from "next/server";
import { analysisToMarkdown } from "@/lib/checker";
import { runCheck } from "@/lib/run-check";

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");
  const md = req.nextUrl.searchParams.get("format") === "md";
  const cors = { "access-control-allow-origin": "*" };
  if (!url) {
    const msg = "Add ?url=example.com to check a site.";
    return md ? new Response(`error: ${msg}\n`, { status: 400, headers: { "content-type": "text/markdown; charset=utf-8", ...cors } }) : Response.json({ ok: false, error: msg }, { status: 400, headers: cors });
  }
  const out = await runCheck(url);
  const status = out.ok ? 200 : 422;
  if (md) {
    const body = out.ok ? `${analysisToMarkdown(out.analysis)}\n## Draft llms.txt\n\n\`\`\`markdown\n${out.llmsDraft}\`\`\`\n` : `error: ${out.error}\n`;
    return new Response(body, { status, headers: { "content-type": "text/markdown; charset=utf-8", ...cors } });
  }
  return Response.json(out, { status, headers: cors });
}
