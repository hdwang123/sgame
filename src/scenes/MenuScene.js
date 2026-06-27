import Phaser from 'phaser';
import { mobileControls } from '../ui/MobileControls.js';

const GAMES = [
  { key: 'tetris', number: '01', title: '俄罗斯方块', en: 'NEON BLOCKS', color: 0x748ffc, icon: '▦', desc: '堆叠、旋转、消除' },
  { key: 'snake', number: '02', title: '贪吃蛇', en: 'CYBER SNAKE', color: 0x51cf66, icon: '●', desc: '吞噬能量，不断生长' },
  { key: 'platformer', number: '03', title: '超级玛丽', en: 'SUPER JUMP', color: 0xff922b, icon: '▲', desc: '奔跑、跳跃、抵达终点' },
  { key: 'tank', number: '04', title: '坦克大战', en: 'TANK STRIKE', color: 0x38d9a9, icon: '◆', desc: '守住基地，消灭敌军' },
];

export class MenuScene extends Phaser.Scene {
  constructor() {
    super('menu');
  }

  create() {
    mobileControls.setProfile('menu');
    this.selected = 0;
    this.cards = [];
    this.drawBackdrop();
    this.add.text(64, 48, 'SELECT GAME', { fontFamily: 'Arial Black, Arial', fontSize: '34px', color: '#f5f7ff' });
    this.add.text(66, 92, '选择一个游戏，按 ENTER 开始', { fontFamily: 'Arial', fontSize: '14px', color: '#7681a6', letterSpacing: 2 });
    GAMES.forEach((game, index) => this.createCard(game, index));
    this.add.text(430, 638, '方向键选择  ·  ENTER 开始  ·  数字键快速进入', { fontFamily: 'Arial', fontSize: '12px', color: '#697392' }).setOrigin(0.5);
    this.input.keyboard.on('keydown-LEFT', () => this.select(this.selected % 2 === 0 ? this.selected + 1 : this.selected - 1));
    this.input.keyboard.on('keydown-RIGHT', () => this.select(this.selected % 2 === 0 ? this.selected + 1 : this.selected - 1));
    this.input.keyboard.on('keydown-UP', () => this.select((this.selected + 2) % 4));
    this.input.keyboard.on('keydown-DOWN', () => this.select((this.selected + 2) % 4));
    this.input.keyboard.on('keydown-ENTER', () => this.scene.start(GAMES[this.selected].key));
    GAMES.forEach((game, index) => this.input.keyboard.on(`keydown-${index + 1}`, () => this.scene.start(game.key)));
    this.select(0);
  }

  drawBackdrop() {
    const graphics = this.add.graphics();
    graphics.lineStyle(1, 0x252b46, 0.35);
    for (let x = 0; x < 860; x += 36) graphics.lineBetween(x, 0, x, 680);
    for (let y = 0; y < 680; y += 36) graphics.lineBetween(0, y, 860, y);
    this.add.circle(785, 55, 210, 0x5f3dc4, 0.1);
    this.add.circle(40, 650, 160, 0x087f5b, 0.08);
  }

  createCard(game, index) {
    const x = 64 + (index % 2) * 374;
    const y = 138 + Math.floor(index / 2) * 226;
    const card = this.add.container(x, y);
    const bg = this.add.rectangle(0, 0, 350, 198, 0x101426, 0.94).setOrigin(0);
    bg.setStrokeStyle(1, 0x303856, 0.9).setInteractive({ useHandCursor: true });
    const accent = this.add.rectangle(0, 0, 5, 198, game.color, 0.9).setOrigin(0);
    const iconBg = this.add.rectangle(26, 30, 62, 62, game.color, 0.14).setOrigin(0).setStrokeStyle(1, game.color, 0.5);
    const color = `#${game.color.toString(16).padStart(6, '0')}`;
    const icon = this.add.text(57, 61, game.icon, { fontFamily: 'Arial Black', fontSize: '28px', color }).setOrigin(0.5);
    const num = this.add.text(318, 22, game.number, { fontFamily: 'Consolas', fontSize: '12px', color: '#5f6887' }).setOrigin(1, 0);
    const en = this.add.text(108, 35, game.en, { fontFamily: 'Arial Black', fontSize: '18px', color: '#eef1ff' });
    const title = this.add.text(108, 64, game.title, { fontFamily: 'Arial', fontSize: '13px', color: '#8d97b9' });
    const desc = this.add.text(27, 126, game.desc, { fontFamily: 'Arial', fontSize: '13px', color: '#7781a0' });
    const action = this.add.text(27, 160, 'PLAY  →', { fontFamily: 'Consolas', fontSize: '12px', color });
    card.add([bg, accent, iconBg, icon, num, en, title, desc, action]);
    bg.on('pointerover', () => this.select(index));
    bg.on('pointerdown', () => this.scene.start(game.key));
    this.cards.push({ card, bg, accent, color: game.color });
  }

  select(index) {
    this.selected = Phaser.Math.Wrap(index, 0, GAMES.length);
    this.cards.forEach((item, i) => {
      const active = i === this.selected;
      item.bg.setStrokeStyle(active ? 2 : 1, active ? item.color : 0x303856, active ? 1 : 0.9);
      item.card.setScale(active ? 1.015 : 1);
      item.accent.setAlpha(active ? 1 : 0.45);
    });
  }
}
