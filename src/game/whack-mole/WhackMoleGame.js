export class WhackMoleGame {
  constructor() { this.score = 0; this.hits = 0; this.misses = 0; this.combo = 0; }
  hit(kind) { if (kind === 'bomb') { this.score = Math.max(0, this.score - 150); this.combo = 0; return -150; } const points = (kind === 'gold' ? 250 : 100) + Math.min(this.combo, 10) * 10; this.score += points; this.hits += 1; this.combo += 1; return points; }
  miss() { this.misses += 1; this.combo = 0; }
}
