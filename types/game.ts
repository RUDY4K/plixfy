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

export type EmbedProvider = 'gamedistribution' | 'gamemonetize' | 'gamepix' | 'other';
export type EmbedAspect = '16:9' | '4:3' | '3:4';

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
