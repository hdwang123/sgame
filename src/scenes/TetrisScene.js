import Phaser from 'phaser';
import {
  BOARD_HEIGHT,
  BOARD_WIDTH,
  PIECES,
} from '../game/tetris/config.js';
import { TetrisGame } from '../game/tetris/TetrisGame.js';
import { soundFX } from '../audio/SoundFX.js';
import { mobileControls } from '../ui/MobileControls.js';
import { t } from '../i18n.js';

const DESKTOP_CELL_SIZE = 31;
const DESKTOP_BOARD_X = 54;
const DESKTOP_BOARD_Y = 30;
const DESKTOP_PANEL_X = 470;
const MOBILE_CELL_SIZE = 31;
const MOBILE_BOARD_X = 10;
const MOBILE_BOARD_Y = 30;
const MOBILE_PANEL_X = 330;

export class TetrisScene extends Phaser.Scene {
  constructor() {
    super('tetris');
  }

  create() {
    this.isMobileLayout = globalThis.matchMedia?.('(max-width: 800px)').matches ?? false;
    this.scale.resize(this.isMobileLayout ? 620 : 860, 680);
    this.boardX = this.isMobileLayout ? MOBILE_BOARD_X : DESKTOP_BOARD_X;
    this.boardY = this.isMobileLayout ? MOBILE_BOARD_Y : DESKTOP_BOARD_Y;
    this.cellSize = this.isMobileLayout ? MOBILE_CELL_SIZE : DESKTOP_CELL_SIZE;
    this.panelX = this.isMobileLayout ? MOBILE_PANEL_X : DESKTOP_PANEL_X;
    this.model = new TetrisGame();
    this.isPaused = false;
    this.dropAccumulator = 0;
    this.touchMoveAccumulator = 0;
    this.lastTouchDirection = 0;

    this.createBackdrop();
    this.createInterface();
    this.bindControls();
    this.bindTouchControls();
    this.draw();
  }

  createBackdrop() {
    const grid = this.add.graphics();
    grid.lineStyle(1, 0x1a1f36, 0.25);
    for (let x = 0; x <= this.scale.width; x += 32) grid.lineBetween(x, 0, x, this.scale.height);
    for (let y = 0; y <= this.scale.height; y += 32) grid.lineBetween(0, y, this.scale.width, y);

    this.add.circle(this.scale.width - 70, 80, 180, 0x5f3dc4, 0.09);
    this.add.circle(55, this.scale.height - 60, 150, 0x00d4aa, 0.06);
  }

  createInterface() {
    this.add.text(this.panelX, 18, t('game.tetris'), {
      fontFamily: 'Arial Black, Arial', fontSize: '25px', color: '#f4f6ff',
    });
    this.add.text(this.panelX + 2, 47, t('game.tetris.sub'), {
      fontFamily: 'Arial', fontSize: '9px', color: '#748ffc', letterSpacing: 2,
    });
    this.boardGlow = this.add.rectangle(
      this.boardX + (BOARD_WIDTH * this.cellSize) / 2,
      this.boardY + (BOARD_HEIGHT * this.cellSize) / 2,
      BOARD_WIDTH * this.cellSize + 12,
      BOARD_HEIGHT * this.cellSize + 12,
      0x12162a,
    ).setStrokeStyle(2, 0x4c6ef5, 0.65);

    this.add.rectangle(
      this.boardX + (BOARD_WIDTH * this.cellSize) / 2,
      this.boardY + (BOARD_HEIGHT * this.cellSize) / 2,
      BOARD_WIDTH * this.cellSize,
      BOARD_HEIGHT * this.cellSize,
      0x070912,
      0.96,
    );

    this.boardGraphics = this.add.graphics();
    this.ghostGraphics = this.add.graphics();
    this.pieceGraphics = this.add.graphics();

    this.add.text(this.panelX, 62, t('tetris.next'), this.labelStyle());
    this.add.rectangle(this.panelX + 140, 137, 280, 118, 0x101427, 0.82)
      .setStrokeStyle(1, 0x343a60, 0.8);
    this.nextGraphics = this.add.graphics();

    this.add.text(this.panelX, 222, t('tetris.score'), this.labelStyle());
    this.scoreText = this.add.text(this.panelX, 246, '000000', {
      fontFamily: 'Arial Black, Arial', fontSize: '40px', color: '#f8f9ff',
    });

    this.add.text(this.panelX, 320, t('tetris.lines'), this.labelStyle());
    this.linesText = this.add.text(this.panelX, 344, '00', this.valueStyle());
    this.add.text(this.panelX + 142, 320, t('tetris.level'), this.labelStyle());
    this.levelText = this.add.text(this.panelX + 142, 344, '01', this.valueStyle());

    this.add.line(this.panelX + 140, 413, 0, 0, 280, 0, 0x343a60, 0.9);
    this.add.text(this.panelX, 438, t('tetris.controls'), this.labelStyle());
    this.addControl('←  →', t('tetris.move'), 474);
    this.addControl('↑ / Z', t('tetris.rotate'), 510);
    this.addControl('↓', t('tetris.softDrop'), 546);
    this.addControl('SPACE', t('tetris.hardDrop'), 582);
    this.addControl('P', t('tetris.pause'), 608);
    this.addControl('ESC', t('tetris.home'), 638);

    const boardWidth = BOARD_WIDTH * this.cellSize;
    const boardHeight = BOARD_HEIGHT * this.cellSize;
    this.overlay = this.add.rectangle(
      this.boardX + boardWidth / 2,
      this.boardY + boardHeight / 2,
      boardWidth,
      boardHeight,
      0x070912,
      0.86,
    )
      .setVisible(false).setDepth(20);
    this.overlayTitle = this.add.text(this.boardX + boardWidth / 2, this.boardY + boardHeight / 2 - 32, '', {
      fontFamily: 'Arial Black, Arial', fontSize: '30px', color: '#ffffff', align: 'center',
    }).setOrigin(0.5).setDepth(21).setVisible(false);
    this.overlayHint = this.add.text(this.boardX + boardWidth / 2, this.boardY + boardHeight / 2 + 18, '', {
      fontFamily: 'Arial', fontSize: '14px', color: '#adb5bd', align: 'center',
    }).setOrigin(0.5).setDepth(21).setVisible(false);
  }

  labelStyle() {
    return { fontFamily: 'Arial', fontSize: '13px', color: '#7c86aa', letterSpacing: 2 };
  }

  valueStyle() {
    return { fontFamily: 'Arial Black, Arial', fontSize: '28px', color: '#e9ecff' };
  }

  addControl(key, action, y) {
    this.add.text(this.panelX, y, key, {
      fontFamily: 'Consolas, monospace', fontSize: '13px', color: '#74c0fc',
      backgroundColor: '#191f39', padding: { x: 7, y: 4 },
    });
    this.add.text(this.panelX + 104, y + 4, action, {
      fontFamily: 'Arial', fontSize: '13px', color: '#adb5bd',
    });
  }

  bindControls() {
    const keyboard = this.input.keyboard;
    this.cursors = keyboard.createCursorKeys();
    this.keys = keyboard.addKeys('Z,SPACE,P,ENTER');
    keyboard.on('keydown-LEFT', () => this.move(-1));
    keyboard.on('keydown-RIGHT', () => this.move(1));
    keyboard.on('keydown-UP', () => this.rotate(1));
    keyboard.on('keydown-Z', () => this.rotate(-1));
    keyboard.on('keydown-SPACE', () => this.hardDrop());
    keyboard.on('keydown-P', () => this.togglePause());
    keyboard.on('keydown-ENTER', () => {
      if (this.model.gameOver) this.scene.restart();
    });
    keyboard.on('keydown-ESC', () => this.scene.start('menu'));
  }

  bindTouchControls() {
    mobileControls.bindScene(this, 'tetris', {
      left: () => this.move(-1),
      right: () => this.move(1),
      primary: () => this.rotate(1),
      secondary: () => this.hardDrop(),
      pause: () => this.togglePause(),
      restart: () => this.scene.restart(),
      home: () => this.scene.start('menu'),
    });
  }

  update(_, delta) {
    if (this.isPaused || this.model.gameOver) return;
    const touchAxis = mobileControls.axis();
    const touchDirection = touchAxis.x < -0.35 ? -1 : touchAxis.x > 0.35 ? 1 : 0;
    if (touchDirection) {
      if (mobileControls.isUsingJoystick() && touchDirection !== this.lastTouchDirection) {
        this.move(touchDirection);
        this.touchMoveAccumulator = 0;
      }
      this.touchMoveAccumulator += delta;
      if (this.touchMoveAccumulator >= 110) {
        this.move(touchDirection);
        this.touchMoveAccumulator = 0;
      }
    } else this.touchMoveAccumulator = 0;
    this.lastTouchDirection = touchDirection;
    this.dropAccumulator += delta;
    const softDropping = this.cursors.down.isDown || touchAxis.y > 0.35;
    if (this.dropAccumulator >= (softDropping ? 45 : this.model.dropInterval)) {
      const result = this.model.tick(softDropping);
      this.handleModelResult(result);
      this.dropAccumulator = 0;
      this.updateStats();
      this.draw();
    }
  }

  move(direction) {
    if (!this.canPlay()) return;
    if (this.model.move(direction)) {
      soundFX.play('move');
      this.draw();
    }
  }

  rotate(direction) {
    if (!this.canPlay()) return;
    if (this.model.rotate(direction)) {
      soundFX.play('rotate');
      this.draw();
    }
  }

  hardDrop() {
    if (!this.canPlay()) return;
    this.handleModelResult(this.model.hardDrop());
    this.dropAccumulator = 0;
    this.updateStats();
    this.draw();
  }

  handleModelResult(result) {
    if (result.cleared) {
      soundFX.play('line');
      this.cameras.main.flash(120, 90, 140, 255, false);
    } else if (result.locked) soundFX.play('drop');
    if (this.model.gameOver) this.endGame();
  }

  draw() {
    this.boardGraphics.clear();
    this.ghostGraphics.clear();
    this.pieceGraphics.clear();
    this.nextGraphics.clear();

    for (let y = 0; y < BOARD_HEIGHT; y += 1) {
      for (let x = 0; x < BOARD_WIDTH; x += 1) {
        const color = this.model.board[y][x];
        if (color) this.drawCell(this.boardGraphics, this.boardX, this.boardY, x, y, color);
        else {
          this.boardGraphics.lineStyle(1, 0x222944, 0.42);
          this.boardGraphics.strokeRect(
            this.boardX + x * this.cellSize,
            this.boardY + y * this.cellSize,
            this.cellSize,
            this.cellSize,
          );
        }
      }
    }

    const activePiece = this.model.activePiece;
    if (!activePiece) return;
    const ghostY = this.model.ghostY();
    activePiece.cells.forEach(([cx, cy]) => {
      const gy = ghostY + cy;
      if (gy >= 0) this.drawGhostCell(this.ghostGraphics, activePiece.x + cx, gy, activePiece.color);
      const py = activePiece.y + cy;
      if (py >= 0) this.drawCell(this.pieceGraphics, this.boardX, this.boardY, activePiece.x + cx, py, activePiece.color);
    });

    const preview = PIECES[this.model.nextPiece];
    const minX = Math.min(...preview.cells.map(([x]) => x));
    const maxX = Math.max(...preview.cells.map(([x]) => x));
    const previewSize = 24;
    const previewCenterX = this.panelX + 91;
    const previewY = 108;
    const previewX = previewCenterX - ((maxX - minX + 1) * previewSize) / 2;
    preview.cells.forEach(([x, y]) => {
      this.drawCell(this.nextGraphics, previewX, previewY, x - minX, y, preview.color, previewSize);
    });
  }

  drawCell(graphics, originX, originY, x, y, color, size = this.cellSize) {
    const px = originX + x * size;
    const py = originY + y * size;
    graphics.fillStyle(color, 1);
    graphics.fillRoundedRect(px + 2, py + 2, size - 4, size - 4, 4);
    graphics.fillStyle(0xffffff, 0.22);
    graphics.fillRoundedRect(px + 4, py + 4, size - 8, 4, 2);
    graphics.lineStyle(1, 0xffffff, 0.15);
    graphics.strokeRoundedRect(px + 2, py + 2, size - 4, size - 4, 4);
  }

  drawGhostCell(graphics, x, y, color) {
    graphics.lineStyle(2, color, 0.4);
    graphics.strokeRoundedRect(
      this.boardX + x * this.cellSize + 4,
      this.boardY + y * this.cellSize + 4,
      this.cellSize - 8,
      this.cellSize - 8,
      3,
    );
  }

  updateStats() {
    this.scoreText.setText(String(this.model.score).padStart(6, '0'));
    this.linesText.setText(String(this.model.lines).padStart(2, '0'));
    this.levelText.setText(String(this.model.level).padStart(2, '0'));
  }

  togglePause() {
    if (this.model.gameOver) return;
    this.isPaused = !this.isPaused;
    this.setOverlay(this.isPaused, t('tetris.paused'), t('tetris.resume'));
  }

  endGame() {
    soundFX.play('lose');
    this.setOverlay(true, t('tetris.gameOver'), t('tetris.gameOverHint', { score: this.model.score }));
  }

  setOverlay(visible, title, hint) {
    this.overlay.setVisible(visible);
    this.overlayTitle.setText(title).setVisible(visible);
    this.overlayHint.setText(hint).setVisible(visible);
  }

  canPlay() {
    return !this.isPaused && !this.model.gameOver && this.model.activePiece;
  }
}
