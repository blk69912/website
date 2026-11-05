"use client";
import { useMemo, useState } from "react";
import { diffLines, diffWords } from "@/lib/diff";
import { estimateTokens } from "@/lib/tokens";

const A = "You are a helpful assistant.\nAnswer in detail.\nAlways use bullet points.\nNever mention competitors.";
const B = "You are a concise support agent for Acme.\nAnswer in two sentences or fewer.\nUse bullet points only for steps.\nNever mention competitors.";

export function DiffTool() {
  const [a, setA] = useState(A);
  const [b, setB] = useState(B);
  const [mode, setMode] = useState<"lines" | "words">("lines");
  const ops = useMemo(() => (mode === "lines" ? diffLines(a, b) : diffWords(a, b)), [a, b, mode]);
  const delta = estimateTokens(b).tokens - estimateTokens(a).tokens;
  const added = ops.filter((o) => o.type === "add").length;
  const removed = ops.filter((o) => o.type === "del").length;
  return (
    <div>
      <div className="grid gap-4 md:grid-cols-2">
        <div><label htmlFor="a" className="mb-1 block font-medium">Before</label><textarea id="a" className="field" value={a} onChange={(e) => setA(e.target.value)} /></div>
        <div><label htmlFor="b" className="mb-1 block font-medium">After</label><textarea id="b" className="field" value={b} onChange={(e) => setB(e.target.value)} /></div>
      </div>
      <div className="mt-6 flex flex-wrap items-center gap-4">
        <fieldset className="flex gap-1" aria-label="Compare by">
          {(["lines", "words"] as const).map((m) => (
            <label key={m} className={`btn ${mode === m ? "" : "btn-quiet"} text-sm`}>
              <input type="radio" name="mode" className="sr-only" checked={mode === m} onChange={() => setMode(m)} />
              By {m}
            </label>
          ))}
        </fieldset>
        <p className="text-muted" aria-live="polite">
          {added} added, {removed} removed. Token change: <strong className="text-ink">{delta > 0 ? "+" : ""}{delta}</strong>
        </p>
      </div>
      <pre className="panel mt-4 overflow-x-auto p-4 font-mono text-sm leading-relaxed whitespace-pre-wrap">
        {ops.map((o, i) =>
          o.type === "same" ? (
            <span key={i}>{o.text}{mode === "lines" ? "\n" : ""}</span>
          ) : (
            <span key={i} className={o.type === "add" ? "bg-[#d7f0e6] text-pass" : "bg-[#f8dcdd] text-fail line-through"}>
              {mode === "lines" ? (o.type === "add" ? "+ " : "- ") : ""}{o.text}{mode === "lines" ? "\n" : ""}
            </span>
          ),
        )}
      </pre>
    </div>
  );
}
