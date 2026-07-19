import type { MetadataRoute } from "next";
import { allGames, categories } from "@/lib/games";
import { getAllPosts } from "@/lib/blog";
import { getAllNews } from "@/lib/news";

const SITE = "https://www.plixfy.com";

type ChangeFreq = MetadataRoute.Sitemap[number]["changeFrequency"];

/** يبني إدخالين (عربي + إنجليزي) لكل مسار متوفر باللغتين مع hreflang */
function bilingual(
  path: string,
  lastModified: Date,
  changeFrequency: ChangeFreq,
  priority: number,
  enPriority?: number
): MetadataRoute.Sitemap {
  const arUrl = SITE + path;
  const enUrl = SITE + "/en" + (path === "/" ? "" : path);
  const languages = { ar: arUrl, en: enUrl, "x-default": arUrl };
  return [
    { url: arUrl, lastModified, changeFrequency, priority, alternates: { languages } },
    {
      url: enUrl,
      lastModified,
      changeFrequency,
      priority: enPriority ?? Math.max(priority - 0.1, 0.1),
      alternates: { languages },
    },
  ];
}

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    ...bilingual("/", now, "daily", 1.0, 0.9),
    ...bilingual("/all-games", now, "weekly", 0.9),
    ...bilingual("/categories", now, "weekly", 0.8),
    ...bilingual("/category/top", now, "daily", 0.8),
    ...bilingual("/category/trending", now, "daily", 0.8),
    ...bilingual("/about", now, "monthly", 0.3),
    ...bilingual("/privacy", now, "monthly", 0.3),
    ...bilingual("/terms", now, "monthly", 0.3),
    // المدوّنة والأخبار عربية فقط — بدون نسخة إنجليزية
    { url: SITE + "/blog", lastModified: now, changeFrequency: "weekly", priority: 0.6 },
    { url: SITE + "/news", lastModified: now, changeFrequency: "daily", priority: 0.7 },
  ];

  const categoryRoutes: MetadataRoute.Sitemap = categories.flatMap((c) =>
    bilingual("/category/" + c.slug, now, "weekly", 0.7)
  );

  const bestRoutes: MetadataRoute.Sitemap = categories.flatMap((c) =>
    bilingual("/best/" + c.slug, now, "weekly", 0.7)
  );

  const gameRoutes: MetadataRoute.Sitemap = allGames.flatMap((g) =>
    bilingual("/play/" + g.slug, now, "monthly", 0.6)
  );

  const similarRoutes: MetadataRoute.Sitemap = allGames.flatMap((g) =>
    bilingual("/play/" + g.slug + "/like", now, "monthly", 0.5)
  );

  const blogRoutes: MetadataRoute.Sitemap = getAllPosts().map((p) => ({
    url: SITE + "/blog/" + p.slug,
    lastModified: new Date(p.updatedAt),
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  const newsRoutes: MetadataRoute.Sitemap = getAllNews().map((n) => ({
    url: SITE + "/news/" + n.slug,
    lastModified: new Date(n.publishedAt),
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  return [
    ...staticRoutes,
    ...newsRoutes,
    ...blogRoutes,
    ...categoryRoutes,
    ...bestRoutes,
    ...gameRoutes,
    ...similarRoutes,
  ];
}
