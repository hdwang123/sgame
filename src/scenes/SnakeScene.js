import Phaser from 'phaser';
import { SnakeGame } from '../game/snake/SnakeGame.js';
import { SNAKE_RULES, SNAKE_SPEEDS } from '../game/snake/config.js';
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
    this.isMobileLayout = globalThis.matchMedia?.('(max-width: 800px)').matches ?? false;
    this.stepTimer = 0;
    this.paused = false;
    this.drawFrame();
    this.snakeGraphics = this.add.graphics();
    this.bindKeys();
    this.bindTouchControls();
    this.setSpeed('normal');
    this.renderGame();
  }

  drawFrame() {
    this.cameras.main.setBackgroundColor('#070a12');
    const grid = this.add.graphics();
    grid.fillStyle(0x0b1020, 1).fillRoundedRect(ORIGIN_X - 8, ORIGIN_Y - 8, COLS * CELL + 16, ROWS * CELL + 16, 10);
    grid.lineStyle(1, 0x1d2940, 0.5);
    for (let x = 0; x <= COLS; x += 1) grid.lineBetween(ORIGIN_X + x * CELL, ORIGIN_Y, ORIGIN_X + x * CELL, ORIGIN_Y + ROWS * CELL);
    for (let y = 0; y <= ROWS; y += 1) grid.lineBetween(ORIGIN_X, ORIGIN_Y + y * CELL, ORIGIN_X + COLS * CELL, ORIGIN_Y + y * CELL);
    this.add.text(80, 37, '贪吃蛇', { fontFamily: 'Arial Black', fontSize: '28px', color: '#69db7c' });
    this.add.text(82, 72, 'CYBER SNAKE', { fontFamily: 'Arial', fontSize: '10px', color: '#688176', letterSpacing: 2 });
    this.scoreText = this.add.text(780, 50, '分数 / SCORE  000', { fontFamily: 'Consolas', fontSize: '15px', color: '#d3f9d8' }).setOrigin(1, 0);
    this.add.text(80, 640, '方向键 / WASD 移动   ·   P 暂停   ·   ESC 返回游戏厅', { fontFamily: 'Arial', fontSize: '12px', color: '#64708f' });
    this.speedButtons = new Map();
    if (!this.isMobileLayout) {
      this.add.text(320, 38, '速度 / SPEED', { fontFamily: 'Arial', fontSize: '11px', color: '#7c86aa' });
      Object.entries(SNAKE_SPEEDS).forEach(([key, option], index) => this.createSpeedButton(key, option.label, 365 + index * 92));
    }
    this.message = this.add.text(430, 360, '', { fontFamily: 'Arial Black', fontSize: '28px', color: '#ffffff', align: 'center', backgroundColor: '#080b14dd', padding: { x: 32, y: 22 } }).setOrigin(0.5).setDepth(5).setVisible(false);
  }

  createSpeedButton(key, label, x) {
    const background = this.add.rectangle(x, 72, 82, 30, 0x171d35, 0.96)
      .setStrokeStyle(1, 0x3a4568, 0.9)
      .setInteractive({ useHandCursor: true });
    const text = this.add.text(x, 72, label, { fontFamily: 'Arial', fontSize: '12px', color: '#aab4d2' }).setOrigin(0.5);
    background.on('pointerdown', () => this.setSpeed(key));
    this.speedButtons.set(key, { background, text });
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
        this.message.setText('游戏暂停\nPAUSED  ·  按 P 继续').setVisible(this.paused);
      }
    });
    this.input.keyboard.on('keydown-ENTER', () => { if (this.model.gameOver) this.scene.restart(); });
    this.input.keyboard.on('keydown-ESC', () => this.scene.start('menu'));
  }

  bindTouchControls() {
    const pause = () => {
      if (!this.model.gameOver) {
        this.paused = !this.paused;
        this.message.setText('游戏暂停\nPAUSED  ·  轻触暂停键继续').setVisible(this.paused);
      }
    };
    mobileControls.bindScene(this, 'snake', {
      left: () => this.model.turn(-1, 0),
      right: () => this.model.turn(1, 0),
      up: () => this.model.turn(0, -1),
      down: () => this.model.turn(0, 1),
      pause,
      restart: () => this.scene.restart(),
      home: () => this.scene.start('menu'),
      'speed-normal': () => this.setSpeed('normal'),
      'speed-slow': () => this.setSpeed('slow'),
      'speed-fast': () => this.setSpeed('fast'),
    });
  }

  setSpeed(speedKey) {
    if (!this.model.setSpeed(speedKey)) return;
    this.stepTimer = 0;
    mobileControls.select(`speed-${speedKey}`);
    this.speedButtons?.forEach(({ background, text }, key) => {
      const selected = key === speedKey;
      background.setFillStyle(selected ? 0x235f58 : 0x171d35, 0.96);
      background.setStrokeStyle(selected ? 2 : 1, selected ? 0x63e6be : 0x3a4568, selected ? 1 : 0.9);
      text.setColor(selected ? '#e6fff8' : '#aab4d2');
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
      this.message.setText(`游戏结束\nGAME OVER  ·  得分 ${this.model.score}\n按 ENTER 重来`).setVisible(true);
      return;
    }
    if (result.ate) {
      soundFX.play('eat');
      this.scoreText.setText(`分数 / SCORE  ${String(this.model.score).padStart(3, '0')}`);
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
