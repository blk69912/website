import { parse } from "yaml";
import type { Finding } from "./lint";

// Lints Agent Skills SKILL.md files: YAML frontmatter plus Markdown body.

export interface SkillLint { name?: string; description?: string; bodyLines: number; findings: Finding[] }

export function lintSkill(md: string): SkillLint {
  const findings: Finding[] = [];
  const m = md.match(/^﻿?---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!m) return { bodyLines: md.split("\n").length, findings: [{ severity: "error", path: "frontmatter", message: "The file must start with YAML frontmatter between two --- lines." }] };
  let fm: Record<string, unknown>;
  try {
    const v = parse(m[1]);
    if (!v || typeof v !== "object" || Array.isArray(v)) throw new Error("Frontmatter must be a mapping of keys to values.");
    fm = v as Record<string, unknown>;
  } catch (e) {
    return { bodyLines: m[2].split("\n").length, findings: [{ severity: "error", path: "frontmatter", message: `YAML does not parse: ${(e as Error).message}` }] };
  }
  const body = m[2];
  const bodyLines = body.split("\n").length;
  const name = typeof fm.name === "string" ? fm.name : undefined;
  const description = typeof fm.description === "string" ? fm.description : undefined;

  if (!name) findings.push({ severity: "error", path: "name", message: "name is required." });
  else {
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(name)) findings.push({ severity: "error", path: "name", message: "name must be lowercase letters, digits, and single hyphens." });
    if (name.length > 64) findings.push({ severity: "error", path: "name", message: `name is ${name.length} characters; the limit is 64.` });
    if (/anthropic|claude/.test(name)) findings.push({ severity: "error", path: "name", message: 'name cannot contain the reserved words "anthropic" or "claude".' });
  }
  if (!description) findings.push({ severity: "error", path: "description", message: "description is required. It is the only text the agent sees before deciding to load the skill." });
  else {
    if (description.length > 1024) findings.push({ severity: "error", path: "description", message: `description is ${description.length} characters; the limit is 1024.` });
    if (/<[a-z/][^>]*>/i.test(description)) findings.push({ severity: "error", path: "description", message: "description cannot contain XML tags." });
    if (description.length < 60) findings.push({ severity: "warning", path: "description", message: "description is short. Say what the skill does and when to use it." });
    if (!/\b(use (it )?when|use this|when the user|when asked|triggers? on|for tasks)\b/i.test(description))
      findings.push({ severity: "warning", path: "description", message: 'description does not say when to use the skill. Add a "Use when ..." clause.' });
    if (/^(i |you )|\b(I can|I will|you can use)\b/i.test(description)) findings.push({ severity: "warning", path: "description", message: "Write the description in the third person; it is injected into the system prompt." });
  }
  const known = new Set(["name", "description", "license", "allowed-tools", "metadata", "compatibility", "version", "model", "disable-model-invocation", "user-invocable", "argument-hint"]);
  for (const k of Object.keys(fm)) if (!known.has(k)) findings.push({ severity: "info", path: k, message: `Unknown frontmatter key "${k}". Some clients ignore it.` });
  if (bodyLines > 500) findings.push({ severity: "warning", path: "body", message: `Body is ${bodyLines} lines. Keep SKILL.md under 500 lines and move detail into referenced files.` });
  if (!body.trim()) findings.push({ severity: "warning", path: "body", message: "Body is empty. Add the instructions the agent should follow." });
  for (const ref of body.matchAll(/\]\(([^)]+\.(md|py|sh|js|ts|txt))\)/g))
    if (/^(\/|[A-Za-z]:\\)/.test(ref[1])) findings.push({ severity: "warning", path: "body", message: `Absolute path "${ref[1]}". Use a path relative to the skill directory.` });
  if (/\\/.test(body.match(/\]\(([^)]+)\)/g)?.join("") ?? "")) findings.push({ severity: "warning", path: "body", message: "Use forward slashes in file references so the skill works on every OS." });
  return { name, description, bodyLines, findings };
}
