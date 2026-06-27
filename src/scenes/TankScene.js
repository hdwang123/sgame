import Phaser from 'phaser';
import { TankGame } from '../game/tank/TankGame.js';
import { ENEMY_SPAWNS, TANK_ARENA, TANK_RULES, TANK_WALLS } from '../game/tank/config.js';
import { soundFX } from '../audio/SoundFX.js';
import { mobileControls } from '../ui/MobileControls.js';

export class TankScene extends Phaser.Scene {
  constructor() {
    super('tank');
  }

  preload() {
    this.load.image('tank-bg', '/assets/tank/battlefield.png');
    this.load.image('playerTank', '/assets/tank/player-tank.png');
    this.load.image('enemyTank', '/assets/tank/enemy-tank.png');
  }

  create() {
    this.model = new TankGame();
    this.makeTextures();
    this.cameras.main.setBackgroundColor('#0a0d12');
    this.physics.world.setBounds(TANK_ARENA.x, TANK_ARENA.y, TANK_ARENA.width, TANK_ARENA.height);
    this.drawArena();

    this.walls = this.physics.add.staticGroup();
    TANK_WALLS.forEach((wall) => this.addWall(...wall));
    this.base = this.physics.add.staticSprite(430, 610, 'base');
    this.player = this.physics.add.sprite(430, 540, 'playerTank')
      .setDisplaySize(43, 52).setCollideWorldBounds(true).setData('lastHit', 0);
    this.bullets = this.physics.add.group({ maxSize: 40 });
    this.enemyBullets = this.physics.add.group({ maxSize: 40 });
    this.enemies = this.physics.add.group();
    ENEMY_SPAWNS.forEach(([x, y], index) => this.spawnEnemy(x, y, index));

    this.physics.add.collider(this.player, this.walls);
    this.physics.add.collider(this.enemies, this.walls, (enemy) => enemy.setData('turnAt', 0));
    this.physics.add.collider(this.player, this.enemies);
    this.physics.add.collider(this.bullets, this.walls, (bullet) => bullet.destroy());
    this.physics.add.collider(this.enemyBullets, this.walls, (bullet) => bullet.destroy());
    this.physics.add.overlap(this.bullets, this.enemies, (bullet, enemy) => this.hitEnemy(bullet, enemy));
    this.physics.add.overlap(this.enemyBullets, this.player, (player, bullet) => this.hitPlayer(player, bullet));
    this.physics.add.overlap(this.enemyBullets, this.base, (bullet) => {
      bullet.destroy();
      this.endGame(false, '基地失守 / BASE LOST');
    });
    this.physics.add.overlap(this.bullets, this.base, (bullet) => {
      bullet.destroy();
      this.endGame(false, '误伤基地 / FRIENDLY FIRE');
    });

    this.cursors = this.input.keyboard.createCursorKeys();
    this.keys = this.input.keyboard.addKeys('W,A,S,D,SPACE');
    this.input.keyboard.on('keydown-ESC', () => this.scene.start('menu'));
    this.input.keyboard.on('keydown-ENTER', () => { if (this.model.finished) this.scene.restart(); });
    mobileControls.bindScene(this, 'tank', {
      restart: () => this.scene.restart(),
      home: () => this.scene.start('menu'),
    });
    this.add.text(30, 13, '坦克大战', { fontFamily: 'Arial Black', fontSize: '26px', color: '#63e6be' });
    this.add.text(32, 44, 'TANK STRIKE', { fontFamily: 'Arial', fontSize: '9px', color: '#698c84', letterSpacing: 2 });
    this.hud = this.add.text(830, 24, '分数/SCORE 0000   生命/LIFE 3', { fontFamily: 'Consolas', fontSize: '14px', color: '#d3f9d8' }).setOrigin(1, 0);
    this.add.text(30, 655, 'WASD / 方向键移动  ·  SPACE 射击  ·  ESC 返回游戏厅', { fontFamily: 'Arial', fontSize: '11px', color: '#66728b' });
    this.message = this.add.text(430, 340, '', { fontFamily: 'Arial Black', fontSize: '29px', color: '#ffffff', align: 'center', backgroundColor: '#080b14e8', padding: { x: 35, y: 24 } }).setOrigin(0.5).setDepth(20).setVisible(false);
  }

  makeTextures() {
    if (this.textures.exists('bullet')) return;
    const g = this.make.graphics({ add: false });
    g.fillStyle(0xfff3bf).fillCircle(4, 4, 4).generateTexture('bullet', 8, 8); g.clear();
    g.fillStyle(0x74c0fc).fillRoundedRect(0, 0, 46, 38, 5).fillStyle(0xffffff).fillTriangle(23, 7, 30, 20, 16, 20).generateTexture('base', 46, 38); g.destroy();
  }

  drawArena() {
    this.add.image(TANK_ARENA.x + TANK_ARENA.width / 2, TANK_ARENA.y + TANK_ARENA.height / 2, 'tank-bg')
      .setDisplaySize(TANK_ARENA.width, TANK_ARENA.height);
    const grid = this.add.graphics();
    grid.fillStyle(0x071016, 0.12).fillRect(TANK_ARENA.x, TANK_ARENA.y, TANK_ARENA.width, TANK_ARENA.height);
    grid.lineStyle(1, 0x5ecfb1, 0.08);
    for (let x = 30; x < 840; x += 32) grid.lineBetween(x, 58, x, 638);
    for (let y = 62; y < 638; y += 32) grid.lineBetween(22, y, 838, y);
    grid.lineStyle(2, 0x2f9e76, 0.45).strokeRoundedRect(TANK_ARENA.x, TANK_ARENA.y, TANK_ARENA.width, TANK_ARENA.height, 8);
  }

  addWall(x, y, width, height) {
    const wall = this.add.rectangle(x, y, width, height, 0x29343a, 0.94).setStrokeStyle(2, 0x7d8f8c, 0.8);
    this.add.rectangle(x, y - height / 2 + 4, width - 5, 5, 0x8aa69e, 0.55);
    this.physics.add.existing(wall, true);
    this.walls.add(wall);
  }

  spawnEnemy(x, y, index) {
    const state = this.model.createEnemyState(index);
    this.enemies.create(x, y, 'enemyTank')
      .setDisplaySize(43, 52)
      .setCollideWorldBounds(true)
      .setData('turnAt', state.turnAt)
      .setData('shootAt', state.shootAt);
  }

  update(time) {
    if (this.model.finished) return;
    this.updatePlayer(time);
    this.enemies.children.iterate((enemy) => { if (enemy) this.updateEnemy(enemy, time); });
    [...this.bullets.getChildren(), ...this.enemyBullets.getChildren()].forEach((bullet) => {
      if (bullet.x < 10 || bullet.x > 850 || bullet.y < 50 || bullet.y > 645) bullet.destroy();
    });
  }

  updatePlayer(time) {
    let moving = false;
    if (this.cursors.left.isDown || this.keys.A.isDown || mobileControls.isDown('left')) { this.player.setVelocity(-TANK_RULES.playerSpeed, 0).setAngle(-90); moving = true; }
    else if (this.cursors.right.isDown || this.keys.D.isDown || mobileControls.isDown('right')) { this.player.setVelocity(TANK_RULES.playerSpeed, 0).setAngle(90); moving = true; }
    else if (this.cursors.up.isDown || this.keys.W.isDown || mobileControls.isDown('up')) { this.player.setVelocity(0, -TANK_RULES.playerSpeed).setAngle(0); moving = true; }
    else if (this.cursors.down.isDown || this.keys.S.isDown || mobileControls.isDown('down')) { this.player.setVelocity(0, TANK_RULES.playerSpeed).setAngle(180); moving = true; }
    if (!moving) this.player.setVelocity(0);
    if ((this.keys.SPACE.isDown || mobileControls.isDown('primary')) && this.model.canPlayerShoot(time)) {
      soundFX.play('shoot');
      this.shoot(this.player, this.bullets, TANK_RULES.playerBulletSpeed);
    }
  }

  updateEnemy(enemy, time) {
    if (time > enemy.getData('turnAt')) {
      const move = this.model.nextEnemyMove(time);
      enemy.setData('turnAt', move.turnAt);
      enemy.setVelocity(move.direction.x * TANK_RULES.enemySpeed, move.direction.y * TANK_RULES.enemySpeed).setAngle(move.direction.angle);
    }
    if (time > enemy.getData('shootAt')) {
      this.shoot(enemy, this.enemyBullets, TANK_RULES.enemyBulletSpeed);
      enemy.setData('shootAt', this.model.nextEnemyShot(time));
    }
  }

  shoot(tank, group, speed) {
    const angle = Phaser.Math.DegToRad(tank.angle - 90);
    const bullet = group.get(tank.x, tank.y, 'bullet');
    if (!bullet) return;
    bullet.setActive(true).setVisible(true);
    bullet.body.enable = true;
    bullet.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);
  }

  hitEnemy(bullet, enemy) {
    bullet.destroy();
    enemy.destroy();
    soundFX.play('explosion');
    this.model.hitEnemy(this.enemies.countActive());
    this.updateHud();
    if (this.model.finished) this.endGame(true);
  }

  hitPlayer(player, bullet) {
    bullet.destroy();
    if (this.time.now < player.getData('lastHit') + TANK_RULES.hitImmunity) return;
    player.setData('lastHit', this.time.now);
    this.model.hitPlayer();
    soundFX.play('hurt');
    this.updateHud();
    this.cameras.main.flash(150, 255, 50, 50, false);
    if (this.model.finished) this.endGame(false);
  }

  updateHud() {
    this.hud.setText(`分数/SCORE ${String(this.model.score).padStart(4, '0')}   生命/LIFE ${this.model.lives}`);
  }

  endGame(won, reason = won ? '任务完成 / CLEAR' : '基地失守 / BASE LOST') {
    this.model.finish(won);
    soundFX.play(won ? 'win' : 'lose');
    if (!won) soundFX.play('explosion');
    this.physics.pause();
    this.message.setText(`${reason}\n得分 ${this.model.score}\n按 ENTER 重新开始`).setVisible(true);
  }
}
