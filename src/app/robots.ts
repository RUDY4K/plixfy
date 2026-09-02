import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const disallow = ["/api/", "/dashboard", "/en/dashboard", "/_not-found"];

  return {
    rules: [
      {
        // Explicitly permit ChatGPT search discovery while keeping private
        // application routes unavailable to every crawler.
        userAgent: "OAI-SearchBot",
        allow: "/",
        disallow,
      },
      { userAgent: "*", allow: "/", disallow },
    ],
    sitemap: "https://www.plixfy.com/sitemap.xml",
    host: "https://www.plixfy.com",
  };
}
