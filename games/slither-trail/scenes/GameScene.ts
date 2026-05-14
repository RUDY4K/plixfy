import Phaser from 'phaser';
import {
  GAME_WIDTH,
  GAME_HEIGHT,
  GRID_COLS,
  GRID_ROWS,
  CELL,
  FIELD_X,
  FIELD_Y,
  FIELD_W,
  FIELD_H,
  FIELD_BG,
  GRID_LINE,
  BG_TOP,
  BG_BOTTOM,
  SNAKE_HEAD,
  SNAKE_BODY,
  SNAKE_BODY_ALT,
  SNAKE_OUTLINE,
  FOOD_COLOR,
  FOOD_OUTLINE,
  SPECIAL_FOOD,
  SPECIAL_FOOD_OUTLINE,
  SPEED_START_MS,
  SPEED_MIN_MS,
  SPEED_STEP_MS,
  SPEED_STEP_EVERY,
  SPECIAL_FOOD_LIFETIME_MS,
  SPECIAL_FOOD_SPAWN_CHANCE,
  SPECIAL_FOOD_POINTS,
  STARTING_LENGTH,
  DPAD_CENTER_Y,
  DPAD_BUTTON,
} from '../lib/constants';
import { type Cell, type Direction, applyDirection, isOpposite } from '../lib/types';
import { sounds } from '../lib/audio';
import { trackGameStart } from '@/lib/analytics';

export class GameScene extends Phaser.Scene {
  private snake: Cell[] = [];
  private direction: Direction = 'right';
  private nextDirection: Direction = 'right';
  private directionLocked = false;

  private food: Cell | null = null;
  private specialFood: Cell | null = null;
  private specialFoodSpawnedAt = 0;

  private score = 0;
  private speedMs = SPEED_START_MS;
  private tickAccumulator = 0;
  private startedAt = 0;
  private alive = true;

  private boardGraphics!: Phaser.GameObjects.Graphics;
  private fxGraphics!: Phaser.GameObjects.Graphics;
  private scoreText!: Phaser.GameObjects.Text;
  private speedText!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: 'GameScene' });
  }

  create(): void {
    this.resetState();
    trackGameStart('slither-trail');

    this.drawBackdrop();
    this.drawField();
    this.drawHud();
    this.drawDpad();

    this.boardGraphics = this.add.graphics();
    this.fxGraphics = this.add.graphics();

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
    this.input.keyboard?.on('keydown-UP', () => this.queueDirection('up'));
    this.input.keyboard?.on('keydown-W', () => this.queueDirection('up'));
    this.input.keyboard?.on('keydown-DOWN', () => this.queueDirection('down'));
    this.input.keyboard?.on('keydown-S', () => this.queueDirection('down'));
    this.input.keyboard?.on('keydown-LEFT', () => this.queueDirection('left'));
    this.input.keyboard?.on('keydown-A', () => this.queueDirection('left'));
    this.input.keyboard?.on('keydown-RIGHT', () => this.queueDirection('right'));
    this.input.keyboard?.on('keydown-D', () => this.queueDirection('right'));

    this.spawnFood();
    this.renderEverything();
  }

  override update(_time: number, delta: number): void {
    if (!this.alive) return;

    this.tickAccumulator += delta;
    if (this.tickAccumulator >= this.speedMs) {
      this.tickAccumulator -= this.speedMs;
      this.tick();
    }

    // Expire special food
    if (this.specialFood && this.time.now - this.specialFoodSpawnedAt > SPECIAL_FOOD_LIFETIME_MS) {
      this.specialFood = null;
      this.renderEverything();
    }

    this.pulseSpecialFood();
  }

  private resetState(): void {
    this.snake = [];
    const startX = Math.floor(GRID_COLS / 2) - 1;
    const startY = Math.floor(GRID_ROWS / 2);
    for (let i = 0; i < STARTING_LENGTH; i++) {
      this.snake.push({ x: startX - i, y: startY });
    }
    this.direction = 'right';
    this.nextDirection = 'right';
    this.directionLocked = false;
    this.food = null;
    this.specialFood = null;
    this.specialFoodSpawnedAt = 0;
    this.score = 0;
    this.speedMs = SPEED_START_MS;
    this.tickAccumulator = 0;
    this.startedAt = this.time.now;
    this.alive = true;
  }

  private tick(): void {
    this.direction = this.nextDirection;
    this.directionLocked = false;

    const newHead = applyDirection(this.snake[0], this.direction);

    if (
      newHead.x < 0 ||
      newHead.x >= GRID_COLS ||
      newHead.y < 0 ||
      newHead.y >= GRID_ROWS
    ) {
      this.die();
      return;
    }

    // Body collision (compare against all except current tail, since tail moves away this tick)
    const last = this.snake.length - 1;
    for (let i = 0; i < this.snake.length; i++) {
      if (i === last) continue;
      if (this.snake[i].x === newHead.x && this.snake[i].y === newHead.y) {
        this.die();
        return;
      }
    }

    this.snake.unshift(newHead);

    let ate = false;
    if (this.food && this.food.x === newHead.x && this.food.y === newHead.y) {
      this.score += 1;
      sounds.eat();
      this.spawnFood();
      this.maybeSpawnSpecial();
      ate = true;
    } else if (
      this.specialFood &&
      this.specialFood.x === newHead.x &&
      this.specialFood.y === newHead.y
    ) {
      this.score += SPECIAL_FOOD_POINTS;
      sounds.special();
      this.specialFood = null;
      ate = true;
      this.cameras.main.flash(80, 250, 200, 60);
    }

    if (!ate) {
      this.snake.pop();
    } else {
      this.applyDifficulty();
      this.updateHud();
    }

    this.renderEverything();
  }

  private queueDirection(d: Direction): void {
    if (!this.alive) return;
    if (this.directionLocked) return;
    if (d === this.direction) return;
    if (isOpposite(this.direction, d)) return;
    this.nextDirection = d;
    this.directionLocked = true;
    sounds.turn();
  }

  private applyDifficulty(): void {
    const tier = Math.floor(this.score / SPEED_STEP_EVERY);
    this.speedMs = Math.max(SPEED_MIN_MS, SPEED_START_MS - tier * SPEED_STEP_MS);
  }

  private spawnFood(): void {
    const empty = this.emptyCells();
    if (empty.length === 0) {
      // Player filled the board — call it a win, end the run.
      this.die();
      return;
    }
    this.food = Phaser.Utils.Array.GetRandom(empty);
  }

  private maybeSpawnSpecial(): void {
    if (this.specialFood) return;
    if (Math.random() > SPECIAL_FOOD_SPAWN_CHANCE) return;
    const empty = this.emptyCells();
    if (empty.length === 0) return;
    this.specialFood = Phaser.Utils.Array.GetRandom(empty);
    this.specialFoodSpawnedAt = this.time.now;
  }

  private emptyCells(): Cell[] {
    const occupied = new Set<string>();
    for (const seg of this.snake) occupied.add(`${seg.x},${seg.y}`);
    if (this.food) occupied.add(`${this.food.x},${this.food.y}`);
    if (this.specialFood) occupied.add(`${this.specialFood.x},${this.specialFood.y}`);

    const out: Cell[] = [];
    for (let y = 0; y < GRID_ROWS; y++) {
      for (let x = 0; x < GRID_COLS; x++) {
        if (!occupied.has(`${x},${y}`)) out.push({ x, y });
      }
    }
    return out;
  }

  private renderEverything(): void {
    this.boardGraphics.clear();

    // Snake body
    for (let i = this.snake.length - 1; i >= 0; i--) {
      const seg = this.snake[i];
      const isHead = i === 0;
      const color = isHead
        ? SNAKE_HEAD
        : i % 2 === 0
          ? SNAKE_BODY
          : SNAKE_BODY_ALT;
      const px = FIELD_X + seg.x * CELL + 1;
      const py = FIELD_Y + seg.y * CELL + 1;
      this.boardGraphics.fillStyle(color, 1);
      this.boardGraphics.fillRoundedRect(px, py, CELL - 2, CELL - 2, 5);
      this.boardGraphics.lineStyle(1, SNAKE_OUTLINE, 0.6);
      this.boardGraphics.strokeRoundedRect(px, py, CELL - 2, CELL - 2, 5);

      if (isHead) {
        // Eye marker — small dot toward direction of travel
        const eyeOffset = {
          up: { dx: CELL / 2, dy: 4 },
          down: { dx: CELL / 2, dy: CELL - 4 },
          left: { dx: 4, dy: CELL / 2 },
          right: { dx: CELL - 4, dy: CELL / 2 },
        }[this.direction];
        this.boardGraphics.fillStyle(0xffffff, 1);
        this.boardGraphics.fillCircle(
          FIELD_X + seg.x * CELL + eyeOffset.dx,
          FIELD_Y + seg.y * CELL + eyeOffset.dy,
          2
        );
      }
    }

    // Food
    if (this.food) {
      const cx = FIELD_X + this.food.x * CELL + CELL / 2;
      const cy = FIELD_Y + this.food.y * CELL + CELL / 2;
      this.boardGraphics.fillStyle(FOOD_COLOR, 1);
      this.boardGraphics.fillCircle(cx, cy, 7);
      this.boardGraphics.lineStyle(2, FOOD_OUTLINE, 1);
      this.boardGraphics.strokeCircle(cx, cy, 7);
      // small stem
      this.boardGraphics.lineStyle(2, 0x14532d, 1);
      this.boardGraphics.lineBetween(cx, cy - 7, cx + 3, cy - 12);
    }
  }

  private pulseSpecialFood(): void {
    this.fxGraphics.clear();
    if (!this.specialFood) return;
    const cx = FIELD_X + this.specialFood.x * CELL + CELL / 2;
    const cy = FIELD_Y + this.specialFood.y * CELL + CELL / 2;
    const pulse = 7 + Math.sin(this.time.now / 120) * 2;
    const remaining = SPECIAL_FOOD_LIFETIME_MS - (this.time.now - this.specialFoodSpawnedAt);
    const alpha = Math.min(1, remaining / 1200);

    this.fxGraphics.fillStyle(SPECIAL_FOOD, 1);
    this.fxGraphics.fillCircle(cx, cy, pulse);
    this.fxGraphics.lineStyle(2, SPECIAL_FOOD_OUTLINE, 1);
    this.fxGraphics.strokeCircle(cx, cy, pulse);

    // glow ring
    this.fxGraphics.lineStyle(2, SPECIAL_FOOD, 0.4 * alpha);
    this.fxGraphics.strokeCircle(cx, cy, pulse + 5);
  }

  private drawBackdrop(): void {
    const g = this.add.graphics();
    g.fillGradientStyle(BG_TOP, BG_TOP, BG_BOTTOM, BG_BOTTOM, 1);
    g.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
  }

  private drawField(): void {
    const g = this.add.graphics();
    g.fillStyle(FIELD_BG, 1);
    g.fillRoundedRect(FIELD_X - 4, FIELD_Y - 4, FIELD_W + 8, FIELD_H + 8, 8);
    g.lineStyle(2, 0x22c55e, 0.4);
    g.strokeRoundedRect(FIELD_X - 4, FIELD_Y - 4, FIELD_W + 8, FIELD_H + 8, 8);

    g.lineStyle(1, GRID_LINE, 0.6);
    for (let i = 1; i < GRID_COLS; i++) {
      g.lineBetween(FIELD_X + i * CELL, FIELD_Y, FIELD_X + i * CELL, FIELD_Y + FIELD_H);
    }
    for (let i = 1; i < GRID_ROWS; i++) {
      g.lineBetween(FIELD_X, FIELD_Y + i * CELL, FIELD_X + FIELD_W, FIELD_Y + i * CELL);
    }
  }

  private drawHud(): void {
    this.scoreText = this.add.text(20, 24, 'Score 0', {
      fontFamily: 'sans-serif',
      fontSize: '22px',
      color: '#ffffff',
      fontStyle: 'bold',
    });
    this.speedText = this.add
      .text(GAME_WIDTH - 20, 24, 'Speed 150ms', {
        fontFamily: 'sans-serif',
        fontSize: '14px',
        color: '#94a3b8',
      })
      .setOrigin(1, 0);
  }

  private updateHud(): void {
    this.scoreText.setText(`Score ${this.score}`);
    this.speedText.setText(`Speed ${this.speedMs}ms`);
  }

  private drawDpad(): void {
    const cx = GAME_WIDTH / 2;
    const cy = DPAD_CENTER_Y;
    const s = DPAD_BUTTON;
    this.makeDpadButton(cx, cy - s, '▲', 'up');
    this.makeDpadButton(cx - s, cy, '◀', 'left');
    this.makeDpadButton(cx + s, cy, '▶', 'right');
    this.makeDpadButton(cx, cy + s, '▼', 'down');
  }

  private makeDpadButton(x: number, y: number, label: string, dir: Direction): void {
    const bg = this.add.rectangle(x, y, DPAD_BUTTON, DPAD_BUTTON, 0xffffff, 0.06);
    bg.setStrokeStyle(2, 0x22c55e, 0.4);
    bg.setInteractive({ useHandCursor: true });
    const text = this.add
      .text(x, y, label, {
        fontFamily: 'sans-serif',
        fontSize: '26px',
        color: '#22c55e',
      })
      .setOrigin(0.5);

    bg.on('pointerdown', (pointer: Phaser.Input.Pointer, _lx: number, _ly: number, event: Phaser.Types.Input.EventData) => {
      this.queueDirection(dir);
      bg.setFillStyle(0x22c55e, 0.25);
      text.setColor('#ffffff');
      event.stopPropagation();
    });
    bg.on('pointerup', () => {
      bg.setFillStyle(0xffffff, 0.06);
      text.setColor('#22c55e');
    });
    bg.on('pointerout', () => {
      bg.setFillStyle(0xffffff, 0.06);
      text.setColor('#22c55e');
    });
  }

  private die(): void {
    if (!this.alive) return;
    this.alive = false;
    sounds.crash();
    this.cameras.main.shake(220, 0.012);
    this.cameras.main.flash(150, 220, 60, 60);

    const elapsedSec = Math.round((this.time.now - this.startedAt) / 1000);
    this.time.delayedCall(700, () => {
      this.scene.start('GameOverScene', {
        score: this.score,
        durationSec: elapsedSec,
        length: this.snake.length,
      });
    });
  }
}
