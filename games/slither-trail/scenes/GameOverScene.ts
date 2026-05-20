import Phaser from 'phaser';
import {
  GAME_WIDTH,
  GAME_HEIGHT,
  BG_TOP,
  BG_BOTTOM,
} from '../lib/constants';
import { loadBest, recordScore } from '../lib/highscore';
import { trackGameEnd, trackHighScore, trackShare } from '@/lib/analytics';
import { showInterstitial } from '@/lib/ads';

interface GameOverData {
  score: number;
  durationSec: number;
  length: number;
}

export class GameOverScene extends Phaser.Scene {
  private result: GameOverData = { score: 0, durationSec: 0, length: 0 };

  constructor() {
    super({ key: 'GameOverScene' });
  }

  init(data: GameOverData): void {
    this.result = {
      score: data?.score ?? 0,
      durationSec: data?.durationSec ?? 0,
      length: data?.length ?? 0,
    };
  }

  create(): void {
    const { score, durationSec, length } = this.result;
    const previousBest = loadBest();
    const newBest = recordScore(score);
    const isNewRecord = score > previousBest && score === newBest;

    trackGameEnd('slither-trail', score, durationSec, 'died');
    if (isNewRecord) trackHighScore('slither-trail', score);

    // *** AD BREAK POINT ***
    // Stub today; swaps to real provider in Prompt 8.
    void showInterstitial('next', 'slither-trail');

    this.drawBackdrop();

    this.add
      .text(GAME_WIDTH / 2, 130, 'Game Over', {
        fontFamily: 'sans-serif',
        fontSize: '44px',
        color: '#22c55e',
        fontStyle: 'bold',
        stroke: '#064e3b',
        strokeThickness: 6,
      })
      .setOrigin(0.5);

    const panel = this.add.rectangle(GAME_WIDTH / 2, 320, 320, 220, 0x0b1220, 0.9);
    panel.setStrokeStyle(3, 0x22c55e);

    this.add
      .text(GAME_WIDTH / 2, 250, 'Score', {
        fontFamily: 'sans-serif',
        fontSize: '16px',
        color: '#94a3b8',
      })
      .setOrigin(0.5);

    this.add
      .text(GAME_WIDTH / 2, 290, String(score), {
        fontFamily: 'sans-serif',
        fontSize: '52px',
        color: '#ffffff',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    this.add
      .text(GAME_WIDTH / 2 - 70, 360, `Length\n${length}`, {
        fontFamily: 'sans-serif',
        fontSize: '14px',
        color: '#94a3b8',
        align: 'center',
      })
      .setOrigin(0.5);

    this.add
      .text(GAME_WIDTH / 2 + 70, 360, `Time\n${durationSec}s`, {
        fontFamily: 'sans-serif',
        fontSize: '14px',
        color: '#94a3b8',
        align: 'center',
      })
      .setOrigin(0.5);

    this.add
      .text(GAME_WIDTH / 2, 405, `Best ${newBest}`, {
        fontFamily: 'sans-serif',
        fontSize: '22px',
        color: '#facc15',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    if (isNewRecord) {
      const badge = this.add
        .text(GAME_WIDTH / 2, 440, 'NEW RECORD', {
          fontFamily: 'sans-serif',
          fontSize: '14px',
          color: '#0b1220',
          backgroundColor: '#facc15',
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

    this.makeButton(GAME_WIDTH / 2 - 75, 510, 'Play again', 0x16a34a, () =>
      this.scene.start('GameScene')
    );
    this.makeButton(GAME_WIDTH / 2 + 75, 510, 'Share', 0x1e293b, () =>
      this.handleShare(score, newBest)
    );
    this.makeButton(GAME_WIDTH / 2, 575, 'Main menu', 0x334155, () =>
      this.scene.start('MenuScene')
    );

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
        fontSize: '18px',
        color: '#ffffff',
        backgroundColor: `#${color.toString(16).padStart(6, '0')}`,
        padding: { left: 16, right: 16, top: 9, bottom: 9 },
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
    trackShare('slither-trail', 'clipboard');
    const msg = `I scored ${score} in Slither Trail on Plixfy (best: ${best}). Can you beat it?`;
    try {
      if (typeof navigator !== 'undefined' && navigator.share) {
        await navigator.share({ title: 'Slither Trail', text: msg });
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
      .text(GAME_WIDTH / 2, 615, msg, {
        fontFamily: 'sans-serif',
        fontSize: '14px',
        color: '#0b1220',
        backgroundColor: '#facc15',
        padding: { left: 12, right: 12, top: 6, bottom: 6 },
      })
      .setOrigin(0.5);
    this.tweens.add({
      targets: toast,
      alpha: 0,
      y: 600,
      delay: 900,
      duration: 600,
      onComplete: () => toast.destroy(),
    });
  }

  private drawBackdrop(): void {
    const g = this.add.graphics();
    g.fillGradientStyle(BG_TOP, BG_TOP, BG_BOTTOM, BG_BOTTOM, 1);
    g.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
  }
}
