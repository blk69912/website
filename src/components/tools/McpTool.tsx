"use client";
import { useMemo, useState } from "react";
import { validateMcp } from "@/lib/mcp";
import { Findings } from "@/components/Findings";

const SAMPLE = JSON.stringify({
  tools: [
    { name: "search_issues", description: "Search issues in the tracker by keyword. Returns up to 20 matches, newest first, with id, title, and state.", inputSchema: { type: "object", properties: { query: { type: "string", description: "Keywords, for example: login timeout" }, state: { type: "string", enum: ["open", "closed", "all"] } }, required: ["query"] }, annotations: { readOnlyHint: true } },
    { name: "close issue", description: "Closes", inputSchema: { type: "object", properties: { id: { type: "number" } }, required: ["id", "reason"] } },
  ],
}, null, 2);

export function McpTool() {
  const [text, setText] = useState(SAMPLE);
  const r = useMemo(() => validateMcp(text), [text]);
  const errors = r.findings.filter((f) => f.severity === "error").length;
  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <div>
        <label htmlFor="mcp" className="mb-1 block font-medium">Tool definitions or client config (JSON)</label>
        <textarea id="mcp" className="field min-h-[26rem]" value={text} onChange={(e) => setText(e.target.value)} spellCheck={false} />
      </div>
      <div aria-live="polite">
        <p className="mb-3 text-muted">
          Read as a {r.kind} with {r.count} {r.kind === "client config" ? "servers" : "tools"}. {errors ? `${errors} errors to fix.` : "No errors."}
        </p>
        <Findings findings={r.findings} okText="Looks good. Models will know what each tool does and how to call it." />
      </div>
    </div>
  );
}
