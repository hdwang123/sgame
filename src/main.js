import Phaser from 'phaser';
import { MenuScene } from './scenes/MenuScene.js';
import { TetrisScene } from './scenes/TetrisScene.js';
import { SnakeScene } from './scenes/SnakeScene.js';
import { MaryJumpScene } from './scenes/MaryJumpScene.js';
import { TankScene } from './scenes/TankScene.js';
import './ui/MobileControls.js';
import './styles.css';

const config = {
  type: Phaser.AUTO,
  parent: 'game-container',
  width: 860,
  height: 680,
  backgroundColor: '#090b15',
  scene: [MenuScene, TetrisScene, SnakeScene, MaryJumpScene, TankScene],
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

new Phaser.Game(config);
