import type { MetadataRoute } from "next";
import { allGames, categories } from "@/lib/games";
import { getAllPosts } from "@/lib/blog";
import { getAllNews } from "@/lib/news";

const SITE = "https://www.plixfy.com";

type ChangeFreq = MetadataRoute.Sitemap[number]["changeFrequency"];
type SitemapExtras = Pick<
  MetadataRoute.Sitemap[number],
  "lastModified" | "images"
>;

// Last material catalogue/content refresh. Keep this accurate when game data is
// refreshed; search engines can then trust the date instead of seeing every URL
// as newly changed on every build.
const GAME_CATALOG_LAST_MODIFIED = new Date("2026-07-19T00:00:00.000Z");

/** يبني إدخالين (عربي + إنجليزي) لكل مسار متوفر باللغتين مع hreflang */
function bilingual(
  path: string,
  changeFrequency: ChangeFreq,
  priority: number,
  enPriority?: number,
  extras: SitemapExtras = {},
): MetadataRoute.Sitemap {
  const arUrl = SITE + path;
  const enUrl = SITE + "/en" + (path === "/" ? "" : path);
  const languages = { ar: arUrl, en: enUrl, "x-default": arUrl };
  return [
    {
      url: arUrl,
      changeFrequency,
      priority,
      alternates: { languages },
      ...extras,
    },
    {
      url: enUrl,
      changeFrequency,
      priority: enPriority ?? Math.max(priority - 0.1, 0.1),
      alternates: { languages },
      ...extras,
    },
  ];
}

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes: MetadataRoute.Sitemap = [
    ...bilingual("/", "daily", 1.0, 0.9),
    ...bilingual("/all-games", "weekly", 0.9),
    ...bilingual("/categories", "weekly", 0.8),
    ...bilingual("/category/top", "daily", 0.8),
    ...bilingual("/category/trending", "daily", 0.8),
    ...bilingual("/about", "monthly", 0.3),
    ...bilingual("/privacy", "monthly", 0.3),
    ...bilingual("/terms", "monthly", 0.3),
    ...bilingual("/blog", "weekly", 0.6),
    ...bilingual("/news", "daily", 0.7),
  ];

  const categoryRoutes: MetadataRoute.Sitemap = categories.flatMap((c) =>
    bilingual("/category/" + c.slug, "weekly", 0.7)
  );

  const bestRoutes: MetadataRoute.Sitemap = categories.flatMap((c) =>
    bilingual("/best/" + c.slug, "weekly", 0.7)
  );

  const gameRoutes: MetadataRoute.Sitemap = allGames.flatMap((g) =>
    bilingual("/play/" + g.slug, "monthly", 0.6, undefined, {
      lastModified: GAME_CATALOG_LAST_MODIFIED,
      images: [g.thumbnail],
    }),
  );

  const blogRoutes: MetadataRoute.Sitemap = getAllPosts().flatMap((p) => {
    const languages = {
      ar: SITE + "/blog/" + p.slug,
      en: SITE + "/en/blog/" + p.slug,
      "x-default": SITE + "/blog/" + p.slug,
    };
    return [
      {
        url: languages.ar,
        lastModified: new Date(p.updatedAt),
        changeFrequency: "monthly" as const,
        priority: 0.6,
        alternates: { languages },
      },
      {
        url: languages.en,
        lastModified: new Date(p.updatedAt),
        changeFrequency: "monthly" as const,
        priority: 0.5,
        alternates: { languages },
      },
    ];
  });

  const newsRoutes: MetadataRoute.Sitemap = getAllNews().flatMap((n) => {
    const languages = {
      ar: SITE + "/news/" + n.slug,
      en: SITE + "/en/news/" + n.slug,
      "x-default": SITE + "/news/" + n.slug,
    };
    return [
      {
        url: languages.ar,
        lastModified: new Date(n.publishedAt),
        changeFrequency: "weekly" as const,
        priority: 0.6,
        alternates: { languages },
      },
      {
        url: languages.en,
        lastModified: new Date(n.publishedAt),
        changeFrequency: "weekly" as const,
        priority: 0.5,
        alternates: { languages },
      },
    ];
  });

  return [
    ...staticRoutes,
    ...newsRoutes,
    ...blogRoutes,
    ...categoryRoutes,
    ...bestRoutes,
    ...gameRoutes,
  ];
}
