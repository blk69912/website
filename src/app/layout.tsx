import type { Metadata } from "next";
import { Schibsted_Grotesk, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { SITE } from "@/content/site";
import { SiteNav } from "@/components/SiteNav";
import { AgentView } from "@/components/AgentView";

const sans = Schibsted_Grotesk({ variable: "--font-schibsted", subsets: ["latin"] });
const mono = JetBrains_Mono({ variable: "--font-jetbrains", subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: { default: `${SITE.name}: tools for the agent-readable web`, template: `%s | ${SITE.name}` },
  description: SITE.tagline,
  alternates: { types: { "text/markdown": "/llms.txt" } },
  openGraph: { siteName: SITE.name, type: "website" },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: SITE.name,
  description: SITE.tagline,
  url: SITE.url,
  codeRepository: SITE.repo,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${sans.variable} ${mono.variable} antialiased`}>
      <body className="min-h-dvh">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
        <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-50 btn">Skip to content</a>
        <div className="lg:grid lg:grid-cols-[15rem_1fr]">
          <SiteNav />
          <div className="min-w-0">
            <AgentView />
            <main id="main" className="px-5 pb-24 pt-6 sm:px-10 lg:pt-14">{children}</main>
          </div>
        </div>
      </body>
    </html>
  );
}
