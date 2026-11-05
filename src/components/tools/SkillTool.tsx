"use client";
import { useMemo, useState } from "react";
import { lintSkill } from "@/lib/skill";
import { Findings } from "@/components/Findings";

const SAMPLE = `---
name: release-notes
description: Writes release notes from merged pull requests.
---

# Release notes

1. List PRs merged since the last tag.
2. Group them by label.
3. Write one plain sentence per change.
`;

export function SkillTool() {
  const [text, setText] = useState(SAMPLE);
  const r = useMemo(() => lintSkill(text), [text]);
  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <div>
        <label htmlFor="skill" className="mb-1 block font-medium">SKILL.md</label>
        <textarea id="skill" className="field min-h-[26rem]" value={text} onChange={(e) => setText(e.target.value)} spellCheck={false} />
      </div>
      <div aria-live="polite">
        <dl className="mb-4 grid grid-cols-[7rem_1fr] gap-y-1">
          <dt className="text-muted">Name</dt><dd className="font-mono">{r.name ?? "missing"}</dd>
          <dt className="text-muted">Description</dt><dd>{r.description ? `${r.description.length} of 1024 characters` : "missing"}</dd>
          <dt className="text-muted">Body</dt><dd>{r.bodyLines} lines</dd>
        </dl>
        <Findings findings={r.findings} okText="This skill is ready. Its description says what it does and when to use it." />
      </div>
    </div>
  );
}
