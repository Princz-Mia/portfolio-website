import type { MetadataRoute } from "next";
import { site } from "@/content";

export const dynamic = "force-static";

// The site is a single page today. Add entries here when real subroutes exist.
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: `${site.url}/`,
      changeFrequency: "monthly",
      priority: 1,
    },
  ];
}
