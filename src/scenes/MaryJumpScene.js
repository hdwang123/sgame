import Phaser from 'phaser';
import { MaryJumpGame } from '../game/mary-jump/MaryJumpGame.js';
import { MARY_JUMP_LEVELS, MARY_JUMP_RULES } from '../game/mary-jump/config.js';
import { soundFX } from '../audio/SoundFX.js';
import { mobileControls } from '../ui/MobileControls.js';
import { showSceneLoader } from '../ui/SceneLoader.js';
import { getLanguage, t } from '../i18n.js';

export class MaryJumpScene extends Phaser.Scene {
  constructor() {
    super('maryJump');
  }

  init() {
    this.scale.resize(860, 680);
  }

  preload() {
    const assets = `${import.meta.env.BASE_URL}assets/mary-jump/`;
    const images = [
      ['mary-jump-bg', `${assets}sunset-ruins.jpg`],
      ['hero', `${assets}hero.png`],
      ['enemy', `${assets}slime.png`],
    ];
    const missingImages = images.filter(([key]) => !this.textures.exists(key));
    if (missingImages.length === 0) return;
    showSceneLoader(this, 0xff922b);
    missingImages.forEach(([key, url]) => this.load.image(key, url));
  }

  create(data = {}) {
    // Scene instances are reused after restart. These objects were destroyed
    // during shutdown, but their properties still point at the old canvases.
    this.levelText = null;
    this.scoreText = null;
    this.message = null;
    this.powerNotice = null;
    this.levelIndex = Phaser.Math.Clamp(data.levelIndex ?? 0, 0, MARY_JUMP_LEVELS.length - 1);
    this.level = MARY_JUMP_LEVELS[this.levelIndex];
    this.levelStartScore = data.score ?? 0;
    this.levelStartPower = data.power ?? 'small';
    this.playerPower = this.levelStartPower;
    this.playerInvincibleUntil = 0;
    this.lastFireAt = Number.NEGATIVE_INFINITY;
    this.restartRequested = false;
    this.phase = 'playing';
    this.jumpQueuedUntil = 0;
    this.queuedJumpSpeed = MARY_JUMP_RULES.jumpSpeed;
    this.lastMobileJumpPressAt = Number.NEGATIVE_INFINITY;
    this.mobileBigJumpArmed = false;
    this.mobileBigJumpAt = Number.POSITIVE_INFINITY;
    this.pendingPlayerPower = null;
    this.powerResizeScheduled = false;
    this.lastGroundedAt = Number.NEGATIVE_INFINITY;
    this.model = new MaryJumpGame();
    this.model.score = this.levelStartScore;
    this.makeTextures();

    this.physics.resume();
    this.physics.world.gravity.y = this.level.gravity;
    this.physics.world.setBounds(0, 0, this.level.width, this.level.height);
    this.physics.world.checkCollision.down = false;
    this.cameras.main
      .stopFollow()
      .setScroll(0, 0)
      .setBounds(0, 0, this.level.width, this.level.height)
      .setBackgroundColor('#10182d');
    this.drawWorld();

    this.platforms = this.physics.add.staticGroup();
    this.level.platforms.forEach((platform) => this.addPlatform(...platform));

    this.player = this.physics.add.sprite(this.level.spawn.x, this.level.spawn.y, 'hero')
      .setDisplaySize(42, 57)
      .setCollideWorldBounds(true)
      .setBounce(0.05);
    this.player.body.setSize(44, 82).setOffset(12, 8);
    this.applyPlayerPower(this.playerPower);
    this.physics.add.collider(this.player, this.platforms);

    this.coins = this.physics.add.staticGroup();
    this.level.coins.forEach(([x, y]) => this.coins.create(x, y, 'coin'));
    this.physics.add.overlap(this.player, this.coins, (_, coin) => {
      coin.destroy();
      this.model.collectCoin();
      soundFX.play('coin');
      this.updateHud();
    });

    this.powerUps = this.physics.add.staticGroup();
    this.level.powerUps.forEach(({ type, x, y }) => {
      this.powerUps.create(x, y, type === 'flower' ? 'maryFlower' : 'maryMushroom')
        .setData('type', type);
    });
    this.physics.add.overlap(this.player, this.powerUps, (_, powerUp) => this.collectPowerUp(powerUp));

    this.enemies = this.physics.add.group({ allowGravity: true });
    this.level.enemies.forEach((config, index) => {
      const direction = index % 2 ? 1 : -1;
      this.enemies.create(config.x, config.y, 'enemy')
        .setDisplaySize(44, 37)
        .setCollideWorldBounds(true)
        .setVelocityX(direction * this.level.enemySpeed)
        .setData('direction', direction)
        .setData('minX', config.minX)
        .setData('maxX', config.maxX);
    });
    this.physics.add.collider(this.enemies, this.platforms);
    this.physics.add.overlap(this.player, this.enemies, (player, enemy) => this.hitEnemy(player, enemy));

    this.fireballs = this.physics.add.group({ allowGravity: false, maxSize: 8 });
    this.physics.add.collider(this.fireballs, this.platforms, (fireball) => fireball.destroy());
    this.physics.add.overlap(this.fireballs, this.enemies, (fireball, enemy) => this.hitEnemyWithFireball(fireball, enemy));

    this.goal = this.physics.add.staticSprite(this.level.goal.x, this.level.goal.y, 'flag');
    this.physics.add.overlap(this.player, this.goal, () => this.completeLevel());

    this.cursors = this.input.keyboard.createCursorKeys();
    this.keys = this.input.keyboard.addKeys('A,D,W,SPACE,X,SHIFT,F');
    this.input.keyboard.on('keydown-ESC', () => this.scene.start('menu'));
    this.input.keyboard.on('keydown-ENTER', () => this.handleContinue());
    this.input.keyboard.on('keydown-P', () => this.togglePause());
    this.input.keyboard.on('keydown-R', () => this.restartFromFirstLevel());
    this.input.keyboard.on('keydown-F', () => this.shootFireball());
    this.nativeRestartHandler = (event) => {
      if (this.phase !== 'lost' || event.repeat) return;
      event.preventDefault();
      this.restartLevel();
    };
    globalThis.addEventListener('keydown', this.nativeRestartHandler, true);
    this.events.once('shutdown', () => {
      globalThis.removeEventListener('keydown', this.nativeRestartHandler, true);
    });
    this.input.on('pointerdown', () => {
      if (this.phase === 'lost') this.restartLevel();
    });
    mobileControls.bindScene(this, 'maryJump', {
      primary: () => this.handleMobileJumpPress(),
      fire: () => this.shootFireball(),
      secondary: () => this.restartFromFirstLevel(),
      pause: () => this.togglePause(),
      restart: () => this.restartLevel(),
      home: () => this.scene.start('menu'),
    });
    this.cameras.main.startFollow(this.player, true, 0.09, 0.09, -180, 0);

    this.add.text(24, 17, t('game.mary'), {
      fontFamily: 'Arial Black', fontSize: '25px', color: '#ffffff',
    }).setScrollFactor(0).setDepth(10);
    this.add.text(26, 49, t('game.mary.sub'), {
      fontFamily: 'Arial', fontSize: '9px', color: '#ffd8a8', letterSpacing: 2,
    }).setScrollFactor(0).setDepth(10);
    this.levelText = this.add.text(430, 20, '', {
      fontFamily: 'Arial Black', fontSize: '20px', color: '#ffe8cc', align: 'center',
    }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(10);
    this.scoreText = this.add.text(830, 25, '', {
      fontFamily: 'Consolas', fontSize: '20px', color: '#ffe8cc',
    }).setOrigin(1, 0).setScrollFactor(0).setDepth(10);
    this.add.text(24, 62, t('mary.controls'), {
      fontFamily: 'Arial', fontSize: '11px', color: '#a5b4d4',
    }).setScrollFactor(0).setDepth(10);
    this.message = this.add.text(430, 310, '', {
      fontFamily: 'Arial Black', fontSize: '28px', color: '#ffffff', align: 'center',
      backgroundColor: '#080b14dd', padding: { x: 34, y: 24 },
    }).setOrigin(0.5).setScrollFactor(0).setDepth(20).setVisible(false);
    this.updateHud();
    this.showStageIntro();
  }

  makeTextures() {
    const g = this.make.graphics({ add: false });
    if (!this.textures.exists('coin')) {
      g.fillStyle(0xffd43b).fillCircle(10, 10, 9)
        .lineStyle(2, 0xfff3bf).strokeCircle(10, 10, 7)
        .generateTexture('coin', 20, 20);
      g.clear();
    }
    if (!this.textures.exists('flag')) {
      g.fillStyle(0xe9ecef).fillRect(8, 0, 5, 90)
        .fillStyle(0x51cf66).fillTriangle(13, 4, 13, 36, 48, 20)
        .generateTexture('flag', 52, 90);
      g.clear();
    }
    if (!this.textures.exists('maryMushroom')) {
      g.fillStyle(0xf03e3e).fillEllipse(16, 10, 30, 19)
        .fillStyle(0xffffff).fillCircle(10, 7, 4).fillCircle(22, 8, 4)
        .fillStyle(0xffe8cc).fillRoundedRect(10, 12, 12, 15, 4)
        .lineStyle(2, 0x7f1d1d).strokeEllipse(16, 10, 30, 19)
        .generateTexture('maryMushroom', 32, 28);
      g.clear();
    }
    if (!this.textures.exists('maryFlower')) {
      g.fillStyle(0x51cf66).fillRect(13, 16, 5, 16)
        .fillStyle(0xffd43b).fillCircle(15, 12, 7)
        .fillStyle(0xff6b6b).fillCircle(15, 4, 6).fillCircle(7, 11, 6).fillCircle(23, 11, 6)
        .fillStyle(0xffffff).fillCircle(15, 11, 4)
        .generateTexture('maryFlower', 30, 32);
      g.clear();
    }
    if (!this.textures.exists('maryFireball')) {
      g.fillStyle(0xffd43b).fillCircle(8, 6, 6)
        .lineStyle(2, 0xff6b35).strokeCircle(8, 6, 5)
        .generateTexture('maryFireball', 16, 12);
    }
    g.destroy();
  }

  drawWorld() {
    this.add.image(this.level.width / 2, this.level.height / 2, 'mary-jump-bg')
      .setDisplaySize(this.level.width, this.level.height)
      .setDepth(-20);
    const overlayColors = [0x080d1b, 0x35100b, 0x100d35];
    this.add.rectangle(
      this.level.width / 2,
      this.level.height / 2,
      this.level.width,
      this.level.height,
      overlayColors[this.levelIndex % overlayColors.length],
      0.18,
    ).setDepth(-19);
  }

  addPlatform(x, y, width, height) {
    const colors = [0x253846, 0x49312d, 0x302f52];
    const trims = [0x78d5b5, 0xff9f43, 0x9c88ff];
    const colorIndex = this.levelIndex % colors.length;
    const platform = this.add.rectangle(x, y, width, height, colors[colorIndex])
      .setStrokeStyle(2, trims[colorIndex], 0.7);
    this.add.rectangle(x, y - height / 2 + 4, width - 4, 7, trims[colorIndex], 0.8);
    this.physics.add.existing(platform, true);
    this.platforms.add(platform);
  }

  update() {
    if (this.phase !== 'playing') return;
    const axis = mobileControls.axis();
    let horizontal = Math.abs(axis.x) >= 0.16 ? axis.x : 0;
    if (this.cursors.left.isDown || this.keys.A.isDown) horizontal = -1;
    else if (this.cursors.right.isDown || this.keys.D.isDown) horizontal = 1;
    if (horizontal) {
      this.player.setVelocityX(MARY_JUMP_RULES.moveSpeed * horizontal).setFlipX(horizontal < 0);
    } else this.player.setVelocityX(0);

    const jump = Phaser.Input.Keyboard.JustDown(this.cursors.up)
      || Phaser.Input.Keyboard.JustDown(this.keys.W)
      || Phaser.Input.Keyboard.JustDown(this.keys.SPACE);
    const bigJump = Phaser.Input.Keyboard.JustDown(this.keys.X)
      || Phaser.Input.Keyboard.JustDown(this.keys.SHIFT);
    if (this.player.body.blocked.down) this.lastGroundedAt = this.time.now;
    if (bigJump) this.queueJump(true);
    else if (jump) this.queueJump();
    this.consumeQueuedJump();
    if (this.mobileBigJumpArmed && !mobileControls.isDown('primary')) {
      this.mobileBigJumpArmed = false;
      this.mobileBigJumpAt = Number.POSITIVE_INFINITY;
    }
    if (this.mobileBigJumpArmed
      && mobileControls.isDown('primary')
      && this.time.now >= this.mobileBigJumpAt
      && this.player.body.velocity.y < 0) {
      this.player.setVelocityY(-MARY_JUMP_RULES.bigJumpSpeed);
      this.mobileBigJumpArmed = false;
      this.mobileBigJumpAt = Number.POSITIVE_INFINITY;
    }

    this.enemies.children.iterate((enemy) => {
      if (!enemy?.active) return;
      let direction = enemy.getData('direction');
      if (enemy.x <= enemy.getData('minX') || enemy.body.blocked.left) direction = 1;
      if (enemy.x >= enemy.getData('maxX') || enemy.body.blocked.right) direction = -1;
      enemy.setData('direction', direction).setVelocityX(direction * this.level.enemySpeed);
    });

    this.fireballs.children.iterate((fireball) => {
      if (!fireball?.active) return;
      if (this.time.now - fireball.getData('bornAt') > 1800
        || fireball.x < 0 || fireball.x > this.level.width) fireball.destroy();
    });

    if (this.player.y > this.level.height + 40) this.lose('mary.missed');
  }

  queueJump(big = false) {
    if (this.phase !== 'playing') return;
    this.jumpQueuedUntil = this.time.now + 160;
    const speed = big ? MARY_JUMP_RULES.bigJumpSpeed : MARY_JUMP_RULES.jumpSpeed;
    this.queuedJumpSpeed = Math.max(this.queuedJumpSpeed, speed);
    this.consumeQueuedJump();
  }

  handleMobileJumpPress() {
    if (this.phase !== 'playing') return;
    const now = this.time.now;
    const doublePress = now - this.lastMobileJumpPressAt <= 300;
    this.lastMobileJumpPressAt = now;
    if (doublePress) {
      this.mobileBigJumpArmed = true;
      this.mobileBigJumpAt = now + 100;
      return;
    }
    this.mobileBigJumpArmed = false;
    this.mobileBigJumpAt = Number.POSITIVE_INFINITY;
    this.queueJump();
  }

  consumeQueuedJump() {
    const canUseCoyoteTime = this.time.now - this.lastGroundedAt <= 110;
    const grounded = this.player?.body?.blocked.down;
    if (this.phase === 'playing' && this.time.now <= this.jumpQueuedUntil && (grounded || canUseCoyoteTime)) {
      this.jumpQueuedUntil = 0;
      this.lastGroundedAt = Number.NEGATIVE_INFINITY;
      soundFX.play('jump');
      this.player.setVelocityY(-this.queuedJumpSpeed);
      this.queuedJumpSpeed = MARY_JUMP_RULES.jumpSpeed;
    }
  }

  collectPowerUp(powerUp) {
    if (!powerUp?.active || this.phase !== 'playing') return;
    const type = powerUp.getData('type');
    powerUp.destroy();
    this.model.collectPowerUp(type);
    if (type === 'flower') this.applyPlayerPowerAfterPhysics('fire');
    else if (this.playerPower === 'small') this.applyPlayerPowerAfterPhysics('big');
    soundFX.play('coin');
    this.showPowerNotice(type === 'flower' ? 'mary.firePower' : 'mary.big');
    this.updateHud();
  }

  applyPlayerPowerAfterPhysics(power) {
    this.playerPower = power;
    this.pendingPlayerPower = power;
    this.updateHud();
    if (this.powerResizeScheduled) return;
    this.powerResizeScheduled = true;
    this.events.once('postupdate', () => {
      this.powerResizeScheduled = false;
      const pendingPower = this.pendingPlayerPower;
      this.pendingPlayerPower = null;
      if (pendingPower && this.player?.active && this.phase === 'playing') {
        this.applyPlayerPower(pendingPower);
      }
    });
  }

  applyPlayerPower(power) {
    this.playerPower = power;
    if (!this.player) return;
    const powered = power !== 'small';
    const wasGrounded = this.player.body?.blocked.down;
    const previousBodyBottom = this.player.body?.bottom;
    const displayWidth = powered ? 52 : 42;
    const displayHeight = powered ? 70 : 57;
    this.player.setDisplaySize(displayWidth, displayHeight);

    // Keep a predictable, narrow world-space hitbox after changing sprite
    // scale. Preserving the feet position prevents growth from embedding the
    // body in a platform and getting it stuck at an edge.
    const bodyWidth = powered ? 30 : 28;
    const bodyHeight = powered ? 60 : 50;
    this.player.body.setSize(
      bodyWidth / Math.abs(this.player.scaleX),
      bodyHeight / Math.abs(this.player.scaleY),
      true,
    );
    this.player.body.updateFromGameObject();
    if (wasGrounded && Number.isFinite(previousBodyBottom)) {
      this.player.y += previousBodyBottom - this.player.body.bottom;
      this.player.body.updateFromGameObject();
    }
    if (power === 'fire') this.player.setTint(0xffd8a8);
    else this.player.clearTint();
    this.updateHud();
  }

  showPowerNotice(messageKey) {
    this.powerNotice?.destroy();
    this.powerNotice = this.add.text(430, 92, t(messageKey), {
      fontFamily: 'Arial Black', fontSize: '15px', color: '#fff3bf',
      backgroundColor: '#080b14dd', padding: { x: 14, y: 8 },
    }).setOrigin(0.5).setScrollFactor(0).setDepth(18);
    const notice = this.powerNotice;
    this.tweens.add({
      targets: notice, alpha: 0, y: 76, delay: 900, duration: 350,
      onComplete: () => {
        notice.destroy();
        if (this.powerNotice === notice) this.powerNotice = null;
      },
    });
  }

  shootFireball() {
    if (this.phase !== 'playing' || this.playerPower !== 'fire') return;
    if (this.time.now < this.lastFireAt + MARY_JUMP_RULES.fireCooldown) return;
    this.lastFireAt = this.time.now;
    const direction = this.player.flipX ? -1 : 1;
    const x = this.player.x + direction * 28;
    const fireball = this.fireballs.get(x, this.player.y - 4, 'maryFireball');
    if (!fireball) return;
    fireball.setActive(true).setVisible(true).setDepth(8).setData('bornAt', this.time.now);
    fireball.body.enable = true;
    fireball.body.reset(x, this.player.y - 4);
    fireball.setVelocity(direction * MARY_JUMP_RULES.fireballSpeed, 0);
    soundFX.play('shoot');
  }

  hitEnemyWithFireball(fireball, enemy) {
    if (this.phase !== 'playing' || !fireball.active || !enemy.active) return;
    fireball.destroy();
    enemy.destroy();
    this.model.defeatEnemy();
    soundFX.play('stomp');
    this.updateHud();
  }

  hitEnemy(player, enemy) {
    if (this.phase !== 'playing' || !enemy.active) return;
    const stomped = this.model.isStomp({
      y: player.y,
      velocityY: player.body.velocity.y,
    }, {
      y: enemy.y,
    });
    if (stomped) {
      enemy.destroy();
      player.setVelocityY(-MARY_JUMP_RULES.stompBounce);
      this.model.defeatEnemy();
      soundFX.play('stomp');
      this.updateHud();
    } else {
      if (this.time.now < this.playerInvincibleUntil) return;
      if (this.playerPower !== 'small') {
        this.playerInvincibleUntil = this.time.now + 3000;
        this.applyPlayerPowerAfterPhysics('small');
        soundFX.play('hurt');
        this.player.setAlpha(0.45);
        this.time.delayedCall(3000, () => this.player?.active && this.player.setAlpha(1));
      } else this.lose('mary.hit');
    }
  }

  lose(reasonKey = 'mary.failed') {
    if (this.phase !== 'playing') return;
    this.phase = 'lost';
    this.model.finish('lost');
    soundFX.play('hurt');
    this.physics.pause();
    this.message.setText(`${t('mary.failed')}\n${t(reasonKey)}\n${t('mary.retry')}`).setVisible(true);
  }

  completeLevel() {
    if (this.phase !== 'playing') return;
    this.physics.pause();
    this.model.score += MARY_JUMP_RULES.levelBonus * (this.levelIndex + 1);
    this.updateHud();
    const finalLevel = this.levelIndex === MARY_JUMP_LEVELS.length - 1;
    this.phase = finalLevel ? 'complete' : 'stage-clear';
    this.model.finish(finalLevel ? 'won' : 'stage-cleared');
    soundFX.play('win');
    if (finalLevel) {
      this.message.setText(`${t('mary.allClear')}\n${t('mary.total', { score: this.model.score })}`).setVisible(true);
    } else {
      const bonus = MARY_JUMP_RULES.levelBonus * (this.levelIndex + 1);
      this.message.setText(`${t('mary.stageClear', { stage: this.levelIndex + 1 })}\n${t('mary.next', { bonus })}`).setVisible(true);
      this.time.delayedCall(1200, () => {
        if (this.phase === 'stage-clear') {
          this.scene.restart({ levelIndex: this.levelIndex + 1, score: this.model.score, power: this.playerPower });
        }
      });
    }
  }

  handleContinue() {
    if (this.phase === 'stage-clear') {
      this.scene.restart({ levelIndex: this.levelIndex + 1, score: this.model.score, power: this.playerPower });
    } else if (this.phase === 'lost') {
      this.restartLevel();
    } else if (this.phase === 'complete') {
      this.scene.restart({ levelIndex: 0, score: 0 });
    }
  }

  restartLevel() {
    if (this.restartRequested) return;
    this.restartRequested = true;
    mobileControls.releaseAll();
    this.scene.restart({
      levelIndex: this.levelIndex,
      score: this.levelStartScore,
      power: this.levelStartPower,
    });
  }

  togglePause() {
    if (this.phase === 'playing') {
      this.phase = 'paused';
      this.physics.pause();
      this.message.setText(`${t('mary.paused')}\n${t('mary.resume')}`).setVisible(true);
    } else if (this.phase === 'paused') {
      this.phase = 'playing';
      this.physics.resume();
      this.message.setVisible(false);
    }
  }

  restartFromFirstLevel() {
    if (this.restartRequested) return;
    this.restartRequested = true;
    mobileControls.releaseAll();
    this.scene.restart({ levelIndex: 0, score: 0, power: 'small' });
  }

  updateHud() {
    const levelName = getLanguage() === 'zh' ? this.level.name : this.level.subtitle;
    if (this.levelText?.scene === this) {
      this.levelText.setText(`${t('global.stage')} ${this.levelIndex + 1}/${MARY_JUMP_LEVELS.length}  ·  ${levelName}`);
    }
    const power = this.playerPower === 'fire'
      ? `  ·  ${t('mary.powerFire')}`
      : this.playerPower === 'big' ? `  ·  ${t('mary.powerBig')}` : '';
    if (this.scoreText?.scene === this) {
      this.scoreText.setText(`${t('mary.score')}  ${String(this.model.score).padStart(4, '0')}${power}`);
    }
  }

  showStageIntro() {
    const levelName = getLanguage() === 'zh' ? this.level.name : this.level.subtitle;
    const intro = this.add.text(430, 220, `${t('global.stage')} ${this.levelIndex + 1}\n${levelName}`, {
      fontFamily: 'Arial Black', fontSize: '24px', color: '#ffffff', align: 'center',
      backgroundColor: '#080b14cc', padding: { x: 28, y: 18 },
    }).setOrigin(0.5).setScrollFactor(0).setDepth(15);
    this.tweens.add({ targets: intro, alpha: 0, delay: 900, duration: 450, onComplete: () => intro.destroy() });
  }
}
