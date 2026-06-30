import Phaser from 'phaser';
import { TankGame } from '../game/tank/TankGame.js';
import { TANK_ARENA, TANK_LEVELS, TANK_RULES } from '../game/tank/config.js';
import { soundFX } from '../audio/SoundFX.js';
import { mobileControls } from '../ui/MobileControls.js';
import { getLanguage, t } from '../i18n.js';

const POWER_UPS = [
  { key: 'freeze', labels: ['停', 'F'], color: 0x74c0fc, nameKey: 'tank.freeze' },
  { key: 'bomb', labels: ['爆', 'B'], color: 0xff922b, nameKey: 'tank.bomb' },
  { key: 'shield', labels: ['盾', 'S'], color: 0xb197fc, nameKey: 'tank.shield' },
  { key: 'life', labels: ['命', '+'], color: 0x69db7c, nameKey: 'tank.extraLife' },
  { key: 'fortify', labels: ['墙', 'W'], color: 0xe9ecef, nameKey: 'tank.fortify' },
];

const POWER_DURATION = 30000;

export class TankScene extends Phaser.Scene {
  constructor() {
    super('tank');
  }

  init() {
    this.scale.resize(860, 680);
  }

  preload() {
  }

  create(data = {}) {
    this.levelIndex = Phaser.Math.Clamp(data.levelIndex ?? 0, 0, TANK_LEVELS.length - 1);
    this.level = TANK_LEVELS[this.levelIndex];
    this.playerSpawn = [...this.level.playerSpawn];
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
    this.breakableWalls = this.physics.add.staticGroup();
    this.level.breakableWalls.forEach((wall) => this.addBreakableWall(...wall));
    this.base = this.physics.add.staticSprite(...this.level.base, 'retroBase')
      .setDisplaySize(46, 46)
      .refreshBody();
    this.player = this.physics.add.sprite(...this.playerSpawn, 'retroPlayerTank')
      .setDisplaySize(36, 36)
      .setCollideWorldBounds(true)
      .setData('lastHit', this.time.now)
      .setData('recovering', false);
    this.player.body.setSize(28, 28).setOffset(2, 2);
    this.playerShield = null;
    this.shieldExpiresAt = 0;
    this.playerInvincibleUntil = 0;
    this.enemiesFrozenUntil = 0;
    this.baseProtectionExpiresAt = 0;
    this.activatePlayerShield(this.player);
    this.bullets = this.physics.add.group({ maxSize: 40 });
    this.enemyBullets = this.physics.add.group({ maxSize: 50 });
    this.enemies = this.physics.add.group();
    this.powerUps = this.physics.add.group({ allowGravity: false, immovable: true });
    this.baseSteelWalls = this.physics.add.staticGroup();
    this.level.enemySpawns.forEach(([x, y], index) => this.spawnEnemy(x, y, index));

    this.physics.add.collider(this.player, this.walls);
    this.physics.add.collider(this.enemies, this.walls);
    this.physics.add.collider(this.player, this.breakableWalls);
    this.physics.add.collider(this.enemies, this.breakableWalls, (enemy) => enemy.setData('turnAt', 0));
    this.physics.add.collider(this.enemies, this.enemies, (enemyA, enemyB) => {
      enemyA.setData('turnAt', 0);
      enemyB.setData('turnAt', 0);
    });
    this.physics.add.collider(this.player, this.enemies);
    this.physics.add.collider(this.player, this.base);
    this.physics.add.collider(this.enemies, this.base, (enemy) => enemy.setData('turnAt', 0));
    this.physics.add.collider(this.player, this.baseSteelWalls);
    this.physics.add.collider(this.enemies, this.baseSteelWalls, (enemy) => enemy.setData('turnAt', 0));
    this.physics.add.collider(this.bullets, this.walls, (bullet) => bullet.destroy());
    this.physics.add.collider(this.enemyBullets, this.walls, (bullet) => bullet.destroy());
    this.physics.add.collider(this.bullets, this.breakableWalls, (bullet, wall) => {
      this.hitBreakableWall(bullet, wall);
    });
    this.physics.add.collider(this.enemyBullets, this.breakableWalls, (bullet, wall) => {
      this.hitBreakableWall(bullet, wall);
    });
    this.physics.add.collider(this.bullets, this.baseSteelWalls, (bullet) => bullet.destroy());
    this.physics.add.collider(this.enemyBullets, this.baseSteelWalls, (bullet) => bullet.destroy());
    this.physics.add.overlap(this.bullets, this.enemyBullets, (playerBullet, enemyBullet) => {
      this.cancelBullets(playerBullet, enemyBullet);
    });
    this.physics.add.overlap(this.bullets, this.enemies, (bullet, enemy) => this.hitEnemy(bullet, enemy));
    this.physics.add.overlap(this.player, this.powerUps, (_, powerUp) => this.collectPowerUp(powerUp));
    // For Group vs Sprite checks Phaser passes the Sprite first, then the Group child.
    this.physics.add.overlap(this.enemyBullets, this.player, (player, bullet) => this.hitPlayer(player, bullet));
    this.physics.add.overlap(this.enemyBullets, this.base, (_, bullet) => {
      this.hitBase(bullet, 'tank.baseLost');
    });
    this.physics.add.overlap(this.bullets, this.base, (_, bullet) => {
      this.hitBase(bullet, 'tank.friendlyFire');
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

    this.add.text(30, 12, t('game.tank'), {
      fontFamily: 'Arial Black', fontSize: '25px', color: '#63e6be',
    });
    this.add.text(32, 42, t('game.tank.sub'), {
      fontFamily: 'Arial', fontSize: '9px', color: '#698c84', letterSpacing: 2,
    });
    this.levelText = this.add.text(430, 18, '', {
      fontFamily: 'Arial Black', fontSize: '15px', color: '#b2f2bb', align: 'center',
    }).setOrigin(0.5, 0);
    this.hud = this.add.text(830, 22, '', {
      fontFamily: 'Consolas', fontSize: '14px', color: '#d3f9d8',
    }).setOrigin(1, 0);
    this.powerStatusText = this.add.text(830, 43, '', {
      fontFamily: 'Consolas', fontSize: '11px', color: '#ffe8a3',
    }).setOrigin(1, 0).setDepth(10);
    this.add.text(30, 655, t('tank.controls'), {
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
    if (!this.textures.exists('retroPlayerTank')) {
      this.drawPixelTank(g, 0xffd43b, 0xff922b).generateTexture('retroPlayerTank', 32, 32);
      g.clear();
    }
    if (!this.textures.exists('retroEnemyTank')) {
      this.drawPixelTank(g, 0xe9ecef, 0x868e96).generateTexture('retroEnemyTank', 32, 32);
      g.clear();
    }
    if (!this.textures.exists('retroBonusTank')) {
      this.drawPixelTank(g, 0xff4d4f, 0xffd43b).generateTexture('retroBonusTank', 32, 32);
      g.clear();
    }
    if (!this.textures.exists('retroBase')) {
      g.fillStyle(0x343a40).fillRect(2, 2, 28, 28)
        .fillStyle(0xced4da).fillRect(5, 5, 22, 22)
        .fillStyle(0x212529).fillRect(9, 8, 14, 16)
        .fillStyle(0xffd43b).fillTriangle(16, 7, 8, 22, 24, 22)
        .fillStyle(0x5c3d1e).fillRect(13, 14, 6, 13)
        .generateTexture('retroBase', 32, 32);
      g.clear();
    }
    if (!this.textures.exists('bullet')) {
      g.fillStyle(0xffffff).fillRect(1, 1, 6, 6)
        .fillStyle(0xffd43b).fillRect(2, 0, 4, 8)
        .generateTexture('bullet', 8, 8);
      g.clear();
    }
    if (!this.textures.exists('baseDestroyed')) {
      g.fillStyle(0x343a40).fillRect(2, 21, 28, 9)
        .fillStyle(0x868e96).fillRect(5, 16, 7, 8)
        .fillRect(20, 18, 8, 7)
        .fillStyle(0xff6b35).fillTriangle(11, 24, 16, 8, 21, 24)
        .fillStyle(0xffd43b).fillTriangle(14, 23, 17, 13, 19, 23)
        .generateTexture('baseDestroyed', 32, 32);
      g.clear();
    }
    if (!this.textures.exists('powerUp')) {
      g.fillStyle(0x212529).fillRect(0, 0, 28, 28)
        .fillStyle(0xffffff).fillRect(2, 2, 24, 24)
        .fillStyle(0x212529).fillRect(5, 5, 18, 18)
        .generateTexture('powerUp', 28, 28);
    }
    g.destroy();
    ['retroPlayerTank', 'retroEnemyTank', 'retroBonusTank', 'retroBase', 'baseDestroyed', 'powerUp']
      .forEach((key) => this.textures.get(key).setFilter(Phaser.Textures.FilterMode.NEAREST));
  }

  drawPixelTank(graphics, bodyColor, accentColor) {
    return graphics.fillStyle(0x212529).fillRect(2, 3, 7, 26)
      .fillRect(23, 3, 7, 26)
      .fillStyle(0x495057).fillRect(3, 5, 4, 5)
      .fillRect(3, 13, 4, 5).fillRect(3, 21, 4, 5)
      .fillRect(25, 5, 4, 5).fillRect(25, 13, 4, 5).fillRect(25, 21, 4, 5)
      .fillStyle(bodyColor).fillRect(9, 7, 14, 20)
      .fillStyle(accentColor).fillRect(12, 10, 8, 10)
      .fillStyle(0x111111).fillRect(14, 12, 4, 6)
      .fillStyle(bodyColor).fillRect(14, 0, 4, 13)
      .fillStyle(0xffffff, 0.45).fillRect(10, 8, 3, 11);
  }

  drawArena() {
    const grid = this.add.graphics();
    grid.fillStyle(0x050505, 1)
      .fillRect(TANK_ARENA.x, TANK_ARENA.y, TANK_ARENA.width, TANK_ARENA.height);
    for (let y = TANK_ARENA.y + 13; y < TANK_ARENA.y + TANK_ARENA.height; y += 26) {
      for (let x = TANK_ARENA.x + 13; x < TANK_ARENA.x + TANK_ARENA.width; x += 26) {
        grid.fillStyle((x + y) % 52 ? 0x101010 : 0x151515, 1).fillRect(x - 1, y - 1, 2, 2);
      }
    }
    grid.lineStyle(3, 0x6c757d, 0.75)
      .strokeRect(TANK_ARENA.x, TANK_ARENA.y, TANK_ARENA.width, TANK_ARENA.height);
  }

  addWall(x, y, width, height) {
    const wall = this.add.rectangle(x, y, width, height, 0xadb5bd, 1)
      .setStrokeStyle(2, 0xf1f3f5, 0.9);
    this.add.rectangle(x, y, Math.max(2, width - 8), Math.max(2, height - 8), 0x495057, 1);
    const rivets = this.add.graphics().setDepth(3);
    rivets.fillStyle(0xe9ecef, 0.9);
    for (let tileX = x - width / 2 + 7; tileX < x + width / 2; tileX += 18) {
      for (let tileY = y - height / 2 + 7; tileY < y + height / 2; tileY += 18) {
        rivets.fillRect(tileX, tileY, 2, 2);
      }
    }
    this.physics.add.existing(wall, true);
    this.walls.add(wall);
  }

  addBreakableWall(x, y, width, height) {
    const columns = Math.max(1, Math.ceil(width / 20));
    const rows = Math.max(1, Math.ceil(height / 20));
    const tileWidth = width / columns;
    const tileHeight = height / rows;
    const left = x - width / 2;
    const top = y - height / 2;

    for (let row = 0; row < rows; row += 1) {
      for (let column = 0; column < columns; column += 1) {
        const tileX = left + tileWidth * (column + 0.5);
        const tileY = top + tileHeight * (row + 0.5);
        const color = (row + column) % 2 ? 0xa94727 : 0x92391f;
        const wall = this.add.rectangle(tileX, tileY, tileWidth, tileHeight, color, 1)
          .setStrokeStyle(1, 0x3b1d14, 1)
          .setDepth(4);
        const highlight = this.add.rectangle(
          tileX,
          tileY - tileHeight * 0.24,
          Math.max(2, tileWidth - 5),
          Math.max(2, tileHeight * 0.18),
          0xf08c46,
          0.72,
        ).setDepth(5);
        wall.setData('decoration', highlight);
        this.physics.add.existing(wall, true);
        this.breakableWalls.add(wall);
      }
    }
  }

  spawnEnemy(x, y, index) {
    const state = this.model.createEnemyState(index);
    const isBonus = (index + this.levelIndex) % 4 === 1;
    const enemy = this.enemies.create(x, y, isBonus ? 'retroBonusTank' : 'retroEnemyTank')
      .setDisplaySize(36, 36)
      .setCollideWorldBounds(true)
      .setData('turnAt', state.turnAt)
      .setData('shootAt', state.shootAt)
      .setData('isBonus', isBonus);
    enemy.body.setSize(28, 28).setOffset(2, 2);
  }

  update(time) {
    if (this.phase !== 'playing') return;
    if (this.playerShield?.active) this.playerShield.setPosition(this.player.x, this.player.y);
    this.updatePlayer(time);
    this.enemies.children.iterate((enemy) => {
      if (!enemy?.active) return;
      if (time < this.enemiesFrozenUntil) enemy.setVelocity(0);
      else this.updateEnemy(enemy, time);
    });
    this.updatePowerStatus(time);
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
    const axis = mobileControls.axis();
    const analogActive = Math.hypot(axis.x, axis.y) >= 0.16;
    const horizontalDominant = Math.abs(axis.x) >= Math.abs(axis.y);
    const analogSpeed = TANK_RULES.playerSpeed * Math.max(0.45, Math.min(1, Math.hypot(axis.x, axis.y)));
    if (this.cursors.left.isDown || this.keys.A.isDown) {
      this.player.setVelocity(-TANK_RULES.playerSpeed, 0).setAngle(-90); moving = true;
    } else if (this.cursors.right.isDown || this.keys.D.isDown) {
      this.player.setVelocity(TANK_RULES.playerSpeed, 0).setAngle(90); moving = true;
    } else if (this.cursors.up.isDown || this.keys.W.isDown) {
      this.player.setVelocity(0, -TANK_RULES.playerSpeed).setAngle(0); moving = true;
    } else if (this.cursors.down.isDown || this.keys.S.isDown) {
      this.player.setVelocity(0, TANK_RULES.playerSpeed).setAngle(180); moving = true;
    } else if (analogActive && horizontalDominant && axis.x < 0) {
      this.player.setVelocity(-analogSpeed, 0).setAngle(-90); moving = true;
    } else if (analogActive && horizontalDominant && axis.x > 0) {
      this.player.setVelocity(analogSpeed, 0).setAngle(90); moving = true;
    } else if (analogActive && axis.y < 0) {
      this.player.setVelocity(0, -analogSpeed).setAngle(0); moving = true;
    } else if (analogActive && axis.y > 0) {
      this.player.setVelocity(0, analogSpeed).setAngle(180); moving = true;
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
    // Keep the projectile close to the 32px retro tank. The old 30px offset
    // could place a shot beyond a thin brick when the tank was touching it.
    const muzzleDistance = 18;
    const x = tank.x + Math.cos(angle) * muzzleDistance;
    const y = tank.y + Math.sin(angle) * muzzleDistance;
    const bullet = group.get(x, y, 'bullet');
    if (!bullet) return;
    bullet.setActive(true).setVisible(true);
    bullet.body.enable = true;
    bullet.body.reset(x, y);
    bullet.body.setSize(6, 6).setOffset(1, 1);
    bullet.clearTint();
    bullet.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);
  }

  cancelBullets(playerBullet, enemyBullet) {
    if (this.phase !== 'playing' || !playerBullet.active || !enemyBullet.active) return;
    playerBullet.destroy();
    enemyBullet.destroy();
    soundFX.play('stomp');
  }

  hitBreakableWall(bullet, wall) {
    if (this.phase !== 'playing' || !bullet.active || !wall.active) return;
    const { x, y } = wall;
    bullet.destroy();
    wall.getData('decoration')?.destroy();
    wall.destroy();
    soundFX.play('explosion');
    const colors = [0xffa06b, 0x9c4f32, 0x54291f];
    for (let index = 0; index < 7; index += 1) {
      const angle = (Math.PI * 2 * index) / 7;
      const fragment = this.add.rectangle(x, y, 7, 5, colors[index % colors.length])
        .setRotation(angle)
        .setDepth(12);
      this.tweens.add({
        targets: fragment,
        x: x + Math.cos(angle) * (22 + (index % 2) * 8),
        y: y + Math.sin(angle) * (22 + (index % 2) * 8),
        rotation: angle + Math.PI,
        alpha: 0,
        scale: 0.35,
        duration: 260 + (index % 3) * 45,
        onComplete: () => fragment.destroy(),
      });
    }
  }

  hitEnemy(bullet, enemy) {
    if (this.phase !== 'playing' || !enemy.active) return;
    const { x, y } = enemy;
    const dropsPowerUp = enemy.getData('isBonus');
    bullet.destroy();
    enemy.destroy();
    soundFX.play('explosion');
    this.createTankExplosion(x, y);
    const stageCleared = this.model.hitEnemy(this.enemies.countActive());
    this.updateHud();
    const droppedPowerUp = dropsPowerUp ? this.dropPowerUp(x, y) : null;
    if (stageCleared && droppedPowerUp) this.collectPowerUp(droppedPowerUp);
    if (stageCleared) this.completeLevel();
  }

  dropPowerUp(x, y) {
    const definition = Phaser.Utils.Array.GetRandom(POWER_UPS);
    const powerUp = this.powerUps.create(x, y, 'powerUp')
      .setDisplaySize(30, 30)
      .setTint(definition.color)
      .setDepth(13)
      .setData('type', definition.key)
      .setData('nameKey', definition.nameKey);
    powerUp.body.setSize(28, 28).setOffset(0, 0);
    const label = this.add.text(x, y, definition.labels[getLanguage() === 'zh' ? 0 : 1], {
      fontFamily: 'Arial Black', fontSize: '15px', color: '#ffffff',
    }).setOrigin(0.5).setDepth(14);
    powerUp.setData('label', label);
    this.tweens.add({ targets: [powerUp, label], alpha: 0.45, duration: 260, yoyo: true, repeat: -1 });
    this.time.delayedCall(12000, () => {
      if (!powerUp.active) return;
      this.tweens.killTweensOf(label);
      label.destroy();
      powerUp.destroy();
    });
    return powerUp;
  }

  collectPowerUp(powerUp) {
    if (!powerUp?.active || this.phase !== 'playing') return;
    const type = powerUp.getData('type');
    const name = t(powerUp.getData('nameKey'));
    const label = powerUp.getData('label');
    this.tweens.killTweensOf(powerUp);
    this.tweens.killTweensOf(label);
    label?.destroy();
    powerUp.destroy();
    soundFX.play('coin');
    this.showPowerNotice(name);

    if (type === 'freeze') this.freezeEnemies();
    else if (type === 'bomb') this.destroyAllEnemies();
    else if (type === 'shield') this.activatePlayerShield(this.player, POWER_DURATION);
    else if (type === 'life') this.model.addLife();
    else if (type === 'fortify') this.activateBaseProtection();
    this.updateHud();
  }

  freezeEnemies() {
    this.enemiesFrozenUntil = this.time.now + POWER_DURATION;
    this.enemies.children.iterate((enemy) => {
      if (!enemy?.active) return;
      enemy.setVelocity(0)
        .setData('turnAt', this.enemiesFrozenUntil)
        .setData('shootAt', this.enemiesFrozenUntil + 450);
    });
  }

  destroyAllEnemies() {
    const enemies = this.enemies.getChildren().filter((enemy) => enemy.active);
    enemies.forEach((enemy, index) => {
      this.createTankExplosion(enemy.x, enemy.y);
      enemy.destroy();
      this.model.hitEnemy(enemies.length - index - 1);
    });
    this.updateHud();
    if (enemies.length) this.completeLevel();
  }

  activateBaseProtection() {
    this.baseProtectionExpiresAt = this.time.now + POWER_DURATION;
    this.baseSteelWalls.clear(true, true);
    [
      [382, 594, 22, 78], [478, 594, 22, 78], [430, 552, 118, 22],
    ].forEach(([x, y, width, height]) => {
      const wall = this.add.rectangle(x, y, width, height, 0xcfd4da, 1)
        .setStrokeStyle(2, 0xffffff, 1)
        .setDepth(11);
      this.physics.add.existing(wall, true);
      this.baseSteelWalls.add(wall);
    });
    const expiresAt = this.baseProtectionExpiresAt;
    this.time.delayedCall(POWER_DURATION, () => {
      if (this.baseProtectionExpiresAt !== expiresAt) return;
      this.baseSteelWalls.clear(true, true);
    });
  }

  showPowerNotice(message) {
    this.powerNotice?.destroy();
    const notice = this.add.text(430, 92, `${t('tank.power')}  ·  ${message}`, {
      fontFamily: 'Consolas', fontSize: '16px', color: '#fff3bf',
      backgroundColor: '#000000dd', padding: { x: 12, y: 7 },
    }).setOrigin(0.5).setDepth(30);
    this.powerNotice = notice;
    this.tweens.add({
      targets: notice, alpha: 0, y: 78, delay: 850, duration: 350,
      onComplete: () => {
        notice.destroy();
        if (this.powerNotice === notice) this.powerNotice = null;
      },
    });
  }

  hitPlayer(player, bullet) {
    if (this.phase !== 'playing') return;
    bullet.destroy();
    if (player.getData('recovering')) return;
    if (this.time.now < this.playerInvincibleUntil) return;
    if (this.time.now < player.getData('lastHit') + TANK_RULES.hitImmunity) return;
    player.setData('lastHit', this.time.now);
    this.createTankExplosion(player.x, player.y);
    this.model.hitPlayer();
    soundFX.play('hurt');
    this.updateHud();
    this.cameras.main.flash(150, 255, 50, 50, false);
    if (this.model.finished) {
      this.endGame(false, 'tank.tankLost');
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

  activatePlayerShield(player, duration = TANK_RULES.hitImmunity) {
    player.setData('lastHit', this.time.now);
    this.playerInvincibleUntil = Math.max(this.playerInvincibleUntil, this.time.now + duration);
    this.shieldExpiresAt = this.playerInvincibleUntil;
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
    this.time.delayedCall(this.shieldExpiresAt - this.time.now, () => {
      if (this.shieldExpiresAt !== expiresAt || !this.playerShield) return;
      this.tweens.killTweensOf(this.playerShield);
      this.playerShield.destroy();
      this.playerShield = null;
    });
  }

  hitBase(bullet, reason) {
    bullet.destroy();
    if (this.phase !== 'playing') return;
    if (this.time.now < this.baseProtectionExpiresAt) {
      soundFX.play('stomp');
      this.cameras.main.flash(70, 255, 255, 255, false);
      return;
    }
    this.phase = 'base-hit';
    this.physics.pause();
    soundFX.play('explosion');
    this.base.clearTint().setTexture('baseDestroyed').setDisplaySize(46, 46).refreshBody();
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
      this.message.setText(`${t('tank.allClear')}\n${t('tank.total', { score: this.model.score })}`).setVisible(true);
    } else {
      this.message.setText(`${t('tank.stageClear')}\n${t('tank.next', { bonus: this.level.clearBonus })}`).setVisible(true);
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

  endGame(won, reasonKey = won ? 'tank.stageClear' : 'tank.baseLost', playExplosion = true) {
    if (this.phase !== 'playing' && this.phase !== 'base-hit') return;
    this.phase = won ? 'complete' : 'lost';
    this.model.finish(won);
    soundFX.play(won ? 'win' : 'lose');
    if (!won && playExplosion) soundFX.play('explosion');
    this.physics.pause();
    this.message.setText(`${t(reasonKey)}\n${t('tank.retry', { score: this.model.score })}`).setVisible(true);
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
      this.message.setText(`${t('tank.paused')}\n${t('tank.resume')}`).setVisible(true);
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
    const levelName = getLanguage() === 'zh' ? this.level.name : this.level.subtitle;
    this.levelText?.setText(`${t('tank.stage')} ${this.levelIndex + 1}/${TANK_LEVELS.length}  ·  ${levelName}`);
    this.hud?.setText(`${t('tank.score')} ${String(this.model.score).padStart(4, '0')}   ${t('tank.life')} ${this.model.lives}`);
  }

  updatePowerStatus(time = this.time.now) {
    if (!this.powerStatusText) return;
    const statuses = [];
    const freezeSeconds = Math.ceil((this.enemiesFrozenUntil - time) / 1000);
    const shieldSeconds = Math.ceil((this.playerInvincibleUntil - time) / 1000);
    const baseSeconds = Math.ceil((this.baseProtectionExpiresAt - time) / 1000);
    if (freezeSeconds > 0) statuses.push(`${t('tank.freezeShort')} ${freezeSeconds}s`);
    if (shieldSeconds > 1) statuses.push(`${t('tank.shieldShort')} ${shieldSeconds}s`);
    if (baseSeconds > 0) statuses.push(`${t('tank.baseShort')} ${baseSeconds}s`);
    this.powerStatusText.setText(statuses.join('   '));
  }

  showStageIntro() {
    const levelName = getLanguage() === 'zh' ? this.level.name : this.level.subtitle;
    const intro = this.add.text(430, 260, `${t('tank.mission')} ${this.levelIndex + 1}\n${levelName}`, {
      fontFamily: 'Arial Black', fontSize: '24px', color: '#ffffff', align: 'center',
      backgroundColor: '#080b14dd', padding: { x: 28, y: 18 },
    }).setOrigin(0.5).setDepth(15);
    this.tweens.add({ targets: intro, alpha: 0, delay: 900, duration: 450, onComplete: () => intro.destroy() });
  }
}
