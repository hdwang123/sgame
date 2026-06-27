import Phaser from 'phaser';
import { MaryJumpGame } from '../game/mary-jump/MaryJumpGame.js';
import {
  MARY_JUMP_COINS,
  MARY_JUMP_ENEMIES,
  MARY_JUMP_PLATFORMS,
  MARY_JUMP_RULES,
  MARY_JUMP_WORLD,
} from '../game/mary-jump/config.js';
import { soundFX } from '../audio/SoundFX.js';
import { mobileControls } from '../ui/MobileControls.js';

export class MaryJumpScene extends Phaser.Scene {
  constructor() {
    super('maryJump');
  }

  preload() {
    this.load.image('mary-jump-bg', '/assets/mary-jump/sunset-ruins.png');
    this.load.image('hero', '/assets/mary-jump/hero.png');
    this.load.image('enemy', '/assets/mary-jump/slime.png');
  }

  create() {
    this.model = new MaryJumpGame();
    this.makeTextures();
    this.physics.world.gravity.y = MARY_JUMP_WORLD.gravity;
    this.physics.world.setBounds(0, 0, MARY_JUMP_WORLD.width, MARY_JUMP_WORLD.height);
    this.cameras.main.setBounds(0, 0, MARY_JUMP_WORLD.width, MARY_JUMP_WORLD.height).setBackgroundColor('#10182d');
    this.drawWorld();

    this.platforms = this.physics.add.staticGroup();
    MARY_JUMP_PLATFORMS.forEach((platform) => this.addPlatform(...platform));

    this.player = this.physics.add.sprite(MARY_JUMP_WORLD.spawn.x, MARY_JUMP_WORLD.spawn.y, 'hero')
      .setDisplaySize(42, 57).setCollideWorldBounds(true).setBounce(0.05);
    this.player.body.setSize(44, 82).setOffset(12, 8);
    this.physics.add.collider(this.player, this.platforms);

    this.coins = this.physics.add.staticGroup();
    MARY_JUMP_COINS.forEach(([x, y]) => this.coins.create(x, y, 'coin'));
    this.physics.add.overlap(this.player, this.coins, (_, coin) => {
      coin.destroy();
      this.model.collectCoin();
      soundFX.play('coin');
      this.updateScore();
    });

    this.enemies = this.physics.add.group({ allowGravity: true });
    MARY_JUMP_ENEMIES.forEach((x, index) => {
      const enemy = this.enemies.create(x, 590, 'enemy').setDisplaySize(44, 37).setCollideWorldBounds(true);
      enemy.setVelocityX(index % 2 ? MARY_JUMP_RULES.enemySpeed : -MARY_JUMP_RULES.enemySpeed);
    });
    this.physics.add.collider(this.enemies, this.platforms);
    this.physics.add.collider(this.player, this.enemies, (player, enemy) => this.hitEnemy(player, enemy));

    this.goal = this.physics.add.staticSprite(MARY_JUMP_WORLD.goal.x, MARY_JUMP_WORLD.goal.y, 'flag');
    this.physics.add.overlap(this.player, this.goal, () => this.win());
    this.cursors = this.input.keyboard.createCursorKeys();
    this.keys = this.input.keyboard.addKeys('A,D,W,SPACE');
    this.input.keyboard.on('keydown-ESC', () => this.scene.start('menu'));
    this.input.keyboard.on('keydown-ENTER', () => { if (this.model.finished) this.scene.restart(); });
    mobileControls.bindScene(this, 'maryJump', {
      primary: () => this.tryJump(),
      restart: () => this.scene.restart(),
      home: () => this.scene.start('menu'),
    });
    this.cameras.main.startFollow(this.player, true, 0.09, 0.09, -180, 0);

    this.add.text(24, 18, '玛丽跳跃', { fontFamily: 'Arial Black', fontSize: '25px', color: '#ffffff' }).setScrollFactor(0).setDepth(10);
    this.add.text(26, 50, 'MARY JUMP', { fontFamily: 'Arial', fontSize: '9px', color: '#ffd8a8', letterSpacing: 2 }).setScrollFactor(0).setDepth(10);
    this.scoreText = this.add.text(830, 28, '分数 / SCORE  0000', { fontFamily: 'Consolas', fontSize: '14px', color: '#ffe8cc' }).setOrigin(1, 0).setScrollFactor(0).setDepth(10);
    this.add.text(24, 62, '← → / AD 移动  ·  ↑ / W / SPACE 跳跃  ·  ESC 返回', { fontFamily: 'Arial', fontSize: '11px', color: '#a5b4d4' }).setScrollFactor(0).setDepth(10);
    this.message = this.add.text(430, 310, '', { fontFamily: 'Arial Black', fontSize: '30px', color: '#ffffff', align: 'center', backgroundColor: '#080b14dd', padding: { x: 34, y: 24 } }).setOrigin(0.5).setScrollFactor(0).setDepth(20).setVisible(false);
  }

  makeTextures() {
    if (this.textures.exists('coin')) return;
    const g = this.make.graphics({ add: false });
    g.fillStyle(0xffd43b).fillCircle(10, 10, 9).lineStyle(2, 0xfff3bf).strokeCircle(10, 10, 7).generateTexture('coin', 20, 20); g.clear();
    g.fillStyle(0xe9ecef).fillRect(8, 0, 5, 90).fillStyle(0x51cf66).fillTriangle(13, 4, 13, 36, 48, 20).generateTexture('flag', 52, 90); g.destroy();
  }

  drawWorld() {
    this.add.image(MARY_JUMP_WORLD.width / 2, MARY_JUMP_WORLD.height / 2, 'mary-jump-bg')
      .setDisplaySize(MARY_JUMP_WORLD.width, MARY_JUMP_WORLD.height)
      .setDepth(-20);
    const bg = this.add.graphics();
    bg.fillStyle(0x080d1b, 0.12).fillRect(0, 0, MARY_JUMP_WORLD.width, MARY_JUMP_WORLD.height);
  }

  addPlatform(x, y, width, height) {
    const platform = this.add.rectangle(x, y, width, height, 0x253846).setStrokeStyle(2, 0x78d5b5, 0.7);
    this.add.rectangle(x, y - height / 2 + 4, width - 4, 7, 0x4c9b78, 0.95);
    this.physics.add.existing(platform, true);
    this.platforms.add(platform);
  }

  update() {
    if (this.model.finished) return;
    const left = this.cursors.left.isDown || this.keys.A.isDown || mobileControls.isDown('left');
    const right = this.cursors.right.isDown || this.keys.D.isDown || mobileControls.isDown('right');
    if (left) this.player.setVelocityX(-MARY_JUMP_RULES.moveSpeed).setFlipX(true);
    else if (right) this.player.setVelocityX(MARY_JUMP_RULES.moveSpeed).setFlipX(false);
    else this.player.setVelocityX(0);
    const jump = Phaser.Input.Keyboard.JustDown(this.cursors.up) || Phaser.Input.Keyboard.JustDown(this.keys.W) || Phaser.Input.Keyboard.JustDown(this.keys.SPACE);
    if (jump) this.tryJump();
    this.enemies.children.iterate((enemy) => {
      if (!enemy) return;
      if (enemy.body.blocked.left) enemy.setVelocityX(MARY_JUMP_RULES.enemySpeed);
      if (enemy.body.blocked.right) enemy.setVelocityX(-MARY_JUMP_RULES.enemySpeed);
    });
    if (this.player.y > 665) this.lose();
  }

  tryJump() {
    if (!this.model.finished && this.player?.body?.blocked.down) {
      soundFX.play('jump');
      this.player.setVelocityY(-MARY_JUMP_RULES.jumpSpeed);
    }
  }

  hitEnemy(player, enemy) {
    if (this.model.isStomp({ y: player.y, velocityY: player.body.velocity.y }, { y: enemy.y })) {
      enemy.destroy();
      player.setVelocityY(-MARY_JUMP_RULES.stompBounce);
      this.model.defeatEnemy();
      soundFX.play('stomp');
      this.updateScore();
    } else this.lose();
  }

  lose() {
    if (!this.model.finish('lost')) return;
    soundFX.play('hurt');
    this.physics.pause();
    this.message.setText('再试一次\nTRY AGAIN  ·  按 ENTER 重来').setVisible(true);
  }

  win() {
    if (!this.model.finish('won')) return;
    soundFX.play('win');
    this.physics.pause();
    this.message.setText(`关卡完成！\nSTAGE CLEAR  ·  得分 ${this.model.score}\n按 ENTER 再来一次`).setVisible(true);
  }

  updateScore() {
    this.scoreText.setText(`分数 / SCORE  ${String(this.model.score).padStart(4, '0')}`);
  }
}
