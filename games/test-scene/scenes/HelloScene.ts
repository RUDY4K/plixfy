import Phaser from 'phaser';

export class HelloScene extends Phaser.Scene {
  constructor() {
    super({ key: 'HelloScene' });
  }

  create(): void {
    const { width, height } = this.scale;

    this.cameras.main.setBackgroundColor('#0a0a0a');

    const grad = this.add.graphics();
    grad.fillGradientStyle(0x1e293b, 0x1e293b, 0x0a0a0a, 0x0a0a0a, 1);
    grad.fillRect(0, 0, width, height);

    this.add
      .text(width / 2, height / 2 - 40, 'Hello Phaser 4', {
        fontFamily: 'sans-serif',
        fontSize: '48px',
        color: '#4ade80',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, height / 2 + 20, 'Click anywhere — engine is alive', {
        fontFamily: 'sans-serif',
        fontSize: '18px',
        color: '#a3a3a3',
      })
      .setOrigin(0.5);

    const circle = this.add.circle(width / 2, height / 2 + 80, 12, 0x4ade80);

    this.tweens.add({
      targets: circle,
      scale: 1.6,
      alpha: 0.4,
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    this.input.on('pointerdown', () => {
      this.cameras.main.flash(200, 74, 222, 128);
    });
  }
}
