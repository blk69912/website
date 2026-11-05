import type { Metadata } from "next";
import { Suspense } from "react";
import { Checker } from "@/components/Checker";
import { pageFor } from "@/content/site";

const page = pageFor("/check")!;
export const metadata: Metadata = { title: page.title, description: page.summary };

export default function CheckPage() {
  return (
    <div className="max-w-5xl">
      <h1 className="page-title">Can AI agents read your site?</h1>
      <p className="prose-measure mt-3 text-lg text-muted">
        The checker fetches your page the way an agent&apos;s fetch tool does: no JavaScript, no cookies. It then reads robots.txt, llms.txt, and the sitemap, and scores ten checks.
      </p>
      <div className="mt-8">
        <Suspense fallback={<div className="h-14" />}>
          <Checker />
        </Suspense>
      </div>
      <section className="mt-16 max-w-3xl" aria-labelledby="api-h">
        <h2 id="api-h" className="section-title">Use it from an agent or CI</h2>
        <pre className="code mt-3">{`curl "$SITE/api/check?url=example.com&format=md"
curl "$SITE/api/check?url=example.com"   # JSON
curl "$SITE/api/badge?url=example.com"   # SVG badge`}</pre>
      </section>
    </div>
  );
}
