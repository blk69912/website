import type { Finding } from "@/lib/lint";

const STYLE = { error: "status-fail", warning: "status-warn", info: "text-muted" } as const;
const WORD = { error: "Error", warning: "Warning", info: "Note" } as const;

export function Findings({ findings, okText }: { findings: Finding[]; okText: string }) {
  if (!findings.length) return <p className="panel p-4 font-medium status-pass">{okText}</p>;
  const order = { error: 0, warning: 1, info: 2 };
  return (
    <ul className="panel divide-y divide-rule">
      {[...findings].sort((a, b) => order[a.severity] - order[b.severity]).map((f, i) => (
        <li key={i} className="grid gap-1 p-3 sm:grid-cols-[5.5rem_1fr]">
          <span className={`font-semibold ${STYLE[f.severity]}`}>{WORD[f.severity]}</span>
          <div>
            <code className="font-mono text-sm text-muted">{f.path}</code>
            <p>{f.message}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}
