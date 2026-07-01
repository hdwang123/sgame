import Phaser from 'phaser';
import { mobileControls } from '../ui/MobileControls.js';
import { getLanguage, setLanguage, t } from '../i18n.js';

const GAMES = [
  { key: 'tetris', number: '01', titleKey: 'game.tetris', subKey: 'game.tetris.sub', descKey: 'game.tetris.desc', color: 0x748ffc, icon: '▦' },
  { key: 'snake', number: '02', titleKey: 'game.snake', subKey: 'game.snake.sub', descKey: 'game.snake.desc', color: 0x51cf66, icon: '●' },
  { key: 'maryJump', number: '03', titleKey: 'game.mary', subKey: 'game.mary.sub', descKey: 'game.mary.desc', color: 0xff922b, icon: '▲' },
  { key: 'tank', number: '04', titleKey: 'game.tank', subKey: 'game.tank.sub', descKey: 'game.tank.desc', color: 0x38d9a9, icon: '◆' },
  { key: 'carrotDefense', number: '05', titleKey: 'game.carrot', subKey: 'game.carrot.sub', descKey: 'game.carrot.desc', color: 0x94d82d, icon: '♟' },
  { key: 'linkMatch', number: '06', titleKey: 'game.link', subKey: 'game.link.sub', descKey: 'game.link.desc', color: 0x22b8cf, icon: '✣' },
];

export class MenuScene extends Phaser.Scene {
  constructor() {
    super('menu');
  }

  create() {
    this.isMobileLayout = globalThis.matchMedia?.('(max-width: 800px)').matches ?? false;
    this.menuColumns = this.isMobileLayout ? 1 : 3;
    this.scale.resize(this.isMobileLayout ? 620 : 860, this.isMobileLayout ? 1040 : 680);
    mobileControls.setProfile('menu');
    this.selected = 0;
    this.cards = [];
    this.drawBackdrop();
    const titleX = this.isMobileLayout ? 34 : 64;
    this.add.text(titleX, this.isMobileLayout ? 28 : 44, t('menu.title'), {
      fontFamily: 'Arial Black, Arial', fontSize: this.isMobileLayout ? '28px' : '34px', color: '#f5f7ff',
    });
    this.add.text(titleX + 2, this.isMobileLayout ? 68 : 87, t('menu.hint'), {
      fontFamily: 'Arial', fontSize: '12px', color: '#7681a6', letterSpacing: 1,
    });
    this.createLanguageSelector();
    GAMES.forEach((game, index) => this.createCard(game, index));
    this.add.text(this.scale.width / 2, this.scale.height - 28, t('menu.controls'), {
      fontFamily: 'Arial', fontSize: this.isMobileLayout ? '10px' : '12px', color: '#697392',
    }).setOrigin(0.5);
    this.input.keyboard.on('keydown-LEFT', () => this.select(this.selected - 1));
    this.input.keyboard.on('keydown-RIGHT', () => this.select(this.selected + 1));
    this.input.keyboard.on('keydown-UP', () => this.select(this.selected - this.menuColumns));
    this.input.keyboard.on('keydown-DOWN', () => this.select(this.selected + this.menuColumns));
    this.input.keyboard.on('keydown-ENTER', () => this.scene.start(GAMES[this.selected].key));
    GAMES.forEach((game, index) => this.input.keyboard.on(`keydown-${index + 1}`, () => this.scene.start(game.key)));
    this.input.keyboard.on('keydown-L', () => this.toggleLanguage());
    this.select(0);
  }

  drawBackdrop() {
    const graphics = this.add.graphics();
    graphics.lineStyle(1, 0x252b46, 0.35);
    for (let x = 0; x < this.scale.width; x += 36) graphics.lineBetween(x, 0, x, this.scale.height);
    for (let y = 0; y < this.scale.height; y += 36) graphics.lineBetween(0, y, this.scale.width, y);
    this.add.circle(this.scale.width - 75, 55, 210, 0x5f3dc4, 0.1);
    this.add.circle(40, this.scale.height - 30, 160, 0x087f5b, 0.08);
  }

  createCard(game, index) {
    const x = this.isMobileLayout ? 30 : 35 + (index % 3) * 270;
    const y = this.isMobileLayout ? 105 + index * 143 : 138 + Math.floor(index / 3) * 226;
    const width = this.isMobileLayout ? 560 : 250;
    const height = this.isMobileLayout ? 128 : 198;
    const card = this.add.container(x, y);
    const bg = this.add.rectangle(0, 0, width, height, 0x101426, 0.94).setOrigin(0);
    bg.setStrokeStyle(1, 0x303856, 0.9).setInteractive({ useHandCursor: true });
    const accent = this.add.rectangle(0, 0, 5, height, game.color, 0.9).setOrigin(0);
    const iconBg = this.add.rectangle(this.isMobileLayout ? 20 : 20, this.isMobileLayout ? 20 : 30, 62, 62, game.color, 0.14).setOrigin(0).setStrokeStyle(1, game.color, 0.5);
    const color = `#${game.color.toString(16).padStart(6, '0')}`;
    const icon = this.add.text(this.isMobileLayout ? 51 : 51, this.isMobileLayout ? 51 : 61, game.icon, { fontFamily: 'Arial Black', fontSize: '28px', color }).setOrigin(0.5);
    const num = this.add.text(width - 24, 18, game.number, { fontFamily: 'Consolas', fontSize: '12px', color: '#5f6887' }).setOrigin(1, 0);
    const title = this.add.text(this.isMobileLayout ? 102 : 94, this.isMobileLayout ? 22 : 32, t(game.titleKey), { fontFamily: 'Arial Black', fontSize: this.isMobileLayout ? '20px' : '18px', color: '#eef1ff' });
    const en = this.add.text(this.isMobileLayout ? 102 : 94, this.isMobileLayout ? 55 : 65, t(game.subKey), { fontFamily: 'Arial', fontSize: '10px', color: '#8d97b9', letterSpacing: 1 });
    const desc = this.add.text(this.isMobileLayout ? 22 : 20, this.isMobileLayout ? 96 : 126, t(game.descKey), { fontFamily: 'Arial', fontSize: '12px', color: '#7781a0' });
    const action = this.add.text(this.isMobileLayout ? width - 24 : 20, this.isMobileLayout ? 96 : 160, t('menu.play'), { fontFamily: 'Arial', fontSize: '12px', color }).setOrigin(this.isMobileLayout ? 1 : 0, 0);
    card.add([bg, accent, iconBg, icon, num, en, title, desc, action]);
    bg.on('pointerover', () => this.select(index));
    bg.on('pointerdown', () => this.scene.start(game.key));
    this.cards.push({ card, bg, accent, color: game.color });
  }

  createLanguageSelector() {
    const y = this.isMobileLayout ? 36 : 50;
    const startX = this.scale.width - (this.isMobileLayout ? 136 : 150);
    [['zh', t('menu.zh')], ['en', t('menu.en')]].forEach(([language, label], index) => {
      const x = startX + index * 72;
      const selected = getLanguage() === language;
      const button = this.add.rectangle(x, y, 66, 30, selected ? 0x315f58 : 0x171d35, 0.96)
        .setStrokeStyle(selected ? 2 : 1, selected ? 0x63e6be : 0x3a4568)
        .setInteractive({ useHandCursor: true });
      this.add.text(x, y, label, {
        fontFamily: 'Arial', fontSize: '10px', color: selected ? '#e6fff8' : '#aab4d2',
      }).setOrigin(0.5);
      button.on('pointerdown', () => {
        setLanguage(language);
        this.scene.restart();
      });
    });
  }

  toggleLanguage() {
    setLanguage(getLanguage() === 'zh' ? 'en' : 'zh');
    this.scene.restart();
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
