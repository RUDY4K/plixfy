import type { MetadataRoute } from "next";
import { allGames, categories } from "@/lib/games";

const SITE = "https://www.plixfy.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: SITE + "/", lastModified: now, changeFrequency: "daily", priority: 1.0 },
    { url: SITE + "/all-games", lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: SITE + "/categories", lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: SITE + "/category/top", lastModified: now, changeFrequency: "daily", priority: 0.8 },
    { url: SITE + "/category/trending", lastModified: now, changeFrequency: "daily", priority: 0.8 },
    { url: SITE + "/about", lastModified: now, changeFrequency: "monthly", priority: 0.3 },
    { url: SITE + "/privacy", lastModified: now, changeFrequency: "monthly", priority: 0.3 },
    { url: SITE + "/terms", lastModified: now, changeFrequency: "monthly", priority: 0.3 },
  ];

  const categoryRoutes: MetadataRoute.Sitemap = categories.map((c) => ({
    url: SITE + "/category/" + c.slug,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  const gameRoutes: MetadataRoute.Sitemap = allGames.map((g) => ({
    url: SITE + "/play/" + g.slug,
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  return [...staticRoutes, ...categoryRoutes, ...gameRoutes];
}
