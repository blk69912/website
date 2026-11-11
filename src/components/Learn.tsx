"use client";
import { useState } from "react";
import { LOOP_STEPS, MCP_FLOW, UI, type Lang } from "@/content/learn";

const ACTOR_COLOR = { user: "bg-ink text-paper", harness: "bg-muted text-paper", model: "bg-signal text-white", tool: "bg-pass text-white" } as const;
const ACTORS = ["user", "harness", "model", "tool"] as const;

export function Learn() {
  const [lang, setLang] = useState<Lang>("en");
  const [i, setI] = useState(0);
  const [windowK, setWindowK] = useState(200);
  const [extra, setExtra] = useState(0);
  const t = (k: keyof typeof UI) => UI[k][lang];
  const step = LOOP_STEPS[i];
  const used = LOOP_STEPS.slice(0, i + 1).reduce((s, x) => s + x.tokens, 0);

  return (
    <div lang={lang} className="max-w-5xl">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="page-title">{t("title")}</h1>
          <p className="prose-measure mt-2 text-lg text-muted">{t("intro")}</p>
        </div>
        <div role="group" aria-label="Language" className="flex gap-1">
          {(["en", "ja"] as const).map((l) => (
            <button key={l} className={`btn ${lang === l ? "" : "btn-quiet"} text-sm`} aria-pressed={lang === l} onClick={() => setLang(l)}>
              {l === "en" ? "English" : "日本語"}
            </button>
          ))}
        </div>
      </div>

      {/* Actor lanes */}
      <section className="mt-10" aria-label={t("title")}>
        <div className="grid grid-cols-4 gap-2" aria-hidden="true">
          {ACTORS.map((a) => (
            <div key={a} className={`rounded-md px-3 py-2 text-center text-sm font-semibold transition-opacity ${ACTOR_COLOR[a]} ${step.actor === a ? "opacity-100" : "opacity-25"}`}>
              {t(`actor_${a}` as keyof typeof UI)}
            </div>
          ))}
        </div>

        <div className="panel mt-4 grid gap-6 p-6 md:grid-cols-2" aria-live="polite">
          <div>
            <p className="text-sm text-muted">{t("step")} {i + 1} {t("of")} {LOOP_STEPS.length}</p>
            <h2 className="section-title mt-1">{step.title[lang]}</h2>
            <p className="mt-3 leading-relaxed">{step.explain[lang]}</p>
          </div>
          <pre className="code self-start">{step.body}</pre>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <button className="btn btn-quiet" onClick={() => setI(Math.max(0, i - 1))} disabled={i === 0}>{t("back")}</button>
          {i < LOOP_STEPS.length - 1 ? (
            <button className="btn" onClick={() => setI(i + 1)}>{t("next")}</button>
          ) : (
            <button className="btn" onClick={() => setI(0)}>{t("restart")}</button>
          )}
          <ol className="ml-2 flex gap-1" aria-hidden="true">
            {LOOP_STEPS.map((s, k) => (
              <li key={k} className={`h-2 w-5 rounded-full ${k <= i ? "bg-signal" : "bg-rule"}`} />
            ))}
          </ol>
        </div>

        <ContextBar label={t("context")} used={used} capacity={windowK * 1000} segments={LOOP_STEPS.slice(0, i + 1).map((s) => ({ tokens: s.tokens, actor: s.actor }))} />
        <label className="mt-2 flex items-center gap-2 text-sm text-muted">
          {t("windowSize")}
          <select className="field w-auto py-1" value={windowK} onChange={(e) => setWindowK(Number(e.target.value))}>
            {[8, 32, 200, 1000].map((k) => <option key={k} value={k}>{k >= 1000 ? `${k / 1000}M` : `${k}K`}</option>)}
          </select>
        </label>
      </section>

      <Compaction lang={lang} extra={extra} setExtra={setExtra} />

      <section className="mt-16" aria-labelledby="mcp-h">
        <h2 id="mcp-h" className="section-title">{t("mcpTitle")}</h2>
        <p className="prose-measure mt-2 text-muted">{t("mcpBody")}</p>
        <ol className="mt-5 space-y-2">
          {MCP_FLOW.map((f, k) => (
            <li key={k} className="grid items-center gap-2 sm:grid-cols-[6rem_2rem_6rem_1fr]">
              <span className="font-semibold">{f.from}</span>
              <span aria-label="to" className="text-muted">to</span>
              <span className="font-semibold">{f.to}</span>
              <span className="font-mono text-sm">{f.label[lang]}</span>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}

function ContextBar({ label, used, capacity, segments }: { label: string; used: number; capacity: number; segments: { tokens: number; actor: keyof typeof ACTOR_COLOR }[] }) {
  const pct = Math.min(100, (used / capacity) * 100);
  return (
    <div className="mt-8">
      <div className="flex justify-between text-sm">
        <span className="font-medium">{label}</span>
        <span className="tabular-nums text-muted">{used.toLocaleString("en-US")} / {capacity.toLocaleString("en-US")} ({pct.toFixed(pct < 10 ? 1 : 0)}%)</span>
      </div>
      <div className="mt-1 flex h-4 overflow-hidden rounded bg-rule" role="meter" aria-valuemin={0} aria-valuemax={capacity} aria-valuenow={used} aria-label={label}>
        {segments.map((s, k) => (
          <div key={k} className={`${ACTOR_COLOR[s.actor].split(" ")[0]} border-r border-white/40`} style={{ width: `${Math.min(100, (s.tokens / capacity) * 100)}%` }} />
        ))}
      </div>
    </div>
  );
}

function Compaction({ lang, extra, setExtra }: { lang: Lang; extra: number; setExtra: (n: number) => void }) {
  const t = (k: keyof typeof UI) => UI[k][lang];
  const capacity = 200_000, threshold = 150_000, base = 5_570, perRound = 6_000, summary = 4_000;
  let kept = base, compactions = 0;
  for (let r = 0; r < extra; r++) {
    kept += perRound;
    if (kept > threshold) { kept = base + summary; compactions++; }
  }
  const compacted = compactions > 0;
  return (
    <section className="mt-16" aria-labelledby="compact-h">
      <h2 id="compact-h" className="section-title">{t("compactTitle")}</h2>
      <p className="prose-measure mt-2 text-muted">{t("compactBody")}</p>
      <label htmlFor="rounds" className="mt-4 block text-sm font-medium">{t("rounds")}: {extra}</label>
      <input id="rounds" type="range" min={0} max={40} value={extra} onChange={(e) => setExtra(Number(e.target.value))} className="w-full max-w-md accent-[#2346d8]" />
      <div className="relative mt-3 h-6 max-w-3xl overflow-hidden rounded bg-rule">
        <div className={`h-full ${compacted ? "bg-pass" : "bg-signal"}`} style={{ width: `${(Math.min(kept, capacity) / capacity) * 100}%` }} />
        <div className="absolute inset-y-0 border-l-2 border-dashed border-fail" style={{ left: `${(threshold / capacity) * 100}%` }} aria-hidden="true" />
      </div>
      <p className="mt-2 text-sm text-muted" aria-live="polite">
        {kept.toLocaleString("en-US")} / {capacity.toLocaleString("en-US")} tokens{compacted ? `. ${t("compacted")} (${compactions}×)` : ""}
      </p>
    </section>
  );
}
