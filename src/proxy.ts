import { NextResponse, type NextRequest } from "next/server";

// Content negotiation: agents that prefer Markdown get the page's Markdown twin.
export function proxy(req: NextRequest) {
  const accept = req.headers.get("accept") ?? "";
  if (prefersMarkdown(accept)) {
    const url = req.nextUrl.clone();
    url.pathname = `/md${req.nextUrl.pathname === "/" ? "" : req.nextUrl.pathname}`;
    return NextResponse.rewrite(url);
  }
  return NextResponse.next();
}

export function prefersMarkdown(accept: string): boolean {
  let md = 0, html = 0;
  for (const part of accept.split(",")) {
    const [type, ...params] = part.trim().toLowerCase().split(";");
    const q = Number(params.find((p) => p.trim().startsWith("q="))?.split("=")[1] ?? 1);
    if (type === "text/markdown" || type === "text/x-markdown") md = Math.max(md, q);
    if (type === "text/html") html = Math.max(html, q);
  }
  return md > 0 && md >= html;
}

export const config = {
  matcher: ["/((?!api|md|w/|_next|.*\\..*).*)"],
};
