import Phaser from 'phaser';
import { HelloScene } from './scenes/HelloScene';

/**
 * NOTE: This module imports Phaser at the top level, so it must NEVER be
 * statically imported by SSR-rendered code. Import it via dynamic() / await
 * import() only.
 */
export function createConfig(parent: HTMLElement): Phaser.Types.Core.GameConfig {
  return {
    type: Phaser.AUTO,
    parent,
    backgroundColor: '#0a0a0a',
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: 800,
      height: 600,
    },
    scene: [HelloScene],
  };
}
