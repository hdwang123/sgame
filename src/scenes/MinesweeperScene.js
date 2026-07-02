import Phaser from 'phaser';
import { mobileControls } from '../ui/MobileControls.js';
import { soundFX } from '../audio/SoundFX.js';
import { t } from '../i18n.js';
import { MinesweeperGame } from '../game/minesweeper/MinesweeperGame.js';

const COLORS = ['#9aa4b2', '#4dabf7', '#69db7c', '#ff6b6b', '#9775fa', '#ffa94d', '#22b8cf', '#f1f3f5', '#868e96'];
export class MinesweeperScene extends Phaser.Scene {
  constructor() { super('minesweeper'); }
  init() { this.isMobileLayout = globalThis.matchMedia?.('(max-width: 800px)').matches ?? false; this.scale.resize(this.isMobileLayout ? 620 : 860, 680); }
  create() {
    this.model = new MinesweeperGame(); this.flagMode = false; this.elapsed = 0; this.phase = 'playing'; this.views = [];
    this.cellSize = this.isMobileLayout ? 54 : 52; this.boardX = (this.scale.width - this.cellSize * 9) / 2; this.boardY = 118;
    this.cameras.main.setBackgroundColor('#10151d');
    this.add.text(26, 18, t('game.mine'), { fontFamily: 'Arial Black', fontSize: '27px', color: '#e9ecef' });
    this.hud = this.add.text(this.scale.width - 26, 22, '', { fontFamily: 'Consolas', fontSize: '18px', color: '#f8f9fa' }).setOrigin(1, 0);
    for (let r = 0; r < 9; r += 1) { this.views[r] = []; for (let c = 0; c < 9; c += 1) this.createCell(r, c); }
    this.modeText = this.add.text(this.scale.width / 2, 615, '', { fontFamily: 'Arial Black', fontSize: '13px', color: '#ffd43b' }).setOrigin(0.5);
    this.add.text(this.scale.width / 2, 646, t('mine.controls'), { fontFamily: 'Arial', fontSize: '11px', color: '#8491a3' }).setOrigin(0.5);
    this.message = this.add.text(this.scale.width / 2, 350, '', { fontFamily: 'Arial Black', fontSize: '27px', color: '#fff', align: 'center', backgroundColor: '#0b1018ee', padding: { x: 30, y: 22 } }).setOrigin(0.5).setDepth(30).setVisible(false);
    this.input.keyboard.on('keydown-F', () => this.toggleMode()); this.input.keyboard.on('keydown-R', () => this.scene.restart()); this.input.keyboard.on('keydown-ESC', () => this.scene.start('menu'));
    this.input.keyboard.on('keydown-ENTER', () => { if (this.phase !== 'playing') this.scene.restart(); });
    mobileControls.bindScene(this, 'minesweeper', { primary: () => this.toggleMode(), restart: () => this.scene.restart(), home: () => this.scene.start('menu') });
    this.updateHud();
  }
  createCell(row, column) {
    const x = this.boardX + column * this.cellSize + this.cellSize / 2; const y = this.boardY + row * this.cellSize + this.cellSize / 2;
    const box = this.add.rectangle(x, y, this.cellSize - 4, this.cellSize - 4, 0x2f3947, 1).setStrokeStyle(1, 0x657184).setInteractive({ useHandCursor: true });
    const label = this.add.text(x, y, '', { fontFamily: 'Arial Black', fontSize: '23px', color: '#fff' }).setOrigin(0.5);
    box.on('pointerdown', (pointer) => { if (pointer.rightButtonDown() || this.flagMode) this.flag(row, column); else this.reveal(row, column); });
    box.on('contextmenu', (event) => event.preventDefault()); this.views[row][column] = { box, label };
  }
  reveal(row, column) { if (this.phase !== 'playing') return; const result = this.model.reveal(row, column); result.changed.forEach(([r, c]) => this.paint(r, c)); if (result.exploded) this.end(false); else if (result.won) this.end(true); else if (result.changed.length) soundFX.play('move'); this.updateHud(); }
  flag(row, column) { if (!this.model.toggleFlag(row, column)) return; this.paint(row, column); soundFX.play('rotate'); this.updateHud(); }
  paint(row, column) { const cell = this.model.cells[row][column]; const view = this.views[row][column]; if (cell.revealed) { view.box.setFillStyle(cell.mine ? 0xc92a2a : 0x17202b).setStrokeStyle(1, 0x364152); view.label.setText(cell.mine ? '✹' : cell.adjacent ? String(cell.adjacent) : '').setColor(cell.mine ? '#fff' : COLORS[cell.adjacent]); } else { view.box.setFillStyle(0x2f3947); view.label.setText(cell.flagged ? '⚑' : '').setColor('#ffd43b'); } }
  toggleMode() { this.flagMode = !this.flagMode; this.updateHud(); }
  update(_, delta) { if (this.phase === 'playing' && this.model.started) { this.elapsed += delta / 1000; this.updateHud(); } }
  updateHud() { this.hud.setText(`${t('mine.mines')} ${this.model.mineCount - this.model.flags}   ${t('mine.time')} ${Math.floor(this.elapsed)}s`); this.modeText.setText(this.flagMode ? t('mine.flagMode') : t('mine.digMode')); }
  end(won) { this.phase = won ? 'won' : 'lost'; if (!won) { this.model.cells.forEach((row, r) => row.forEach((cell, c) => { if (cell.mine) { cell.revealed = true; this.paint(r, c); } })); } soundFX.play(won ? 'win' : 'lose'); this.message.setText(won ? t('mine.win', { time: Math.floor(this.elapsed) }) : t('mine.lose')).setVisible(true); }
}
