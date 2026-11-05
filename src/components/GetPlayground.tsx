"use client";
import { useState, useSyncExternalStore } from "react";

const EXAMPLES = (ns: string) => [
  { label: "Store a value", path: `/w/kv/${ns}/status?set=reviewing PR 42` },
  { label: "Read it back", path: `/w/kv/${ns}/status` },
  { label: "Count a step", path: `/w/count/${ns}/steps?inc=1` },
  { label: "Append a note", path: `/w/note/${ns}?add=tests pass on main` },
  { label: "List notes", path: `/w/note/${ns}` },
  { label: "Make a paste", path: `/w/paste?text=hello from a sandbox` },
];

// A per-visit namespace that exists only in the browser.
let visitNs = "";
const getNs = () => (visitNs ||= `try-${Array.from(crypto.getRandomValues(new Uint8Array(6)), (b) => b.toString(16).padStart(2, "0")).join("")}`);
const noop = () => () => {};

export function GetPlayground() {
  const ns = useSyncExternalStore(noop, getNs, () => "your-namespace");
  const [pick, setPick] = useState(0);
  const [edited, setEdited] = useState<string | null>(null);
  const path = edited ?? EXAMPLES(ns)[pick].path;
  const setPath = (p: string) => setEdited(p);
  const [out, setOut] = useState<{ status: number; body: string } | null>(null);
  const run = async () => {
    const r = await fetch(path);
    setOut({ status: r.status, body: await r.text() });
  };
  return (
    <div className="panel p-5">
      <p className="text-sm text-muted">Your namespace for this visit is <code className="inline">{ns}</code>.</p>
      <div className="mt-3 flex flex-wrap gap-1">
        {EXAMPLES(ns).map((e, k) => (
          <button key={e.label} className="btn btn-quiet text-sm" onClick={() => { setPick(k); setEdited(null); }}>{e.label}</button>
        ))}
      </div>
      <form className="mt-3 flex flex-col gap-2 sm:flex-row" onSubmit={(e) => { e.preventDefault(); run(); }}>
        <label htmlFor="gp" className="sr-only">Request path</label>
        <span className="hidden self-center font-mono text-sm text-muted sm:block">GET</span>
        <input id="gp" className="field font-mono text-sm" value={path} onChange={(e) => setPath(e.target.value)} spellCheck={false} />
        <button className="btn shrink-0">Send</button>
      </form>
      {out && <pre className="code mt-3" aria-live="polite">{`HTTP ${out.status}\n\n${out.body}`}</pre>}
    </div>
  );
}
