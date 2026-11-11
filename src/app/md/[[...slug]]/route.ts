import { pageFor, PAGES, SITE } from "@/content/site";

export function generateStaticParams() {
  return PAGES.map((p) => ({ slug: p.path === "/" ? [] : p.path.slice(1).split("/") }));
}

export async function GET(_req: Request, ctx: RouteContext<"/md/[[...slug]]">) {
  const { slug } = await ctx.params;
  const path = "/" + (slug ?? []).join("/");
  const page = pageFor(path);
  if (!page) return new Response(`# Not found\n\nNo page at ${path}. See ${SITE.url}/llms.txt for the index.\n`, { status: 404, headers: { "content-type": "text/markdown; charset=utf-8" } });
  const body = `# ${page.title}\n\n> ${page.summary}\n\n${page.md}\n\nHuman version: ${SITE.url}${page.path}\nIndex: ${SITE.url}/llms.txt\n`;
  return new Response(body, { headers: { "content-type": "text/markdown; charset=utf-8", vary: "accept" } });
}
