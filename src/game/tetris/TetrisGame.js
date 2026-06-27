import { BOARD_HEIGHT, BOARD_WIDTH, PIECES, PIECE_NAMES, createEmptyBoard, rotateCells } from './config.js';

function shuffle(items, random) {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export class TetrisGame {
  constructor(random = Math.random) {
    this.random = random;
    this.reset();
  }

  reset() {
    this.board = createEmptyBoard();
    this.bag = [];
    this.score = 0;
    this.lines = 0;
    this.level = 1;
    this.gameOver = false;
    this.nextPiece = this.takeFromBag();
    this.spawnPiece();
  }

  takeFromBag() {
    if (this.bag.length === 0) this.bag = shuffle(PIECE_NAMES, this.random);
    return this.bag.pop();
  }

  spawnPiece() {
    const name = this.nextPiece;
    this.nextPiece = this.takeFromBag();
    this.activePiece = {
      name,
      color: PIECES[name].color,
      cells: PIECES[name].cells.map((cell) => [...cell]),
      x: 3,
      y: -1,
    };
    if (this.collides(this.activePiece)) this.gameOver = true;
    return !this.gameOver;
  }

  move(direction) {
    if (this.gameOver) return false;
    const candidate = { ...this.activePiece, x: this.activePiece.x + direction };
    if (this.collides(candidate)) return false;
    this.activePiece.x = candidate.x;
    return true;
  }

  rotate(direction) {
    if (this.gameOver || this.activePiece.name === 'O') return false;
    let cells = this.activePiece.cells;
    const rotations = direction > 0 ? 1 : 3;
    for (let i = 0; i < rotations; i += 1) cells = rotateCells(cells);
    for (const offset of [0, -1, 1, -2, 2]) {
      const candidate = { ...this.activePiece, cells, x: this.activePiece.x + offset };
      if (!this.collides(candidate)) {
        this.activePiece.cells = cells;
        this.activePiece.x += offset;
        return true;
      }
    }
    return false;
  }

  tick(softDrop = false) {
    if (this.gameOver) return { moved: false, locked: false, cleared: 0 };
    if (this.stepDown()) {
      if (softDrop) this.score += 1;
      return { moved: true, locked: false, cleared: 0 };
    }
    return this.lockPiece();
  }

  hardDrop() {
    if (this.gameOver) return { distance: 0, cleared: 0 };
    let distance = 0;
    while (this.stepDown()) distance += 1;
    this.score += distance * 2;
    const result = this.lockPiece();
    return { ...result, distance };
  }

  stepDown() {
    const candidate = { ...this.activePiece, y: this.activePiece.y + 1 };
    if (this.collides(candidate)) return false;
    this.activePiece.y += 1;
    return true;
  }

  collides(piece) {
    return piece.cells.some(([cx, cy]) => {
      const x = piece.x + cx;
      const y = piece.y + cy;
      return x < 0 || x >= BOARD_WIDTH || y >= BOARD_HEIGHT || (y >= 0 && this.board[y][x]);
    });
  }

  lockPiece() {
    this.activePiece.cells.forEach(([cx, cy]) => {
      const x = this.activePiece.x + cx;
      const y = this.activePiece.y + cy;
      if (y >= 0) this.board[y][x] = this.activePiece.color;
    });
    const cleared = this.clearLines();
    this.spawnPiece();
    return { moved: false, locked: true, cleared, gameOver: this.gameOver };
  }

  clearLines() {
    let cleared = 0;
    this.board = this.board.filter((row) => {
      if (!row.every(Boolean)) return true;
      cleared += 1;
      return false;
    });
    while (this.board.length < BOARD_HEIGHT) this.board.unshift(Array(BOARD_WIDTH).fill(null));
    if (cleared) {
      this.score += [0, 100, 300, 500, 800][cleared] * this.level;
      this.lines += cleared;
      this.level = Math.floor(this.lines / 10) + 1;
    }
    return cleared;
  }

  ghostY() {
    let y = this.activePiece.y;
    while (!this.collides({ ...this.activePiece, y: y + 1 })) y += 1;
    return y;
  }

  get dropInterval() {
    return Math.max(90, 760 - (this.level - 1) * 65);
  }
}
