import Phaser from 'phaser';
import { soundFX } from '../audio/SoundFX.js';
import { mobileControls } from '../ui/MobileControls.js';
import { t } from '../i18n.js';
import { CarrotDefenseGame } from '../game/carrot-defense/CarrotDefenseGame.js';
import {
  CARROT_PATH,
  CARROT_RULES,
  CARROT_TOWER_SPOTS,
  CARROT_WAVES,
} from '../game/carrot-defense/config.js';

export class CarrotDefenseScene extends Phaser.Scene {
  constructor() {
    super('carrotDefense');
  }

  init() {
    this.isMobileLayout = globalThis.matchMedia?.('(max-width: 800px)').matches ?? false;
    this.scale.resize(this.isMobileLayout ? 620 : 860, 680);
    const scaleX = this.isMobileLayout ? 620 / 860 : 1;
    this.path = CARROT_PATH.map(([x, y]) => [x * scaleX, y]);
    this.towerSpots = CARROT_TOWER_SPOTS.map(([x, y]) => [x * scaleX, y]);
  }

  create() {
    this.model = new CarrotDefenseGame();
    this.phase = 'playing';
    this.spawnRemaining = 0;
    this.spawnAccumulator = 0;
    this.nextWaveAt = 0;
    this.waveCompleteHandled = false;
    this.makePixelTextures();
    this.drawGrassAndPath();

    this.enemies = this.add.group();
    this.enemyHealthGraphics = this.add.graphics().setDepth(13);
    this.towers = [];
    this.createBuildSpots();
    const [carrotX, carrotY] = this.path[this.path.length - 1];
    this.carrot = this.add.image(carrotX, carrotY, 'pixelCarrot').setDepth(8).setScale(1.25);
    this.add.rectangle(carrotX, carrotY + 48, 82, 15, 0x3b2f1f, 0.9).setDepth(7);
    this.carrotHealthBar = this.add.rectangle(carrotX - 39, carrotY + 48, 78, 11, 0x69db7c).setOrigin(0, 0.5).setDepth(8);

    this.createInterface();
    this.bindControls();
    this.startWave(0);
  }

  makePixelTextures() {
    const g = this.make.graphics({ add: false });
    if (!this.textures.exists('pixelCarrot')) {
      g.fillStyle(0x2f9e44).fillRect(14, 0, 8, 13).fillRect(4, 5, 12, 7).fillRect(21, 5, 12, 7)
        .fillStyle(0xff922b).fillRect(7, 13, 28, 10).fillRect(10, 23, 22, 10)
        .fillRect(13, 33, 16, 9).fillRect(16, 42, 10, 8)
        .fillStyle(0xffffff).fillRect(12, 19, 6, 7).fillRect(25, 19, 6, 7)
        .fillStyle(0x212529).fillRect(14, 21, 3, 4).fillRect(27, 21, 3, 4).fillRect(19, 31, 7, 3)
        .generateTexture('pixelCarrot', 42, 52);
      g.clear();
    }
    if (!this.textures.exists('pixelEnemy')) {
      g.fillStyle(0x862e9c).fillRect(4, 6, 24, 20).fillRect(8, 2, 16, 4)
        .fillStyle(0xda77f2).fillRect(8, 8, 16, 8)
        .fillStyle(0xffffff).fillRect(9, 10, 5, 6).fillRect(20, 10, 5, 6)
        .fillStyle(0x212529).fillRect(11, 12, 2, 3).fillRect(22, 12, 2, 3)
        .fillStyle(0x5f3dc4).fillRect(3, 26, 8, 4).fillRect(21, 26, 8, 4)
        .generateTexture('pixelEnemy', 32, 30);
      g.clear();
    }
    if (!this.textures.exists('pixelTower')) {
      g.fillStyle(0x495057).fillRect(3, 19, 34, 15)
        .fillStyle(0x74c0fc).fillRect(8, 9, 24, 17).fillRect(17, 2, 7, 15)
        .fillStyle(0xd0ebff).fillRect(12, 12, 16, 6)
        .fillStyle(0x1c7ed6).fillRect(8, 28, 24, 6)
        .generateTexture('pixelTower', 40, 36);
      g.clear();
    }
    if (!this.textures.exists('pixelBullet')) {
      g.fillStyle(0xfff3bf).fillRect(2, 2, 8, 8)
        .fillStyle(0xffd43b).fillRect(0, 4, 12, 4)
        .generateTexture('pixelBullet', 12, 12);
    }
    g.destroy();
  }

  drawGrassAndPath() {
    this.cameras.main.setBackgroundColor('#4d8f3a');
    const grass = this.add.graphics().setDepth(-10);
    grass.fillStyle(0x4f913d).fillRect(0, 0, this.scale.width, 680);
    for (let y = 88; y < 680; y += 24) {
      for (let x = (y / 24) % 2 ? 8 : 18; x < this.scale.width; x += 32) {
        const color = (x + y) % 3 ? 0x65a84c : 0x3d7d31;
        grass.fillStyle(color, 0.65).fillRect(x, y, 5, 8).fillRect(x + 5, y + 3, 4, 5);
      }
    }
    const road = this.add.graphics().setDepth(-5);
    road.lineStyle(70, 0x6b4f32, 1);
    for (let i = 1; i < this.path.length; i += 1) road.lineBetween(...this.path[i - 1], ...this.path[i]);
    road.lineStyle(56, 0xc49a63, 1);
    for (let i = 1; i < this.path.length; i += 1) road.lineBetween(...this.path[i - 1], ...this.path[i]);
    road.fillStyle(0xd8b77c, 0.7);
    for (let i = 0; i < this.path.length; i += 1) {
      const [x, y] = this.path[i];
      road.fillRect(x - 7, y - 4, 14, 8);
    }
  }

  createBuildSpots() {
    this.towerSpots.forEach(([x, y], index) => {
      const ring = this.add.circle(x, y, 27, 0x173d2b, 0.75)
        .setStrokeStyle(3, 0x9be564, 0.8)
        .setInteractive({ useHandCursor: true })
        .setDepth(3);
      const plus = this.add.text(x, y, '+', {
        fontFamily: 'Arial Black', fontSize: '25px', color: '#d8f5a2',
      }).setOrigin(0.5).setDepth(4);
      const spot = { id: index, x, y, ring, plus, tower: null, levelText: null, nextFireAt: 0 };
      ring.on('pointerdown', () => this.useBuildSpot(spot));
      this.towers.push(spot);
    });
  }

  useBuildSpot(spot) {
    if (this.phase !== 'playing') return;
    if (!spot.tower) {
      if (!this.model.buildTower(spot.id)) {
        this.showToast(t('carrot.noMoney'));
        return;
      }
      spot.tower = this.add.image(spot.x, spot.y, 'pixelTower').setDepth(6);
      spot.levelText = this.add.text(spot.x + 20, spot.y - 23, '1', {
        fontFamily: 'Arial Black', fontSize: '12px', color: '#ffffff',
        backgroundColor: '#1c7ed6', padding: { x: 4, y: 1 },
      }).setOrigin(0.5).setDepth(7);
      spot.plus.setVisible(false);
      spot.ring.setStrokeStyle(2, 0x74c0fc, 0.65);
      soundFX.play('coin');
    } else if (this.model.upgradeTower(spot.id)) {
      const level = this.model.towers.get(spot.id);
      spot.levelText.setText(String(level));
      spot.tower.setTint(level === 3 ? 0xffd43b : 0xa5d8ff).setScale(1 + (level - 1) * 0.08);
      soundFX.play('line');
    } else this.showToast(t('carrot.maxOrPoor'));
    this.updateHud();
  }

  createInterface() {
    this.add.rectangle(this.scale.width / 2, 38, this.scale.width, 76, 0x07140f, 0.9).setScrollFactor(0).setDepth(20);
    this.add.text(24, 15, t('game.carrot'), {
      fontFamily: 'Arial Black', fontSize: '25px', color: '#d8f5a2',
    }).setDepth(21);
    this.add.text(26, 47, t('game.carrot.sub'), {
      fontFamily: 'Consolas', fontSize: '10px', color: '#74c69d', letterSpacing: 2,
    }).setDepth(21);
    this.hud = this.add.text(this.scale.width - 30, 20, '', {
      fontFamily: 'Consolas', fontSize: '15px', color: '#fff3bf', align: 'right',
    }).setOrigin(1, 0).setDepth(21);
    this.hint = this.add.text(this.scale.width / 2, 650, t('carrot.controls'), {
      fontFamily: 'Arial', fontSize: '12px', color: '#e9fac8',
      backgroundColor: '#07140fcc', padding: { x: 12, y: 6 },
    }).setOrigin(0.5).setDepth(20);
    this.message = this.add.text(this.scale.width / 2, 330, '', {
      fontFamily: 'Arial Black', fontSize: '27px', color: '#ffffff', align: 'center',
      backgroundColor: '#07140fee', padding: { x: 30, y: 22 },
    }).setOrigin(0.5).setDepth(30).setVisible(false);
    this.toast = this.add.text(this.scale.width / 2, 92, '', {
      fontFamily: 'Arial Black', fontSize: '14px', color: '#fff3bf',
      backgroundColor: '#07140fdd', padding: { x: 12, y: 7 },
    }).setOrigin(0.5).setDepth(25).setVisible(false);
    this.updateHud();
  }

  bindControls() {
    this.input.keyboard.on('keydown-P', () => this.togglePause());
    this.input.keyboard.on('keydown-R', () => this.scene.restart());
    this.input.keyboard.on('keydown-ENTER', () => {
      if (this.phase === 'won' || this.phase === 'lost') this.scene.restart();
    });
    this.input.keyboard.on('keydown-ESC', () => this.scene.start('menu'));
    mobileControls.bindScene(this, 'carrotDefense', {
      pause: () => this.togglePause(),
      restart: () => this.scene.restart(),
      home: () => this.scene.start('menu'),
    });
  }

  startWave(index) {
    const wave = CARROT_WAVES[index];
    if (!wave) return;
    this.spawnRemaining = wave.count;
    this.spawnAccumulator = wave.interval;
    this.waveCompleteHandled = false;
    this.nextWaveAt = 0;
    this.showToast(t('carrot.waveStart', { wave: index + 1 }));
    this.updateHud();
  }

  update(time, delta) {
    if (this.phase !== 'playing') return;
    if (this.nextWaveAt) {
      if (time >= this.nextWaveAt) this.startWave(this.model.waveIndex);
      else return;
    }
    const wave = CARROT_WAVES[this.model.waveIndex];
    if (this.spawnRemaining > 0) {
      this.spawnAccumulator += delta;
      if (this.spawnAccumulator >= wave.interval) {
        this.spawnAccumulator = 0;
        this.spawnEnemy(wave);
        this.spawnRemaining -= 1;
      }
    }
    this.updateEnemies(delta);
    if (this.phase !== 'playing') return;
    this.updateTowers(time);
    this.drawEnemyHealth();
    if (this.spawnRemaining === 0 && this.enemies.countActive(true) === 0 && !this.waveCompleteHandled) {
      this.waveCompleteHandled = true;
      const won = this.model.completeWave();
      this.updateHud();
      if (won) this.endGame(true);
      else {
        this.showToast(t('carrot.waveClear', { wave: this.model.waveIndex }));
        this.nextWaveAt = time + CARROT_RULES.waveDelay;
      }
    }
  }

  spawnEnemy(wave) {
    const [x, y] = this.path[0];
    this.enemies.create(x, y, 'pixelEnemy')
      .setDepth(10)
      .setData('waypoint', 1)
      .setData('health', wave.health)
      .setData('maxHealth', wave.health)
      .setData('speed', wave.speed)
      .setData('reward', wave.reward);
  }

  updateEnemies(delta) {
    this.enemies.children.iterate((enemy) => {
      if (!enemy?.active) return;
      const waypoint = enemy.getData('waypoint');
      if (waypoint >= this.path.length) {
        this.enemyReachedCarrot(enemy);
        return;
      }
      const [targetX, targetY] = this.path[waypoint];
      const dx = targetX - enemy.x;
      const dy = targetY - enemy.y;
      const distance = Math.hypot(dx, dy);
      const step = enemy.getData('speed') * delta / 1000;
      if (distance <= step) {
        enemy.setPosition(targetX, targetY).setData('waypoint', waypoint + 1);
      } else {
        enemy.x += (dx / distance) * step;
        enemy.y += (dy / distance) * step;
        enemy.setFlipX(dx < 0);
      }
    });
  }

  updateTowers(time) {
    this.towers.forEach((spot) => {
      if (!spot.tower || time < spot.nextFireAt) return;
      const level = this.model.towers.get(spot.id);
      const range = CARROT_RULES.towerRange + (level - 1) * 18;
      const target = this.enemies.getChildren()
        .filter((enemy) => enemy.active && Phaser.Math.Distance.Between(spot.x, spot.y, enemy.x, enemy.y) <= range)
        .sort((a, b) => b.getData('waypoint') - a.getData('waypoint'))[0];
      if (!target) return;
      spot.nextFireAt = time + Math.max(280, CARROT_RULES.towerFireDelay - (level - 1) * 110);
      this.fireAtTarget(spot, target, level);
    });
  }

  fireAtTarget(spot, target, damage) {
    const bullet = this.add.image(spot.x, spot.y, 'pixelBullet').setDepth(12);
    const distance = Phaser.Math.Distance.Between(spot.x, spot.y, target.x, target.y);
    soundFX.play('shoot');
    this.tweens.add({
      targets: bullet,
      x: target.x,
      y: target.y,
      duration: Math.max(90, distance / CARROT_RULES.bulletSpeed * 1000),
      onComplete: () => {
        bullet.destroy();
        if (!target.active || this.phase !== 'playing') return;
        const health = target.getData('health') - damage;
        target.setData('health', health).setTint(0xffffff);
        this.time.delayedCall(70, () => target?.active && target.clearTint());
        if (health <= 0) this.defeatEnemy(target);
      },
    });
  }

  defeatEnemy(enemy) {
    this.model.reward(enemy.getData('reward'));
    this.createPixelBurst(enemy.x, enemy.y, 0xda77f2);
    enemy.destroy();
    soundFX.play('explosion');
    this.updateHud();
  }

  enemyReachedCarrot(enemy) {
    enemy.destroy();
    this.model.damageCarrot(1);
    soundFX.play('hurt');
    this.carrot.setTint(0xff6b6b);
    this.time.delayedCall(120, () => this.carrot?.active && this.carrot.clearTint());
    this.cameras.main.shake(100, 0.006);
    this.updateHud();
    if (this.model.finished) this.endGame(false);
  }

  createPixelBurst(x, y, color) {
    for (let index = 0; index < 7; index += 1) {
      const angle = Math.PI * 2 * index / 7;
      const pixel = this.add.rectangle(x, y, 6, 6, color).setDepth(14);
      this.tweens.add({
        targets: pixel,
        x: x + Math.cos(angle) * 28,
        y: y + Math.sin(angle) * 28,
        alpha: 0,
        duration: 260,
        onComplete: () => pixel.destroy(),
      });
    }
  }

  drawEnemyHealth() {
    this.enemyHealthGraphics.clear();
    this.enemies.children.iterate((enemy) => {
      if (!enemy?.active) return;
      const ratio = Math.max(0, enemy.getData('health') / enemy.getData('maxHealth'));
      this.enemyHealthGraphics.fillStyle(0x321515, 0.9).fillRect(enemy.x - 15, enemy.y - 22, 30, 4);
      this.enemyHealthGraphics.fillStyle(0xff6b6b, 1).fillRect(enemy.x - 15, enemy.y - 22, 30 * ratio, 4);
    });
  }

  updateHud() {
    const healthRatio = this.model.health / CARROT_RULES.initialHealth;
    this.carrotHealthBar?.setScale(healthRatio, 1).setFillStyle(healthRatio > 0.4 ? 0x69db7c : 0xff6b6b);
    this.hud?.setText(
      `${t('carrot.money')} ${this.model.money}   ${t('carrot.health')} ${this.model.health}   ${t('carrot.wave')} ${Math.min(this.model.waveIndex + 1, CARROT_WAVES.length)}/${CARROT_WAVES.length}`,
    );
  }

  showToast(text) {
    this.toast.setText(text).setAlpha(1).setVisible(true);
    this.tweens.killTweensOf(this.toast);
    this.tweens.add({ targets: this.toast, alpha: 0, delay: 850, duration: 300 });
  }

  togglePause() {
    if (this.phase === 'playing') {
      this.phase = 'paused';
      this.tweens.pauseAll();
      this.message.setText(`${t('carrot.paused')}\n${t('carrot.resume')}`).setVisible(true);
    } else if (this.phase === 'paused') {
      this.phase = 'playing';
      this.tweens.resumeAll();
      this.message.setVisible(false);
    }
  }

  endGame(won) {
    this.phase = won ? 'won' : 'lost';
    this.tweens.pauseAll();
    soundFX.play(won ? 'win' : 'lose');
    this.message.setText(won ? t('carrot.win') : t('carrot.lose')).setVisible(true);
  }
}
