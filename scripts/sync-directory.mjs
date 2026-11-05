#!/usr/bin/env node
// Refreshes data/directory.generated.json from the GitHub REST API.
// Usage: GITHUB_TOKEN=... node scripts/sync-directory.mjs   (token optional, raises rate limit)
import { readFile, writeFile } from "node:fs/promises";

const root = new URL("..", import.meta.url);
const { entries } = JSON.parse(await readFile(new URL("data/directory.json", root), "utf8"));
const headers = { accept: "application/vnd.github+json", "user-agent": "agent-ready-web-directory-sync" };
if (process.env.GITHUB_TOKEN) headers.authorization = `Bearer ${process.env.GITHUB_TOKEN}`;

const seen = new Set();
const out = [];
for (const e of entries) {
  if (seen.has(e.repo.toLowerCase())) throw new Error(`Duplicate entry: ${e.repo}`);
  seen.add(e.repo.toLowerCase());
  const res = await fetch(`https://api.github.com/repos/${e.repo}`, { headers });
  if (!res.ok) {
    console.warn(`skip ${e.repo}: HTTP ${res.status}`);
    continue;
  }
  const r = await res.json();
  if (r.archived) console.warn(`note ${e.repo} is archived`);
  out.push({
    repo: r.full_name,
    url: r.html_url,
    category: e.category,
    description: (r.description ?? "").trim(),
    stars: r.stargazers_count,
    language: r.language,
    topics: (r.topics ?? []).slice(0, 6),
    pushedAt: r.pushed_at,
    archived: r.archived,
  });
}
out.sort((a, b) => b.stars - a.stars);
await writeFile(new URL("data/directory.generated.json", root), JSON.stringify({ syncedAt: new Date().toISOString(), entries: out }, null, 2) + "\n");
console.log(`wrote ${out.length} entries`);
