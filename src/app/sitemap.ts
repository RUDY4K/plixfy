import type { MetadataRoute } from "next";
import { allGames, categories } from "@/lib/games";
import { hasEditorialGameContent } from "@/lib/gameContent";
import catalogMeta from "@/data/playgama-catalog-meta.json";

const SITE = "https://www.plixfy.com";

type ChangeFreq = MetadataRoute.Sitemap[number]["changeFrequency"];
type SitemapExtras = Pick<
  MetadataRoute.Sitemap[number],
  "lastModified" | "images"
>;

// Updated by the Playgama sync only when the material catalog JSON changes.
const GAME_CATALOG_LAST_MODIFIED = new Date(catalogMeta.syncedAt);

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
    ...bilingual("/contact", "monthly", 0.4),
    ...bilingual("/editorial-policy", "monthly", 0.4),
    ...bilingual("/privacy", "monthly", 0.3),
    ...bilingual("/terms", "monthly", 0.3),
  ];

  const categoryRoutes: MetadataRoute.Sitemap = categories.flatMap((c) =>
    bilingual("/category/" + c.slug, "weekly", 0.7)
  );

  const gameRoutes: MetadataRoute.Sitemap = allGames.flatMap((game) => {
    const hasAr = hasEditorialGameContent(game.slug, "ar");
    const hasEn = hasEditorialGameContent(game.slug, "en");
    const arUrl = `${SITE}/play/${game.slug}`;
    const enUrl = `${SITE}/en/play/${game.slug}`;
    const languages = {
      ...(hasAr ? { ar: arUrl, "x-default": arUrl } : {}),
      ...(hasEn ? { en: enUrl } : {}),
    };

    return [
      ...(hasAr
        ? [{
            url: arUrl,
            lastModified: GAME_CATALOG_LAST_MODIFIED,
            changeFrequency: "monthly" as const,
            priority: 0.6,
            images: [game.thumbnail],
            alternates: { languages },
          }]
        : []),
      ...(hasEn
        ? [{
            url: enUrl,
            lastModified: GAME_CATALOG_LAST_MODIFIED,
            changeFrequency: "monthly" as const,
            priority: 0.5,
            images: [game.thumbnail],
            alternates: { languages },
          }]
        : []),
    ];
  });

  return [
    ...staticRoutes,
    ...categoryRoutes,
    ...gameRoutes,
  ];
}
