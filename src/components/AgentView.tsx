"use client";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

// The site's signature: every page can show the Markdown an agent receives.
export function AgentView() {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const [md, setMd] = useState<string>("");

  useEffect(() => {
    if (!open) return;
    let alive = true;
    fetch(path, { headers: { accept: "text/markdown" } })
      .then((r) => (r.ok && (r.headers.get("content-type") ?? "").includes("markdown") ? r.text() : Promise.reject()))
      .then((t) => alive && setMd(t))
      .catch(() => alive && setMd("This page has no Markdown twin yet."));
    return () => {
      alive = false;
    };
  }, [open, path]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <div className="flex justify-end px-5 pt-4 sm:px-10">
        <button className="btn btn-quiet text-sm" aria-expanded={open} aria-controls="agent-sheet" onClick={() => setOpen((o) => !o)}>
          <span aria-hidden="true" className="font-mono text-signal">{open ? "</>" : "<>"}</span>
          {open ? "Back to the human view" : "See what an agent reads"}
        </button>
      </div>
      <aside
        id="agent-sheet"
        aria-label="Markdown served to agents"
        hidden={!open}
        className="agent-sheet mx-5 mt-3 rounded-lg bg-agent p-5 text-agent-text sm:mx-10"
      >
        <p className="mb-3 font-mono text-xs text-[#9fb0c2]">
          GET {path} &nbsp; Accept: text/markdown
        </p>
        <pre className="whitespace-pre-wrap break-words font-mono text-sm leading-relaxed">{md || "Loading…"}</pre>
      </aside>
    </>
  );
}
