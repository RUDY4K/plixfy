import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/dashboard", "/en/dashboard", "/_next/", "/_not-found"],
    },
    sitemap: "https://www.plixfy.com/sitemap.xml",
    host: "https://www.plixfy.com",
  };
}
