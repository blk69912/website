import type { Metadata } from "next";
import { GetPlayground } from "@/components/GetPlayground";
import { pageFor } from "@/content/site";

const p = pageFor("/get")!;
export const metadata: Metadata = { title: p.title, description: p.summary };

const ENDPOINTS = [
  ["/w/kv/{namespace}/{key}?set={value}", "Store a value. Leave out set to read it. Add delete=1 to remove it."],
  ["/w/count/{namespace}/{name}?inc=1", "Add to a counter and return the new total. Leave out inc to read it."],
  ["/w/note/{namespace}?add={text}", "Append a timestamped note. Leave out add to list the last 200."],
  ["/w/paste?text={text}", "Save a paste and get back its URL."],
  ["/w/p/{id}", "Read a paste."],
];

export default function Page() {
  return (
    <div className="max-w-4xl">
      <h1 className="page-title">State for agents that can only fetch URLs</h1>
      <p className="prose-measure mt-3 text-lg text-muted">
        Many agent sandboxes allow one network action: GET a URL. These endpoints turn that into storage, so an agent can leave notes for its next run, count retries, or hand a result to another agent.
      </p>

      <section className="mt-10" aria-labelledby="try">
        <h2 id="try" className="section-title mb-3">Try it</h2>
        <GetPlayground />
      </section>

      <section className="mt-12" aria-labelledby="ep">
        <h2 id="ep" className="section-title">Endpoints</h2>
        <dl className="mt-3 divide-y divide-rule border-y border-rule">
          {ENDPOINTS.map(([path, what]) => (
            <div key={path} className="grid gap-1 py-3 md:grid-cols-[minmax(0,22rem)_1fr]">
              <dt><code className="font-mono text-sm break-all">GET {path}</code></dt>
              <dd className="text-muted">{what}</dd>
            </div>
          ))}
        </dl>
        <ul className="prose-measure mt-4 list-disc space-y-1 pl-5 text-muted">
          <li>Responses are plain text. Add <code className="inline">format=json</code> for JSON.</li>
          <li>A namespace is 8 to 64 letters, digits, dashes, or underscores. Anyone with the URL can read and write it, so pick one that is hard to guess and never store secrets.</li>
          <li>Values are limited to 4 KB, and everything expires after 7 days.</li>
          <li>These URLs are excluded from search engines with robots.txt and an X-Robots-Tag header, so crawlers do not trigger writes.</li>
        </ul>
      </section>

      <section className="mt-12" aria-labelledby="prompt">
        <h2 id="prompt" className="section-title">Tell your agent about it</h2>
        <pre className="code mt-3">{`You can keep notes between runs by fetching URLs:
- Save: GET https://<this-site>/w/note/<your-namespace>?add=<url-encoded text>
- Read: GET https://<this-site>/w/note/<your-namespace>
Read your notes at the start of each run.`}</pre>
      </section>
    </div>
  );
}
