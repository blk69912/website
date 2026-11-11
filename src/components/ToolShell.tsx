import type { ReactNode } from "react";
import { pageFor } from "@/content/site";

export function ToolShell({ path, children }: { path: string; children: ReactNode }) {
  const p = pageFor(path)!;
  return (
    <div className="max-w-6xl">
      <h1 className="page-title">{p.title}</h1>
      <p className="prose-measure mt-2 text-lg text-muted">{p.summary}</p>
      <p className="mt-1 text-sm text-muted">Runs in your browser. Nothing you paste is sent anywhere.</p>
      <div className="mt-8">{children}</div>
    </div>
  );
}

export const toolMeta = (path: string) => {
  const p = pageFor(path)!;
  return { title: p.title, description: p.summary };
};
