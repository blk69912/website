"use client";
import { useMemo, useState } from "react";
import { estimateTokens } from "@/lib/tokens";

const SAMPLE = "You are a careful coding agent. Read the failing test, find the cause, and fix it with the smallest change.\n\n失敗しているテストを読み、原因を特定し、最小の変更で修正してください。";

export function TokenTool() {
  const [text, setText] = useState(SAMPLE);
  const e = useMemo(() => estimateTokens(text), [text]);
  const rows: [string, number][] = [["Estimated tokens", e.tokens], ["Characters", e.chars], ["Words", e.words], ["Lines", e.lines], ["CJK characters", e.cjk]];
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_16rem]">
      <div>
        <label htmlFor="t" className="mb-1 block font-medium">Text</label>
        <textarea id="t" className="field min-h-[22rem]" value={text} onChange={(ev) => setText(ev.target.value)} />
      </div>
      <div>
        <dl className="panel divide-y divide-rule" aria-live="polite">
          {rows.map(([k, v], i) => (
            <div key={k} className={`flex items-baseline justify-between p-3 ${i === 0 ? "text-lg" : ""}`}>
              <dt className={i === 0 ? "font-semibold" : "text-muted"}>{k}</dt>
              <dd className={`tabular-nums ${i === 0 ? "text-3xl font-bold" : ""}`}>{v.toLocaleString("en-US")}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-3 text-sm text-muted">A heuristic, usually within 15% for English prose. Code, numbers, and rare scripts vary more. For exact counts, call your provider&apos;s count-tokens endpoint.</p>
      </div>
    </div>
  );
}
