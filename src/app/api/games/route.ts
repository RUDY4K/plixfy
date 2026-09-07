import { NextResponse } from "next/server";
import { categoryShortLabel } from "@/lib/categoryI18n";
import { allGames } from "@/lib/games";
import type { Locale } from "@/lib/i18n";

export function GET(request: Request) {
  const url = new URL(request.url);
  const locale: Locale = url.searchParams.get("locale") === "en" ? "en" : "ar";
  const requested = (url.searchParams.get("slugs") ?? "")
    .split(",")
    .map((slug) => slug.trim())
    .filter(Boolean)
    .slice(0, 100);
  const wanted = new Set(requested);
  const bySlug = new Map(allGames.filter((game) => wanted.has(game.slug)).map((game) => [game.slug, game]));
  const games = requested.flatMap((slug) => {
    const game = bySlug.get(slug);
    return game
      ? [{
          title: game.title,
          slug: game.slug,
          thumbnail: game.thumbnail,
          thumbnailWide: game.thumbnailWide,
          category: categoryShortLabel(game.categorySlug, locale, game.category),
          categorySlug: game.categorySlug,
          badge: game.badge,
        }]
      : [];
  });
  return NextResponse.json({ games }, { headers: { "Cache-Control": "public, max-age=300" } });
}
