import type { NextRequest } from "next/server";
import { badgeColor, badgeSvg } from "@/lib/badge";
import { runCheck } from "@/lib/run-check";

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");
  const label = (req.nextUrl.searchParams.get("label") ?? "agent ready").slice(0, 40);
  const headers = { "content-type": "image/svg+xml; charset=utf-8", "cache-control": "public, max-age=3600, s-maxage=21600, stale-while-revalidate=86400" };
  if (!url) return new Response(badgeSvg(label, "add ?url=", badgeColor(null)), { status: 400, headers });
  const out = await runCheck(url);
  const svg = out.ok ? badgeSvg(label, `${out.analysis.score}/100`, badgeColor(out.analysis.score)) : badgeSvg(label, "unreachable", badgeColor(null));
  return new Response(svg, { headers });
}
