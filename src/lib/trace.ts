// Normalize agent transcripts (JSONL) from several common shapes into one timeline.

export type EventKind = "system" | "user" | "assistant" | "thinking" | "tool_call" | "tool_result" | "error" | "other";

export interface TraceEvent {
  line: number;
  kind: EventKind;
  label: string;
  text: string;
  toolName?: string;
  toolId?: string;
  isError?: boolean;
  timestamp?: string;
  tokens?: { input?: number; output?: number };
}

export interface ParsedTrace {
  events: TraceEvent[];
  errors: { line: number; message: string }[];
  stats: { toolCalls: number; toolErrors: number; byTool: Record<string, number>; inputTokens: number; outputTokens: number };
}

const str = (v: unknown) => (typeof v === "string" ? v : v === undefined ? "" : JSON.stringify(v, null, 2));

function blocksToEvents(line: number, role: string, content: unknown, ts?: string): TraceEvent[] {
  if (typeof content === "string") return [{ line, kind: role === "user" ? "user" : role === "system" ? "system" : "assistant", label: role, text: content, timestamp: ts }];
  if (!Array.isArray(content)) return [];
  const out: TraceEvent[] = [];
  for (const b of content as Record<string, unknown>[]) {
    switch (b?.type) {
      case "text":
        out.push({ line, kind: role === "user" ? "user" : "assistant", label: role, text: str(b.text), timestamp: ts });
        break;
      case "thinking":
        out.push({ line, kind: "thinking", label: "thinking", text: str(b.thinking) || "(thinking omitted)", timestamp: ts });
        break;
      case "tool_use":
      case "server_tool_use":
        out.push({ line, kind: "tool_call", label: str(b.name), toolName: str(b.name), toolId: str(b.id), text: str(b.input), timestamp: ts });
        break;
      case "tool_result": {
        const c = Array.isArray(b.content) ? (b.content as Record<string, unknown>[]).map((x) => str(x.text ?? x)).join("\n") : str(b.content);
        out.push({ line, kind: "tool_result", label: "result", toolId: str(b.tool_use_id), isError: b.is_error === true, text: c, timestamp: ts });
        break;
      }
      default:
        out.push({ line, kind: "other", label: str(b?.type) || "block", text: str(b), timestamp: ts });
    }
  }
  return out;
}

export function parseTrace(input: string): ParsedTrace {
  const events: TraceEvent[] = [];
  const errors: ParsedTrace["errors"] = [];
  let inputTokens = 0, outputTokens = 0;
  const raw = input.trim().startsWith("[") ? safeArray(input) : null;
  const rows: { line: number; value: unknown }[] = [];
  if (raw) raw.forEach((value, i) => rows.push({ line: i + 1, value }));
  else
    input.split("\n").forEach((l, i) => {
      if (!l.trim()) return;
      try { rows.push({ line: i + 1, value: JSON.parse(l) }); }
      catch (e) { errors.push({ line: i + 1, message: (e as Error).message }); }
    });

  for (const { line, value } of rows) {
    const o = (value ?? {}) as Record<string, unknown>;
    const ts = typeof o.timestamp === "string" ? o.timestamp : undefined;
    const msg = (o.message && typeof o.message === "object" ? o.message : o) as Record<string, unknown>;
    const usage = msg.usage as Record<string, number> | undefined;
    if (usage) { inputTokens += usage.input_tokens ?? usage.prompt_tokens ?? 0; outputTokens += usage.output_tokens ?? usage.completion_tokens ?? 0; }
    const role = str(msg.role || o.type);
    let evs: TraceEvent[] = [];
    if (Array.isArray(msg.tool_calls)) {
      // OpenAI-style assistant message
      if (msg.content) evs.push({ line, kind: "assistant", label: "assistant", text: str(msg.content), timestamp: ts });
      for (const tc of msg.tool_calls as Record<string, Record<string, unknown>>[])
        evs.push({ line, kind: "tool_call", label: str(tc.function?.name), toolName: str(tc.function?.name), toolId: str(tc.id), text: prettyMaybe(str(tc.function?.arguments)), timestamp: ts });
    } else if (role === "tool") {
      evs.push({ line, kind: "tool_result", label: "result", toolId: str(msg.tool_call_id), text: str(msg.content), timestamp: ts });
    } else if (["user", "assistant", "system"].includes(role)) {
      evs = blocksToEvents(line, role, msg.content, ts);
    } else if (o.type === "error" || o.error) {
      evs.push({ line, kind: "error", label: "error", text: str(o.error ?? o.message), isError: true, timestamp: ts });
    } else {
      evs.push({ line, kind: "other", label: str(o.type) || "event", text: str(o), timestamp: ts });
    }
    if (usage && evs.length) evs[evs.length - 1].tokens = { input: usage.input_tokens ?? usage.prompt_tokens, output: usage.output_tokens ?? usage.completion_tokens };
    events.push(...evs);
  }

  const names = new Map(events.filter((e) => e.kind === "tool_call" && e.toolId).map((e) => [e.toolId!, e.toolName!]));
  const byTool: Record<string, number> = {};
  let toolErrors = 0;
  for (const e of events) {
    if (e.kind === "tool_call") byTool[e.toolName || "?"] = (byTool[e.toolName || "?"] ?? 0) + 1;
    if (e.kind === "tool_result") {
      if (e.toolId && names.has(e.toolId)) e.toolName = names.get(e.toolId);
      if (e.isError) toolErrors++;
    }
  }
  return { events, errors, stats: { toolCalls: Object.values(byTool).reduce((a, b) => a + b, 0), toolErrors, byTool, inputTokens, outputTokens } };
}

function safeArray(s: string): unknown[] | null {
  try { const v = JSON.parse(s); return Array.isArray(v) ? v : null; } catch { return null; }
}
function prettyMaybe(s: string) {
  try { return JSON.stringify(JSON.parse(s), null, 2); } catch { return s; }
}
