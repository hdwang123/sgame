import { MARY_JUMP_RULES } from './config.js';

export class MaryJumpGame {
  constructor() {
    this.reset();
  }

  reset() {
    this.score = 0;
    this.finished = false;
    this.outcome = null;
  }

  collectCoin() {
    if (this.finished) return this.score;
    this.score += MARY_JUMP_RULES.coinScore;
    return this.score;
  }

  defeatEnemy() {
    if (this.finished) return this.score;
    this.score += MARY_JUMP_RULES.enemyScore;
    return this.score;
  }

  collectPowerUp(type) {
    if (this.finished) return this.score;
    this.score += type === 'flower' ? MARY_JUMP_RULES.flowerScore : MARY_JUMP_RULES.mushroomScore;
    return this.score;
  }

  isStomp(playerState, enemyState) {
    const descendingOrNearApex = playerState.velocityY >= -35;
    const clearlyAbove = playerState.y <= enemyState.y - 12;
    return descendingOrNearApex && clearlyAbove;
  }

  finish(outcome) {
    if (this.finished) return false;
    this.finished = true;
    this.outcome = outcome;
    return true;
  }
}
