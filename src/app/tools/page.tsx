import Link from "next/link";
import type { Metadata } from "next";
import { PAGES, pageFor } from "@/content/site";

const page = pageFor("/tools")!;
export const metadata: Metadata = { title: page.title, description: page.summary };

export default function Tools() {
  return (
    <div className="max-w-4xl">
      <h1 className="page-title">{page.title}</h1>
      <p className="prose-measure mt-2 text-lg text-muted">{page.summary}</p>
      <ul className="mt-8 divide-y divide-rule border-y border-rule">
        {PAGES.filter((p) => p.group === "tools").map((t) => (
          <li key={t.path}>
            <Link href={t.path} className="group grid gap-1 py-4 text-ink no-underline sm:grid-cols-[11rem_1fr]">
              <span className="font-semibold text-signal group-hover:underline">{t.title}</span>
              <span className="text-muted">{t.summary}</span>
            </Link>
          </li>
        ))}
      </ul>
      <p className="mt-6 text-muted">Missing a tool you reach for every week? Open an issue or send a pull request: each tool is one page and one pure function with tests.</p>
    </div>
  );
}
