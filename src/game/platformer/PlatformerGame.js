import { PLATFORMER_RULES } from './config.js';

export class PlatformerGame {
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
    this.score += PLATFORMER_RULES.coinScore;
    return this.score;
  }

  defeatEnemy() {
    if (this.finished) return this.score;
    this.score += PLATFORMER_RULES.enemyScore;
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
