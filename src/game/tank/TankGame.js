import { TANK_DIRECTIONS, TANK_RULES } from './config.js';

export class TankGame {
  constructor(random = Math.random, initialState = {}) {
    this.random = random;
    this.reset(initialState);
  }

  reset(initialState = {}) {
    this.score = initialState.score ?? 0;
    this.lives = initialState.lives ?? TANK_RULES.initialLives;
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

  nextEnemyMove(time, delayRange = [650, 1500]) {
    const direction = TANK_DIRECTIONS[Math.floor(this.random() * TANK_DIRECTIONS.length)];
    const [minimum, maximum] = delayRange;
    return {
      direction,
      turnAt: time + minimum + Math.floor(this.random() * (maximum - minimum + 1)),
    };
  }

  nextEnemyShot(time, delayRange = [1100, 2200]) {
    const [minimum, maximum] = delayRange;
    return time + minimum + Math.floor(this.random() * (maximum - minimum + 1));
  }

  hitEnemy(remainingEnemies) {
    if (this.finished) return false;
    this.score += TANK_RULES.enemyScore;
    return remainingEnemies === 0;
  }

  addStageBonus(points) {
    if (this.finished) return this.score;
    this.score += points;
    return this.score;
  }

  hitPlayer() {
    if (this.finished) return false;
    this.lives -= 1;
    if (this.lives <= 0) this.finish(false);
    return true;
  }

  addLife(amount = 1) {
    if (this.finished) return this.lives;
    this.lives += Math.max(0, amount);
    return this.lives;
  }

  finish(won) {
    if (this.finished) return false;
    this.finished = true;
    this.won = won;
    return true;
  }
}
