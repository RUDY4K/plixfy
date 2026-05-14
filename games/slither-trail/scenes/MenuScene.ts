import Phaser from 'phaser';
import {
  GAME_WIDTH,
  GAME_HEIGHT,
  BG_TOP,
  BG_BOTTOM,
  CELL,
  SNAKE_HEAD,
  SNAKE_BODY,
  SNAKE_BODY_ALT,
  FOOD_COLOR,
} from '../lib/constants';
import { loadBest } from '../lib/highscore';

export class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MenuScene' });
  }

  create(): void {
    this.drawBackdrop();

    this.add
      .text(GAME_WIDTH / 2, 120, 'Slither Trail', {
        fontFamily: 'sans-serif',
        fontSize: '44px',
        color: '#22c55e',
        fontStyle: 'bold',
        stroke: '#064e3b',
        strokeThickness: 6,
      })
      .setOrigin(0.5);

    this.add
      .text(GAME_WIDTH / 2, 170, 'Eat. Grow. Don’t bite yourself.', {
        fontFamily: 'sans-serif',
        fontSize: '15px',
        color: '#94a3b8',
      })
      .setOrigin(0.5);

    this.drawDecorativeSnake();

    const best = loadBest();
    if (best > 0) {
      this.add
        .text(GAME_WIDTH / 2, GAME_HEIGHT - 230, `Best: ${best}`, {
          fontFamily: 'sans-serif',
          fontSize: '20px',
          color: '#facc15',
          fontStyle: 'bold',
        })
        .setOrigin(0.5);
    }

    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT - 180, 'Arrows · WASD · D-pad', {
        fontFamily: 'sans-serif',
        fontSize: '14px',
        color: '#94a3b8',
      })
      .setOrigin(0.5);

    const cta = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT - 130, 'Tap / Space to start', {
        fontFamily: 'sans-serif',
        fontSize: '20px',
        color: '#ffffff',
        backgroundColor: '#16a34a',
        padding: { left: 18, right: 18, top: 10, bottom: 10 },
        fontStyle: 'bold',
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

    this.input.keyboard?.addCapture([
      'SPACE',
      'UP',
      'DOWN',
      'LEFT',
      'RIGHT',
      'W',
      'A',
      'S',
      'D',
    ]);

    const start = () => this.scene.start('GameScene');
    this.input.once('pointerdown', start);
    for (const key of ['SPACE', 'UP', 'DOWN', 'LEFT', 'RIGHT', 'W', 'A', 'S', 'D']) {
      this.input.keyboard?.once(`keydown-${key}`, start);
    }
  }

  private drawBackdrop(): void {
    const g = this.add.graphics();
    g.fillGradientStyle(BG_TOP, BG_TOP, BG_BOTTOM, BG_BOTTOM, 1);
    g.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
  }

  private drawDecorativeSnake(): void {
    const g = this.add.graphics();
    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT / 2 - 20;
    const segments = 8;
    for (let i = segments - 1; i >= 0; i--) {
      const color = i === 0 ? SNAKE_HEAD : i % 2 === 0 ? SNAKE_BODY : SNAKE_BODY_ALT;
      g.fillStyle(color, 1);
      const x = cx - (segments * CELL) / 2 + i * CELL;
      g.fillRoundedRect(x + 1, cy - CELL / 2, CELL - 2, CELL - 2, 4);
    }
    // food in front of snake
    g.fillStyle(FOOD_COLOR, 1);
    g.fillCircle(cx + (segments * CELL) / 2 + 14, cy, 7);

    // Make snake bob
    this.tweens.add({
      targets: g,
      y: -8,
      duration: 900,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }
}
