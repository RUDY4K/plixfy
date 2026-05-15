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
