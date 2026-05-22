import type { GameMeta, LightGameMeta } from '@/types/game';
import { toLightGame } from '@/types/game';
import { CUSTOM_GAMES } from './registry-custom';
import { EMBED_GAMES } from './registry-embed';
import { EXTRA_GAMES } from './registry-extra';

/**
 * Feature flag — when true, every game with provider==='gamedistribution'
 * is excluded from the live catalog. GameDistribution's player checks the
 * embedding domain against an approved-publisher list and redirects to a
 * "CLICK HERE TO PLAY" page (their `dmain:false` gate) when our domain
 * isn't approved. The publisher application is in flight; flip this back
 * to `false` the moment GD whitelists plixfy.com to re-enable ~5,594
 * games in one deploy without re-harvesting anything.
 *
 * Investigation + evidence: docs/research/embeddable-game-sources.md
 * and the curl probe of game.api.gamedistribution.com.
 */
const HIDE_GAMEDISTRIBUTION = true;

const ALL_GAMES: readonly GameMeta[] = [...CUSTOM_GAMES, ...EMBED_GAMES, ...EXTRA_GAMES];

export const GAMES: readonly GameMeta[] = HIDE_GAMEDISTRIBUTION
  ? ALL_GAMES.filter((g) => !(g.kind === 'embed' && g.provider === 'gamedistribution'))
  : ALL_GAMES;

/**
 * Light projection of the full catalog. Used by every browse-side
 * surface (homepage grid, category cards, carousel rows, favorites,
 * random link). Drops longDescription/controls/embedUrl/provider so
 * the RSC payload shipped to the client stays small at 3000+ games.
 */
export const LIGHT_GAMES: readonly LightGameMeta[] = GAMES.map(toLightGame);

export function findGame(slug: string): GameMeta | undefined {
  return GAMES.find((g) => g.slug === slug);
}

export function gamesByCategory(category: GameMeta['category']): GameMeta[] {
  return GAMES.filter((g) => g.category === category);
}

export function liveGames(): LightGameMeta[] {
  return LIGHT_GAMES.filter((g) => g.status === 'live');
}

export function customGames(): LightGameMeta[] {
  return LIGHT_GAMES.filter((g) => g.kind === 'custom');
}

export function embedGames(): LightGameMeta[] {
  return LIGHT_GAMES.filter((g) => g.kind === 'embed');
}

/** All live games in the "io" or "multiplayer" categories, for the dedicated row. */
export function ioMultiplayerGames(limit = 24): LightGameMeta[] {
  return LIGHT_GAMES
    .filter((g) => g.status === 'live' && (g.category === 'io' || g.category === 'multiplayer'))
    .slice(0, limit);
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

export function trendingGames(): LightGameMeta[] {
  const by = new Map(LIGHT_GAMES.map((g) => [g.slug, g] as const));
  return TRENDING_SLUGS.map((s) => by.get(s)).filter((g): g is LightGameMeta => Boolean(g) && g!.status === 'live');
}

/**
 * The last N live embed games in the registry are treated as "recently
 * added" — generate-embed-registry.mjs appends new harvest results, so
 * tail of the array is the freshest set.
 */
export function recentlyAddedGames(limit = 12): LightGameMeta[] {
  const trendingSet = new Set<string>(TRENDING_SLUGS);
  return EMBED_GAMES
    .filter((g) => g.status === 'live' && !trendingSet.has(g.slug))
    .slice(-limit)
    .reverse()
    .map(toLightGame);
}

/**
 * Recommendations for a game-detail page.
 *
 * Score = same-category (3pts) + shared keyword (1pt each). Self-excluded.
 * Picks up to `limit` distinct top-scored live games. When ties happen,
 * embed games sort before custom because the catalog is mostly embeds and
 * users want similar discovery, not the same 4 originals over and over.
 */
export function relatedGames(slug: string, limit = 8): GameMeta[] {
  const target = findGame(slug);
  if (!target) return [];
  const targetKeywords = new Set(target.keywords.map((k) => k.toLowerCase()));

  const scored = GAMES
    .filter((g) => g.slug !== slug && g.status === 'live')
    .map((g) => {
      let score = 0;
      if (g.category === target.category) score += 3;
      for (const kw of g.keywords) {
        if (targetKeywords.has(kw.toLowerCase())) score += 1;
      }
      return { game: g, score };
    })
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score);

  return scored.slice(0, limit).map((s) => s.game);
}
