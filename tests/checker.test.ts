import { describe, expect, it } from "vitest";
import { analyze, draftLlmsTxt, isRootBlocked, parseRobots, looksLikeLlmsTxt, analysisToMarkdown } from "@/lib/checker";
import { badgeSvg, badgeColor } from "@/lib/badge";

const goodHtml = `<!doctype html><html lang="en"><head><title>Acme Docs | Acme</title>
<meta name="description" content="Guides and API reference for the Acme payments platform.">
<script type="application/ld+json">{"@context":"https://schema.org","@type":"WebSite","name":"Acme"}</script>
</head><body><h1>Acme Docs</h1><p>${"Readable server-rendered content. ".repeat(30)}</p>
<a href="/guides">Guides</a><a href="https://other.example/x">External</a><a href="#top">Top</a></body></html>`;

describe("robots parsing", () => {
  it("blocks a named agent with Disallow: /", () => {
    const g = parseRobots("User-agent: GPTBot\nDisallow: /\n\nUser-agent: *\nAllow: /");
    expect(isRootBlocked(g, "GPTBot")).toBe(true);
    expect(isRootBlocked(g, "ClaudeBot")).toBe(false);
  });
  it("groups consecutive user-agent lines", () => {
    const g = parseRobots("User-agent: ClaudeBot\nUser-agent: GPTBot\nDisallow: /");
    expect(isRootBlocked(g, "ClaudeBot")).toBe(true);
    expect(isRootBlocked(g, "gptbot")).toBe(true);
  });
  it("treats empty Disallow as allow-all and longer Allow as winning", () => {
    expect(isRootBlocked(parseRobots("User-agent: *\nDisallow:"), "GPTBot")).toBe(false);
    expect(isRootBlocked(parseRobots("User-agent: *\nDisallow: /private"), "GPTBot")).toBe(false);
    expect(isRootBlocked(parseRobots("User-agent: *\nDisallow: /\nAllow: /"), "GPTBot")).toBe(false);
  });
});

describe("analyze", () => {
  it("scores a well-formed site highly", () => {
    const a = analyze({ url: "https://acme.example/", status: 200, contentType: "text/html", html: goodHtml, robotsTxt: "User-agent: *\nAllow: /\nSitemap: https://acme.example/sitemap.xml", llmsTxt: "# Acme\n\n> Payments", sitemapFound: true, markdownNegotiated: true });
    expect(a.score).toBe(100);
    expect(a.grade).toBe("A");
    expect(a.page.links.map((l) => l.href)).toEqual(["https://acme.example/guides"]);
  });
  it("flags a client-rendered shell", () => {
    const a = analyze({ url: "https://spa.example/", status: 200, contentType: "text/html", html: '<html><head><title>App</title></head><body><div id="root"></div><script>render()</script></body></html>', robotsTxt: null, llmsTxt: null, sitemapFound: false, markdownNegotiated: false });
    expect(a.checks.find((c) => c.id === "ssr")?.status).toBe("fail");
    expect(a.checks.find((c) => c.id === "llms")?.status).toBe("fail");
    expect(a.score).toBeLessThan(40);
    expect(analysisToMarkdown(a)).toContain("FAIL");
  });
  it("rejects an HTML page served at /llms.txt", () => {
    expect(looksLikeLlmsTxt("<!doctype html><html>", "text/html")).toBe(false);
    expect(looksLikeLlmsTxt("# Site\n> x", "text/plain")).toBe(true);
  });
  it("drafts an llms.txt with same-origin links", () => {
    const a = analyze({ url: "https://acme.example/", status: 200, contentType: "text/html", html: goodHtml, robotsTxt: null, llmsTxt: null, sitemapFound: false, markdownNegotiated: false });
    const d = draftLlmsTxt(a);
    expect(d.startsWith("# Acme Docs\n")).toBe(true);
    expect(d).toContain("- [Guides](https://acme.example/guides)");
    expect(d).not.toContain("other.example");
  });
});

describe("badge", () => {
  it("renders escaped SVG", () => {
    const s = badgeSvg("agent ready", "92/100 <A>", badgeColor(92));
    expect(s).toContain("<svg");
    expect(s).toContain("&lt;A&gt;");
    expect(s).toContain("#1f7a4d");
  });
});
