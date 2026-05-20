import Phaser from 'phaser';
import {
  TEXTURE,
  GAME_WIDTH,
  GAME_HEIGHT,
  SKY_TOP,
  SKY_BOTTOM,
  GROUND_HEIGHT,
} from '../lib/constants';
import { loadBest, recordScore } from '../lib/highscore';
import { trackGameEnd, trackHighScore, trackShare } from '@/lib/analytics';
import { showInterstitial } from '@/lib/ads';

interface GameOverData {
  score: number;
  durationSec: number;
}

export class GameOverScene extends Phaser.Scene {
  private result: GameOverData = { score: 0, durationSec: 0 };

  constructor() {
    super({ key: 'GameOverScene' });
  }

  init(data: GameOverData): void {
    this.result = { score: data?.score ?? 0, durationSec: data?.durationSec ?? 0 };
  }

  create(): void {
    const { score, durationSec } = this.result;
    const previousBest = loadBest();
    const newBest = recordScore(score);
    const isNewRecord = score > previousBest && score === newBest;

    trackGameEnd('flap-hero', score, durationSec, 'died');
    if (isNewRecord) trackHighScore('flap-hero', score);

    // *** AD BREAK POINT ***
    // Stub call today (logs to console); swaps to real provider in Prompt 8.
    void showInterstitial('next', 'flap-hero');

    this.drawBackdrop();

    this.add
      .text(GAME_WIDTH / 2, 140, 'Game Over', {
        fontFamily: 'sans-serif',
        fontSize: '48px',
        color: '#fde047',
        fontStyle: 'bold',
        stroke: '#1f2937',
        strokeThickness: 6,
      })
      .setOrigin(0.5);

    const panel = this.add.rectangle(GAME_WIDTH / 2, 320, 320, 200, 0x0f172a, 0.85);
    panel.setStrokeStyle(3, 0x4ade80);

    this.add
      .text(GAME_WIDTH / 2, 260, 'Score', {
        fontFamily: 'sans-serif',
        fontSize: '18px',
        color: '#94a3b8',
      })
      .setOrigin(0.5);

    this.add
      .text(GAME_WIDTH / 2, 295, String(score), {
        fontFamily: 'sans-serif',
        fontSize: '52px',
        color: '#ffffff',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    this.add
      .text(GAME_WIDTH / 2, 350, 'Best', {
        fontFamily: 'sans-serif',
        fontSize: '14px',
        color: '#94a3b8',
      })
      .setOrigin(0.5);

    this.add
      .text(GAME_WIDTH / 2, 380, String(newBest), {
        fontFamily: 'sans-serif',
        fontSize: '28px',
        color: '#facc15',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    if (isNewRecord) {
      const badge = this.add
        .text(GAME_WIDTH / 2, 410, 'NEW RECORD', {
          fontFamily: 'sans-serif',
          fontSize: '14px',
          color: '#0f172a',
          backgroundColor: '#fde047',
          padding: { left: 10, right: 10, top: 4, bottom: 4 },
          fontStyle: 'bold',
        })
        .setOrigin(0.5);
      this.tweens.add({
        targets: badge,
        scale: 1.15,
        duration: 500,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    }

    const playBtn = this.makeButton(GAME_WIDTH / 2 - 70, 500, 'Play again', 0x16a34a, () =>
      this.scene.start('GameScene')
    );
    void playBtn;

    const shareBtn = this.makeButton(GAME_WIDTH / 2 + 70, 500, 'Share', 0x1e293b, () =>
      this.handleShare(score, newBest)
    );
    void shareBtn;

    const menuBtn = this.makeButton(GAME_WIDTH / 2, 570, 'Main menu', 0x334155, () =>
      this.scene.start('MenuScene')
    );
    void menuBtn;

    this.input.keyboard?.addCapture(['SPACE']);
    this.input.keyboard?.once('keydown-SPACE', () => this.scene.start('GameScene'));
  }

  private makeButton(
    x: number,
    y: number,
    label: string,
    color: number,
    onClick: () => void
  ): Phaser.GameObjects.Text {
    const text = this.add
      .text(x, y, label, {
        fontFamily: 'sans-serif',
        fontSize: '20px',
        color: '#ffffff',
        backgroundColor: `#${color.toString(16).padStart(6, '0')}`,
        padding: { left: 18, right: 18, top: 10, bottom: 10 },
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    text.on('pointerdown', onClick);
    text.on('pointerover', () => text.setAlpha(0.85));
    text.on('pointerout', () => text.setAlpha(1));
    return text;
  }

  private async handleShare(score: number, best: number): Promise<void> {
    trackShare('flap-hero', 'clipboard');
    const msg = `I scored ${score} in Flap Hero on Plixfy (best: ${best}). Can you beat it?`;
    try {
      if (typeof navigator !== 'undefined' && navigator.share) {
        await navigator.share({ title: 'Flap Hero', text: msg });
        return;
      }
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(msg);
        this.showToast('Copied to clipboard');
        return;
      }
    } catch {
      /* user dismissed or unavailable */
    }
    this.showToast('Share unavailable');
  }

  private showToast(msg: string): void {
    const toast = this.add
      .text(GAME_WIDTH / 2, 640, msg, {
        fontFamily: 'sans-serif',
        fontSize: '14px',
        color: '#0f172a',
        backgroundColor: '#fde047',
        padding: { left: 12, right: 12, top: 6, bottom: 6 },
      })
      .setOrigin(0.5);
    this.tweens.add({
      targets: toast,
      alpha: 0,
      y: 620,
      delay: 900,
      duration: 600,
      onComplete: () => toast.destroy(),
    });
  }

  private drawBackdrop(): void {
    const g = this.add.graphics();
    g.fillGradientStyle(SKY_TOP, SKY_TOP, SKY_BOTTOM, SKY_BOTTOM, 1);
    g.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    this.add
      .tileSprite(0, GAME_HEIGHT - GROUND_HEIGHT, GAME_WIDTH, GROUND_HEIGHT, TEXTURE.ground)
      .setOrigin(0, 0);
  }
}
