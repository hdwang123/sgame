import Phaser from 'phaser';
import { TankGame } from '../game/tank/TankGame.js';
import { TANK_ARENA, TANK_LEVELS, TANK_RULES } from '../game/tank/config.js';
import { soundFX } from '../audio/SoundFX.js';
import { mobileControls } from '../ui/MobileControls.js';
import { showSceneLoader } from '../ui/SceneLoader.js';

export class TankScene extends Phaser.Scene {
  constructor() {
    super('tank');
  }

  preload() {
    showSceneLoader(this, 0x38d9a9);
    const assets = `${import.meta.env.BASE_URL}assets/tank/`;
    this.load.image('tank-bg', `${assets}battlefield.jpg`);
    this.load.image('playerTank', `${assets}player-tank-cartoon.png`);
    this.load.image('enemyTank', `${assets}enemy-tank-cartoon.png`);
    this.load.image('baseCastle', `${assets}base-castle-cartoon.png`);
  }

  create(data = {}) {
    this.levelIndex = Phaser.Math.Clamp(data.levelIndex ?? 0, 0, TANK_LEVELS.length - 1);
    this.level = TANK_LEVELS[this.levelIndex];
    this.playerSpawn = [this.level.base[0], this.level.base[1] - 70];
    this.stageStartScore = data.score ?? 0;
    this.stageStartLives = data.lives ?? TANK_RULES.initialLives;
    this.phase = 'playing';
    this.model = new TankGame(Math.random, {
      score: this.stageStartScore,
      lives: this.stageStartLives,
    });
    this.makeTextures();

    this.physics.resume();
    this.cameras.main.setBackgroundColor('#0a0d12');
    this.physics.world.setBounds(TANK_ARENA.x, TANK_ARENA.y, TANK_ARENA.width, TANK_ARENA.height);
    this.drawArena();

    this.walls = this.physics.add.staticGroup();
    this.level.walls.forEach((wall) => this.addWall(...wall));
    this.base = this.physics.add.staticSprite(...this.level.base, 'baseCastle')
      .setDisplaySize(64, 64)
      .refreshBody();
    this.player = this.physics.add.sprite(...this.playerSpawn, 'playerTank')
      .setDisplaySize(48, 52)
      .setCollideWorldBounds(true)
      .setData('lastHit', this.time.now)
      .setData('recovering', false);
    this.player.body.setSize(200, 200).setOffset(28, 28);
    this.playerShield = null;
    this.shieldExpiresAt = 0;
    this.activatePlayerShield(this.player);
    this.bullets = this.physics.add.group({ maxSize: 40 });
    this.enemyBullets = this.physics.add.group({ maxSize: 50 });
    this.enemies = this.physics.add.group();
    this.level.enemySpawns.forEach(([x, y], index) => this.spawnEnemy(x, y, index));

    this.physics.add.collider(this.player, this.walls);
    this.physics.add.collider(this.enemies, this.walls);
    this.physics.add.collider(this.enemies, this.enemies, (enemyA, enemyB) => {
      enemyA.setData('turnAt', 0);
      enemyB.setData('turnAt', 0);
    });
    this.physics.add.collider(this.player, this.enemies);
    this.physics.add.collider(this.player, this.base);
    this.physics.add.collider(this.enemies, this.base, (enemy) => enemy.setData('turnAt', 0));
    this.physics.add.collider(this.bullets, this.walls, (bullet) => bullet.destroy());
    this.physics.add.collider(this.enemyBullets, this.walls, (bullet) => bullet.destroy());
    this.physics.add.overlap(this.bullets, this.enemyBullets, (playerBullet, enemyBullet) => {
      this.cancelBullets(playerBullet, enemyBullet);
    });
    this.physics.add.overlap(this.bullets, this.enemies, (bullet, enemy) => this.hitEnemy(bullet, enemy));
    // For Group vs Sprite checks Phaser passes the Sprite first, then the Group child.
    this.physics.add.overlap(this.enemyBullets, this.player, (player, bullet) => this.hitPlayer(player, bullet));
    this.physics.add.overlap(this.enemyBullets, this.base, (_, bullet) => {
      this.hitBase(bullet, '基地失守 / BASE LOST');
    });
    this.physics.add.overlap(this.bullets, this.base, (_, bullet) => {
      this.hitBase(bullet, '误伤基地 / FRIENDLY FIRE');
    });

    this.cursors = this.input.keyboard.createCursorKeys();
    this.keys = this.input.keyboard.addKeys('W,A,S,D,SPACE');
    this.input.keyboard.on('keydown-ESC', () => this.scene.start('menu'));
    this.input.keyboard.on('keydown-ENTER', () => this.handleContinue());
    this.input.keyboard.on('keydown-P', () => this.togglePause());
    this.input.keyboard.on('keydown-R', () => this.restartFromFirstLevel());
    mobileControls.bindScene(this, 'tank', {
      secondary: () => this.restartFromFirstLevel(),
      pause: () => this.togglePause(),
      restart: () => this.restartLevel(),
      home: () => this.scene.start('menu'),
    });

    this.add.text(30, 12, '坦克大战', {
      fontFamily: 'Arial Black', fontSize: '25px', color: '#63e6be',
    });
    this.add.text(32, 42, 'TANK STRIKE', {
      fontFamily: 'Arial', fontSize: '9px', color: '#698c84', letterSpacing: 2,
    });
    this.levelText = this.add.text(430, 18, '', {
      fontFamily: 'Arial Black', fontSize: '15px', color: '#b2f2bb', align: 'center',
    }).setOrigin(0.5, 0);
    this.hud = this.add.text(830, 22, '', {
      fontFamily: 'Consolas', fontSize: '14px', color: '#d3f9d8',
    }).setOrigin(1, 0);
    this.add.text(30, 655, 'WASD / 方向键移动  ·  SPACE 射击  ·  P 暂停  ·  R 从第1关开始  ·  ESC 返回游戏厅', {
      fontFamily: 'Arial', fontSize: '11px', color: '#66728b',
    });
    this.message = this.add.text(430, 340, '', {
      fontFamily: 'Arial Black', fontSize: '28px', color: '#ffffff', align: 'center',
      backgroundColor: '#080b14e8', padding: { x: 35, y: 24 },
    }).setOrigin(0.5).setDepth(20).setVisible(false);
    this.updateHud();
    this.showStageIntro();
  }

  makeTextures() {
    const g = this.make.graphics({ add: false });
    if (!this.textures.exists('bullet')) {
      g.fillStyle(0xfff3bf).fillCircle(4, 4, 4).generateTexture('bullet', 8, 8);
      g.clear();
    }
    if (!this.textures.exists('baseDestroyed')) {
      g.fillStyle(0x20252a).fillRect(7, 43, 50, 14)
        .fillStyle(0x343a40).fillTriangle(5, 48, 19, 27, 31, 49)
        .fillTriangle(24, 49, 39, 20, 48, 49)
        .fillTriangle(39, 49, 53, 31, 60, 49)
        .fillStyle(0xff6b35).fillTriangle(26, 45, 34, 29, 38, 46)
        .fillStyle(0xffd43b).fillTriangle(30, 45, 34, 35, 36, 45)
        .lineStyle(3, 0x111418, 0.9).lineBetween(15, 35, 24, 46)
        .lineBetween(45, 28, 38, 43)
        .generateTexture('baseDestroyed', 64, 64);
    }
    g.destroy();
  }

  drawArena() {
    this.add.image(
      TANK_ARENA.x + TANK_ARENA.width / 2,
      TANK_ARENA.y + TANK_ARENA.height / 2,
      'tank-bg',
    ).setDisplaySize(TANK_ARENA.width, TANK_ARENA.height);
    const overlays = [0x071016, 0x15120a, 0x100818];
    const accents = [0x5ecfb1, 0xffc857, 0xb197fc];
    const grid = this.add.graphics();
    grid.fillStyle(overlays[this.levelIndex], 0.2)
      .fillRect(TANK_ARENA.x, TANK_ARENA.y, TANK_ARENA.width, TANK_ARENA.height);
    grid.lineStyle(1, accents[this.levelIndex], 0.09);
    for (let x = 30; x < 840; x += 32) grid.lineBetween(x, 58, x, 638);
    for (let y = 62; y < 638; y += 32) grid.lineBetween(22, y, 838, y);
    grid.lineStyle(2, accents[this.levelIndex], 0.5)
      .strokeRoundedRect(TANK_ARENA.x, TANK_ARENA.y, TANK_ARENA.width, TANK_ARENA.height, 8);
  }

  addWall(x, y, width, height) {
    const colors = [0x29343a, 0x4a4030, 0x352f4f];
    const trims = [0x8aa69e, 0xc9a45c, 0x9b8ed1];
    const wall = this.add.rectangle(x, y, width, height, colors[this.levelIndex], 0.96)
      .setStrokeStyle(2, trims[this.levelIndex], 0.85);
    this.add.rectangle(x, y - height / 2 + 4, width - 5, 5, trims[this.levelIndex], 0.6);
    this.physics.add.existing(wall, true);
    this.walls.add(wall);
  }

  spawnEnemy(x, y, index) {
    const state = this.model.createEnemyState(index);
    const enemy = this.enemies.create(x, y, 'enemyTank')
      .setDisplaySize(48, 52)
      .setCollideWorldBounds(true)
      .setData('turnAt', state.turnAt)
      .setData('shootAt', state.shootAt);
    enemy.body.setSize(200, 200).setOffset(28, 28);
  }

  update(time) {
    if (this.phase !== 'playing') return;
    if (this.playerShield?.active) this.playerShield.setPosition(this.player.x, this.player.y);
    this.updatePlayer(time);
    this.enemies.children.iterate((enemy) => {
      if (enemy?.active) this.updateEnemy(enemy, time);
    });
    [...this.bullets.getChildren(), ...this.enemyBullets.getChildren()].forEach((bullet) => {
      const halfWidth = bullet.displayWidth / 2;
      const halfHeight = bullet.displayHeight / 2;
      const outsideArena = bullet.x - halfWidth <= TANK_ARENA.x
        || bullet.x + halfWidth >= TANK_ARENA.x + TANK_ARENA.width
        || bullet.y - halfHeight <= TANK_ARENA.y
        || bullet.y + halfHeight >= TANK_ARENA.y + TANK_ARENA.height;
      if (outsideArena) bullet.destroy();
    });
  }

  updatePlayer(time) {
    if (this.player.getData('recovering')) {
      this.player.setVelocity(0);
      return;
    }
    let moving = false;
    if (this.cursors.left.isDown || this.keys.A.isDown || mobileControls.isDown('left')) {
      this.player.setVelocity(-TANK_RULES.playerSpeed, 0).setAngle(-90); moving = true;
    } else if (this.cursors.right.isDown || this.keys.D.isDown || mobileControls.isDown('right')) {
      this.player.setVelocity(TANK_RULES.playerSpeed, 0).setAngle(90); moving = true;
    } else if (this.cursors.up.isDown || this.keys.W.isDown || mobileControls.isDown('up')) {
      this.player.setVelocity(0, -TANK_RULES.playerSpeed).setAngle(0); moving = true;
    } else if (this.cursors.down.isDown || this.keys.S.isDown || mobileControls.isDown('down')) {
      this.player.setVelocity(0, TANK_RULES.playerSpeed).setAngle(180); moving = true;
    }
    if (!moving) this.player.setVelocity(0);
    if ((this.keys.SPACE.isDown || mobileControls.isDown('primary')) && this.model.canPlayerShoot(time)) {
      soundFX.play('shoot');
      this.shoot(this.player, this.bullets, TANK_RULES.playerBulletSpeed);
    }
  }

  updateEnemy(enemy, time) {
    if (this.turnAwayFromObstacle(enemy, time)) return;
    if (time > enemy.getData('turnAt')) {
      const move = this.model.nextEnemyMove(time, this.level.enemyTurnDelay);
      enemy.setData('turnAt', move.turnAt);
      enemy.setVelocity(
        move.direction.x * this.level.enemySpeed,
        move.direction.y * this.level.enemySpeed,
      ).setAngle(move.direction.angle);
    }
    if (time > enemy.getData('shootAt')) {
      this.shoot(enemy, this.enemyBullets, this.level.enemyBulletSpeed);
      enemy.setData('shootAt', this.model.nextEnemyShot(time, this.level.enemyShotDelay));
    }
  }

  turnAwayFromObstacle(enemy, time) {
    const blocked = enemy.body.blocked;
    let direction = null;
    if (blocked.left) direction = { x: 1, y: 0, angle: 90 };
    else if (blocked.right) direction = { x: -1, y: 0, angle: -90 };
    else if (blocked.up) direction = { x: 0, y: 1, angle: 180 };
    else if (blocked.down) direction = { x: 0, y: -1, angle: 0 };
    if (!direction) return false;

    enemy.setVelocity(
      direction.x * this.level.enemySpeed,
      direction.y * this.level.enemySpeed,
    ).setAngle(direction.angle);
    enemy.setData('turnAt', time + this.level.enemyTurnDelay[0]);
    return true;
  }

  shoot(tank, group, speed) {
    const angle = Phaser.Math.DegToRad(tank.angle - 90);
    const muzzleDistance = 30;
    const x = tank.x + Math.cos(angle) * muzzleDistance;
    const y = tank.y + Math.sin(angle) * muzzleDistance;
    const bullet = group.get(x, y, 'bullet');
    if (!bullet) return;
    bullet.setActive(true).setVisible(true);
    bullet.body.enable = true;
    bullet.clearTint();
    bullet.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);
  }

  cancelBullets(playerBullet, enemyBullet) {
    if (this.phase !== 'playing' || !playerBullet.active || !enemyBullet.active) return;
    playerBullet.destroy();
    enemyBullet.destroy();
    soundFX.play('stomp');
  }

  hitEnemy(bullet, enemy) {
    if (this.phase !== 'playing' || !enemy.active) return;
    const { x, y } = enemy;
    bullet.destroy();
    enemy.destroy();
    soundFX.play('explosion');
    this.createTankExplosion(x, y);
    const stageCleared = this.model.hitEnemy(this.enemies.countActive());
    this.updateHud();
    if (stageCleared) this.completeLevel();
  }

  hitPlayer(player, bullet) {
    if (this.phase !== 'playing') return;
    bullet.destroy();
    if (player.getData('recovering')) return;
    if (this.time.now < player.getData('lastHit') + TANK_RULES.hitImmunity) return;
    player.setData('lastHit', this.time.now);
    this.createTankExplosion(player.x, player.y);
    this.model.hitPlayer();
    soundFX.play('hurt');
    this.updateHud();
    this.cameras.main.flash(150, 255, 50, 50, false);
    if (this.model.finished) {
      this.endGame(false, '战车被击毁 / TANK LOST');
      return;
    }
    this.recoverPlayerAfterHit(player);
  }

  recoverPlayerAfterHit(player) {
    player.setData('recovering', true);
    player.setVelocity(0).setVisible(false);
    player.body.enable = false;
    [...this.enemyBullets.getChildren()].forEach((enemyBullet) => enemyBullet.destroy());
    this.time.delayedCall(1000, () => {
      if (this.phase !== 'playing' || !player.active) return;
      player.body.enable = true;
      player.body.reset(...this.playerSpawn);
      player.setVelocity(0).setAngle(0).setAlpha(1).setVisible(true).setData('recovering', false);
      this.activatePlayerShield(player);
    });
  }

  activatePlayerShield(player) {
    player.setData('lastHit', this.time.now);
    this.shieldExpiresAt = this.time.now + TANK_RULES.hitImmunity;
    if (this.playerShield) {
      this.tweens.killTweensOf(this.playerShield);
      this.playerShield.destroy();
    }
    this.playerShield = this.add.circle(player.x, player.y, 30, 0x74c0fc, 0.18)
      .setStrokeStyle(3, 0x9be7ff, 0.9)
      .setDepth(8);
    this.tweens.add({
      targets: this.playerShield,
      scale: 1.12,
      alpha: 0.45,
      duration: 180,
      yoyo: true,
      repeat: -1,
    });
    const expiresAt = this.shieldExpiresAt;
    this.time.delayedCall(TANK_RULES.hitImmunity, () => {
      if (this.shieldExpiresAt !== expiresAt || !this.playerShield) return;
      this.tweens.killTweensOf(this.playerShield);
      this.playerShield.destroy();
      this.playerShield = null;
    });
  }

  hitBase(bullet, reason) {
    bullet.destroy();
    if (this.phase !== 'playing') return;
    this.phase = 'base-hit';
    this.physics.pause();
    soundFX.play('explosion');
    this.base.clearTint().setTexture('baseDestroyed').setDisplaySize(64, 64).refreshBody();
    this.cameras.main.shake(320, 0.012);
    this.createBaseExplosion();
    this.time.delayedCall(420, () => this.endGame(false, reason, false));
  }

  createBaseExplosion() {
    const blast = this.add.circle(this.base.x, this.base.y, 18, 0xffd43b, 0.9).setDepth(15);
    this.tweens.add({
      targets: blast,
      scale: 4,
      alpha: 0,
      duration: 420,
      onComplete: () => blast.destroy(),
    });
    const colors = [0xffd43b, 0xff922b, 0xff4d4f];
    for (let index = 0; index < 14; index += 1) {
      const angle = (Math.PI * 2 * index) / 14;
      const distance = 45 + (index % 3) * 12;
      const spark = this.add.circle(
        this.base.x,
        this.base.y,
        3 + (index % 3),
        colors[index % colors.length],
        1,
      ).setDepth(16);
      this.tweens.add({
        targets: spark,
        x: this.base.x + Math.cos(angle) * distance,
        y: this.base.y + Math.sin(angle) * distance,
        scale: 0.3,
        alpha: 0,
        duration: 360 + (index % 4) * 45,
        onComplete: () => spark.destroy(),
      });
    }
  }

  completeLevel() {
    if (this.phase !== 'playing') return;
    this.model.addStageBonus(this.level.clearBonus);
    this.updateHud();
    this.physics.pause();
    soundFX.play('win');
    const finalLevel = this.levelIndex === TANK_LEVELS.length - 1;
    this.phase = finalLevel ? 'complete' : 'stage-clear';
    if (finalLevel) {
      this.model.finish(true);
      this.message.setText(`全部战区解放！\nALL MISSIONS CLEAR\n总分 ${this.model.score}\n按 ENTER 重新出击`).setVisible(true);
    } else {
      this.message.setText(`战区解放 / STAGE CLEAR\n奖励 +${this.level.clearBonus}\n即将进入下一关…`).setVisible(true);
      this.time.delayedCall(1200, () => {
        if (this.phase === 'stage-clear') {
          this.scene.restart({
            levelIndex: this.levelIndex + 1,
            score: this.model.score,
            lives: this.model.lives,
          });
        }
      });
    }
  }

  endGame(won, reason = won ? '任务完成 / CLEAR' : '基地失守 / BASE LOST', playExplosion = true) {
    if (this.phase !== 'playing' && this.phase !== 'base-hit') return;
    this.phase = won ? 'complete' : 'lost';
    this.model.finish(won);
    soundFX.play(won ? 'win' : 'lose');
    if (!won && playExplosion) soundFX.play('explosion');
    this.physics.pause();
    this.message.setText(`${reason}\n得分 ${this.model.score}\nENTER 重试本关  ·  R 从第1关开始`).setVisible(true);
  }

  handleContinue() {
    if (this.phase === 'stage-clear') {
      this.scene.restart({
        levelIndex: this.levelIndex + 1,
        score: this.model.score,
        lives: this.model.lives,
      });
    } else if (this.phase === 'lost') {
      this.restartLevel();
    } else if (this.phase === 'complete') {
      this.scene.restart({ levelIndex: 0, score: 0, lives: TANK_RULES.initialLives });
    }
  }

  restartLevel() {
    this.scene.restart({
      levelIndex: this.levelIndex,
      score: this.stageStartScore,
      lives: this.stageStartLives,
    });
  }

  togglePause() {
    if (this.phase === 'playing') {
      if (this.player.getData('recovering')) return;
      this.phase = 'paused';
      this.physics.pause();
      this.message.setText('游戏暂停\nPAUSED  ·  按 P 或轻触暂停键继续').setVisible(true);
    } else if (this.phase === 'paused') {
      this.phase = 'playing';
      this.physics.resume();
      this.message.setVisible(false);
    }
  }

  createTankExplosion(x, y) {
    const flash = this.add.circle(x, y, 9, 0xffffff, 1).setDepth(18);
    const fireball = this.add.circle(x, y, 16, 0xff922b, 0.95)
      .setStrokeStyle(5, 0xffd43b, 0.9)
      .setDepth(17);
    const shockwave = this.add.circle(x, y, 18, 0x000000, 0)
      .setStrokeStyle(3, 0xffe066, 0.9)
      .setDepth(16);
    this.tweens.add({
      targets: flash,
      scale: 2.4,
      alpha: 0,
      duration: 150,
      onComplete: () => flash.destroy(),
    });
    this.tweens.add({
      targets: fireball,
      scale: 2.2,
      alpha: 0,
      duration: 320,
      ease: 'Quad.easeOut',
      onComplete: () => fireball.destroy(),
    });
    this.tweens.add({
      targets: shockwave,
      scale: 2.8,
      alpha: 0,
      duration: 360,
      ease: 'Cubic.easeOut',
      onComplete: () => shockwave.destroy(),
    });

    const colors = [0xffd43b, 0xff922b, 0xff4d4f, 0xced4da];
    for (let index = 0; index < 10; index += 1) {
      const angle = (Math.PI * 2 * index) / 10;
      const distance = 28 + (index % 3) * 9;
      const fragment = this.add.rectangle(
        x,
        y,
        4 + (index % 2) * 2,
        7,
        colors[index % colors.length],
      ).setRotation(angle).setDepth(19);
      this.tweens.add({
        targets: fragment,
        x: x + Math.cos(angle) * distance,
        y: y + Math.sin(angle) * distance,
        rotation: angle + Math.PI,
        scale: 0.25,
        alpha: 0,
        duration: 280 + (index % 3) * 55,
        ease: 'Quad.easeOut',
        onComplete: () => fragment.destroy(),
      });
    }
  }

  restartFromFirstLevel() {
    if (this.levelIndex === 0 && this.phase === 'playing') return;
    this.scene.restart({ levelIndex: 0, score: 0, lives: TANK_RULES.initialLives });
  }

  updateHud() {
    this.levelText?.setText(`STAGE ${this.levelIndex + 1}/${TANK_LEVELS.length}  ·  ${this.level.name}`);
    this.hud?.setText(`SCORE ${String(this.model.score).padStart(4, '0')}   LIFE ${this.model.lives}`);
  }

  showStageIntro() {
    const intro = this.add.text(430, 260, `MISSION ${this.levelIndex + 1}\n${this.level.name}\n${this.level.subtitle}`, {
      fontFamily: 'Arial Black', fontSize: '24px', color: '#ffffff', align: 'center',
      backgroundColor: '#080b14dd', padding: { x: 28, y: 18 },
    }).setOrigin(0.5).setDepth(15);
    this.tweens.add({ targets: intro, alpha: 0, delay: 900, duration: 450, onComplete: () => intro.destroy() });
  }
}
