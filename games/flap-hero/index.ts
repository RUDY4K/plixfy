import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { MenuScene } from './scenes/MenuScene';
import { GameScene } from './scenes/GameScene';
import { GameOverScene } from './scenes/GameOverScene';
import { GAME_WIDTH, GAME_HEIGHT } from './lib/constants';

/**
 * Flap Hero — Flappy Bird-style arcade game.
 * Module imports Phaser at the top, so it must only be loaded via dynamic
 * import (see app/games/[slug]/GameStage.tsx).
 */
export function createConfig(parent: HTMLElement): Phaser.Types.Core.GameConfig {
  return {
    type: Phaser.AUTO,
    parent,
    backgroundColor: '#0f172a',
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: GAME_WIDTH,
      height: GAME_HEIGHT,
    },
    physics: {
      default: 'arcade',
      arcade: {
        gravity: { x: 0, y: 0 },
        debug: false,
      },
    },
    input: {
      activePointers: 2,
    },
    scene: [BootScene, MenuScene, GameScene, GameOverScene],
  };
}
