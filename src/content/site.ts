// One registry drives navigation, sitemap.xml, /llms.txt, and the Markdown twins.
export const SITE = {
  name: "Agent Ready",
  tagline: "Tools for building a web that people and AI agents can both read.",
  repo: "https://github.com/blk69912/website",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "http://localhost:3000"),
};

export interface PageEntry {
  path: string;
  title: string;
  nav: string;
  summary: string;
  group: "main" | "tools" | "play";
  md: string;
}

export const PAGES: PageEntry[] = [
  {
    path: "/",
    title: "Agent Ready",
    nav: "Home",
    group: "main",
    summary: "Check whether a website works for AI agents, and use small tools for building agents.",
    md: `Agent Ready is an open-source collection of tools for the agent-readable web.

- Check any site's agent readiness at /check and get a README badge.
- Use browser-only developer tools for agent builders at /tools.
- Learn how a tool-calling agent works, step by step, at /learn.
- Browse MCP servers and Agent Skills at /directory.
- Store notes, counters, and pastes with nothing but GET requests at /get.
- Fork the agent-aware portfolio template at /portfolio.
- Play the HTTP status and prompt-injection games at /play.

Every page on this site is also available as Markdown: send \`Accept: text/markdown\`.`,
  },
  {
    path: "/check",
    title: "Agent-Ready Checker",
    nav: "Checker",
    group: "main",
    summary: "Score a website on how well AI agents can fetch and understand it, and get a fix list, a draft llms.txt, and a badge.",
    md: `Enter a URL and the checker fetches the page, robots.txt, llms.txt, and sitemap.xml, then scores ten checks.

API for agents:

- \`GET /api/check?url=example.com\` returns JSON.
- \`GET /api/check?url=example.com&format=md\` returns a Markdown report.
- \`GET /api/badge?url=example.com\` returns an SVG badge for a README.

Checks: plain GET works, /llms.txt exists, robots.txt policy for AI agents, sitemap, server-rendered text, title and description, lang attribute, JSON-LD, a single H1, Markdown content negotiation.`,
  },
  { path: "/tools", title: "Agent Dev Tools", nav: "Tools", group: "main", summary: "Browser-only tools for people who build agents. Nothing you paste leaves your machine.", md: "A set of small tools that run entirely in the browser: token estimate, prompt diff, trace viewer, MCP validator, Skill linter, and cost estimator." },
  { path: "/tools/tokens", title: "Token estimator", nav: "Tokens", group: "tools", summary: "Estimate how many tokens a prompt uses, including Japanese, Chinese, and Korean text.", md: "Paste text to see an estimated token count, characters, words, and lines. The estimate is a heuristic; use your provider's count-tokens endpoint for exact numbers." },
  { path: "/tools/diff", title: "Prompt diff", nav: "Diff", group: "tools", summary: "Compare two versions of a prompt line by line or word by word.", md: "Paste two prompt versions to see what changed, with added and removed lines highlighted and a token delta." },
  { path: "/tools/trace", title: "Trace viewer", nav: "Trace", group: "tools", summary: "Turn an agent transcript in JSONL into a readable timeline of messages, tool calls, and results.", md: "Accepts JSONL or a JSON array in Anthropic Messages, Claude Code transcript, or OpenAI chat formats. Shows a timeline, tool-call counts, errors, and token usage." },
  { path: "/tools/mcp", title: "MCP validator", nav: "MCP", group: "tools", summary: "Validate MCP tool definitions and client config files before you ship them.", md: "Paste a tools/list result, a tools array, a single tool, or an mcpServers config. Reports missing descriptions, schema mistakes, duplicate names, and leaked secrets." },
  { path: "/tools/skill", title: "Skill linter", nav: "Skill", group: "tools", summary: "Lint a SKILL.md file: frontmatter rules, description quality, and body length.", md: "Paste a SKILL.md file. Checks the name format, description length and trigger wording, reserved words, XML tags, unknown keys, and body length." },
  { path: "/tools/cost", title: "Cost estimator", nav: "Cost", group: "tools", summary: "Estimate per-request, daily, and monthly model costs with prompt caching.", md: "Choose a model preset or enter your own prices per million tokens, then set token counts, request volume, and cache hit share." },
  { path: "/learn", title: "How agents work", nav: "Learn", group: "main", summary: "An interactive walk through the tool-calling loop, the context window, and MCP, in English and Japanese.", md: "Step through a real-shaped agent run: the request, each tool call, each result, and the final answer, while watching the context window fill. Then see what compaction does, and how MCP connects tools." },
  { path: "/directory", title: "Directory", nav: "Directory", group: "main", summary: "A living list of MCP servers, Agent Skills, and agent-ready web projects, refreshed from GitHub.", md: "Search and filter MCP servers, Agent Skills collections, and agent-ready web projects. Add one with a one-line pull request to data/directory.json." },
  {
    path: "/get",
    title: "GET-only web services",
    nav: "GET-only",
    group: "main",
    summary: "Key-value storage, counters, notes, and pastes that work with nothing but GET requests, for agents whose sandbox only allows web fetch.",
    md: `Every endpoint is a plain GET. Responses are plain text unless you add \`format=json\`. Data expires after 7 days. Anyone who knows a URL can read it, so do not store secrets.

- \`GET /w/kv/{namespace}/{key}?set={value}\` stores a value. Without \`set\`, returns it. \`?delete=1\` removes it.
- \`GET /w/count/{namespace}/{name}?inc=1\` increments and returns a counter.
- \`GET /w/note/{namespace}?add={text}\` appends a note. Without \`add\`, lists notes.
- \`GET /w/paste?text={text}\` stores a paste and returns its URL. \`GET /w/p/{id}\` reads it.

A namespace is 8-64 characters of letters, digits, dash, or underscore.`,
  },
  { path: "/portfolio", title: "Portfolio template", nav: "Portfolio", group: "main", summary: "A portfolio page that ships with llms.txt, JSON Resume, JSON-LD, and generated social images. Fork it and edit one JSON file.", md: "The portfolio template renders from content/profile.json. The same data is published as JSON Resume at /resume.json, as schema.org Person JSON-LD, and in /llms.txt." },
  { path: "/play", title: "Play", nav: "Play", group: "main", summary: "Two short games: guess the HTTP status code, and spot the prompt injection.", md: "Games for developers. Each round takes about a minute." },
  { path: "/play/status", title: "HTTP status quiz", nav: "Status quiz", group: "play", summary: "Match situations to HTTP status codes.", md: "Ten rounds. Each round describes a situation; choose the status code a well-behaved server should return." },
  { path: "/play/injection", title: "Spot the injection", nav: "Injection", group: "play", summary: "Decide which tool results try to hijack an agent.", md: "Each round shows content an agent fetched while working. Decide whether it is ordinary data or a prompt injection, then read why." },
];

export const pageFor = (path: string) => PAGES.find((p) => p.path === path);
