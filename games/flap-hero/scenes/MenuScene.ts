import Phaser from 'phaser';
import {
  TEXTURE,
  GAME_WIDTH,
  GAME_HEIGHT,
  SKY_TOP,
  SKY_BOTTOM,
  GROUND_HEIGHT,
} from '../lib/constants';
import { loadBest } from '../lib/highscore';

export class MenuScene extends Phaser.Scene {
  private bird!: Phaser.GameObjects.Image;

  constructor() {
    super({ key: 'MenuScene' });
  }

  create(): void {
    this.drawSky();
    this.drawGround();

    this.add
      .text(GAME_WIDTH / 2, 120, 'Flap Hero', {
        fontFamily: 'sans-serif',
        fontSize: '52px',
        color: '#fde047',
        fontStyle: 'bold',
        stroke: '#1f2937',
        strokeThickness: 6,
      })
      .setOrigin(0.5);

    this.add
      .text(GAME_WIDTH / 2, 180, 'Tap to fly. Avoid the pipes.', {
        fontFamily: 'sans-serif',
        fontSize: '16px',
        color: '#cbd5e1',
      })
      .setOrigin(0.5);

    this.bird = this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, TEXTURE.bird);
    this.bird.setScale(1.3);
    this.tweens.add({
      targets: this.bird,
      y: this.bird.y - 18,
      duration: 600,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    const best = loadBest();
    if (best > 0) {
      this.add
        .text(GAME_WIDTH / 2, GAME_HEIGHT - 200, `Best: ${best}`, {
          fontFamily: 'sans-serif',
          fontSize: '20px',
          color: '#facc15',
        })
        .setOrigin(0.5);
    }

    const cta = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT - 150, 'Tap / Space to start', {
        fontFamily: 'sans-serif',
        fontSize: '20px',
        color: '#ffffff',
        backgroundColor: '#16a34a',
        padding: { left: 18, right: 18, top: 10, bottom: 10 },
      })
      .setOrigin(0.5);

    this.tweens.add({
      targets: cta,
      alpha: 0.55,
      duration: 700,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    this.input.keyboard?.addCapture(['SPACE', 'UP']);
    const start = () => this.scene.start('GameScene');
    this.input.once('pointerdown', start);
    this.input.keyboard?.once('keydown-SPACE', start);
    this.input.keyboard?.once('keydown-UP', start);
  }

  private drawSky(): void {
    const g = this.add.graphics();
    g.fillGradientStyle(SKY_TOP, SKY_TOP, SKY_BOTTOM, SKY_BOTTOM, 1);
    g.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
  }

  private drawGround(): void {
    const tile = this.add.tileSprite(
      0,
      GAME_HEIGHT - GROUND_HEIGHT,
      GAME_WIDTH,
      GROUND_HEIGHT,
      TEXTURE.ground
    );
    tile.setOrigin(0, 0);
  }
}
