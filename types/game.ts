import type Phaser from 'phaser';

export type GameCategory = 'puzzle' | 'arcade' | 'strategy' | 'casual' | 'word';
export type Difficulty = 'easy' | 'medium' | 'hard';

export interface GameMeta {
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
  status: 'live' | 'coming-soon';
  engine: 'phaser' | 'react';
}

/**
 * Each game module is loaded lazily, so its `import Phaser from 'phaser'`
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
