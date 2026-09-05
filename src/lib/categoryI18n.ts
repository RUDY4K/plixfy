import { getCategoryMeta, type CategoryMeta } from "@/lib/games";
import type { Locale } from "@/lib/i18n";

/** أسماء وأوصاف التصنيفات بالإنجليزية — تقابل categoryMeta العربية في games.ts */
const categoryMetaEn: Record<string, CategoryMeta> = {
  racing: { name: "Racing Games", icon: "🏎️", description: "Challenge your friends in the fastest cars on the wildest tracks" },
  action: { name: "Action & Fighting", icon: "⚔️", description: "Thrilling battles and endless adventures" },
  puzzle: { name: "Puzzle & Brain", icon: "🧩", description: "Test your wits with the best puzzles" },
  io: { name: ".io Games", icon: "🌐", description: "Play against players from around the world" },
  girls: { name: "Games for Girls", icon: "💖", description: "Fashion, cooking, makeup and more" },
  casual: { name: "Casual Games", icon: "🎯", description: "Fun games for any time" },
  sports: { name: "Sports Games", icon: "⚽", description: "Football, basketball and tennis" },
  shooting: { name: "Shooting Games", icon: "🎯", description: "Aim, defend and win" },
  trending: { name: "Explore Roblox-style games", icon: "🔥", description: "Automatic selections using catalog genre tags and game titles" },
  top: { name: "Explore the library", icon: "👑", description: "A selection for discovering games from the catalog" },
};

export function getLocalizedCategoryMeta(
  slug: string,
  locale: Locale
): CategoryMeta | null {
  if (locale === "en") return categoryMetaEn[slug] ?? null;
  return getCategoryMeta(slug);
}

/** التسمية القصيرة للتصنيف (كما تظهر على بطاقات الألعاب) حسب اللغة */
export function categoryShortLabel(
  slug: string,
  locale: Locale,
  fallback: string
): string {
  if (locale === "ar") return fallback;
  return categoryMetaEn[slug]?.name ?? fallback;
}
