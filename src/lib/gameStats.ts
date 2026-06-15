import { allGames, getGameBySlug, type Game } from "./games";

const FALLBACK_TOP_SLUG = "moto-x3m";

export function getTopGame(): Game {
  let best: Game | null = null;
  let bestPlays = -1;
  for (const g of allGames) {
    if (typeof g.plays === "number" && g.plays > bestPlays) {
      bestPlays = g.plays;
      best = g;
    }
  }
  if (best) return best;
  const fallback = getGameBySlug(FALLBACK_TOP_SLUG);
  if (fallback) return fallback;
  return allGames[0];
}

function hashSlug(slug: string): number {
  let h = 2166136261;
  for (let i = 0; i < slug.length; i++) {
    h ^= slug.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export interface GameStats {
  rating: number;
  ratingDisplay: string;
  playsCount: number;
  playsDisplay: string;
}

export function getGameStats(slug: string): GameStats {
  const h = hashSlug(slug);
  const rating = 3.8 + ((h % 130) / 100);
  const playsRaw = 8_000 + ((h >>> 8) % 240_000);

  return {
    rating,
    ratingDisplay: rating.toFixed(1),
    playsCount: playsRaw,
    playsDisplay: formatPlays(playsRaw),
  };
}

function formatPlays(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return String(n);
}
