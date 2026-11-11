import { PAGES, SITE } from "@/content/site";

export function GET() {
  const link = (p: (typeof PAGES)[number]) => `- [${p.title}](${SITE.url}${p.path}): ${p.summary}`;
  const body = [
    `# ${SITE.name}`,
    "",
    `> ${SITE.tagline} Every page is also served as Markdown when the request sends Accept: text/markdown.`,
    "",
    "## Pages",
    "",
    ...PAGES.filter((p) => p.group === "main").map(link),
    "",
    "## Tools",
    "",
    ...PAGES.filter((p) => p.group === "tools").map(link),
    "",
    "## API",
    "",
    `- [Checker JSON](${SITE.url}/api/check?url=example.com): add format=md for Markdown`,
    `- [Checker badge](${SITE.url}/api/badge?url=example.com): SVG for README files`,
    `- [GET-only services](${SITE.url}/get): key-value, counters, notes, and pastes over GET`,
    "",
    "## Optional",
    "",
    ...PAGES.filter((p) => p.group === "play").map(link),
    `- [Source code](${SITE.repo})`,
    `- [JSON Resume](${SITE.url}/resume.json)`,
    "",
  ].join("\n");
  return new Response(body, { headers: { "content-type": "text/markdown; charset=utf-8" } });
}
