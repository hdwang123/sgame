import { CARROT_RULES, CARROT_WAVES } from './config.js';

export class CarrotDefenseGame {
  constructor() {
    this.reset();
  }

  reset() {
    this.money = CARROT_RULES.initialMoney;
    this.health = CARROT_RULES.initialHealth;
    this.waveIndex = 0;
    this.towers = new Map();
    this.finished = false;
    this.won = false;
  }

  buildTower(spotId) {
    if (this.finished || this.towers.has(spotId) || this.money < CARROT_RULES.towerCost) return false;
    this.money -= CARROT_RULES.towerCost;
    this.towers.set(spotId, 1);
    return true;
  }

  upgradeTower(spotId) {
    const level = this.towers.get(spotId);
    if (this.finished || !level || level >= 3 || this.money < CARROT_RULES.upgradeCost) return false;
    this.money -= CARROT_RULES.upgradeCost;
    this.towers.set(spotId, level + 1);
    return true;
  }

  reward(amount) {
    if (!this.finished) this.money += amount;
    return this.money;
  }

  damageCarrot(amount = 1) {
    if (this.finished) return this.health;
    this.health = Math.max(0, this.health - amount);
    if (this.health === 0) this.finish(false);
    return this.health;
  }

  completeWave() {
    if (this.finished) return false;
    this.waveIndex += 1;
    if (this.waveIndex >= CARROT_WAVES.length) this.finish(true);
    return this.won;
  }

  finish(won) {
    if (this.finished) return false;
    this.finished = true;
    this.won = Boolean(won);
    return true;
  }
}
