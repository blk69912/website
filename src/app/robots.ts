import type { MetadataRoute } from "next";
import { SITE } from "@/content/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: ["Claude-User", "ChatGPT-User", "ClaudeBot", "GPTBot", "OAI-SearchBot", "Claude-SearchBot", "PerplexityBot"], allow: "/", disallow: ["/w/"] },
      { userAgent: "*", allow: "/", disallow: ["/w/", "/api/"] },
    ],
    sitemap: `${SITE.url}/sitemap.xml`,
  };
}
