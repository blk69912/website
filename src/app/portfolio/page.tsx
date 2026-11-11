import type { Metadata } from "next";
import profile from "@/content/profile.json";
import { SITE } from "@/content/site";

export const metadata: Metadata = { title: `${profile.basics.name}: portfolio`, description: profile.basics.summary };

const personLd = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: profile.basics.name,
  jobTitle: profile.basics.label,
  description: profile.basics.summary,
  url: profile.basics.url,
  address: { "@type": "PostalAddress", addressLocality: profile.basics.location.city, addressCountry: profile.basics.location.countryCode },
  sameAs: profile.basics.profiles.map((p) => p.url),
  knowsAbout: profile.skills.flatMap((s) => s.keywords),
};

export default function Portfolio() {
  const b = profile.basics;
  return (
    <div className="max-w-4xl">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(personLd) }} />
      <aside className="panel mb-10 p-4 text-sm">
        <p>
          <strong>This is a template.</strong> Fork the repository, edit <code className="inline">src/content/profile.json</code>, and deploy. The same file feeds this page, <a href="/resume.json">/resume.json</a> in JSON Resume format, schema.org Person data, and <a href="/llms.txt">/llms.txt</a>.
        </p>
      </aside>

      <header>
        <h1 className="page-title">{b.name}</h1>
        <p className="mt-2 text-xl">{b.label}</p>
        <p className="prose-measure mt-4 text-lg text-muted">{b.summary}</p>
        <p className="mt-4 flex flex-wrap gap-4">
          {b.profiles.map((p) => <a key={p.url} href={p.url}>{p.network}</a>)}
          <a href="/resume.json">Résumé as JSON</a>
        </p>
      </header>

      <section className="mt-14" aria-labelledby="projects">
        <h2 id="projects" className="section-title">Projects</h2>
        <ul className="mt-3 divide-y divide-rule border-y border-rule">
          {profile.projects.map((p) => (
            <li key={p.name} className="grid gap-1 py-4 sm:grid-cols-[12rem_1fr]">
              <a href={p.url} className="font-semibold">{p.name}</a>
              <span className="text-muted">{p.description}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-14" aria-labelledby="work">
        <h2 id="work" className="section-title">Work</h2>
        {profile.work.map((w) => (
          <div key={w.name + w.position} className="mt-3">
            <p className="font-semibold">{w.position}, {w.name}</p>
            <p className="text-sm text-muted">Since {w.startDate}</p>
            <p className="mt-1">{w.summary}</p>
            <ul className="mt-2 list-disc pl-5 text-muted">{w.highlights.map((h) => <li key={h}>{h}</li>)}</ul>
          </div>
        ))}
      </section>

      <section className="mt-14" aria-labelledby="skills">
        <h2 id="skills" className="section-title">Skills</h2>
        <dl className="mt-3 grid grid-cols-[8rem_1fr] gap-y-2">
          {profile.skills.map((s) => (
            <div key={s.name} className="contents">
              <dt className="font-medium">{s.name}</dt>
              <dd className="text-muted">{s.keywords.join(", ")}</dd>
            </div>
          ))}
        </dl>
      </section>

      <p className="mt-16 text-sm text-muted">Built with the <a href={SITE.repo}>Agent Ready portfolio template</a>.</p>
    </div>
  );
}
