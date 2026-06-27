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

  isStomp(playerState, enemyState) {
    return playerState.velocityY > 120 && playerState.y < enemyState.y - 8;
  }

  finish(outcome) {
    if (this.finished) return false;
    this.finished = true;
    this.outcome = outcome;
    return true;
  }
}
