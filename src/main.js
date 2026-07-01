import Phaser from 'phaser';
import { MenuScene } from './scenes/MenuScene.js';
import { TetrisScene } from './scenes/TetrisScene.js';
import { SnakeScene } from './scenes/SnakeScene.js';
import { MaryJumpScene } from './scenes/MaryJumpScene.js';
import { TankScene } from './scenes/TankScene.js';
import { CarrotDefenseScene } from './scenes/CarrotDefenseScene.js';
import { LinkMatchScene } from './scenes/LinkMatchScene.js';
import './ui/MobileControls.js';
import './styles.css';

const userAgent = globalThis.navigator?.userAgent ?? '';
const isMobileBrowser = globalThis.matchMedia?.('(pointer: coarse)').matches
  || /Android|iPhone|iPad|iPod|Mobile|MicroMessenger/i.test(userAgent);

const config = {
  // Mobile Safari and some WeChat WebViews can create a WebGL context but
  // render a black canvas after uploading the larger game textures. Canvas is
  // fast enough for these games and is substantially more reliable there.
  type: isMobileBrowser ? Phaser.CANVAS : Phaser.AUTO,
  parent: 'game-container',
  width: 860,
  height: 680,
  backgroundColor: '#090b15',
  scene: [MenuScene, TetrisScene, SnakeScene, MaryJumpScene, TankScene, CarrotDefenseScene, LinkMatchScene],
  loader: {
    // Avoid the default XHR Blob -> Image copy. Direct image loading lowers
    // peak memory use and is more reliable in Safari and embedded WebViews.
    imageLoadType: 'HTMLImageElement',
  },
  physics: {
    default: 'arcade',
    arcade: { gravity: { y: 0 }, debug: false },
  },
  render: {
    antialias: true,
    pixelArt: false,
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
};

const game = new Phaser.Game(config);
document.documentElement.dataset.renderer = isMobileBrowser ? 'canvas' : 'auto';

export { game };
