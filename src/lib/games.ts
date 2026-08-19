import type { GameBadge } from "@/components/GameCard";
import playgamaGamesData from "@/data/playgama-games.json";

export type GameSource = "playgama";
export type GameDeviceSupport =
  | "mobile-and-desktop"
  | "mobile-only"
  | "desktop-only"
  | "unknown";
export type GameOrientation = "landscape" | "portrait" | "both";

export interface Game {
  title: string;
  slug: string;
  thumbnail: string;
  thumbnailWide: string;
  images: readonly string[];
  videoId?: string;
  badge: GameBadge;
  category: string;
  categorySlug: CategorySlug;
  description?: string;
  howToPlay?: string;
  supportedLanguages: readonly string[];
  genres: readonly string[];
  inGamePurchases: boolean;
  plays?: number;
  supportedDevices: GameDeviceSupport;
  orientation: GameOrientation;
  source: GameSource;
}

export type CategorySlug =
  | "racing"
  | "action"
  | "puzzle"
  | "io"
  | "girls"
  | "casual"
  | "sports"
  | "shooting";

export interface Category {
  slug: CategorySlug;
  labelAr: string;
  labelEn: string;
  iconSeed: string;
}

export const categories: readonly Category[] = [
  { slug: "racing", labelAr: "سباق", labelEn: "Racing", iconSeed: "racing-icon" },
  { slug: "action", labelAr: "أكشن", labelEn: "Action", iconSeed: "action-icon" },
  { slug: "puzzle", labelAr: "ألغاز", labelEn: "Puzzle", iconSeed: "puzzle-icon" },
  { slug: "io", labelAr: "آيو", labelEn: ".io", iconSeed: "io-icon" },
  { slug: "girls", labelAr: "بنات", labelEn: "Girls", iconSeed: "girls-icon" },
  { slug: "casual", labelAr: "خفيف", labelEn: "Casual", iconSeed: "casual-icon" },
  { slug: "sports", labelAr: "رياضة", labelEn: "Sports", iconSeed: "sports-icon" },
  { slug: "shooting", labelAr: "تصويب", labelEn: "Shooting", iconSeed: "shooting-icon" },
];

interface ImportedPlaygamaGame {
  title: string;
  slug: string;
  thumbnail: string;
  thumbnailWide: string;
  images: string[];
  videoId?: string;
  category: string;
  categorySlug: CategorySlug;
  description?: string;
  howToPlay?: string;
  supportedLanguages: string[];
  genres: string[];
  inGamePurchases: boolean;
  supportedDevices: GameDeviceSupport;
  orientation: GameOrientation;
}

const importedGames = playgamaGamesData as ImportedPlaygamaGame[];

export const allGames: readonly Game[] = importedGames.map((game, index) => ({
  ...game,
  badge: index < 12 ? "top" : index < 36 ? "new" : null,
  source: "playgama",
}));

const slugToGame = new Map(allGames.map((game) => [game.slug, game]));
const gamesByCategoryMap = categories.reduce(
  (result, category) => {
    result[category.slug] = allGames.filter((game) => game.categorySlug === category.slug);
    return result;
  },
  {} as Record<CategorySlug, readonly Game[]>,
);

function toExcludeSet(excludeSlugs?: Iterable<string>): Set<string> | null {
  if (!excludeSlugs) return null;
  const set = excludeSlugs instanceof Set ? excludeSlugs : new Set(excludeSlugs);
  return set.size === 0 ? null : (set as Set<string>);
}

export function getGamesByCategory(
  slug: CategorySlug,
  excludeSlugs?: Iterable<string>,
): readonly Game[] {
  const games = gamesByCategoryMap[slug] ?? [];
  const excluded = toExcludeSet(excludeSlugs);
  return excluded ? games.filter((game) => !excluded.has(game.slug)) : games;
}

export function getTrendingGames(excludeSlugs?: Iterable<string>): readonly Game[] {
  const excluded = toExcludeSet(excludeSlugs);
  return allGames.filter((game) => !excluded?.has(game.slug)).slice(0, 12);
}

export function getTopPicks(excludeSlugs?: Iterable<string>): readonly Game[] {
  const excluded = toExcludeSet(excludeSlugs);
  return allGames.filter((game) => !excluded?.has(game.slug)).slice(0, 24);
}

/** A stable Riyadh-day rotation keeps the homepage fresh without changing mid-session. */
export function getFeaturedGame(): Game & { description: string; thumbnailWide: string } {
  const candidates = allGames.slice(0, Math.min(60, allGames.length));
  const riyadhDate = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Riyadh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  const dayNumber = Math.floor(Date.parse(`${riyadhDate}T00:00:00Z`) / 86_400_000);
  const base = candidates[Math.abs(dayNumber) % candidates.length] ?? allGames[0];
  return {
    ...base,
    description: base.description ?? "ألعاب جديدة تنتظرك — العب الآن بدون تحميل",
    thumbnailWide: base.thumbnailWide || base.thumbnail,
  };
}

export function getPlaygamaVideoUrl(videoId: string): string {
  return `https://static.playgama.com/p-video/${encodeURIComponent(videoId)}/orig_length_h640.mp4`;
}

export function getGameBySlug(slug: string): Game | undefined {
  return slugToGame.get(slug);
}

export interface CategoryMeta {
  name: string;
  icon: string;
  description: string;
}

export const categoryMeta: Record<string, CategoryMeta> = {
  racing: { name: "ألعاب السباق", icon: "🏎️", description: "تحدّ أصدقاءك في أسرع سيارات وأشد الطرق" },
  action: { name: "أكشن وقتال", icon: "⚔️", description: "معارك مثيرة ومغامرات بلا حدود" },
  puzzle: { name: "ألغاز ومخ", icon: "🧩", description: "اختبر ذكاءك مع أقوى الألغاز" },
  io: { name: "ألعاب آيو", icon: "🌐", description: "العب ضد لاعبين من كل العالم" },
  girls: { name: "ألعاب البنات", icon: "💖", description: "أزياء، طبخ، ومكياج وأكثر" },
  casual: { name: "ألعاب خفيفة", icon: "🎯", description: "ألعاب ممتعة لكل الأوقات" },
  sports: { name: "ألعاب رياضية", icon: "⚽", description: "كرة، كرة سلة، وتنس" },
  shooting: { name: "ألعاب إطلاق نار", icon: "🎯", description: "صوّب ودافع وانتصر" },
  trending: { name: "ألعاب رائجة الآن", icon: "🔥", description: "أكثر الألعاب لعباً هذا الأسبوع" },
  top: { name: "ترشيحات بليكسفاي", icon: "👑", description: "أفضل ألعاب اخترناها لك" },
};

export function getCategoryMeta(slug: string): CategoryMeta | null {
  return categoryMeta[slug] ?? null;
}

export function getCategoryGames(slug: string): readonly Game[] {
  if (slug === "trending") return getTrendingGames();
  if (slug === "top") return getTopPicks();
  return getGamesByCategory(slug as CategorySlug);
}
