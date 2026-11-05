import Link from "next/link";
import { PAGES, SITE } from "@/content/site";

const INDEX = [
  { path: "/check", what: "Score any site and get a fix list, a draft llms.txt, and a README badge." },
  { path: "/tools", what: "Token estimate, prompt diff, trace viewer, MCP validator, Skill linter, cost estimate. Runs in your browser." },
  { path: "/learn", what: "Step through one agent run and watch the context window fill. English and Japanese." },
  { path: "/directory", what: "MCP servers, Agent Skills, and agent-ready web projects, with live GitHub stars." },
  { path: "/get", what: "Key-value, counters, notes, and pastes for agents that can only make GET requests." },
  { path: "/portfolio", what: "A portfolio template with llms.txt, JSON Resume, and JSON-LD built in." },
  { path: "/play", what: "Guess the HTTP status code. Spot the prompt injection." },
];

export default function Home() {
  const self = PAGES[0];
  return (
    <div className="max-w-6xl">
      <section aria-labelledby="hero" className="max-w-3xl">
        <h1 id="hero" className="text-[clamp(2.5rem,6vw,4.5rem)] font-bold leading-[1.02] tracking-[-0.025em]">
          Is your site readable by AI agents?
        </h1>
        <p className="prose-measure mt-5 text-xl text-muted">
          More of your visitors arrive through an assistant&apos;s fetch tool. Check what they see, then fix it.
        </p>
        <form action="/check" method="get" className="mt-8 flex max-w-2xl flex-col gap-2 sm:flex-row" role="search">
          <label htmlFor="hero-url" className="sr-only">Website address</label>
          <input id="hero-url" name="url" className="field text-lg" placeholder="example.com" required inputMode="url" />
          <button className="btn shrink-0 text-lg">Check site</button>
        </form>
      </section>

      <section aria-labelledby="two" className="mt-20">
        <h2 id="two" className="section-title">One page, two readers</h2>
        <p className="prose-measure mt-2 text-muted">
          This page, as you see it and as an agent receives it. Ask any page here for <code className="inline">text/markdown</code> and you get the right column.
        </p>
        <div className="mt-6 grid overflow-hidden rounded-lg border border-rule md:grid-cols-2">
          <div className="bg-surface p-6">
            <p className="text-sm text-muted">Rendered HTML</p>
            <p className="mt-3 text-2xl font-bold leading-tight">Is your site readable by AI agents?</p>
            <p className="mt-2 text-muted">More of your visitors arrive through an assistant&apos;s fetch tool.</p>
            <div className="mt-4 flex gap-2">
              <span className="field min-w-0 max-w-48 text-muted">example.com</span>
              <span className="btn shrink-0 whitespace-nowrap">Check site</span>
            </div>
          </div>
          <pre className="code rounded-none p-6">{`GET / HTTP/1.1
Accept: text/markdown

# ${self.title}

> ${self.summary}

${self.md.split("\n").slice(0, 6).join("\n")}
…`}</pre>
        </div>
      </section>

      <section aria-labelledby="inside" className="mt-20">
        <h2 id="inside" className="section-title">What&apos;s here</h2>
        <ul className="mt-4 divide-y divide-rule border-y border-rule">
          {INDEX.map((i) => {
            const p = PAGES.find((x) => x.path === i.path)!;
            return (
              <li key={i.path}>
                <Link href={i.path} className="group grid gap-1 py-4 text-ink no-underline sm:grid-cols-[14rem_1fr]">
                  <span className="font-semibold text-signal group-hover:underline">{p.title}</span>
                  <span className="text-muted">{i.what}</span>
                </Link>
              </li>
            );
          })}
        </ul>
        <p className="mt-6 text-muted">
          Everything is MIT licensed. <a href={SITE.repo}>Star or fork it on GitHub</a>, or deploy your own copy to Vercel in one click.
        </p>
      </section>
    </div>
  );
}
