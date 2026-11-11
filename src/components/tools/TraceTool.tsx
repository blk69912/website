"use client";
import { useMemo, useState } from "react";
import { parseTrace, type EventKind } from "@/lib/trace";

const SAMPLE = [
  { type: "user", message: { role: "user", content: "The date test fails. Fix it." } },
  { type: "assistant", message: { role: "assistant", content: [{ type: "text", text: "I'll run the test first." }, { type: "tool_use", id: "t1", name: "Bash", input: { command: "npm test -- date" } }], usage: { input_tokens: 2410, output_tokens: 48 } } },
  { type: "user", message: { role: "user", content: [{ type: "tool_result", tool_use_id: "t1", content: 'FAIL date.test.ts\n expected "2026-11-05" received "2026-11-04"' }] } },
  { type: "assistant", message: { role: "assistant", content: [{ type: "tool_use", id: "t2", name: "Read", input: { file_path: "src/date.ts" } }], usage: { input_tokens: 2530, output_tokens: 31 } } },
  { type: "user", message: { role: "user", content: [{ type: "tool_result", tool_use_id: "t2", content: "File does not exist.", is_error: true }] } },
  { type: "assistant", message: { role: "assistant", content: [{ type: "tool_use", id: "t3", name: "Read", input: { file_path: "src/lib/date.ts" } }], usage: { input_tokens: 2570, output_tokens: 33 } } },
  { type: "user", message: { role: "user", content: [{ type: "tool_result", tool_use_id: "t3", content: "export const today = () => new Date().toISOString().slice(0, 10);" }] } },
  { type: "assistant", message: { role: "assistant", content: [{ type: "text", text: "toISOString uses UTC. I'll switch to the local date." }], usage: { input_tokens: 2650, output_tokens: 22 } } },
].map((o) => JSON.stringify(o)).join("\n");

const LOOK: Record<EventKind, { label: string; cls: string }> = {
  system: { label: "System", cls: "border-muted" },
  user: { label: "User", cls: "border-ink" },
  assistant: { label: "Assistant", cls: "border-signal" },
  thinking: { label: "Thinking", cls: "border-rule" },
  tool_call: { label: "Tool call", cls: "border-[#7b5cd6]" },
  tool_result: { label: "Result", cls: "border-pass" },
  error: { label: "Error", cls: "border-fail" },
  other: { label: "Event", cls: "border-rule" },
};

export function TraceTool() {
  const [text, setText] = useState(SAMPLE);
  const [filter, setFilter] = useState<"all" | "tools" | "errors">("all");
  const t = useMemo(() => parseTrace(text), [text]);
  const events = t.events.filter((e) => (filter === "all" ? true : filter === "tools" ? e.kind === "tool_call" || e.kind === "tool_result" : e.isError || e.kind === "error"));

  const onFile = async (f: File | undefined) => f && setText(await f.text());

  return (
    <div className="grid gap-8 xl:grid-cols-[minmax(0,26rem)_1fr]">
      <div>
        <label htmlFor="trace" className="mb-1 block font-medium">JSONL transcript</label>
        <textarea id="trace" className="field min-h-[24rem]" value={text} onChange={(e) => setText(e.target.value)} spellCheck={false} />
        <label className="mt-2 block text-sm text-muted">
          Or open a file: <input type="file" accept=".jsonl,.json,.txt" onChange={(e) => onFile(e.target.files?.[0])} className="text-sm" />
        </label>
        <p className="mt-2 text-sm text-muted">Claude Code keeps transcripts in <code className="inline">~/.claude/projects/</code>.</p>
        {t.errors.length > 0 && <p className="mt-3 text-sm status-warn">{t.errors.length} lines could not be parsed, first at line {t.errors[0].line}.</p>}
      </div>
      <div className="min-w-0">
        <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-rule bg-rule sm:grid-cols-4">
          {[["Events", t.events.length], ["Tool calls", t.stats.toolCalls], ["Tool errors", t.stats.toolErrors], ["Tokens in / out", `${t.stats.inputTokens.toLocaleString("en-US")} / ${t.stats.outputTokens.toLocaleString("en-US")}`]].map(([k, v]) => (
            <div key={k as string} className="bg-surface p-3"><dt className="text-sm text-muted">{k}</dt><dd className="text-xl font-semibold tabular-nums">{v}</dd></div>
          ))}
        </dl>
        {Object.keys(t.stats.byTool).length > 0 && (
          <p className="mt-3 text-sm text-muted">By tool: {Object.entries(t.stats.byTool).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${v}`).join(", ")}</p>
        )}
        <div className="mt-4 flex gap-1" role="group" aria-label="Show">
          {(["all", "tools", "errors"] as const).map((f) => (
            <button key={f} className={`btn ${filter === f ? "" : "btn-quiet"} text-sm`} aria-pressed={filter === f} onClick={() => setFilter(f)}>
              {f === "all" ? "Everything" : f === "tools" ? "Tools only" : "Errors only"}
            </button>
          ))}
        </div>
        <ol className="mt-4 space-y-2">
          {events.map((e, i) => (
            <li key={i} className={`panel border-l-4 ${e.isError ? "border-l-fail" : LOOK[e.kind].cls} p-3`}>
              <div className="flex flex-wrap items-baseline gap-x-3 text-sm">
                <span className="font-semibold">{e.isError ? "Error result" : LOOK[e.kind].label}</span>
                {e.toolName && <code className="font-mono">{e.toolName}</code>}
                <span className="text-muted">line {e.line}</span>
                {e.tokens && <span className="text-muted">{e.tokens.input ?? 0} in, {e.tokens.output ?? 0} out</span>}
              </div>
              <details open={e.text.length < 400}>
                <summary className="cursor-pointer text-sm text-muted">{e.text.length} characters</summary>
                <pre className="mt-2 max-h-80 overflow-auto whitespace-pre-wrap break-words font-mono text-sm">{e.text}</pre>
              </details>
            </li>
          ))}
          {!events.length && <li className="text-muted">Nothing to show. Paste a transcript, or change the filter.</li>}
        </ol>
      </div>
    </div>
  );
}
