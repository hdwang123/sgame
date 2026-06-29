import Phaser from 'phaser';
import { MaryJumpGame } from '../game/mary-jump/MaryJumpGame.js';
import { MARY_JUMP_LEVELS, MARY_JUMP_RULES } from '../game/mary-jump/config.js';
import { soundFX } from '../audio/SoundFX.js';
import { mobileControls } from '../ui/MobileControls.js';
import { showSceneLoader } from '../ui/SceneLoader.js';

export class MaryJumpScene extends Phaser.Scene {
  constructor() {
    super('maryJump');
  }

  preload() {
    showSceneLoader(this, 0xff922b);
    const assets = `${import.meta.env.BASE_URL}assets/mary-jump/`;
    this.load.image('mary-jump-bg', `${assets}sunset-ruins.jpg`);
    this.load.image('hero', `${assets}hero.png`);
    this.load.image('enemy', `${assets}slime.png`);
  }

  create(data = {}) {
    this.levelIndex = Phaser.Math.Clamp(data.levelIndex ?? 0, 0, MARY_JUMP_LEVELS.length - 1);
    this.level = MARY_JUMP_LEVELS[this.levelIndex];
    this.levelStartScore = data.score ?? 0;
    this.phase = 'playing';
    this.jumpQueuedUntil = 0;
    this.lastGroundedAt = Number.NEGATIVE_INFINITY;
    this.model = new MaryJumpGame();
    this.model.score = this.levelStartScore;
    this.makeTextures();

    this.physics.resume();
    this.physics.world.gravity.y = this.level.gravity;
    this.physics.world.setBounds(0, 0, this.level.width, this.level.height);
    this.physics.world.checkCollision.down = false;
    this.cameras.main
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
    this.physics.add.collider(this.player, this.platforms);

    this.coins = this.physics.add.staticGroup();
    this.level.coins.forEach(([x, y]) => this.coins.create(x, y, 'coin'));
    this.physics.add.overlap(this.player, this.coins, (_, coin) => {
      coin.destroy();
      this.model.collectCoin();
      soundFX.play('coin');
      this.updateHud();
    });

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

    this.goal = this.physics.add.staticSprite(this.level.goal.x, this.level.goal.y, 'flag');
    this.physics.add.overlap(this.player, this.goal, () => this.completeLevel());

    this.cursors = this.input.keyboard.createCursorKeys();
    this.keys = this.input.keyboard.addKeys('A,D,W,SPACE');
    this.input.keyboard.on('keydown-ESC', () => this.scene.start('menu'));
    this.input.keyboard.on('keydown-ENTER', () => this.handleContinue());
    this.input.keyboard.on('keydown-P', () => this.togglePause());
    this.input.keyboard.on('keydown-R', () => this.restartFromFirstLevel());
    mobileControls.bindScene(this, 'maryJump', {
      primary: () => this.queueJump(),
      secondary: () => this.restartFromFirstLevel(),
      pause: () => this.togglePause(),
      restart: () => this.restartLevel(),
      home: () => this.scene.start('menu'),
    });
    this.cameras.main.startFollow(this.player, true, 0.09, 0.09, -180, 0);

    this.add.text(24, 17, '玛丽跳跃', {
      fontFamily: 'Arial Black', fontSize: '25px', color: '#ffffff',
    }).setScrollFactor(0).setDepth(10);
    this.add.text(26, 49, 'MARY JUMP', {
      fontFamily: 'Arial', fontSize: '9px', color: '#ffd8a8', letterSpacing: 2,
    }).setScrollFactor(0).setDepth(10);
    this.levelText = this.add.text(430, 20, '', {
      fontFamily: 'Arial Black', fontSize: '15px', color: '#ffe8cc', align: 'center',
    }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(10);
    this.scoreText = this.add.text(830, 25, '', {
      fontFamily: 'Consolas', fontSize: '14px', color: '#ffe8cc',
    }).setOrigin(1, 0).setScrollFactor(0).setDepth(10);
    this.add.text(24, 62, '方向键 / AD 移动  ·  ↑ / W / SPACE 跳跃  ·  P 暂停  ·  R 从第1关开始  ·  ESC 返回', {
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
    if (this.textures.exists('coin')) return;
    const g = this.make.graphics({ add: false });
    g.fillStyle(0xffd43b).fillCircle(10, 10, 9)
      .lineStyle(2, 0xfff3bf).strokeCircle(10, 10, 7)
      .generateTexture('coin', 20, 20);
    g.clear();
    g.fillStyle(0xe9ecef).fillRect(8, 0, 5, 90)
      .fillStyle(0x51cf66).fillTriangle(13, 4, 13, 36, 48, 20)
      .generateTexture('flag', 52, 90);
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
      overlayColors[this.levelIndex],
      0.18,
    ).setDepth(-19);
  }

  addPlatform(x, y, width, height) {
    const colors = [0x253846, 0x49312d, 0x302f52];
    const trims = [0x78d5b5, 0xff9f43, 0x9c88ff];
    const platform = this.add.rectangle(x, y, width, height, colors[this.levelIndex])
      .setStrokeStyle(2, trims[this.levelIndex], 0.7);
    this.add.rectangle(x, y - height / 2 + 4, width - 4, 7, trims[this.levelIndex], 0.8);
    this.physics.add.existing(platform, true);
    this.platforms.add(platform);
  }

  update() {
    if (this.phase !== 'playing') return;
    const left = this.cursors.left.isDown || this.keys.A.isDown || mobileControls.isDown('left');
    const right = this.cursors.right.isDown || this.keys.D.isDown || mobileControls.isDown('right');
    if (left) this.player.setVelocityX(-MARY_JUMP_RULES.moveSpeed).setFlipX(true);
    else if (right) this.player.setVelocityX(MARY_JUMP_RULES.moveSpeed).setFlipX(false);
    else this.player.setVelocityX(0);

    const jump = Phaser.Input.Keyboard.JustDown(this.cursors.up)
      || Phaser.Input.Keyboard.JustDown(this.keys.W)
      || Phaser.Input.Keyboard.JustDown(this.keys.SPACE);
    if (this.player.body.blocked.down) this.lastGroundedAt = this.time.now;
    if (jump) this.queueJump();
    this.consumeQueuedJump();

    this.enemies.children.iterate((enemy) => {
      if (!enemy?.active) return;
      let direction = enemy.getData('direction');
      if (enemy.x <= enemy.getData('minX') || enemy.body.blocked.left) direction = 1;
      if (enemy.x >= enemy.getData('maxX') || enemy.body.blocked.right) direction = -1;
      enemy.setData('direction', direction).setVelocityX(direction * this.level.enemySpeed);
    });

    if (this.player.y > this.level.height + 40) this.lose('MISSED THE PLATFORM');
  }

  queueJump() {
    if (this.phase !== 'playing') return;
    this.jumpQueuedUntil = this.time.now + 160;
    this.consumeQueuedJump();
  }

  consumeQueuedJump() {
    const canUseCoyoteTime = this.time.now - this.lastGroundedAt <= 110;
    const grounded = this.player?.body?.blocked.down;
    if (this.phase === 'playing' && this.time.now <= this.jumpQueuedUntil && (grounded || canUseCoyoteTime)) {
      this.jumpQueuedUntil = 0;
      this.lastGroundedAt = Number.NEGATIVE_INFINITY;
      soundFX.play('jump');
      this.player.setVelocityY(-MARY_JUMP_RULES.jumpSpeed);
    }
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
      this.lose('HIT BY SLIME');
    }
  }

  lose(reason = 'TRY AGAIN') {
    if (this.phase !== 'playing') return;
    this.phase = 'lost';
    this.model.finish('lost');
    soundFX.play('hurt');
    this.physics.pause();
    this.message.setText(`挑战失败\n${reason}\nENTER 重试本关  ·  R 从第1关开始`).setVisible(true);
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
      this.message.setText(`全部关卡完成！\nALL STAGES CLEAR\n总分 ${this.model.score}\n按 ENTER 重新挑战`).setVisible(true);
    } else {
      this.message.setText(`第 ${this.levelIndex + 1} 关完成\nSTAGE CLEAR  +${MARY_JUMP_RULES.levelBonus * (this.levelIndex + 1)}\n即将进入下一关…`).setVisible(true);
      this.time.delayedCall(1200, () => {
        if (this.phase === 'stage-clear') {
          this.scene.restart({ levelIndex: this.levelIndex + 1, score: this.model.score });
        }
      });
    }
  }

  handleContinue() {
    if (this.phase === 'stage-clear') {
      this.scene.restart({ levelIndex: this.levelIndex + 1, score: this.model.score });
    } else if (this.phase === 'lost') {
      this.restartLevel();
    } else if (this.phase === 'complete') {
      this.scene.restart({ levelIndex: 0, score: 0 });
    }
  }

  restartLevel() {
    this.scene.restart({ levelIndex: this.levelIndex, score: this.levelStartScore });
  }

  togglePause() {
    if (this.phase === 'playing') {
      this.phase = 'paused';
      this.physics.pause();
      this.message.setText('游戏暂停\nPAUSED  ·  按 P 或轻触暂停键继续').setVisible(true);
    } else if (this.phase === 'paused') {
      this.phase = 'playing';
      this.physics.resume();
      this.message.setVisible(false);
    }
  }

  restartFromFirstLevel() {
    if (this.levelIndex === 0 && this.phase === 'playing') return;
    this.scene.restart({ levelIndex: 0, score: 0 });
  }

  updateHud() {
    this.levelText?.setText(`STAGE ${this.levelIndex + 1}/${MARY_JUMP_LEVELS.length}  ·  ${this.level.name}`);
    this.scoreText?.setText(`分数 / SCORE  ${String(this.model.score).padStart(4, '0')}`);
  }

  showStageIntro() {
    const intro = this.add.text(430, 220, `STAGE ${this.levelIndex + 1}\n${this.level.name}\n${this.level.subtitle}`, {
      fontFamily: 'Arial Black', fontSize: '24px', color: '#ffffff', align: 'center',
      backgroundColor: '#080b14cc', padding: { x: 28, y: 18 },
    }).setOrigin(0.5).setScrollFactor(0).setDepth(15);
    this.tweens.add({ targets: intro, alpha: 0, delay: 900, duration: 450, onComplete: () => intro.destroy() });
  }
}
