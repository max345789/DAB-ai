import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  // v1 is intentionally minimal: index only the public marketing entry.
  // Chat itself is an app surface and should not be indexed.
  return [
    {
      url: "https://dabcloud.in",
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
  ];
}

