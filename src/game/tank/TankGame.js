import { TANK_DIRECTIONS, TANK_RULES } from './config.js';

export class TankGame {
  constructor(random = Math.random) {
    this.random = random;
    this.reset();
  }

  reset() {
    this.score = 0;
    this.lives = TANK_RULES.initialLives;
    this.finished = false;
    this.won = false;
    this.lastPlayerShot = 0;
  }

  canPlayerShoot(time) {
    if (this.finished || time <= this.lastPlayerShot + TANK_RULES.shotCooldown) return false;
    this.lastPlayerShot = time;
    return true;
  }

  createEnemyState(index) {
    return { turnAt: 0, shootAt: 900 + index * 250 };
  }

  nextEnemyMove(time) {
    const direction = TANK_DIRECTIONS[Math.floor(this.random() * TANK_DIRECTIONS.length)];
    return {
      direction,
      turnAt: time + 650 + Math.floor(this.random() * 851),
    };
  }

  nextEnemyShot(time) {
    return time + 1100 + Math.floor(this.random() * 1101);
  }

  hitEnemy(remainingEnemies) {
    if (this.finished) return false;
    this.score += TANK_RULES.enemyScore;
    if (remainingEnemies === 0) this.finish(true);
    return true;
  }

  hitPlayer() {
    if (this.finished) return false;
    this.lives -= 1;
    if (this.lives <= 0) this.finish(false);
    return true;
  }

  finish(won) {
    if (this.finished) return false;
    this.finished = true;
    this.won = won;
    return true;
  }
}
