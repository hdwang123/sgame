import Phaser from 'phaser';
import { soundFX } from '../audio/SoundFX.js';
import { mobileControls } from '../ui/MobileControls.js';
import { t } from '../i18n.js';
import { LinkMatchGame } from '../game/link-match/LinkMatchGame.js';
import { LINK_MATCH_RULES } from '../game/link-match/config.js';

const CELL_SIZE = 62;
const BOARD_Y = 104;

export class LinkMatchScene extends Phaser.Scene {
  constructor() {
    super('linkMatch');
  }

  init() {
    this.isMobileLayout = globalThis.matchMedia?.('(max-width: 800px)').matches ?? false;
    this.scale.resize(this.isMobileLayout ? 620 : 860, 680);
    this.boardX = this.isMobileLayout ? 62 : 182;
  }

  create() {
    this.model = new LinkMatchGame();
    this.phase = 'playing';
    this.timeRemaining = LINK_MATCH_RULES.timeLimit;
    this.selected = null;
    this.tileViews = new Map();
    this.makeIconTextures();
    this.drawBackdrop();
    this.createInterface();
    this.drawBoard();
    this.bindControls();
  }

  makeIconTextures() {
    const colors = [
      0xff6b6b, 0xff922b, 0xffd43b, 0x69db7c,
      0x38d9a9, 0x4dabf7, 0x748ffc, 0xda77f2,
    ];
    const g = this.make.graphics({ add: false });
    for (let index = 0; index < LINK_MATCH_RULES.iconTypes; index += 1) {
      const key = `linkIcon${index + 1}`;
      if (this.textures.exists(key)) continue;
      const color = colors[index % colors.length];
      const variant = Math.floor(index / colors.length);
      g.clear();
      g.fillStyle(0x101a2d).fillRect(0, 0, 42, 42);
      g.fillStyle(color);
      if (index % 4 === 0) {
        g.fillRect(9, 9, 24, 24).fillStyle(0xffffff, 0.45).fillRect(14, 14, 8, 8);
      } else if (index % 4 === 1) {
        g.fillRect(17, 5, 8, 32).fillRect(5, 17, 32, 8).fillStyle(0xffffff, 0.45).fillRect(18, 8, 4, 10);
      } else if (index % 4 === 2) {
        g.fillTriangle(21, 4, 38, 35, 4, 35).fillStyle(0xffffff, 0.45).fillRect(18, 13, 6, 12);
      } else {
        g.fillCircle(21, 21, 16).fillStyle(0xffffff, 0.45).fillRect(12, 12, 10, 7);
      }
      if (variant) {
        g.lineStyle(3, 0xffffff, 0.8).strokeRect(5, 5, 32, 32);
      }
      g.generateTexture(key, 42, 42);
    }
    g.destroy();
  }

  drawBackdrop() {
    this.cameras.main.setBackgroundColor('#07111f');
    const grid = this.add.graphics().setDepth(-5);
    grid.fillStyle(0x081426).fillRect(0, 0, this.scale.width, 680);
    grid.lineStyle(1, 0x17345a, 0.35);
    for (let x = 0; x < this.scale.width; x += 32) grid.lineBetween(x, 0, x, 680);
    for (let y = 0; y < 680; y += 32) grid.lineBetween(0, y, this.scale.width, y);
    this.add.rectangle(this.scale.width / 2, 352, 530, 530, 0x0b1c31, 0.94)
      .setStrokeStyle(2, 0x38d9a9, 0.45)
      .setDepth(-2);
    this.connectionGraphics = this.add.graphics().setDepth(20);
  }

  createInterface() {
    this.add.text(24, 16, t('game.link'), {
      fontFamily: 'Arial Black', fontSize: '26px', color: '#63e6be',
    });
    this.add.text(26, 49, t('game.link.sub'), {
      fontFamily: 'Consolas', fontSize: '10px', color: '#5c9e91', letterSpacing: 2,
    });
    this.hud = this.add.text(this.scale.width - 30, 20, '', {
      fontFamily: 'Consolas', fontSize: '20px', color: '#d3f9d8', align: 'right',
    }).setOrigin(1, 0);
    const shuffleX = this.scale.width - 125;
    const shuffleButton = this.add.rectangle(shuffleX, 67, 150, 30, 0x174d43, 0.95)
      .setStrokeStyle(1, 0x63e6be, 0.8)
      .setInteractive({ useHandCursor: true });
    this.shuffleLabel = this.add.text(shuffleX, 67, '', {
      fontFamily: 'Arial Black', fontSize: '12px', color: '#e6fcf5',
    }).setOrigin(0.5);
    shuffleButton.on('pointerdown', () => this.shuffleBoard());
    this.add.text(this.scale.width / 2, 650, t('link.controls'), {
      fontFamily: 'Arial', fontSize: '12px', color: '#91a7c6',
    }).setOrigin(0.5);
    this.message = this.add.text(this.scale.width / 2, 340, '', {
      fontFamily: 'Arial Black', fontSize: '28px', color: '#ffffff', align: 'center',
      backgroundColor: '#06101eee', padding: { x: 32, y: 24 },
    }).setOrigin(0.5).setDepth(30).setVisible(false);
    this.toast = this.add.text(this.scale.width / 2, 82, '', {
      fontFamily: 'Arial Black', fontSize: '14px', color: '#fff3bf',
      backgroundColor: '#06101edd', padding: { x: 12, y: 6 },
    }).setOrigin(0.5).setDepth(25).setVisible(false);
    this.updateHud();
  }

  bindControls() {
    this.input.keyboard.on('keydown-H', () => this.shuffleBoard());
    this.input.keyboard.on('keydown-P', () => this.togglePause());
    this.input.keyboard.on('keydown-R', () => this.scene.restart());
    this.input.keyboard.on('keydown-ENTER', () => {
      if (this.phase === 'won' || this.phase === 'lost') this.scene.restart();
    });
    this.input.keyboard.on('keydown-ESC', () => this.scene.start('menu'));
    mobileControls.bindScene(this, 'linkMatch', {
      primary: () => this.shuffleBoard(),
      pause: () => this.togglePause(),
      restart: () => this.scene.restart(),
      home: () => this.scene.start('menu'),
    });
  }

  drawBoard() {
    this.tileViews.forEach((view) => view.destroy());
    this.tileViews.clear();
    this.selected = null;
    for (let row = 1; row <= LINK_MATCH_RULES.rows; row += 1) {
      for (let column = 1; column <= LINK_MATCH_RULES.columns; column += 1) {
        const type = this.model.board[row][column];
        if (!type) continue;
        const { x, y } = this.positionToPoint({ row, column });
        const container = this.add.container(x, y).setSize(CELL_SIZE - 6, CELL_SIZE - 6)
          .setInteractive({ useHandCursor: true });
        const background = this.add.rectangle(0, 0, CELL_SIZE - 7, CELL_SIZE - 7, 0x12243d, 1)
          .setStrokeStyle(2, 0x31577e, 0.9);
        const icon = this.add.image(0, 0, `linkIcon${type}`).setScale(0.93);
        container.add([background, icon]);
        container.setData('background', background);
        const position = { row, column };
        container.on('pointerdown', () => this.selectTile(position));
        this.tileViews.set(this.positionKey(position), container);
      }
    }
  }

  selectTile(position) {
    if (this.phase !== 'playing') return;
    const type = this.model.tileAt(position);
    if (!type) return;
    if (!this.selected) {
      this.setSelected(position);
      return;
    }
    if (this.positionKey(this.selected) === this.positionKey(position)) {
      this.clearSelection();
      return;
    }
    if (this.model.tileAt(this.selected) !== type) {
      this.setSelected(position);
      return;
    }
    const first = this.selected;
    const path = this.model.removePair(first, position);
    if (!path) {
      soundFX.play('hurt');
      this.setSelected(position);
      return;
    }
    this.clearSelection();
    this.tileViews.get(this.positionKey(first))?.destroy();
    this.tileViews.get(this.positionKey(position))?.destroy();
    this.tileViews.delete(this.positionKey(first));
    this.tileViews.delete(this.positionKey(position));
    this.drawConnection(path);
    soundFX.play('line');
    this.updateHud();
    if (this.model.remaining === 0) this.endGame(true);
    else if (!this.model.hasAvailablePair()) {
      this.model.shuffleRemaining(false);
      this.drawBoard();
      this.showToast(t('link.autoShuffle'));
    }
  }

  setSelected(position) {
    this.clearSelection();
    this.selected = { ...position };
    const view = this.tileViews.get(this.positionKey(position));
    view?.getData('background')?.setStrokeStyle(3, 0xffd43b, 1);
    view?.setScale(1.06);
    soundFX.play('move');
  }

  clearSelection() {
    if (!this.selected) return;
    const view = this.tileViews.get(this.positionKey(this.selected));
    view?.getData('background')?.setStrokeStyle(2, 0x31577e, 0.9);
    view?.setScale(1);
    this.selected = null;
  }

  drawConnection(path) {
    this.connectionGraphics.clear().lineStyle(5, 0xffd43b, 1);
    for (let index = 1; index < path.length; index += 1) {
      const first = this.positionToPoint(path[index - 1]);
      const second = this.positionToPoint(path[index]);
      this.connectionGraphics.lineBetween(first.x, first.y, second.x, second.y);
    }
    this.time.delayedCall(180, () => this.connectionGraphics.clear());
  }

  shuffleBoard() {
    if (this.phase !== 'playing') return;
    if (!this.model.shuffleRemaining(true)) {
      this.showToast(t('link.noShuffle'));
      return;
    }
    this.drawBoard();
    this.updateHud();
    soundFX.play('rotate');
    this.showToast(t('link.shuffled'));
  }

  update(_, delta) {
    if (this.phase !== 'playing') return;
    this.timeRemaining = Math.max(0, this.timeRemaining - delta / 1000);
    this.updateHud();
    if (this.timeRemaining <= 0) this.endGame(false);
  }

  updateHud() {
    this.hud?.setText(
      `${t('link.score')} ${String(this.model.score).padStart(4, '0')}   ${t('link.time')} ${Math.ceil(this.timeRemaining)}s   ${t('link.left')} ${this.model.remaining}`,
    );
    this.shuffleLabel?.setText(`${t('link.shuffle')}  H  ×${this.model.shuffles}`);
  }

  togglePause() {
    if (this.phase === 'playing') {
      this.phase = 'paused';
      this.message.setText(`${t('link.paused')}\n${t('link.resume')}`).setVisible(true);
    } else if (this.phase === 'paused') {
      this.phase = 'playing';
      this.message.setVisible(false);
    }
  }

  endGame(won) {
    this.phase = won ? 'won' : 'lost';
    soundFX.play(won ? 'win' : 'lose');
    this.message.setText(won
      ? t('link.win', { score: this.model.score })
      : t('link.lose', { score: this.model.score })).setVisible(true);
  }

  showToast(text) {
    this.toast.setText(text).setAlpha(1).setVisible(true);
    this.tweens.killTweensOf(this.toast);
    this.tweens.add({ targets: this.toast, alpha: 0, delay: 800, duration: 260 });
  }

  positionToPoint({ row, column }) {
    return {
      x: this.boardX + (column - 0.5) * CELL_SIZE,
      y: BOARD_Y + (row - 0.5) * CELL_SIZE,
    };
  }

  positionKey({ row, column }) {
    return `${row}:${column}`;
  }
}
