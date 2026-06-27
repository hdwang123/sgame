import Phaser from 'phaser';
import { SnakeGame } from '../game/snake/SnakeGame.js';
import { SNAKE_RULES } from '../game/snake/config.js';
import { soundFX } from '../audio/SoundFX.js';
import { mobileControls } from '../ui/MobileControls.js';

const COLS = SNAKE_RULES.columns;
const ROWS = SNAKE_RULES.rows;
const CELL = 28;
const ORIGIN_X = 80;
const ORIGIN_Y = 105;

export class SnakeScene extends Phaser.Scene {
  constructor() {
    super('snake');
  }

  create() {
    this.model = new SnakeGame({ columns: COLS, rows: ROWS });
    this.stepTimer = 0;
    this.paused = false;
    this.drawFrame();
    this.snakeGraphics = this.add.graphics();
    this.bindKeys();
    this.bindTouchControls();
    this.renderGame();
  }

  drawFrame() {
    this.cameras.main.setBackgroundColor('#070a12');
    const grid = this.add.graphics();
    grid.fillStyle(0x0b1020, 1).fillRoundedRect(ORIGIN_X - 8, ORIGIN_Y - 8, COLS * CELL + 16, ROWS * CELL + 16, 10);
    grid.lineStyle(1, 0x1d2940, 0.5);
    for (let x = 0; x <= COLS; x += 1) grid.lineBetween(ORIGIN_X + x * CELL, ORIGIN_Y, ORIGIN_X + x * CELL, ORIGIN_Y + ROWS * CELL);
    for (let y = 0; y <= ROWS; y += 1) grid.lineBetween(ORIGIN_X, ORIGIN_Y + y * CELL, ORIGIN_X + COLS * CELL, ORIGIN_Y + y * CELL);
    this.add.text(80, 42, 'CYBER SNAKE', { fontFamily: 'Arial Black', fontSize: '28px', color: '#69db7c' });
    this.scoreText = this.add.text(780, 50, 'SCORE 000', { fontFamily: 'Consolas', fontSize: '16px', color: '#d3f9d8' }).setOrigin(1, 0);
    this.add.text(80, 640, '方向键 / WASD 移动   ·   P 暂停   ·   ESC 返回游戏厅', { fontFamily: 'Arial', fontSize: '12px', color: '#64708f' });
    this.message = this.add.text(430, 360, '', { fontFamily: 'Arial Black', fontSize: '28px', color: '#ffffff', align: 'center', backgroundColor: '#080b14dd', padding: { x: 32, y: 22 } }).setOrigin(0.5).setDepth(5).setVisible(false);
  }

  bindKeys() {
    const turn = (x, y) => this.model.turn(x, y);
    this.input.keyboard.on('keydown-LEFT', () => turn(-1, 0));
    this.input.keyboard.on('keydown-A', () => turn(-1, 0));
    this.input.keyboard.on('keydown-RIGHT', () => turn(1, 0));
    this.input.keyboard.on('keydown-D', () => turn(1, 0));
    this.input.keyboard.on('keydown-UP', () => turn(0, -1));
    this.input.keyboard.on('keydown-W', () => turn(0, -1));
    this.input.keyboard.on('keydown-DOWN', () => turn(0, 1));
    this.input.keyboard.on('keydown-S', () => turn(0, 1));
    this.input.keyboard.on('keydown-P', () => {
      if (!this.model.gameOver) {
        this.paused = !this.paused;
        this.message.setText('PAUSED\n按 P 继续').setVisible(this.paused);
      }
    });
    this.input.keyboard.on('keydown-ENTER', () => { if (this.model.gameOver) this.scene.restart(); });
    this.input.keyboard.on('keydown-ESC', () => this.scene.start('menu'));
  }

  bindTouchControls() {
    const pause = () => {
      if (!this.model.gameOver) {
        this.paused = !this.paused;
        this.message.setText('PAUSED\n轻触暂停键继续').setVisible(this.paused);
      }
    };
    mobileControls.bindScene(this, 'snake', {
      left: () => this.model.turn(-1, 0),
      right: () => this.model.turn(1, 0),
      up: () => this.model.turn(0, -1),
      down: () => this.model.turn(0, 1),
      pause,
      home: () => this.scene.start('menu'),
    });
  }

  update(_, delta) {
    if (this.model.gameOver || this.paused) return;
    this.stepTimer += delta;
    if (this.stepTimer >= this.model.speed) {
      this.stepTimer = 0;
      this.step();
    }
  }

  step() {
    const result = this.model.step();
    if (result.gameOver) {
      soundFX.play('lose');
      this.message.setText(`GAME OVER\n得分 ${this.model.score}\n按 ENTER 重来`).setVisible(true);
      return;
    }
    if (result.ate) {
      soundFX.play('eat');
      this.scoreText.setText(`SCORE ${String(this.model.score).padStart(3, '0')}`);
      this.cameras.main.flash(80, 70, 255, 130, false);
    }
    this.renderGame();
  }

  renderGame() {
    this.snakeGraphics.clear();
    this.model.snake.forEach((part, index) => {
      this.snakeGraphics.fillStyle(index === 0 ? 0x8ce99a : 0x40c057, 1).fillRoundedRect(ORIGIN_X + part.x * CELL + 3, ORIGIN_Y + part.y * CELL + 3, CELL - 6, CELL - 6, 6);
    });
    const fx = ORIGIN_X + this.model.food.x * CELL + CELL / 2;
    const fy = ORIGIN_Y + this.model.food.y * CELL + CELL / 2;
    this.snakeGraphics.fillStyle(0xff6b6b, 1).fillCircle(fx, fy, 9);
    this.snakeGraphics.lineStyle(2, 0xffa8a8, 0.7).strokeCircle(fx, fy, 13);
  }
}
