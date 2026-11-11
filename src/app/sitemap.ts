import type { MetadataRoute } from "next";
import { PAGES, SITE } from "@/content/site";

export default function sitemap(): MetadataRoute.Sitemap {
  return PAGES.map((p) => ({ url: `${SITE.url}${p.path}`, changeFrequency: "weekly", priority: p.path === "/" ? 1 : 0.7 }));
}
