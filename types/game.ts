import type Phaser from 'phaser';

export type GameCategory =
  | 'puzzle'
  | 'arcade'
  | 'strategy'
  | 'casual'
  | 'word'
  | 'racing'
  | 'sports'
  | 'action'
  | 'shooting'
  | 'adventure'
  | 'io'
  | 'multiplayer'
  | 'simulation'
  | 'clicker'
  | 'board'
  | 'girls'
  | 'skill'
  | 'stickman'
  | 'zombie'
  | 'cooking';
export type Difficulty = 'easy' | 'medium' | 'hard';
export type GameStatus = 'live' | 'coming-soon' | 'unverified';

export type EmbedProvider =
  | 'gamedistribution'
  | 'gamemonetize'
  | 'gamepix'
  | 'direct'
  | 'onlinegames'
  | 'miniplay'
  | 'gameflare'
  | 'silvergames'
  | 'rocketgames'
  | 'y8'
  | 'playgama'
  | 'other';
export type EmbedAspect = '16:9' | '4:3' | '3:4';

/**
 * Mobile-vs-desktop compatibility.
 *   'all'     — works on both (mouse + touch, or natively responsive)
 *   'mobile'  — touch-first, works great on phones
 *   'desktop' — keyboard / fine-pointer required; hidden by default on mobile
 *   'unknown' — ambiguous; shown on mobile with a small "Best on desktop" badge
 *
 * The field is optional on stored metadata — `lib/platform.ts:classifyPlatform`
 * fills it at registry-merge time using a rules engine over category /
 * controls / keywords / provider, so older harvested entries don't need
 * a re-harvest to participate in the filter.
 */
export type GamePlatform = 'all' | 'mobile' | 'desktop' | 'unknown';

interface BaseGameMeta {
  slug: string;
  title: string;
  description: string;
  longDescription: string;
  thumbnail: string;
  category: GameCategory;
  difficulty: Difficulty;
  controls: string;
  color: string;
  keywords: string[];
  status: GameStatus;
  platform?: GamePlatform;
}

export interface CustomGameMeta extends BaseGameMeta {
  kind: 'custom';
  engine: 'phaser' | 'react';
}

export interface EmbedGameMeta extends BaseGameMeta {
  kind: 'embed';
  provider: EmbedProvider;
  embedUrl: string;
  aspect?: EmbedAspect;
}

export type GameMeta = CustomGameMeta | EmbedGameMeta;

/**
 * Slim projection used by browse views (homepage grid, category cards,
 * carousel rows). Drops the heavy fields — longDescription, controls,
 * embedUrl, provider — which only the detail page needs. Keeps the
 * RSC payload tight when 2000+ games are listed.
 */
export interface LightGameMeta {
  kind: 'custom' | 'embed';
  slug: string;
  title: string;
  description: string;
  thumbnail: string;
  category: GameCategory;
  difficulty: Difficulty;
  color: string;
  keywords: string[];
  status: GameStatus;
  platform: GamePlatform;
}

export function toLightGame(g: GameMeta): LightGameMeta {
  return {
    kind: g.kind,
    slug: g.slug,
    title: g.title,
    description: g.description,
    thumbnail: g.thumbnail,
    category: g.category,
    difficulty: g.difficulty,
    color: g.color,
    keywords: g.keywords,
    status: g.status,
    platform: g.platform ?? 'unknown',
  };
}

/**
 * Each Phaser game module is loaded lazily, so its `import Phaser from 'phaser'`
 * statement only runs in the browser. The shape below is what callers
 * (PhaserGame) expect a dynamically-imported game module to export.
 */
export interface PhaserGameModule {
  createConfig: (parent: HTMLElement) => Phaser.Types.Core.GameConfig;
}

export type GameLoader = () => Promise<PhaserGameModule>;

export interface ScoreRecord {
  game: string;
  score: number;
  achievedAt: number;
}
