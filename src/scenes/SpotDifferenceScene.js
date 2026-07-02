import Phaser from 'phaser';
import { mobileControls } from '../ui/MobileControls.js';
import { soundFX } from '../audio/SoundFX.js';
import { t } from '../i18n.js';
import { SpotDifferenceGame, SPOT_LEVELS } from '../game/spot-difference/SpotDifferenceGame.js';

export class SpotDifferenceScene extends Phaser.Scene {
  constructor() { super('spotDifference'); }
  init() { this.isMobileLayout = globalThis.matchMedia?.('(max-width: 800px)').matches ?? false; this.scale.resize(this.isMobileLayout ? 620 : 860, 680); }
  create() {
    this.model = new SpotDifferenceGame(); this.phase = 'playing'; this.pictureGraphics = []; this.markers = [];
    this.cameras.main.setBackgroundColor('#17120d');
    this.add.text(25, 18, t('game.spot'), { fontFamily: 'Arial Black', fontSize: '27px', color: '#ffd8a8' });
    this.hud = this.add.text(this.scale.width - 25, 22, '', { fontFamily: 'Consolas', fontSize: '18px', color: '#fff4e6' }).setOrigin(1, 0);
    const panelWidth = this.isMobileLayout ? 280 : 360;
    const panelHeight = 430;
    this.leftX = this.isMobileLayout ? 20 : 55; this.rightX = this.isMobileLayout ? 320 : 445; this.panelY = 105;
    this.panelWidth = panelWidth; this.panelHeight = panelHeight; this.drawLevel();
    const hit = this.add.rectangle(this.rightX, this.panelY, panelWidth, panelHeight, 0xffffff, 0.001).setOrigin(0).setInteractive({ useHandCursor: true });
    hit.on('pointerdown', (pointer) => this.checkPoint(pointer.x - this.rightX, pointer.y - this.panelY));
    this.add.text(this.scale.width / 2, 600, t('spot.controls'), { fontFamily: 'Arial', fontSize: '13px', color: '#c7aa86' }).setOrigin(0.5);
    this.message = this.add.text(this.scale.width / 2, 330, '', { fontFamily: 'Arial Black', fontSize: '27px', color: '#fff', align: 'center', backgroundColor: '#17100dee', padding: { x: 30, y: 22 } }).setOrigin(0.5).setDepth(30).setVisible(false);
    this.input.keyboard.on('keydown-ESC', () => this.scene.start('menu')); this.input.keyboard.on('keydown-R', () => this.scene.restart());
    this.input.keyboard.on('keydown-ENTER', () => { if (this.phase === 'finished') this.scene.restart(); });
    mobileControls.bindScene(this, 'spotDifference', { restart: () => this.scene.restart(), home: () => this.scene.start('menu') });
    this.updateHud();
  }
  drawLevel() {
    this.pictureGraphics.forEach((graphic) => graphic.destroy()); this.pictureGraphics = [];
    this.markers.forEach((marker) => marker.destroy()); this.markers = [];
    this.drawPicture(this.leftX, this.panelY, this.panelWidth, this.panelHeight, false);
    this.drawPicture(this.rightX, this.panelY, this.panelWidth, this.panelHeight, true);
    this.updateHud();
  }
  drawPicture(x, y, width, height, changed) {
    const g = this.add.graphics(); this.pictureGraphics.push(g);
    const level = this.model.level; const scaleX = width / 280; const objectScale = Math.min(1.18, scaleX);
    g.fillStyle(level.sky).fillRoundedRect(x, y, width, height, 8);
    if (level.setting === 'space') {
      g.fillStyle(0xffffff, 0.55);
      for (let i = 0; i < 24; i += 1) g.fillCircle(x + ((i * 73 + level.variant * 19) % width), y + ((i * 41) % 300), i % 3 + 1);
    } else if (level.setting === 'ocean') {
      g.fillStyle(0x74c0fc, 0.22);
      for (let i = 0; i < 6; i += 1) g.fillEllipse(x + width / 2, y + 55 + i * 52, width, 25);
    } else if (level.setting === 'indoor') {
      g.fillStyle(level.ground).fillRect(x, y + 300, width, height - 300);
      g.lineStyle(6, 0xffffff, 0.45).lineBetween(x, y + 300, x + width, y + 300);
      g.lineStyle(1, 0xffffff, 0.12);
      for (let stripe = 35; stripe < width; stripe += 55) g.lineBetween(x + stripe, y, x + stripe, y + 300);
      for (let plank = 0; plank < 5; plank += 1) g.lineBetween(x, y + 325 + plank * 24, x + width, y + 325 + plank * 24);
    } else {
      g.fillStyle(level.ground).fillRect(x, y + 300, width, height - 300);
      if (level.theme === 'city') g.fillStyle(0x343a40).fillRect(x, y + 355, width, 75);
      if (level.theme === 'snow') g.fillStyle(0xffffff, 0.72).fillEllipse(x + width / 2, y + 320, width + 40, 85);
      if (level.theme === 'beach') g.fillStyle(0x4dabf7, 0.6).fillRect(x, y + 270, width, 42);
    }
    level.objects.forEach((object) => {
      const differs = changed && level.differences.some(({ id }) => id === object.id);
      this.drawObject(g, object.kind, x + object.x * scaleX, y + object.y, object.size * objectScale, object.colorIndex, differs);
    });
    g.lineStyle(3, 0xffffff, 0.9).strokeRoundedRect(x, y, width, height, 8);
  }
  drawObject(g, kind, x, y, baseSize, colorIndex, changed) {
    const colors = [0xff6b6b, 0xffd43b, 0x51cf66, 0x4dabf7, 0x9775fa, 0xff922b];
    const color = changed ? colors[(colorIndex + 3) % colors.length] : colors[colorIndex];
    const s = baseSize * (changed ? 0.72 : 1);
    const circle = (radius, fill = color) => g.fillStyle(fill).fillCircle(x, y, radius * s);
    if (kind === 'sun') { circle(25, color); g.lineStyle(3 * s, color); for (let i = 0; i < 8; i += 1) { const a = i * Math.PI / 4; g.lineBetween(x + Math.cos(a) * 30 * s, y + Math.sin(a) * 30 * s, x + Math.cos(a) * 39 * s, y + Math.sin(a) * 39 * s); } }
    else if (kind === 'cloud') { g.fillStyle(changed ? 0xffd8a8 : 0xffffff, 0.92).fillEllipse(x, y + 5 * s, 70 * s, 28 * s).fillCircle(x - 18 * s, y, 18 * s).fillCircle(x + 12 * s, y - 8 * s, 22 * s); }
    else if (kind === 'tree' || kind === 'pine' || kind === 'palm') {
      g.fillStyle(0x704214).fillRect(x - 7 * s, y, 14 * s, 48 * s);
      if (kind === 'pine') g.fillStyle(color).fillTriangle(x, y - 42 * s, x - 33 * s, y + 18 * s, x + 33 * s, y + 18 * s);
      else if (kind === 'palm') { g.lineStyle(9 * s, color); for (let i = -2; i <= 2; i += 1) g.lineBetween(x, y, x + i * 22 * s, y - (28 - Math.abs(i) * 5) * s); }
      else circle(34, color);
    } else if (kind === 'house' || kind === 'barn' || kind === 'cabin' || kind === 'building') {
      const w = (kind === 'building' ? 62 : 72) * s; const h = (kind === 'building' ? 92 : 55) * s;
      g.fillStyle(color).fillRect(x - w / 2, y - h / 2, w, h);
      if (kind !== 'building') g.fillStyle(0x8d4b32).fillTriangle(x - w * 0.62, y - h / 2, x, y - h, x + w * 0.62, y - h / 2);
      g.fillStyle(0x74c0fc).fillRect(x - 22 * s, y - 12 * s, 15 * s, 17 * s).fillStyle(0x5c3b24).fillRect(x + 8 * s, y - 4 * s, 17 * s, 31 * s);
      if (kind === 'building') for (let row = 0; row < 3; row += 1) g.fillStyle(0xfff3bf).fillRect(x - 21 * s, y - 35 * s + row * 25 * s, 12 * s, 14 * s).fillRect(x + 8 * s, y - 35 * s + row * 25 * s, 12 * s, 14 * s);
    } else if (kind === 'flower') { g.lineStyle(3 * s, 0x2b8a3e).lineBetween(x, y, x, y + 30 * s); for (let i = 0; i < (changed ? 4 : 6); i += 1) { const a = i * Math.PI / 3; g.fillStyle(color).fillCircle(x + Math.cos(a) * 12 * s, y + Math.sin(a) * 12 * s, 8 * s); } circle(6, 0xffd43b); }
    else if (kind === 'pond' || kind === 'dune') g.fillStyle(color, 0.85).fillEllipse(x, y, 75 * s, 30 * s);
    else if (kind === 'fence') { g.lineStyle(6 * s, color).lineBetween(x - 40 * s, y - 12 * s, x + 40 * s, y - 12 * s).lineBetween(x - 40 * s, y + 12 * s, x + 40 * s, y + 12 * s); for (let i = -1; i <= 1; i += 1) g.lineBetween(x + i * 32 * s, y - 28 * s, x + i * 32 * s, y + 28 * s); }
    else if (kind === 'kite') { g.fillStyle(color).fillTriangle(x, y - 29 * s, x - 22 * s, y, x, y + 29 * s).fillTriangle(x, y - 29 * s, x + 22 * s, y, x, y + 29 * s); g.lineStyle(2 * s, 0x495057).lineBetween(x, y + 29 * s, x + 22 * s, y + 54 * s); }
    else if (kind === 'boat') { g.fillStyle(color).fillTriangle(x - 40 * s, y, x + 40 * s, y, x + 28 * s, y + 24 * s).fillStyle(0xffffff).fillTriangle(x, y - 55 * s, x, y - 3 * s, x + 35 * s, y - 3 * s); g.lineStyle(3 * s, 0x704214).lineBetween(x, y - 58 * s, x, y + 3 * s); }
    else if (kind === 'umbrella') { g.fillStyle(color).slice(x, y, 38 * s, Math.PI, Math.PI * 2, false).fillPath(); g.lineStyle(4 * s, 0x704214).lineBetween(x, y, x, y + 48 * s); }
    else if (kind === 'ball' || kind === 'planet' || kind === 'moon') { circle(kind === 'planet' ? 31 : 24, color); g.lineStyle(4 * s, 0xffffff, 0.55).strokeCircle(x, y, (kind === 'planet' ? 18 : 13) * s); if (kind === 'planet') g.lineStyle(5 * s, 0xffe8cc, 0.7).strokeEllipse(x, y, 82 * s, 22 * s); }
    else if (kind === 'fish') { g.fillStyle(color).fillEllipse(x, y, 58 * s, 31 * s).fillTriangle(x - 28 * s, y, x - 50 * s, y - 20 * s, x - 50 * s, y + 20 * s); circle(3, 0x212529); }
    else if (kind === 'shell') { g.fillStyle(color).slice(x, y, 25 * s, Math.PI, Math.PI * 2, false).fillPath(); g.lineStyle(2 * s, 0xffffff, 0.7); for (let i = -2; i <= 2; i += 1) g.lineBetween(x, y, x + i * 8 * s, y - 22 * s); }
    else if (kind === 'star' || kind === 'starfish' || kind === 'snowflake') { g.lineStyle((kind === 'snowflake' ? 4 : 9) * s, color); const count = kind === 'snowflake' ? 6 : 5; for (let i = 0; i < count; i += 1) { const a = i * Math.PI * 2 / count - Math.PI / 2; g.lineBetween(x, y, x + Math.cos(a) * 30 * s, y + Math.sin(a) * 30 * s); } }
    else if (kind === 'rocket' || kind === 'comet') { g.fillStyle(color).fillEllipse(x, y, 30 * s, 66 * s); g.fillStyle(0xd0ebff).fillCircle(x, y - 10 * s, 7 * s); g.fillStyle(0xff922b).fillTriangle(x - 12 * s, y + 25 * s, x, y + 53 * s, x + 12 * s, y + 25 * s); }
    else if (kind === 'ufo' || kind === 'satellite') { g.fillStyle(color).fillEllipse(x, y, 72 * s, 24 * s).fillStyle(0x74c0fc, 0.9).slice(x, y, 22 * s, Math.PI, Math.PI * 2, false).fillPath(); g.lineStyle(3 * s, 0xffffff).lineBetween(x - 38 * s, y, x - 53 * s, y - 25 * s).lineBetween(x + 38 * s, y, x + 53 * s, y - 25 * s); }
    else if (kind === 'mushroom') { g.fillStyle(color).slice(x, y, 30 * s, Math.PI, Math.PI * 2, false).fillPath().fillStyle(0xffe8cc).fillRect(x - 9 * s, y, 18 * s, 30 * s); }
    else if (kind === 'fox' || kind === 'cow' || kind === 'camel') { g.fillStyle(color).fillEllipse(x, y, 58 * s, 35 * s).fillCircle(x + 30 * s, y - 16 * s, 18 * s); g.fillTriangle(x + 18 * s, y - 29 * s, x + 25 * s, y - 48 * s, x + 34 * s, y - 28 * s); for (let i = -1; i <= 1; i += 2) g.fillRect(x + i * 18 * s, y + 12 * s, 8 * s, 31 * s); }
    else if (kind === 'butterfly') { g.fillStyle(color, 0.9).fillEllipse(x - 14 * s, y, 28 * s, 38 * s).fillEllipse(x + 14 * s, y, 28 * s, 38 * s).fillStyle(0x343a40).fillRect(x - 3 * s, y - 17 * s, 6 * s, 34 * s); }
    else if (kind === 'tractor' || kind === 'car' || kind === 'bus' || kind === 'sled') { const w = kind === 'bus' ? 82 : 66; g.fillStyle(color).fillRoundedRect(x - w / 2 * s, y - 20 * s, w * s, 35 * s, 7 * s); if (kind !== 'sled') g.fillStyle(0x212529).fillCircle(x - 21 * s, y + 17 * s, 11 * s).fillCircle(x + 21 * s, y + 17 * s, 11 * s); else g.lineStyle(4 * s, 0x704214).strokeEllipse(x, y + 18 * s, 78 * s, 22 * s); }
    else if (kind === 'hay' || kind === 'rock' || kind === 'gift' || kind === 'treasure') { g.fillStyle(color).fillRoundedRect(x - 30 * s, y - 23 * s, 60 * s, 46 * s, 5 * s); g.lineStyle(5 * s, 0xfff3bf).lineBetween(x, y - 22 * s, x, y + 22 * s).lineBetween(x - 29 * s, y, x + 29 * s, y); }
    else if (kind === 'bubble') { g.lineStyle(4 * s, changed ? color : 0xd0ebff, 0.8).strokeCircle(x, y, 25 * s).strokeCircle(x + 25 * s, y - 22 * s, 11 * s); }
    else if (kind === 'coral' || kind === 'cactus') { g.lineStyle(10 * s, color).lineBetween(x, y + 35 * s, x, y - 35 * s).lineBetween(x, y, x - 25 * s, y - 20 * s).lineBetween(x - 25 * s, y - 20 * s, x - 25 * s, y - 38 * s).lineBetween(x, y + 10 * s, x + 23 * s, y - 8 * s); }
    else if (kind === 'submarine') { g.fillStyle(color).fillEllipse(x, y, 78 * s, 39 * s).fillStyle(0x74c0fc).fillCircle(x - 15 * s, y, 8 * s).fillCircle(x + 10 * s, y, 8 * s).fillStyle(color).fillRect(x - 4 * s, y - 32 * s, 9 * s, 20 * s); }
    else if (kind === 'octopus') { circle(24, color); g.lineStyle(7 * s, color); for (let i = -2; i <= 2; i += 1) g.lineBetween(x + i * 8 * s, y + 16 * s, x + i * 13 * s, y + 48 * s); }
    else if (kind === 'pyramid' || kind === 'tent') g.fillStyle(color).fillTriangle(x, y - 42 * s, x - 48 * s, y + 35 * s, x + 48 * s, y + 35 * s);
    else if (kind === 'snowman') { circle(27, 0xffffff); g.fillStyle(0xffffff).fillCircle(x, y - 44 * s, 21 * s); g.fillStyle(color).fillTriangle(x, y - 42 * s, x + 25 * s, y - 36 * s, x, y - 34 * s); }
    else if (kind === 'light' || kind === 'lamp' || kind === 'sign') { g.fillStyle(0x343a40).fillRect(x - 5 * s, y - 5 * s, 10 * s, 62 * s).fillStyle(color).fillRoundedRect(x - 18 * s, y - 39 * s, 36 * s, 42 * s, 6 * s); }
    else if (kind === 'bench') { g.fillStyle(color).fillRect(x - 43 * s, y - 18 * s, 86 * s, 14 * s).fillRect(x - 43 * s, y + 4 * s, 86 * s, 14 * s).fillRect(x - 31 * s, y + 15 * s, 8 * s, 25 * s).fillRect(x + 23 * s, y + 15 * s, 8 * s, 25 * s); }
    else if (kind === 'swing') { g.lineStyle(6 * s, color).lineBetween(x - 37 * s, y + 38 * s, x, y - 42 * s).lineBetween(x, y - 42 * s, x + 37 * s, y + 38 * s).lineBetween(x - 5 * s, y - 31 * s, x - 5 * s, y + 20 * s).lineBetween(x + 17 * s, y - 31 * s, x + 17 * s, y + 20 * s).lineBetween(x - 8 * s, y + 20 * s, x + 20 * s, y + 20 * s); }
    else if (kind === 'fountain') { g.fillStyle(0xadb5bd).fillEllipse(x, y + 25 * s, 82 * s, 28 * s); g.lineStyle(5 * s, color).lineBetween(x, y + 17 * s, x, y - 36 * s).lineBetween(x, y - 20 * s, x - 23 * s, y).lineBetween(x, y - 20 * s, x + 23 * s, y); }
    else if (kind === 'sofa') { g.fillStyle(color).fillRoundedRect(x - 48 * s, y - 24 * s, 96 * s, 56 * s, 13 * s).fillStyle(0xffffff, 0.25).fillRoundedRect(x - 36 * s, y - 13 * s, 31 * s, 27 * s, 6 * s).fillRoundedRect(x + 5 * s, y - 13 * s, 31 * s, 27 * s, 6 * s); }
    else if (kind === 'table' || kind === 'desk') { g.fillStyle(color).fillRoundedRect(x - 47 * s, y - 12 * s, 94 * s, 22 * s, 5 * s).fillRect(x - 36 * s, y + 8 * s, 9 * s, 42 * s).fillRect(x + 27 * s, y + 8 * s, 9 * s, 42 * s); if (kind === 'desk') g.fillStyle(0xffffff, 0.28).fillRect(x - 18 * s, y + 10 * s, 36 * s, 20 * s); }
    else if (kind === 'chair') { g.fillStyle(color).fillRoundedRect(x - 27 * s, y - 42 * s, 54 * s, 48 * s, 7 * s).fillRect(x - 30 * s, y + 3 * s, 60 * s, 15 * s).fillRect(x - 23 * s, y + 16 * s, 8 * s, 38 * s).fillRect(x + 15 * s, y + 16 * s, 8 * s, 38 * s); }
    else if (kind === 'lamp') { g.fillStyle(color).fillTriangle(x, y - 48 * s, x - 28 * s, y - 6 * s, x + 28 * s, y - 6 * s).fillStyle(0x495057).fillRect(x - 4 * s, y - 6 * s, 8 * s, 47 * s).fillStyle(color).fillEllipse(x, y + 43 * s, 42 * s, 12 * s); }
    else if (['television', 'screen', 'blackboard', 'window'].includes(kind)) { const w = kind === 'blackboard' ? 92 : 67; g.fillStyle(kind === 'window' ? 0x74c0fc : 0x212529).fillRoundedRect(x - w / 2 * s, y - 34 * s, w * s, 68 * s, 6 * s); g.lineStyle(5 * s, color).strokeRoundedRect(x - w / 2 * s, y - 34 * s, w * s, 68 * s, 6 * s); if (kind === 'window') g.lineBetween(x, y - 32 * s, x, y + 32 * s).lineBetween(x - w / 2 * s, y, x + w / 2 * s, y); else g.fillStyle(0xffffff, 0.35).fillCircle(x - 18 * s, y - 10 * s, 5 * s).fillRect(x - 12 * s, y + 8 * s, 28 * s, 4 * s); }
    else if (kind === 'rug') { g.fillStyle(color, 0.88).fillEllipse(x, y, 96 * s, 48 * s); g.lineStyle(3 * s, 0xffffff, 0.7).strokeEllipse(x, y, 70 * s, 31 * s); }
    else if (kind === 'plant') { g.fillStyle(color).fillTriangle(x, y - 48 * s, x - 26 * s, y - 6 * s, x, y).fillTriangle(x, y - 35 * s, x + 28 * s, y - 2 * s, x, y + 5 * s).fillStyle(0xa65f36).fillRoundedRect(x - 19 * s, y, 38 * s, 39 * s, 5 * s); }
    else if (kind === 'clock') { circle(29, 0xffffff); g.lineStyle(4 * s, color).strokeCircle(x, y, 29 * s).lineBetween(x, y, x, y - 17 * s).lineBetween(x, y, x + (changed ? -16 : 15) * s, y + 8 * s); }
    else if (kind === 'bed') { g.fillStyle(color).fillRoundedRect(x - 52 * s, y - 15 * s, 104 * s, 48 * s, 9 * s).fillStyle(0xffffff).fillRoundedRect(x - 42 * s, y - 11 * s, 31 * s, 22 * s, 7 * s).fillStyle(0x704214).fillRect(x - 55 * s, y - 31 * s, 10 * s, 73 * s); }
    else if (['wardrobe', 'cabinet', 'fridge'].includes(kind)) { const h = kind === 'fridge' ? 92 : 78; g.fillStyle(color).fillRoundedRect(x - 34 * s, y - h / 2 * s, 68 * s, h * s, 6 * s); g.lineStyle(3 * s, 0xffffff, 0.55).lineBetween(x, y - h / 2 * s, x, y + h / 2 * s); g.fillStyle(0xffffff, 0.75).fillCircle(x - 7 * s, y, 3 * s).fillCircle(x + 7 * s, y, 3 * s); }
    else if (kind === 'pillow') { g.fillStyle(color).fillRoundedRect(x - 38 * s, y - 24 * s, 76 * s, 48 * s, 15 * s); g.lineStyle(3 * s, 0xffffff, 0.6).strokeRoundedRect(x - 28 * s, y - 16 * s, 56 * s, 32 * s, 11 * s); }
    else if (kind === 'book' || kind === 'map') { g.fillStyle(color).fillRoundedRect(x - 39 * s, y - 29 * s, 78 * s, 58 * s, 5 * s); g.lineStyle(3 * s, 0xffffff, 0.7).lineBetween(x, y - 27 * s, x, y + 27 * s); if (kind === 'map') g.lineStyle(3 * s, 0x704214).lineBetween(x - 25 * s, y - 10 * s, x - 5 * s, y + 8 * s).lineBetween(x + 10 * s, y - 12 * s, x + 25 * s, y + 14 * s); }
    else if (kind === 'stove') { g.fillStyle(color).fillRoundedRect(x - 36 * s, y - 37 * s, 72 * s, 74 * s, 5 * s).fillStyle(0x212529).fillCircle(x - 17 * s, y - 19 * s, 11 * s).fillCircle(x + 17 * s, y - 19 * s, 11 * s).fillRect(x - 23 * s, y + 3 * s, 46 * s, 27 * s); }
    else if (kind === 'sink') { g.fillStyle(0xced4da).fillEllipse(x, y + 5 * s, 72 * s, 38 * s); g.lineStyle(7 * s, color).lineBetween(x, y - 5 * s, x, y - 38 * s).lineBetween(x, y - 38 * s, x + 22 * s, y - 38 * s).lineBetween(x + 22 * s, y - 38 * s, x + 22 * s, y - 20 * s); }
    else if (kind === 'kettle') { g.fillStyle(color).fillCircle(x, y, 28 * s).fillTriangle(x + 21 * s, y - 10 * s, x + 51 * s, y - 1 * s, x + 24 * s, y + 10 * s); g.lineStyle(5 * s, 0x343a40).strokeEllipse(x, y - 21 * s, 43 * s, 31 * s); }
    else if (kind === 'plate' || kind === 'hoop') { g.lineStyle((kind === 'hoop' ? 7 : 5) * s, color).strokeCircle(x, y, (kind === 'hoop' ? 34 : 28) * s); if (kind === 'plate') g.lineStyle(2 * s, 0xffffff, 0.8).strokeCircle(x, y, 17 * s); }
    else if (kind === 'globe') { circle(28, 0x4dabf7); g.lineStyle(3 * s, color).strokeEllipse(x, y, 24 * s, 55 * s).lineBetween(x - 27 * s, y, x + 27 * s, y).lineBetween(x, y + 29 * s, x, y + 46 * s); }
    else if (kind === 'pencil' || kind === 'wand' || kind === 'wrench') { g.lineStyle((kind === 'wand' ? 7 : 11) * s, color).lineBetween(x - 34 * s, y + 34 * s, x + 30 * s, y - 30 * s); if (kind === 'pencil') g.fillStyle(0xffe8cc).fillTriangle(x + 30 * s, y - 30 * s, x + 42 * s, y - 42 * s, x + 35 * s, y - 24 * s); else circle(kind === 'wand' ? 8 : 13, color); }
    else if (kind === 'backpack') { g.fillStyle(color).fillRoundedRect(x - 31 * s, y - 33 * s, 62 * s, 70 * s, 13 * s).fillStyle(0xffffff, 0.28).fillRoundedRect(x - 22 * s, y + 3 * s, 44 * s, 23 * s, 7 * s); g.lineStyle(5 * s, color).strokeEllipse(x, y - 31 * s, 34 * s, 25 * s); }
    else if (['teddy', 'doll', 'pirate', 'wizard', 'clown', 'hero'].includes(kind)) { const skin = kind === 'teddy' ? color : 0xffd8a8; g.fillStyle(skin).fillCircle(x, y - 28 * s, 22 * s).fillStyle(color).fillRoundedRect(x - 24 * s, y - 8 * s, 48 * s, 55 * s, 14 * s); g.fillStyle(0x212529).fillCircle(x - 8 * s, y - 31 * s, 3 * s).fillCircle(x + 8 * s, y - 31 * s, 3 * s); if (kind === 'pirate') g.fillStyle(0x212529).fillRect(x - 22 * s, y - 40 * s, 44 * s, 8 * s).fillCircle(x + 8 * s, y - 31 * s, 7 * s); if (kind === 'wizard') g.fillStyle(0x7048e8).fillTriangle(x, y - 77 * s, x - 34 * s, y - 41 * s, x + 34 * s, y - 41 * s); if (kind === 'clown') g.fillStyle(0xe03131).fillCircle(x, y - 24 * s, 6 * s); if (kind === 'hero') g.fillStyle(0xe03131).fillTriangle(x - 21 * s, y - 5 * s, x - 48 * s, y + 49 * s, x, y + 30 * s); }
    else if (kind === 'toytrain') { g.fillStyle(color).fillRect(x - 47 * s, y - 17 * s, 72 * s, 36 * s).fillRect(x + 5 * s, y - 42 * s, 31 * s, 61 * s).fillStyle(0x212529).fillCircle(x - 26 * s, y + 23 * s, 12 * s).fillCircle(x + 21 * s, y + 23 * s, 12 * s); }
    else if (kind === 'blocks' || kind === 'battery') { g.fillStyle(color).fillRect(x - 34 * s, y - 30 * s, 31 * s, 31 * s).fillStyle(colors[(colorIndex + 1) % colors.length]).fillRect(x + 4 * s, y - 8 * s, 31 * s, 39 * s); if (kind === 'battery') g.fillStyle(0xffffff).fillRect(x + 13 * s, y - 18 * s, 12 * s, 10 * s); }
    else if (kind === 'robot') { g.fillStyle(color).fillRoundedRect(x - 29 * s, y - 25 * s, 58 * s, 60 * s, 7 * s).fillRect(x - 20 * s, y - 54 * s, 40 * s, 28 * s); g.fillStyle(0x74c0fc).fillCircle(x - 10 * s, y - 41 * s, 5 * s).fillCircle(x + 10 * s, y - 41 * s, 5 * s); g.lineStyle(5 * s, color).lineBetween(x, y - 54 * s, x, y - 68 * s); }
    else if (kind === 'gear') { circle(28, color); circle(11, 0x343a40); g.lineStyle(7 * s, color); for (let i = 0; i < 8; i += 1) { const a = i * Math.PI / 4; g.lineBetween(x + Math.cos(a) * 23 * s, y + Math.sin(a) * 23 * s, x + Math.cos(a) * 39 * s, y + Math.sin(a) * 39 * s); } }
    else if (kind === 'antenna') { g.lineStyle(6 * s, color).lineBetween(x - 25 * s, y + 36 * s, x, y - 22 * s).lineBetween(x + 25 * s, y + 36 * s, x, y - 22 * s); circle(10, color); }
    else if (kind === 'potion') { g.fillStyle(color, 0.85).fillCircle(x, y + 12 * s, 27 * s).fillStyle(0xffffff, 0.8).fillRect(x - 10 * s, y - 34 * s, 20 * s, 29 * s); }
    else if (kind === 'cauldron' || kind === 'drum' || kind === 'barrel') { g.fillStyle(color).fillRoundedRect(x - 34 * s, y - 28 * s, 68 * s, 56 * s, 10 * s); g.lineStyle(5 * s, 0xffffff, 0.6).lineBetween(x - 33 * s, y - 12 * s, x + 33 * s, y - 12 * s).lineBetween(x - 33 * s, y + 12 * s, x + 33 * s, y + 12 * s); if (kind === 'cauldron') g.fillStyle(0x212529).fillEllipse(x, y - 27 * s, 70 * s, 18 * s); }
    else if (kind === 'owl' || kind === 'parrot') { g.fillStyle(color).fillEllipse(x, y, 47 * s, 65 * s); g.fillStyle(0xffffff).fillCircle(x - 10 * s, y - 16 * s, 10 * s).fillCircle(x + 10 * s, y - 16 * s, 10 * s); g.fillStyle(0x212529).fillCircle(x - 10 * s, y - 16 * s, 4 * s).fillCircle(x + 10 * s, y - 16 * s, 4 * s); g.fillStyle(0xff922b).fillTriangle(x - 5 * s, y - 5 * s, x + 5 * s, y - 5 * s, x, y + 6 * s); }
    else if (kind === 'island') { g.fillStyle(0xffd89b).fillEllipse(x, y + 14 * s, 92 * s, 35 * s); g.fillStyle(color).fillCircle(x, y - 12 * s, 28 * s); }
    else if (kind === 'flag' || kind === 'cape') { g.lineStyle(5 * s, 0x495057).lineBetween(x - 25 * s, y - 46 * s, x - 25 * s, y + 45 * s); g.fillStyle(color).fillTriangle(x - 22 * s, y - 43 * s, x + 37 * s, y - 26 * s, x - 22 * s, y - 7 * s); }
    else if (kind === 'hat') { g.fillStyle(color).fillTriangle(x, y - 48 * s, x - 34 * s, y + 13 * s, x + 34 * s, y + 13 * s).fillEllipse(x, y + 13 * s, 88 * s, 18 * s); }
    else if (kind === 'balloon') { circle(28, color); g.lineStyle(2 * s, 0x495057).lineBetween(x, y + 28 * s, x + 10 * s, y + 66 * s); }
    else if (kind === 'elephant') { g.fillStyle(color).fillEllipse(x, y, 73 * s, 49 * s).fillCircle(x + 35 * s, y - 7 * s, 23 * s).fillRect(x - 26 * s, y + 12 * s, 12 * s, 40 * s).fillRect(x + 12 * s, y + 12 * s, 12 * s, 40 * s); g.lineStyle(11 * s, color).lineBetween(x + 51 * s, y, x + 54 * s, y + 40 * s); }
    else if (kind === 'mask' || kind === 'shield') { g.fillStyle(color).fillRoundedRect(x - 34 * s, y - 28 * s, 68 * s, 55 * s, kind === 'mask' ? 20 * s : 6 * s); g.fillStyle(0x212529).fillEllipse(x - 13 * s, y - 6 * s, 13 * s, 7 * s).fillEllipse(x + 13 * s, y - 6 * s, 13 * s, 7 * s); }
    else circle(25, color);
  }
  checkPoint(x, y) {
    if (this.phase !== 'playing') return;
    const baseX = x * 280 / this.panelWidth;
    const item = this.model.differences.find((difference) => Math.hypot(baseX - difference.x, y - difference.y) < 42 && !this.model.found.has(difference.id));
    if (!item) { this.model.miss(); soundFX.play('hurt'); this.updateHud(); return; }
    this.model.find(item.id); soundFX.play('coin');
    [this.leftX, this.rightX].forEach((panelX) => this.markers.push(this.add.circle(panelX + item.x * this.panelWidth / 280, this.panelY + item.y, 33, 0xffffff, 0.05).setStrokeStyle(4, 0xffd43b).setDepth(10)));
    this.updateHud();
    if (this.model.complete) {
      soundFX.play('win');
      if (this.model.allComplete) { this.phase = 'finished'; this.message.setText(t('spot.finished', { score: this.model.score, mistakes: this.model.mistakes })).setVisible(true); }
      else {
        this.phase = 'transition'; this.message.setText(t('spot.levelClear', { level: this.model.levelIndex + 1 })).setVisible(true);
        this.time.delayedCall(750, () => { this.model.nextLevel(); this.phase = 'playing'; this.message.setVisible(false); this.drawLevel(); });
      }
    }
  }
  updateHud() { this.hud.setText(`${t('spot.level')} ${this.model.levelIndex + 1}/${SPOT_LEVELS.length}   ${t('spot.found')} ${this.model.found.size}/${this.model.differences.length}   ${t('spot.score')} ${this.model.score}`); }
}
