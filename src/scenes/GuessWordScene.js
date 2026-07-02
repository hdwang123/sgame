import Phaser from 'phaser';
import { mobileControls } from '../ui/MobileControls.js';
import { soundFX } from '../audio/SoundFX.js';
import { getLanguage, t } from '../i18n.js';
import { GuessWordGame } from '../game/guess-word/GuessWordGame.js';

export class GuessWordScene extends Phaser.Scene {
  constructor() { super('guessWord'); }
  init() { this.isMobileLayout = globalThis.matchMedia?.('(max-width: 800px)').matches ?? false; this.scale.resize(this.isMobileLayout ? 620 : 860, 680); }
  create() {
    this.model = new GuessWordGame();
    this.phase = 'playing';
    this.buttons = [];
    this.cameras.main.setBackgroundColor('#160c1b');
    const g = this.add.graphics().lineStyle(1, 0x5f2b55, 0.35);
    for (let x = 0; x < this.scale.width; x += 34) g.lineBetween(x, 0, x, 680);
    for (let y = 0; y < 680; y += 34) g.lineBetween(0, y, this.scale.width, y);
    this.add.text(28, 22, t('game.guess'), { fontFamily: 'Arial Black', fontSize: '28px', color: '#faa2c1' });
    this.hud = this.add.text(this.scale.width - 28, 25, '', { fontFamily: 'Consolas', fontSize: '18px', color: '#ffe3e3' }).setOrigin(1, 0);
    this.card = this.add.rectangle(this.scale.width / 2, 260, this.isMobileLayout ? 560 : 650, 285, 0x2b152d, 0.96).setStrokeStyle(2, 0xf06595, 0.6);
    this.roundText = this.add.text(this.scale.width / 2, 145, '', { fontFamily: 'Arial', fontSize: '13px', color: '#c77d9b' }).setOrigin(0.5);
    this.clueText = this.add.text(this.scale.width / 2, 245, '', { fontFamily: 'Arial Black', fontSize: this.isMobileLayout ? '27px' : '34px', color: '#fff0f6', align: 'center', wordWrap: { width: this.isMobileLayout ? 500 : 590 } }).setOrigin(0.5);
    this.add.text(this.scale.width / 2, 638, t('guess.controls'), { fontFamily: 'Arial', fontSize: '12px', color: '#a887a7' }).setOrigin(0.5);
    this.message = this.add.text(this.scale.width / 2, 340, '', { fontFamily: 'Arial Black', fontSize: '28px', color: '#fff', align: 'center', backgroundColor: '#180b1bee', padding: { x: 30, y: 24 } }).setOrigin(0.5).setDepth(20).setVisible(false);
    this.input.keyboard.on('keydown-ESC', () => this.scene.start('menu'));
    this.input.keyboard.on('keydown-R', () => this.scene.restart());
    this.input.keyboard.on('keydown-ENTER', () => { if (this.phase === 'finished') this.scene.restart(); });
    ['ONE', 'TWO', 'THREE', 'FOUR'].forEach((key, i) => this.input.keyboard.on(`keydown-${key}`, () => this.choose(i)));
    mobileControls.bindScene(this, 'guessWord', { restart: () => this.scene.restart(), home: () => this.scene.start('menu') });
    this.showPuzzle();
  }
  showPuzzle() {
    this.buttons.forEach((button) => button.destroy()); this.buttons = [];
    const puzzle = this.model.puzzle;
    if (!puzzle) { this.finish(); return; }
    this.roundText.setText(t('guess.round', { current: this.model.index + 1, total: this.model.order.length }));
    this.clueText.setText(getLanguage() === 'en' ? puzzle.enClue : puzzle.clue);
    const gap = this.isMobileLayout ? 132 : 150;
    puzzle.options.forEach((option, i) => {
      const x = this.scale.width / 2 + (i - 1.5) * gap;
      const box = this.add.rectangle(x, 475, this.isMobileLayout ? 112 : 130, 105, 0x43203e, 1).setStrokeStyle(2, 0xf783ac, 0.65).setInteractive({ useHandCursor: true });
      const label = this.add.text(x, 468, option, { fontFamily: 'Arial Black', fontSize: '42px', color: '#fff0f6' }).setOrigin(0.5);
      const key = this.add.text(x, 515, String(i + 1), { fontFamily: 'Consolas', fontSize: '11px', color: '#d6336c' }).setOrigin(0.5);
      box.on('pointerdown', () => this.choose(i));
      this.buttons.push(box, label, key);
    });
    this.updateHud();
  }
  choose(index) {
    if (this.phase !== 'playing') return;
    const result = this.model.answer(this.model.puzzle.options[index]);
    soundFX.play(result.correct ? 'coin' : 'hurt');
    this.phase = 'feedback';
    this.roundText.setText(result.correct ? t('guess.correct') : t('guess.wrong', { answer: this.model.order[this.model.index - 1].answer }));
    this.time.delayedCall(650, () => { this.phase = result.finished ? 'finished' : 'playing'; result.finished ? this.finish() : this.showPuzzle(); });
  }
  updateHud() { this.hud.setText(`${t('guess.score')} ${String(this.model.score).padStart(4, '0')}`); }
  finish() { this.phase = 'finished'; this.buttons.forEach((button) => button.destroy()); this.buttons = []; this.clueText.setText(''); this.roundText.setText(''); this.updateHud(); soundFX.play('win'); this.message.setText(t('guess.finished', { correct: this.model.correct, total: this.model.order.length, score: this.model.score })).setVisible(true); }
}
