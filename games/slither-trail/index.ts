import Phaser from 'phaser';
import { MenuScene } from './scenes/MenuScene';
import { GameScene } from './scenes/GameScene';
import { GameOverScene } from './scenes/GameOverScene';
import { GAME_WIDTH, GAME_HEIGHT } from './lib/constants';

/**
 * Slither Trail — grid-based snake game.
 * Module imports Phaser at module-evaluation time, so it must only be
 * loaded via dynamic import (see app/games/[slug]/GameStage.tsx).
 */
export function createConfig(parent: HTMLElement): Phaser.Types.Core.GameConfig {
  return {
    type: Phaser.AUTO,
    parent,
    backgroundColor: '#0a0a0a',
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: GAME_WIDTH,
      height: GAME_HEIGHT,
    },
    input: {
      activePointers: 2,
    },
    scene: [MenuScene, GameScene, GameOverScene],
  };
}
