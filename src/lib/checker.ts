// Pure analysis for the Agent-Ready Checker. No network here: see fetcher.ts.

export type Status = "pass" | "warn" | "fail";

export interface CheckResult {
  id: string;
  title: string;
  status: Status;
  weight: number;
  detail: string;
  fix?: string;
}

export interface Artifacts {
  url: string;
  status: number;
  contentType: string;
  html: string;
  robotsTxt: string | null;
  llmsTxt: string | null;
  llmsTxtContentType?: string;
  sitemapFound: boolean;
  markdownNegotiated: boolean;
}

export interface Analysis {
  url: string;
  score: number;
  grade: string;
  checks: CheckResult[];
  page: PageInfo;
}

export interface PageInfo {
  title: string;
  description: string;
  lang: string;
  h1: string[];
  links: { href: string; text: string }[];
  textLength: number;
}

export const AI_AGENTS = [
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  "ClaudeBot",
  "Claude-User",
  "Claude-SearchBot",
  "anthropic-ai",
  "PerplexityBot",
  "Google-Extended",
  "Applebot-Extended",
  "CCBot",
] as const;

const decode = (s: string) =>
  s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();

function attr(tag: string, name: string): string | null {
  const m = tag.match(new RegExp(`\\b${name}\\s*=\\s*("([^"]*)"|'([^']*)'|([^\\s>]+))`, "i"));
  return m ? decode(m[2] ?? m[3] ?? m[4] ?? "") : null;
}

function metaContent(html: string, key: string): string {
  for (const tag of html.match(/<meta\b[^>]*>/gi) ?? []) {
    const k = (attr(tag, "name") ?? attr(tag, "property") ?? "").toLowerCase();
    if (k === key) return attr(tag, "content") ?? "";
  }
  return "";
}

export function visibleText(html: string): string {
  return decode(
    html
      .replace(/<(script|style|noscript|template|svg)\b[\s\S]*?<\/\1>/gi, " ")
      .replace(/<!--[\s\S]*?-->/g, " ")
      .replace(/<[^>]+>/g, " "),
  );
}

export function extractPage(html: string, base: string): PageInfo {
  const title = decode(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? "");
  const htmlTag = html.match(/<html\b[^>]*>/i)?.[0] ?? "";
  const h1 = [...html.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/gi)].map((m) => visibleText(m[1])).filter(Boolean);
  const links: PageInfo["links"] = [];
  for (const m of html.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/gi)) {
    const href = attr(`<a ${m[1]}>`, "href");
    const text = visibleText(m[2]);
    if (!href || !text || href.startsWith("#") || /^(javascript|mailto|tel):/i.test(href)) continue;
    try {
      const abs = new URL(href, base);
      if (abs.origin !== new URL(base).origin) continue;
      if (!links.some((l) => l.href === abs.href)) links.push({ href: abs.href, text: text.slice(0, 80) });
    } catch {
      /* ignore malformed */
    }
  }
  return {
    title,
    description: metaContent(html, "description") || metaContent(html, "og:description"),
    lang: attr(htmlTag, "lang") ?? "",
    h1,
    links: links.slice(0, 40),
    textLength: visibleText(html).length,
  };
}

/** Parse robots.txt into user-agent groups. */
export function parseRobots(txt: string): { agents: string[]; rules: { allow: boolean; path: string }[] }[] {
  const groups: { agents: string[]; rules: { allow: boolean; path: string }[] }[] = [];
  let current: (typeof groups)[number] | null = null;
  let lastWasAgent = false;
  for (const raw of txt.split(/\r?\n/)) {
    const line = raw.replace(/#.*/, "").trim();
    const m = line.match(/^([A-Za-z-]+)\s*:\s*(.*)$/);
    if (!m) continue;
    const key = m[1].toLowerCase();
    const val = m[2].trim();
    if (key === "user-agent") {
      if (!current || !lastWasAgent) {
        current = { agents: [], rules: [] };
        groups.push(current);
      }
      current.agents.push(val.toLowerCase());
      lastWasAgent = true;
    } else if ((key === "allow" || key === "disallow") && current) {
      if (val || key === "allow") current.rules.push({ allow: key === "allow", path: val });
      lastWasAgent = false;
    } else {
      lastWasAgent = false;
    }
  }
  return groups;
}

/** Is the site root blocked for this agent? Uses longest-match semantics on "/". */
export function isRootBlocked(groups: ReturnType<typeof parseRobots>, agent: string): boolean {
  const a = agent.toLowerCase();
  const group = groups.find((g) => g.agents.includes(a)) ?? groups.find((g) => g.agents.includes("*"));
  if (!group) return false;
  let best: { allow: boolean; len: number } | null = null;
  for (const r of group.rules) {
    if (r.path === "" && r.allow) continue;
    if ("/".startsWith(r.path) || r.path === "/" || r.path === "/*") {
      const len = r.path.length;
      if (!best || len > best.len || (len === best.len && r.allow)) best = { allow: r.allow, len };
    }
  }
  return best ? !best.allow : false;
}

function jsonLdTypes(html: string): string[] {
  const types: string[] = [];
  for (const m of html.matchAll(/<script\b[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      const walk = (v: unknown) => {
        if (Array.isArray(v)) v.forEach(walk);
        else if (v && typeof v === "object") {
          const o = v as Record<string, unknown>;
          if (typeof o["@type"] === "string") types.push(o["@type"]);
          if (Array.isArray(o["@type"])) types.push(...(o["@type"] as string[]));
          if (o["@graph"]) walk(o["@graph"]);
        }
      };
      walk(JSON.parse(m[1]));
    } catch {
      types.push("(invalid JSON-LD)");
    }
  }
  return types;
}

export function looksLikeLlmsTxt(txt: string, contentType = ""): boolean {
  if (/text\/html/i.test(contentType)) return false;
  const t = txt.trim();
  return t.startsWith("# ") && !/^<!doctype|<html/i.test(t);
}

export function analyze(a: Artifacts): Analysis {
  const page = extractPage(a.html, a.url);
  const checks: CheckResult[] = [];
  const add = (c: CheckResult) => checks.push(c);

  add(
    a.status >= 200 && a.status < 300
      ? { id: "reachable", title: "Page responds to a plain GET", status: "pass", weight: 10, detail: `HTTP ${a.status}, ${a.contentType || "no content-type"}` }
      : { id: "reachable", title: "Page responds to a plain GET", status: "fail", weight: 10, detail: `HTTP ${a.status}`, fix: "Agents give up on non-2xx responses. Serve the page without requiring cookies, JavaScript challenges, or login." },
  );

  const hasLlms = a.llmsTxt !== null && looksLikeLlmsTxt(a.llmsTxt, a.llmsTxtContentType);
  add(
    hasLlms
      ? { id: "llms", title: "Publishes /llms.txt", status: "pass", weight: 15, detail: `${a.llmsTxt!.split("\n").length} lines` }
      : { id: "llms", title: "Publishes /llms.txt", status: "fail", weight: 15, detail: "No Markdown file found at /llms.txt", fix: "Add /llms.txt: an H1 with the site name, a one-line summary in a blockquote, then lists of links to your key pages. A draft is generated below." },
  );

  if (a.robotsTxt === null) {
    add({ id: "robots", title: "robots.txt states a policy for AI agents", status: "warn", weight: 10, detail: "No robots.txt found, so every crawler is allowed by default", fix: "Add robots.txt and name the AI agents you allow or block, so the choice is explicit." });
  } else {
    const groups = parseRobots(a.robotsTxt);
    const blocked = AI_AGENTS.filter((ag) => isRootBlocked(groups, ag));
    const named = AI_AGENTS.filter((ag) => groups.some((g) => g.agents.includes(ag.toLowerCase())));
    if (blocked.length === AI_AGENTS.length)
      add({ id: "robots", title: "robots.txt states a policy for AI agents", status: "fail", weight: 10, detail: "Every known AI agent is blocked from /", fix: "If you want to be cited by assistants, allow at least the user-triggered fetchers such as Claude-User and ChatGPT-User." });
    else if (blocked.length > 0)
      add({ id: "robots", title: "robots.txt states a policy for AI agents", status: "warn", weight: 10, detail: `Blocked: ${blocked.join(", ")}`, fix: "Partial blocks are fine if deliberate. Check that user-triggered fetchers are allowed." });
    else
      add({ id: "robots", title: "robots.txt states a policy for AI agents", status: named.length ? "pass" : "pass", weight: 10, detail: named.length ? `Explicit rules for ${named.length} AI agents, none blocked` : "No AI agent is blocked" });
  }

  add(
    a.sitemapFound
      ? { id: "sitemap", title: "Has a sitemap", status: "pass", weight: 5, detail: "Found via robots.txt or /sitemap.xml" }
      : { id: "sitemap", title: "Has a sitemap", status: "warn", weight: 5, detail: "No sitemap found", fix: "Publish /sitemap.xml and reference it from robots.txt." },
  );

  const textOk = page.textLength >= 400;
  add(
    textOk
      ? { id: "ssr", title: "Content is in the HTML, not only in JavaScript", status: "pass", weight: 20, detail: `${page.textLength.toLocaleString("en-US")} characters of readable text without running scripts` }
      : { id: "ssr", title: "Content is in the HTML, not only in JavaScript", status: page.textLength >= 100 ? "warn" : "fail", weight: 20, detail: `Only ${page.textLength} characters of readable text before JavaScript runs`, fix: "Most fetch tools do not execute JavaScript. Server-render or prerender the main content." },
  );

  const titleOk = page.title.length >= 5;
  const descOk = page.description.length >= 30;
  add(
    titleOk && descOk
      ? { id: "meta", title: "Title and description explain the page", status: "pass", weight: 10, detail: `"${page.title.slice(0, 70)}"` }
      : { id: "meta", title: "Title and description explain the page", status: titleOk || descOk ? "warn" : "fail", weight: 10, detail: `${titleOk ? "Title present" : "Title missing"}, ${descOk ? "description present" : "description missing or shorter than 30 characters"}`, fix: "Add a <title> and a meta description that say what the page is for in plain words." },
  );

  add(
    page.lang
      ? { id: "lang", title: "Declares the page language", status: "pass", weight: 5, detail: `lang="${page.lang}"` }
      : { id: "lang", title: "Declares the page language", status: "warn", weight: 5, detail: "No lang attribute on <html>", fix: 'Add lang="en" (or your language) to the <html> element.' },
  );

  const types = jsonLdTypes(a.html);
  const validTypes = types.filter((t) => t !== "(invalid JSON-LD)");
  add(
    validTypes.length
      ? { id: "jsonld", title: "Structured data (JSON-LD)", status: types.length === validTypes.length ? "pass" : "warn", weight: 10, detail: `Types: ${[...new Set(validTypes)].slice(0, 6).join(", ")}` }
      : { id: "jsonld", title: "Structured data (JSON-LD)", status: types.length ? "fail" : "warn", weight: 10, detail: types.length ? "JSON-LD present but does not parse" : "No JSON-LD found", fix: "Describe the page with schema.org JSON-LD such as WebSite, Organization, Article, or Product." },
  );

  add(
    page.h1.length === 1
      ? { id: "headings", title: "One clear H1", status: "pass", weight: 5, detail: `"${page.h1[0].slice(0, 70)}"` }
      : { id: "headings", title: "One clear H1", status: "warn", weight: 5, detail: page.h1.length ? `${page.h1.length} H1 elements` : "No H1", fix: "Use exactly one H1 that names the page, so summaries start in the right place." },
  );

  add(
    a.markdownNegotiated
      ? { id: "markdown", title: "Serves Markdown on request", status: "pass", weight: 10, detail: "Returns text/markdown for Accept: text/markdown" }
      : { id: "markdown", title: "Serves Markdown on request", status: "warn", weight: 10, detail: "Returns HTML even when Markdown is requested", fix: "Return a Markdown version when the Accept header prefers text/markdown, or link a .md twin of each page." },
  );

  const total = checks.reduce((s, c) => s + c.weight, 0);
  const got = checks.reduce((s, c) => s + (c.status === "pass" ? c.weight : c.status === "warn" ? c.weight / 2 : 0), 0);
  const score = Math.round((got / total) * 100);
  return { url: a.url, score, grade: grade(score), checks, page };
}

export function grade(score: number): string {
  if (score >= 90) return "A";
  if (score >= 75) return "B";
  if (score >= 60) return "C";
  if (score >= 40) return "D";
  return "F";
}

/** Draft an llms.txt from what we learned about the page. */
export function draftLlmsTxt(an: Analysis): string {
  const origin = new URL(an.url).origin;
  const name = an.page.title.split(/\s[|\-–—]\s/)[0] || new URL(an.url).hostname;
  const lines = [`# ${name}`, "", `> ${an.page.description || "One sentence on what this site is and who it is for."}`, ""];
  const links = an.page.links.filter((l) => l.href !== an.url && l.href !== origin + "/").slice(0, 15);
  lines.push("## Pages", "");
  if (links.length) for (const l of links) lines.push(`- [${l.text}](${l.href})`);
  else lines.push(`- [Home](${origin}/): Start here`);
  lines.push("", "## Optional", "", `- [Sitemap](${origin}/sitemap.xml)`);
  return lines.join("\n") + "\n";
}

export function analysisToMarkdown(an: Analysis): string {
  const icon = { pass: "PASS", warn: "WARN", fail: "FAIL" } as const;
  const out = [`# Agent-readiness report for ${an.url}`, "", `Score: **${an.score}/100** (grade ${an.grade})`, ""];
  for (const c of an.checks) {
    out.push(`- ${icon[c.status]} ${c.title}: ${c.detail}`);
    if (c.fix && c.status !== "pass") out.push(`  - Fix: ${c.fix}`);
  }
  return out.join("\n") + "\n";
}
