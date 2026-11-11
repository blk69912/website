"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { PAGES, SITE } from "@/content/site";

const MAIN = PAGES.filter((p) => p.group === "main" && p.path !== "/");
const TOOLS = PAGES.filter((p) => p.group === "tools");

export function SiteNav() {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const active = (p: string) => (p === "/" ? path === "/" : path === p || path.startsWith(p + "/"));
  const item = (p: string, label: string, sub = false) => (
    <li key={p}>
      <Link
        href={p}
        onClick={() => setOpen(false)}
        aria-current={path === p ? "page" : undefined}
        className={`block rounded px-2 py-1 no-underline ${sub ? "pl-5 text-[0.95rem]" : "font-medium"} ${
          active(p) ? "bg-signal-soft text-signal" : "text-ink hover:bg-surface"
        }`}
      >
        {label}
      </Link>
    </li>
  );
  return (
    <header className="border-b border-rule lg:sticky lg:top-0 lg:h-dvh lg:border-b-0 lg:border-r">
      <div className="flex items-center justify-between px-5 py-4 lg:block lg:px-5 lg:py-7">
        <Link href="/" className="flex items-center gap-2 text-ink no-underline" aria-label={`${SITE.name} home`}>
          <Mark />
          <span className="text-lg font-bold tracking-tight">{SITE.name}</span>
        </Link>
        <button className="btn btn-quiet lg:hidden" aria-expanded={open} aria-controls="site-nav" onClick={() => setOpen(!open)}>
          Menu
        </button>
      </div>
      <nav id="site-nav" aria-label="Site" className={`${open ? "block" : "hidden"} px-3 pb-5 lg:block`}>
        <ul className="space-y-0.5">
          {MAIN.map((p) => (
            <li key={p.path}>
              <ul>
                {item(p.path, p.nav)}
                {p.path === "/tools" && TOOLS.map((t) => item(t.path, t.nav, true))}
              </ul>
            </li>
          ))}
        </ul>
        <p className="mt-6 px-2 text-sm text-muted">
          Open source on <a href={SITE.repo}>GitHub</a>.
        </p>
      </nav>
    </header>
  );
}

function Mark() {
  // Two overlapping reading frames: one for people, one for agents.
  return (
    <svg width="26" height="26" viewBox="0 0 26 26" aria-hidden="true">
      <rect x="1.5" y="4.5" width="15" height="17" rx="2.5" fill="none" stroke="currentColor" strokeWidth="2" />
      <rect x="9.5" y="1.5" width="15" height="17" rx="2.5" fill="#2346d8" />
      <path d="M13 7h8M13 10.5h8M13 14h5" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}
