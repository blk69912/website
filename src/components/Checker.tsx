"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import type { CheckOutcome } from "@/lib/run-check";
import type { CheckResult } from "@/lib/checker";
import { CopyButton } from "./CopyButton";

const ORDER = { fail: 0, warn: 1, pass: 2 } as const;
const WORD = { pass: "Pass", warn: "Improve", fail: "Fix" } as const;

export function Checker() {
  const params = useSearchParams();
  const router = useRouter();
  const initial = params.get("url") ?? "";
  const [value, setValue] = useState(initial);
  // The result is tied to the URL it answers, so loading is derived, not stored.
  const [result, setResult] = useState<{ url: string; out: CheckOutcome } | null>(null);
  const loading = !!initial && result?.url !== initial;

  useEffect(() => {
    if (!initial) return;
    let alive = true;
    fetch(`/api/check?url=${encodeURIComponent(initial)}`)
      .then((r) => r.json() as Promise<CheckOutcome>)
      .then((out) => alive && setResult({ url: initial, out }))
      .catch(() => alive && setResult({ url: initial, out: { ok: false, error: "The checker could not be reached. Try again." } }));
    return () => {
      alive = false;
    };
  }, [initial]);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (value.trim()) router.push(`/check?url=${encodeURIComponent(value.trim())}`);
  };

  const out = loading ? undefined : result?.out;
  return (
    <div>
      <form onSubmit={submit} className="flex max-w-2xl flex-col gap-2 sm:flex-row" role="search">
        <label htmlFor="url" className="sr-only">Website address</label>
        <input id="url" name="url" className="field text-lg" placeholder="example.com" value={value} onChange={(e) => setValue(e.target.value)} autoComplete="url" inputMode="url" />
        <button className="btn shrink-0 text-lg" disabled={loading}>{loading ? "Checking…" : "Check site"}</button>
      </form>

      <div aria-live="polite" className="mt-10">
        {loading && <p className="text-muted">Fetching the page, robots.txt, llms.txt, and sitemap…</p>}
        {out && !out.ok && <p className="panel max-w-2xl border-fail p-4 text-fail">{out.error}</p>}
        {out?.ok && <Report out={out} />}
      </div>
    </div>
  );
}

function Report({ out }: { out: Extract<CheckOutcome, { ok: true }> }) {
  const { analysis: a } = out;
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const host = new URL(a.url).host;
  const badgeUrl = `${origin}/api/badge?url=${encodeURIComponent(host)}`;
  const badgeMd = `[![Agent ready](${badgeUrl})](${origin}/check?url=${encodeURIComponent(host)})`;
  const checks = [...a.checks].sort((x, y) => ORDER[x.status] - ORDER[y.status]);
  return (
    <div className="space-y-12">
      <section aria-labelledby="score" className="flex flex-wrap items-end gap-x-10 gap-y-4">
        <div>
          <h2 id="score" className="sr-only">Score</h2>
          <p className="font-mono text-sm text-muted">{a.url}</p>
          <p className="mt-1 flex items-baseline gap-3">
            <span className="text-7xl font-bold tabular-nums tracking-tight">{a.score}</span>
            <span className="text-2xl text-muted">/ 100, grade {a.grade}</span>
          </p>
        </div>
        <ScoreBar checks={a.checks} />
      </section>

      <section aria-labelledby="checks-h">
        <h2 id="checks-h" className="section-title mb-3">What to change</h2>
        <ul className="panel divide-y divide-rule">
          {checks.map((c) => (
            <li key={c.id} className="grid gap-1 p-4 sm:grid-cols-[6rem_1fr]">
              <span className={`font-semibold status-${c.status}`}>{WORD[c.status]}</span>
              <div>
                <p className="font-medium">{c.title}</p>
                <p className="text-muted">{c.detail}</p>
                {c.fix && c.status !== "pass" && <p className="prose-measure mt-1">{c.fix}</p>}
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="badge-h" className="max-w-3xl">
        <h2 id="badge-h" className="section-title mb-3">Add the badge to your README</h2>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={`/api/badge?url=${encodeURIComponent(host)}`} alt={`Agent ready score for ${host}`} height={20} />
        <pre className="code mt-3">{badgeMd}</pre>
        <div className="mt-2"><CopyButton text={badgeMd} label="Copy Markdown" /></div>
      </section>

      {a.checks.find((c) => c.id === "llms")?.status !== "pass" && (
        <section aria-labelledby="llms-h" className="max-w-3xl">
          <h2 id="llms-h" className="section-title mb-1">A starting point for /llms.txt</h2>
          <p className="mb-3 text-muted">Built from the links on your page. Edit the summary and keep the pages that matter.</p>
          <pre className="code">{out.llmsDraft}</pre>
          <div className="mt-2 flex gap-2">
            <CopyButton text={out.llmsDraft} label="Copy llms.txt" />
            <a className="btn btn-quiet text-sm" download="llms.txt" href={`data:text/markdown;charset=utf-8,${encodeURIComponent(out.llmsDraft)}`}>Download</a>
          </div>
        </section>
      )}
    </div>
  );
}

function ScoreBar({ checks }: { checks: CheckResult[] }) {
  const total = checks.reduce((s, c) => s + c.weight, 0);
  const color = { pass: "bg-pass", warn: "bg-[#d9a400]", fail: "bg-fail" } as const;
  return (
    <div className="min-w-64 flex-1" aria-hidden="true">
      <div className="flex h-3 overflow-hidden rounded-full bg-rule">
        {checks.map((c) => (
          <div key={c.id} title={c.title} className={`${color[c.status]} border-r border-surface last:border-r-0`} style={{ width: `${(c.weight / total) * 100}%` }} />
        ))}
      </div>
      <p className="mt-2 text-sm text-muted">Each segment is one check, sized by its weight.</p>
    </div>
  );
}
