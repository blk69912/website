import { describe, expect, it } from "vitest";
import { estimateTokens } from "@/lib/tokens";
import { diffLines } from "@/lib/diff";
import { parseTrace } from "@/lib/trace";
import { validateMcp } from "@/lib/mcp";
import { lintSkill } from "@/lib/skill";
import { estimateCost } from "@/lib/pricing";

describe("tokens", () => {
  it("counts CJK roughly one per character", () => {
    expect(estimateTokens("こんにちは世界").tokens).toBeGreaterThanOrEqual(7);
    expect(estimateTokens("").tokens).toBe(0);
    const e = estimateTokens("The quick brown fox jumps over the lazy dog.");
    expect(e.tokens).toBeGreaterThan(8);
    expect(e.tokens).toBeLessThan(15);
  });
});

describe("diff", () => {
  it("finds added and removed lines", () => {
    const d = diffLines("a\nb\nc", "a\nc\nd");
    expect(d.filter((x) => x.type === "del").map((x) => x.text)).toEqual(["b"]);
    expect(d.filter((x) => x.type === "add").map((x) => x.text)).toEqual(["d"]);
  });
});

describe("trace", () => {
  it("parses Claude Code style transcripts and pairs tool names", () => {
    const jsonl = [
      JSON.stringify({ type: "user", message: { role: "user", content: "fix it" } }),
      JSON.stringify({ type: "assistant", message: { role: "assistant", content: [{ type: "tool_use", id: "t1", name: "Bash", input: { command: "ls" } }], usage: { input_tokens: 100, output_tokens: 20 } } }),
      JSON.stringify({ type: "user", message: { role: "user", content: [{ type: "tool_result", tool_use_id: "t1", content: "boom", is_error: true }] } }),
      "not json",
    ].join("\n");
    const t = parseTrace(jsonl);
    expect(t.events.map((e) => e.kind)).toEqual(["user", "tool_call", "tool_result"]);
    expect(t.events[2].toolName).toBe("Bash");
    expect(t.stats).toMatchObject({ toolCalls: 1, toolErrors: 1, inputTokens: 100, outputTokens: 20 });
    expect(t.errors).toHaveLength(1);
  });
  it("parses OpenAI style messages", () => {
    const t = parseTrace(JSON.stringify([{ role: "assistant", content: null, tool_calls: [{ id: "c1", function: { name: "search", arguments: '{"q":"x"}' } }] }, { role: "tool", tool_call_id: "c1", content: "r" }]));
    expect(t.events.map((e) => e.kind)).toEqual(["tool_call", "tool_result"]);
    expect(t.events[1].toolName).toBe("search");
  });
});

describe("mcp", () => {
  it("catches common tool mistakes", () => {
    const r = validateMcp(JSON.stringify({ tools: [{ name: "bad name", inputSchema: { type: "object", properties: { q: {} }, required: ["q", "missing"] } }, { name: "bad name", description: "x", inputSchema: { type: "object" } }] }));
    const msgs = r.findings.map((f) => f.message).join("\n");
    expect(r.count).toBe(2);
    expect(msgs).toMatch(/name must be/);
    expect(msgs).toMatch(/description is missing/);
    expect(msgs).toMatch(/"missing" is required/);
    expect(msgs).toMatch(/Duplicate tool name/);
  });
  it("accepts a clean tool", () => {
    const r = validateMcp(JSON.stringify({ name: "search_issues", description: "Search issues in the tracker by keyword and return the 20 newest matches.", inputSchema: { type: "object", properties: { query: { type: "string", description: "Keywords, e.g. login bug" } }, required: ["query"] }, annotations: { readOnlyHint: true } }));
    expect(r.findings.filter((f) => f.severity !== "info")).toEqual([]);
  });
  it("checks client configs", () => {
    const r = validateMcp(JSON.stringify({ mcpServers: { a: { args: [] }, b: { command: "npx", env: { TOKEN: "ghp_abc" } } } }));
    expect(r.kind).toBe("client config");
    expect(r.findings.map((f) => f.path)).toEqual(["$.mcpServers.a", "$.mcpServers.b.env.TOKEN"]);
  });
  it("reports invalid JSON", () => expect(validateMcp("{").findings[0].severity).toBe("error"));
});

describe("skill lint", () => {
  it("passes a good skill", () => {
    const r = lintSkill("---\nname: pdf-forms\ndescription: Fills and flattens PDF forms with pypdf. Use when the user asks to fill a PDF form or extract form fields.\n---\n# PDF forms\n\nSteps...\n");
    expect(r.findings).toEqual([]);
  });
  it("flags bad frontmatter", () => {
    const r = lintSkill("---\nname: Claude_Helper\ndescription: I can help <b>you</b>\nfoo: 1\n---\n");
    const paths = r.findings.map((f) => `${f.severity}:${f.path}`);
    expect(paths).toContain("error:name");
    expect(paths).toContain("error:description");
    expect(paths).toContain("info:foo");
    expect(paths).toContain("warning:body");
  });
  it("requires frontmatter", () => expect(lintSkill("# no fm").findings[0].severity).toBe("error"));
});

describe("cost", () => {
  it("applies cache share", () => {
    const c = estimateCost({ inputTokens: 1_000_000, outputTokens: 0, requestsPerDay: 1, inputPrice: 4, outputPrice: 20, cachedShare: 0.5, cacheReadPrice: 0.2 });
    expect(c.perRequest).toBeCloseTo(2.1);
    expect(c.perMonth).toBeCloseTo(63);
  });
});

import { prefersMarkdown } from "@/proxy";
describe("content negotiation", () => {
  it("prefers markdown only when asked", () => {
    expect(prefersMarkdown("text/markdown")).toBe(true);
    expect(prefersMarkdown("text/markdown, text/html;q=0.5")).toBe(true);
    expect(prefersMarkdown("text/html,application/xhtml+xml,*/*;q=0.8")).toBe(false);
    expect(prefersMarkdown("text/html, text/markdown;q=0.4")).toBe(false);
    expect(prefersMarkdown("*/*")).toBe(false);
  });
});
