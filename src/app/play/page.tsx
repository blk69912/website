import Link from "next/link";
import type { Metadata } from "next";
import { PAGES, pageFor } from "@/content/site";

const p = pageFor("/play")!;
export const metadata: Metadata = { title: p.title, description: p.summary };

export default function Play() {
  return (
    <div className="max-w-4xl">
      <h1 className="page-title">{p.title}</h1>
      <p className="mt-2 text-lg text-muted">{p.summary}</p>
      <ul className="mt-8 grid gap-4 sm:grid-cols-2">
        {PAGES.filter((x) => x.group === "play").map((g) => (
          <li key={g.path}>
            <Link href={g.path} className="panel block h-full p-6 text-ink no-underline hover:border-signal">
              <span className="text-2xl font-bold text-signal">{g.title}</span>
              <span className="mt-2 block text-muted">{g.md}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
