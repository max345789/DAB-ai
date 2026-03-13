import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          // Keep auth pages out of search results.
          "/login",
          "/signup",
          "/forgot-password",
          "/reset-password",
          // Hide internal pages until v3.
          "/dashboard",
          "/ads",
          "/campaigns",
          "/leads",
          "/finance",
          "/automation",
          "/integrations",
          "/reports",
          "/settings",
          "/command-center",
        ],
      },
    ],
    sitemap: "https://dabcloud.in/sitemap.xml",
    host: "https://dabcloud.in",
  };
}

