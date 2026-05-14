import Phaser from 'phaser';
import {
  TEXTURE,
  GAME_WIDTH,
  GAME_HEIGHT,
  SKY_TOP,
  SKY_BOTTOM,
  GROUND_HEIGHT,
  GRAVITY,
  FLAP_VELOCITY,
  PIPE_SPEED_START,
  PIPE_SPEED_MAX,
  PIPE_GAP_START,
  PIPE_GAP_MIN,
  PIPE_SPAWN_MS,
  PIPE_SPAWN_MIN_MS,
} from '../lib/constants';
import { sounds } from '../lib/audio';
import { trackGameStart } from '@/lib/analytics';

type Pipe = Phaser.Physics.Arcade.Sprite & { scored?: boolean };

const PLAYABLE_HEIGHT = GAME_HEIGHT - GROUND_HEIGHT;

export class GameScene extends Phaser.Scene {
  private bird!: Phaser.Physics.Arcade.Sprite;
  private pipes!: Phaser.Physics.Arcade.Group;
  private ground!: Phaser.GameObjects.TileSprite;
  private scoreText!: Phaser.GameObjects.Text;
  private score = 0;
  private pipeSpeed = PIPE_SPEED_START;
  private pipeGap = PIPE_GAP_START;
  private spawnDelayMs = PIPE_SPAWN_MS;
  private spawnTimer?: Phaser.Time.TimerEvent;
  private startedAt = 0;
  private alive = true;

  constructor() {
    super({ key: 'GameScene' });
  }

  create(): void {
    this.score = 0;
    this.pipeSpeed = PIPE_SPEED_START;
    this.pipeGap = PIPE_GAP_START;
    this.spawnDelayMs = PIPE_SPAWN_MS;
    this.alive = true;
    this.startedAt = this.time.now;
    trackGameStart('flap-hero');

    this.drawSky();
    this.pipes = this.physics.add.group({ allowGravity: false, immovable: true });
    this.ground = this.add.tileSprite(
      0,
      PLAYABLE_HEIGHT,
      GAME_WIDTH,
      GROUND_HEIGHT,
      TEXTURE.ground
    );
    this.ground.setOrigin(0, 0).setDepth(10);

    this.bird = this.physics.add.sprite(GAME_WIDTH / 3, GAME_HEIGHT / 2, TEXTURE.bird);
    this.bird.setCollideWorldBounds(false);
    this.bird.setGravityY(GRAVITY);
    const body = this.bird.body as Phaser.Physics.Arcade.Body;
    body.setSize(38, 26, true);

    this.scoreText = this.add
      .text(GAME_WIDTH / 2, 60, '0', {
        fontFamily: 'sans-serif',
        fontSize: '64px',
        color: '#ffffff',
        fontStyle: 'bold',
        stroke: '#1f2937',
        strokeThickness: 6,
      })
      .setOrigin(0.5)
      .setDepth(20);

    this.input.keyboard?.addCapture(['SPACE', 'UP']);
    this.input.on('pointerdown', this.flap, this);
    this.input.keyboard?.on('keydown-SPACE', this.flap, this);
    this.input.keyboard?.on('keydown-UP', this.flap, this);

    this.physics.add.collider(this.bird, this.pipes, this.die, undefined, this);

    this.spawnPipePair();
    this.scheduleNextSpawn();
  }

  override update(_time: number, delta: number): void {
    if (!this.alive) return;

    // Scroll ground for parallax
    this.ground.tilePositionX += (this.pipeSpeed * delta) / 1000;

    // Tilt bird based on velocity
    const vy = (this.bird.body as Phaser.Physics.Arcade.Body).velocity.y;
    const targetAngle = Phaser.Math.Clamp(vy / 8, -25, 75);
    this.bird.setAngle(Phaser.Math.Linear(this.bird.angle, targetAngle, 0.12));

    // Ground / ceiling collision
    if (this.bird.y >= PLAYABLE_HEIGHT - 12 || this.bird.y <= 0) {
      this.die();
      return;
    }

    // Score & pipe cleanup
    this.pipes.getChildren().forEach((obj) => {
      const pipe = obj as Pipe;
      if (!pipe.scored && pipe.getData('top') && pipe.x + pipe.displayWidth / 2 < this.bird.x) {
        pipe.scored = true;
        this.addScore();
      }
      if (pipe.x < -100) pipe.destroy();
    });

    // Difficulty progression every 5 points
    const tier = Math.floor(this.score / 5);
    this.pipeSpeed = Math.min(PIPE_SPEED_MAX, PIPE_SPEED_START + tier * 15);
    this.pipeGap = Math.max(PIPE_GAP_MIN, PIPE_GAP_START - tier * 6);
    this.spawnDelayMs = Math.max(PIPE_SPAWN_MIN_MS, PIPE_SPAWN_MS - tier * 40);
  }

  private flap = (): void => {
    if (!this.alive) return;
    (this.bird.body as Phaser.Physics.Arcade.Body).setVelocityY(FLAP_VELOCITY);
    sounds.flap();
    this.tweens.add({
      targets: this.bird,
      angle: -20,
      duration: 80,
      yoyo: false,
    });
  };

  private addScore(): void {
    this.score += 1;
    this.scoreText.setText(String(this.score));
    sounds.score();
    this.tweens.add({
      targets: this.scoreText,
      scale: { from: 1.3, to: 1 },
      duration: 180,
      ease: 'Back.easeOut',
    });
  }

  private spawnPipePair(): void {
    if (!this.alive) return;
    const minTop = 60;
    const maxTop = PLAYABLE_HEIGHT - this.pipeGap - 60;
    const topHeight = Phaser.Math.Between(minTop, maxTop);
    const x = GAME_WIDTH + 60;

    const top = this.pipes.create(x, 0, TEXTURE.pipe) as Pipe;
    top.setOrigin(0.5, 0);
    top.setDisplaySize(64, topHeight);
    top.setData('top', true);
    top.refreshBody();
    (top.body as Phaser.Physics.Arcade.Body).setVelocityX(-this.pipeSpeed);
    (top.body as Phaser.Physics.Arcade.Body).allowGravity = false;

    const bottomY = topHeight + this.pipeGap;
    const bottomHeight = PLAYABLE_HEIGHT - bottomY;
    const bottom = this.pipes.create(x, bottomY, TEXTURE.pipe) as Pipe;
    bottom.setOrigin(0.5, 0);
    bottom.setDisplaySize(64, bottomHeight);
    bottom.setData('top', false);
    bottom.refreshBody();
    (bottom.body as Phaser.Physics.Arcade.Body).setVelocityX(-this.pipeSpeed);
    (bottom.body as Phaser.Physics.Arcade.Body).allowGravity = false;
  }

  private scheduleNextSpawn(): void {
    this.spawnTimer = this.time.addEvent({
      delay: this.spawnDelayMs,
      callback: () => {
        if (!this.alive) return;
        this.spawnPipePair();
        this.scheduleNextSpawn();
      },
    });
  }

  private die = (): void => {
    if (!this.alive) return;
    this.alive = false;
    sounds.crash();
    this.spawnTimer?.remove();
    this.cameras.main.shake(220, 0.012);
    this.cameras.main.flash(120, 200, 60, 60);

    this.pipes.setVelocityX(0);
    this.physics.world.gravity.y = 0;
    (this.bird.body as Phaser.Physics.Arcade.Body).setVelocity(0, 0);
    (this.bird.body as Phaser.Physics.Arcade.Body).allowGravity = true;
    (this.bird.body as Phaser.Physics.Arcade.Body).setGravityY(GRAVITY * 0.8);

    const elapsedSec = Math.round((this.time.now - this.startedAt) / 1000);
    this.time.delayedCall(800, () => {
      this.scene.start('GameOverScene', {
        score: this.score,
        durationSec: elapsedSec,
      });
    });
  };

  private drawSky(): void {
    const g = this.add.graphics();
    g.fillGradientStyle(SKY_TOP, SKY_TOP, SKY_BOTTOM, SKY_BOTTOM, 1);
    g.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
  }
}
