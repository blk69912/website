import type { Finding } from "./lint";

// Validates MCP tool definitions (tools/list result, a tools array, or one tool)
// and client config files with an "mcpServers" map.

const NAME = /^[A-Za-z0-9_.-]{1,64}$/;

function checkSchema(schema: unknown, path: string, out: Finding[], depth = 0) {
  if (!schema || typeof schema !== "object") { out.push({ severity: "error", path, message: "Schema must be an object." }); return; }
  const s = schema as Record<string, unknown>;
  if (depth === 0 && s.type !== "object") out.push({ severity: "error", path: `${path}.type`, message: 'inputSchema.type must be "object".' });
  if (s.type === "object" || s.properties) {
    const props = (s.properties ?? {}) as Record<string, unknown>;
    if (s.properties !== undefined && (typeof s.properties !== "object" || Array.isArray(s.properties)))
      out.push({ severity: "error", path: `${path}.properties`, message: "properties must be an object map." });
    const req = s.required;
    if (req !== undefined && !Array.isArray(req)) out.push({ severity: "error", path: `${path}.required`, message: "required must be an array of property names." });
    for (const r of Array.isArray(req) ? req : [])
      if (!(r in props)) out.push({ severity: "error", path: `${path}.required`, message: `"${r}" is required but not defined in properties.` });
    for (const [k, v] of Object.entries(props)) {
      const p = (v ?? {}) as Record<string, unknown>;
      if (!p.type && !p.enum && !p.anyOf && !p.oneOf && !p.$ref && !p.const)
        out.push({ severity: "warning", path: `${path}.properties.${k}`, message: "No type given. Models guess worse without one." });
      if (!p.description && depth < 2)
        out.push({ severity: "warning", path: `${path}.properties.${k}`, message: "No description. Say what the value means and give an example." });
      if (p.type === "object" || p.properties || p.type === "array") checkSchema(p.type === "array" ? p.items ?? {} : p, `${path}.properties.${k}`, out, depth + 1);
    }
    if (depth === 0 && Object.keys(props).length > 12)
      out.push({ severity: "info", path, message: `${Object.keys(props).length} parameters. Consider splitting the tool; long schemas cost tokens on every request.` });
  }
}

export function validateTool(t: unknown, path: string): Finding[] {
  const out: Finding[] = [];
  if (!t || typeof t !== "object") return [{ severity: "error", path, message: "Tool must be an object." }];
  const tool = t as Record<string, unknown>;
  if (typeof tool.name !== "string") out.push({ severity: "error", path: `${path}.name`, message: "name is required." });
  else if (!NAME.test(tool.name)) out.push({ severity: "error", path: `${path}.name`, message: "name must be 1-64 characters of letters, digits, underscore, dash, or dot." });
  const desc = typeof tool.description === "string" ? tool.description : "";
  if (!desc) out.push({ severity: "error", path: `${path}.description`, message: "description is missing. It is the main thing a model reads to decide when to call the tool." });
  else {
    if (desc.length < 40) out.push({ severity: "warning", path: `${path}.description`, message: "description is very short. Say what it does, when to use it, and what it returns." });
    if (desc.length > 2000) out.push({ severity: "info", path: `${path}.description`, message: "description is over 2000 characters and is sent on every request." });
  }
  const schema = tool.inputSchema ?? tool.input_schema ?? tool.parameters;
  if (tool.input_schema && !tool.inputSchema) out.push({ severity: "info", path: `${path}.input_schema`, message: 'MCP uses camelCase "inputSchema". "input_schema" is the Messages API spelling.' });
  if (schema === undefined) out.push({ severity: "error", path: `${path}.inputSchema`, message: "inputSchema is required (use {\"type\":\"object\"} for no arguments)." });
  else checkSchema(schema, `${path}.inputSchema`, out);
  if (tool.annotations && typeof tool.annotations === "object") {
    const a = tool.annotations as Record<string, unknown>;
    for (const k of ["readOnlyHint", "destructiveHint", "idempotentHint", "openWorldHint"]) if (k in a && typeof a[k] !== "boolean") out.push({ severity: "error", path: `${path}.annotations.${k}`, message: `${k} must be a boolean.` });
  } else out.push({ severity: "info", path: `${path}.annotations`, message: "No annotations. readOnlyHint and destructiveHint help clients decide what needs approval." });
  return out;
}

export function validateMcp(jsonText: string): { kind: string; count: number; findings: Finding[] } {
  let v: unknown;
  try { v = JSON.parse(jsonText); } catch (e) { return { kind: "invalid", count: 0, findings: [{ severity: "error", path: "$", message: `Not valid JSON: ${(e as Error).message}` }] }; }
  const o = v as Record<string, unknown>;
  if (o && typeof o === "object" && "mcpServers" in o) {
    const servers = (o.mcpServers ?? {}) as Record<string, Record<string, unknown>>;
    const f: Finding[] = [];
    for (const [name, s] of Object.entries(servers)) {
      const p = `$.mcpServers.${name}`;
      if (!s.command && !s.url) f.push({ severity: "error", path: p, message: 'Each server needs "command" (stdio) or "url" (HTTP).' });
      if (s.command && s.url) f.push({ severity: "warning", path: p, message: 'Both "command" and "url" are set. Clients will pick one.' });
      if (s.args !== undefined && !Array.isArray(s.args)) f.push({ severity: "error", path: `${p}.args`, message: "args must be an array of strings." });
      if (s.env && typeof s.env === "object")
        for (const [k, val] of Object.entries(s.env as Record<string, string>))
          if (typeof val === "string" && /^(sk-|ghp_|gho_|xox[bp]-|AKIA)/.test(val)) f.push({ severity: "warning", path: `${p}.env.${k}`, message: "Looks like a literal secret. Prefer a variable reference so the file can be shared." });
      if (typeof s.url === "string" && s.url.startsWith("http://") && !/localhost|127\.0\.0\.1/.test(s.url)) f.push({ severity: "warning", path: `${p}.url`, message: "Remote server over plain http. Use https." });
    }
    if (!Object.keys(servers).length) f.push({ severity: "warning", path: "$.mcpServers", message: "No servers defined." });
    return { kind: "client config", count: Object.keys(servers).length, findings: f };
  }
  const tools = Array.isArray(v) ? v : Array.isArray(o?.tools) ? (o.tools as unknown[]) : Array.isArray((o?.result as Record<string, unknown>)?.tools) ? ((o.result as Record<string, unknown>).tools as unknown[]) : [v];
  const base = Array.isArray(v) ? "$" : Array.isArray(o?.tools) ? "$.tools" : o?.result ? "$.result.tools" : "$";
  const findings = tools.flatMap((t, i) => validateTool(t, tools.length === 1 && base === "$" ? "$" : `${base}[${i}]`));
  const names = tools.map((t) => (t as Record<string, unknown>)?.name).filter(Boolean);
  for (const n of new Set(names)) if (names.filter((x) => x === n).length > 1) findings.push({ severity: "error", path: base, message: `Duplicate tool name "${n}".` });
  return { kind: tools.length === 1 ? "tool" : "tool list", count: tools.length, findings };
}
