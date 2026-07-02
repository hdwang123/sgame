export class MinesweeperGame {
  constructor({ rows = 9, columns = 9, mines = 10, random = Math.random } = {}) {
    this.rows = rows; this.columns = columns; this.mineCount = mines; this.random = random;
    this.cells = Array.from({ length: rows }, () => Array.from({ length: columns }, () => ({ mine: false, revealed: false, flagged: false, adjacent: 0 })));
    this.started = false; this.finished = false; this.won = false;
  }
  inBounds(row, column) { return row >= 0 && row < this.rows && column >= 0 && column < this.columns; }
  neighbors(row, column) { const result = []; for (let dr = -1; dr <= 1; dr += 1) for (let dc = -1; dc <= 1; dc += 1) if ((dr || dc) && this.inBounds(row + dr, column + dc)) result.push([row + dr, column + dc]); return result; }
  placeMines(safeRow, safeColumn) {
    const safe = new Set([[safeRow, safeColumn], ...this.neighbors(safeRow, safeColumn)].map(([r, c]) => `${r}:${c}`));
    const available = []; for (let r = 0; r < this.rows; r += 1) for (let c = 0; c < this.columns; c += 1) if (!safe.has(`${r}:${c}`)) available.push([r, c]);
    for (let i = 0; i < this.mineCount; i += 1) { const index = Math.floor(this.random() * available.length); const [r, c] = available.splice(index, 1)[0]; this.cells[r][c].mine = true; }
    for (let r = 0; r < this.rows; r += 1) for (let c = 0; c < this.columns; c += 1) this.cells[r][c].adjacent = this.neighbors(r, c).filter(([nr, nc]) => this.cells[nr][nc].mine).length;
    this.started = true;
  }
  reveal(row, column) {
    if (this.finished || !this.inBounds(row, column)) return { changed: [] };
    if (!this.started) this.placeMines(row, column);
    const first = this.cells[row][column]; if (first.flagged || first.revealed) return { changed: [] };
    if (first.mine) { first.revealed = true; this.finished = true; this.won = false; return { changed: [[row, column]], exploded: true }; }
    const changed = []; const queue = [[row, column]]; const seen = new Set();
    while (queue.length) { const [r, c] = queue.shift(); const key = `${r}:${c}`; if (seen.has(key)) continue; seen.add(key); const cell = this.cells[r][c]; if (cell.revealed || cell.flagged || cell.mine) continue; cell.revealed = true; changed.push([r, c]); if (cell.adjacent === 0) queue.push(...this.neighbors(r, c)); }
    const hiddenSafe = this.cells.flat().some((cell) => !cell.mine && !cell.revealed); if (!hiddenSafe) { this.finished = true; this.won = true; }
    return { changed, won: this.won };
  }
  toggleFlag(row, column) { const cell = this.cells[row]?.[column]; if (!cell || cell.revealed || this.finished) return false; cell.flagged = !cell.flagged; return true; }
  get flags() { return this.cells.flat().filter((cell) => cell.flagged).length; }
}
