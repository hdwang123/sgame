import Phaser from 'phaser';
import { mobileControls } from '../ui/MobileControls.js';
import { soundFX } from '../audio/SoundFX.js';
import { t } from '../i18n.js';
import { WhackMoleGame } from '../game/whack-mole/WhackMoleGame.js';

export class WhackMoleScene extends Phaser.Scene {
  constructor() { super('whackMole'); }
  init() { this.isMobileLayout = globalThis.matchMedia?.('(max-width: 800px)').matches ?? false; this.scale.resize(this.isMobileLayout ? 620 : 860, 680); }
  create() {
    this.model = new WhackMoleGame(); this.phase = 'playing'; this.remaining = 30; this.nextSpawn = 300; this.active = null; this.holes = [];
    this.cameras.main.setBackgroundColor('#142414');
    const g = this.add.graphics(); g.fillStyle(0x254d27).fillRect(0, 82, this.scale.width, 598);
    for (let y = 95; y < 680; y += 28) for (let x = (y % 56 ? 10 : 24); x < this.scale.width; x += 42) g.fillStyle(0x3c6738, 0.5).fillRect(x, y, 4, 10);
    this.add.text(26, 18, t('game.mole'), { fontFamily: 'Arial Black', fontSize: '27px', color: '#d8f5a2' });
    this.hud = this.add.text(this.scale.width - 26, 22, '', { fontFamily: 'Consolas', fontSize: '18px', color: '#f4fce3' }).setOrigin(1, 0);
    const startX = this.scale.width / 2 - 190; const startY = 175;
    for (let row = 0; row < 3; row += 1) for (let column = 0; column < 3; column += 1) this.createHole(startX + column * 190, startY + row * 155, row * 3 + column);
    this.add.text(this.scale.width / 2, 651, t('mole.controls'), { fontFamily: 'Arial', fontSize: '12px', color: '#b7cfaa' }).setOrigin(0.5);
    this.message = this.add.text(this.scale.width / 2, 340, '', { fontFamily: 'Arial Black', fontSize: '27px', color: '#fff', align: 'center', backgroundColor: '#102010ee', padding: { x: 30, y: 22 } }).setOrigin(0.5).setDepth(30).setVisible(false);
    this.input.keyboard.on('keydown-R', () => this.scene.restart()); this.input.keyboard.on('keydown-ESC', () => this.scene.start('menu')); this.input.keyboard.on('keydown-ENTER', () => { if (this.phase === 'finished') this.scene.restart(); });
    mobileControls.bindScene(this, 'whackMole', { restart: () => this.scene.restart(), home: () => this.scene.start('menu') }); this.updateHud();
  }
  createHole(x, y, index) {
    this.add.ellipse(x, y + 35, 142, 54, 0x13200f, 0.9).setStrokeStyle(3, 0x6b4f2e);
    const body = this.add.circle(x, y, 48, 0x8b5a35).setStrokeStyle(3, 0x4b2f1d).setInteractive({ useHandCursor: true }).setVisible(false).setDepth(4);
    const face = this.add.text(x, y - 3, '•ᴗ•', { fontFamily: 'Arial Black', fontSize: '24px', color: '#2f1b10' }).setOrigin(0.5).setVisible(false).setDepth(5);
    body.on('pointerdown', () => this.whack(index)); this.holes.push({ body, face });
  }
  spawn() {
    if (this.active) { this.hideActive(true); }
    const index = Phaser.Math.Between(0, this.holes.length - 1); const roll = Math.random(); const kind = roll < 0.12 ? 'bomb' : roll < 0.28 ? 'gold' : 'normal'; const hole = this.holes[index];
    const color = kind === 'bomb' ? 0x343a40 : kind === 'gold' ? 0xffd43b : 0x8b5a35; hole.body.setFillStyle(color).setVisible(true).setScale(0.3); hole.face.setText(kind === 'bomb' ? '✹' : '•ᴗ•').setColor(kind === 'bomb' ? '#ff6b6b' : '#2f1b10').setVisible(true).setScale(0.3);
    this.tweens.add({ targets: [hole.body, hole.face], scale: 1, duration: 110 }); this.active = { index, kind, expires: this.time.now + Math.max(420, 850 - this.model.hits * 8) };
  }
  whack(index) { if (this.phase !== 'playing' || !this.active || this.active.index !== index) return; const kind = this.active.kind; this.model.hit(kind); soundFX.play(kind === 'bomb' ? 'hurt' : 'stomp'); this.hideActive(false); this.updateHud(); }
  hideActive(missed) { if (!this.active) return; const hole = this.holes[this.active.index]; hole.body.setVisible(false); hole.face.setVisible(false); if (missed && this.active.kind !== 'bomb') this.model.miss(); this.active = null; }
  update(time, delta) { if (this.phase !== 'playing') return; this.remaining = Math.max(0, this.remaining - delta / 1000); this.nextSpawn -= delta; if (this.active && time >= this.active.expires) this.hideActive(true); if (this.nextSpawn <= 0) { this.spawn(); this.nextSpawn = Math.max(380, 720 - this.model.hits * 6); } this.updateHud(); if (this.remaining <= 0) this.finish(); }
  updateHud() { this.hud.setText(`${t('mole.score')} ${String(this.model.score).padStart(4, '0')}   ${t('mole.combo')} ×${this.model.combo}   ${t('mole.time')} ${Math.ceil(this.remaining)}s`); }
  finish() { this.phase = 'finished'; this.hideActive(false); soundFX.play('win'); this.message.setText(t('mole.finished', { score: this.model.score, hits: this.model.hits })).setVisible(true); }
}
