"use client";
import { useMemo, useState } from "react";

export interface DirEntry { repo: string; url: string; category: string; description: string; stars: number; language: string | null; pushedAt: string; archived: boolean }

const CATS: Record<string, string> = { all: "Everything", mcp: "MCP servers and SDKs", skills: "Agent Skills", "agent-ready-web": "Agent-ready web" };

export function DirectoryList({ entries }: { entries: DirEntry[] }) {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("all");
  const [sort, setSort] = useState<"stars" | "recent">("stars");
  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    return entries
      .filter((e) => (cat === "all" || e.category === cat) && (!s || `${e.repo} ${e.description}`.toLowerCase().includes(s)))
      .sort((a, b) => (sort === "stars" ? b.stars - a.stars : b.pushedAt.localeCompare(a.pushedAt)));
  }, [entries, q, cat, sort]);
  return (
    <div>
      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-64 flex-1">
          <label htmlFor="q" className="mb-1 block text-sm font-medium">Search</label>
          <input id="q" className="field" value={q} onChange={(e) => setQ(e.target.value)} placeholder="browser, unity, docs…" />
        </div>
        <div>
          <label htmlFor="cat" className="mb-1 block text-sm font-medium">Category</label>
          <select id="cat" className="field" value={cat} onChange={(e) => setCat(e.target.value)}>
            {Object.entries(CATS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="sort" className="mb-1 block text-sm font-medium">Sort by</label>
          <select id="sort" className="field" value={sort} onChange={(e) => setSort(e.target.value as "stars" | "recent")}>
            <option value="stars">Most stars</option>
            <option value="recent">Recently updated</option>
          </select>
        </div>
      </div>
      <p className="mt-4 text-sm text-muted" aria-live="polite">{list.length} projects</p>
      <ul className="mt-2 divide-y divide-rule border-y border-rule">
        {list.map((e) => (
          <li key={e.repo} className="grid gap-1 py-4 sm:grid-cols-[1fr_8rem]">
            <div>
              <a href={e.url} className="font-semibold">{e.repo}</a>
              <span className="ml-2 text-sm text-muted">{CATS[e.category]}{e.language ? `, ${e.language}` : ""}{e.archived ? ", archived" : ""}</span>
              <p className="text-muted">{e.description || "No description."}</p>
            </div>
            <p className="tabular-nums sm:text-right">
              <span className="font-semibold">{e.stars.toLocaleString("en-US")}</span> <span className="text-sm text-muted">stars</span>
              <br />
              <span className="text-sm text-muted">updated {e.pushedAt.slice(0, 10)}</span>
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
