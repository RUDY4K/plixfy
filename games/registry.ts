import type { GameMeta } from '@/types/game';
import { CUSTOM_GAMES } from './registry-custom';
import { EMBED_GAMES } from './registry-embed';

export const GAMES: readonly GameMeta[] = [...CUSTOM_GAMES, ...EMBED_GAMES];

export function findGame(slug: string): GameMeta | undefined {
  return GAMES.find((g) => g.slug === slug);
}

export function gamesByCategory(category: GameMeta['category']): GameMeta[] {
  return GAMES.filter((g) => g.category === category);
}

export function liveGames(): GameMeta[] {
  return GAMES.filter((g) => g.status === 'live');
}

export function customGames(): GameMeta[] {
  return GAMES.filter((g) => g.kind === 'custom');
}

export function embedGames(): GameMeta[] {
  return GAMES.filter((g) => g.kind === 'embed');
}

/**
 * Curated "trending" slugs — recognizable big-name titles users actually
 * search for. Order matters: this is the order they appear in the row.
 */
const TRENDING_SLUGS = [
  'moto-x3m',
  'hill-climb-racing-2',
  'helix-jump',
  'bubble-shooter-original',
  'basketball-stars',
  'pool-8-ball',
  'stickman-death-run',
  'stick-duel-battle',
  'microsoft-solitaire-collection',
  'highway-traffic',
] as const;

export function trendingGames(): GameMeta[] {
  const by = new Map(GAMES.map((g) => [g.slug, g] as const));
  return TRENDING_SLUGS.map((s) => by.get(s)).filter((g): g is GameMeta => Boolean(g) && g!.status === 'live');
}

/**
 * The last N live embed games in the registry are treated as "recently
 * added" — generate-embed-registry.mjs appends new harvest results, so
 * tail of the array is the freshest set.
 */
export function recentlyAddedGames(limit = 12): GameMeta[] {
  const trendingSet = new Set<string>(TRENDING_SLUGS);
  return EMBED_GAMES
    .filter((g) => g.status === 'live' && !trendingSet.has(g.slug))
    .slice(-limit)
    .reverse();
}
