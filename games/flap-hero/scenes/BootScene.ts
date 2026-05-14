import Phaser from 'phaser';
import {
  TEXTURE,
  BIRD_BODY,
  BIRD_BEAK,
  BIRD_OUTLINE,
  PIPE_FILL,
  PIPE_EDGE,
  GROUND_FILL,
  GROUND_TOP,
  GAME_WIDTH,
} from '../lib/constants';

/**
 * Generates every sprite the game needs procedurally. No external assets,
 * so this scene finishes in a couple of frames and just hands off to the
 * menu. We still draw a loading bar in case texture generation gets slower
 * on weaker devices.
 */
export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  create(): void {
    this.cameras.main.setBackgroundColor('#0f172a');

    this.add
      .text(GAME_WIDTH / 2, this.scale.height / 2 - 20, 'Flap Hero', {
        fontFamily: 'sans-serif',
        fontSize: '36px',
        color: '#fde047',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    this.add
      .text(GAME_WIDTH / 2, this.scale.height / 2 + 24, 'Loading…', {
        fontFamily: 'sans-serif',
        fontSize: '14px',
        color: '#94a3b8',
      })
      .setOrigin(0.5);

    this.generateTextures();

    this.time.delayedCall(220, () => this.scene.start('MenuScene'));
  }

  private generateTextures(): void {
    this.makeBirdTexture();
    this.makePipeTexture();
    this.makeGroundTexture();
    this.makePixelTexture();
  }

  private makeBirdTexture(): void {
    const W = 48;
    const H = 36;
    const g = this.add.graphics({ x: 0, y: 0 });

    // Body
    g.fillStyle(BIRD_BODY, 1);
    g.fillEllipse(W / 2, H / 2, W - 6, H - 6);
    g.lineStyle(3, BIRD_OUTLINE, 1);
    g.strokeEllipse(W / 2, H / 2, W - 6, H - 6);

    // Belly highlight
    g.fillStyle(0xfef9c3, 1);
    g.fillEllipse(W / 2 - 2, H / 2 + 4, W - 18, H - 18);

    // Wing
    g.fillStyle(0xf59e0b, 1);
    g.fillEllipse(W / 2 - 6, H / 2 + 2, 16, 10);
    g.lineStyle(2, BIRD_OUTLINE, 1);
    g.strokeEllipse(W / 2 - 6, H / 2 + 2, 16, 10);

    // Eye
    g.fillStyle(0xffffff, 1);
    g.fillCircle(W / 2 + 8, H / 2 - 5, 5);
    g.fillStyle(0x1f2937, 1);
    g.fillCircle(W / 2 + 9, H / 2 - 5, 2.5);

    // Beak
    g.fillStyle(BIRD_BEAK, 1);
    g.fillTriangle(W / 2 + 14, H / 2 - 2, W / 2 + 24, H / 2, W / 2 + 14, H / 2 + 4);
    g.lineStyle(2, BIRD_OUTLINE, 1);
    g.strokeTriangle(W / 2 + 14, H / 2 - 2, W / 2 + 24, H / 2, W / 2 + 14, H / 2 + 4);

    g.generateTexture(TEXTURE.bird, W, H);
    g.destroy();
  }

  private makePipeTexture(): void {
    const W = 64;
    const H = 32; // one tile, repeated vertically via setScale or tileSprite
    const g = this.add.graphics({ x: 0, y: 0 });
    g.fillStyle(PIPE_FILL, 1);
    g.fillRect(0, 0, W, H);
    g.lineStyle(3, PIPE_EDGE, 1);
    g.strokeRect(0, 0, W, H);
    // Inner highlight
    g.fillStyle(0x4ade80, 1);
    g.fillRect(6, 0, 6, H);
    g.fillStyle(0x166534, 1);
    g.fillRect(W - 10, 0, 4, H);
    g.generateTexture(TEXTURE.pipe, W, H);
    g.destroy();
  }

  private makeGroundTexture(): void {
    const W = 64;
    const H = 80;
    const g = this.add.graphics({ x: 0, y: 0 });
    g.fillStyle(GROUND_FILL, 1);
    g.fillRect(0, 0, W, H);
    g.fillStyle(GROUND_TOP, 1);
    g.fillRect(0, 0, W, 10);
    // grass tufts
    g.fillStyle(0x166534, 1);
    for (let x = 4; x < W; x += 12) {
      g.fillTriangle(x, 10, x + 4, 4, x + 8, 10);
    }
    g.lineStyle(2, 0x0c4a0c, 0.3);
    for (let y = 18; y < H; y += 8) {
      g.lineBetween(0, y, W, y);
    }
    g.generateTexture(TEXTURE.ground, W, H);
    g.destroy();
  }

  private makePixelTexture(): void {
    const g = this.add.graphics({ x: 0, y: 0 });
    g.fillStyle(0xffffff, 1);
    g.fillRect(0, 0, 2, 2);
    g.generateTexture(TEXTURE.pixel, 2, 2);
    g.destroy();
  }
}
