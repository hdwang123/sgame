import { LINK_MATCH_RULES } from './config.js';

export class LinkMatchGame {
  constructor(random = Math.random) {
    this.random = random;
    this.reset();
  }

  reset() {
    this.score = 0;
    this.shuffles = LINK_MATCH_RULES.initialShuffles;
    this.remaining = LINK_MATCH_RULES.rows * LINK_MATCH_RULES.columns;
    this.board = Array.from(
      { length: LINK_MATCH_RULES.rows + 2 },
      () => Array(LINK_MATCH_RULES.columns + 2).fill(0),
    );
    const values = [];
    for (let pair = 0; pair < this.remaining / 2; pair += 1) {
      const type = pair % LINK_MATCH_RULES.iconTypes + 1;
      values.push(type, type);
    }
    this.shuffleArray(values);
    let index = 0;
    for (let row = 1; row <= LINK_MATCH_RULES.rows; row += 1) {
      for (let column = 1; column <= LINK_MATCH_RULES.columns; column += 1) {
        this.board[row][column] = values[index];
        index += 1;
      }
    }
    this.ensureMove();
  }

  tileAt(position) {
    return this.board[position.row]?.[position.column] ?? 0;
  }

  removePair(first, second) {
    const type = this.tileAt(first);
    if (!type || type !== this.tileAt(second)) return null;
    const path = this.findPath(first, second);
    if (!path) return null;
    this.board[first.row][first.column] = 0;
    this.board[second.row][second.column] = 0;
    this.remaining -= 2;
    this.score += LINK_MATCH_RULES.pairScore;
    return path;
  }

  findPath(first, second) {
    if (first.row === second.row && first.column === second.column) return null;
    if (this.segmentClear(first, second)) return [first, second];
    const oneTurn = this.findOneTurn(first, second);
    if (oneTurn) return oneTurn;

    for (let row = 0; row < this.board.length; row += 1) {
      for (let column = 0; column < this.board[0].length; column += 1) {
        if (this.board[row][column] !== 0) continue;
        const pivot = { row, column };
        if (!this.segmentClear(first, pivot)) continue;
        const tail = this.findOneTurn(pivot, second);
        if (tail) return [first, ...tail];
      }
    }
    return null;
  }

  findOneTurn(first, second) {
    if (this.segmentClear(first, second)) return [first, second];
    const corners = [
      { row: first.row, column: second.column },
      { row: second.row, column: first.column },
    ];
    for (const corner of corners) {
      if (this.tileAt(corner) !== 0) continue;
      if (this.segmentClear(first, corner) && this.segmentClear(corner, second)) {
        return [first, corner, second];
      }
    }
    return null;
  }

  segmentClear(first, second) {
    if (first.row !== second.row && first.column !== second.column) return false;
    if (first.row === second.row) {
      const start = Math.min(first.column, second.column) + 1;
      const end = Math.max(first.column, second.column);
      for (let column = start; column < end; column += 1) {
        if (this.board[first.row][column] !== 0) return false;
      }
      return true;
    }
    const start = Math.min(first.row, second.row) + 1;
    const end = Math.max(first.row, second.row);
    for (let row = start; row < end; row += 1) {
      if (this.board[row][first.column] !== 0) return false;
    }
    return true;
  }

  hasAvailablePair() {
    const positionsByType = new Map();
    for (let row = 1; row <= LINK_MATCH_RULES.rows; row += 1) {
      for (let column = 1; column <= LINK_MATCH_RULES.columns; column += 1) {
        const type = this.board[row][column];
        if (!type) continue;
        if (!positionsByType.has(type)) positionsByType.set(type, []);
        positionsByType.get(type).push({ row, column });
      }
    }
    for (const positions of positionsByType.values()) {
      for (let first = 0; first < positions.length; first += 1) {
        for (let second = first + 1; second < positions.length; second += 1) {
          if (this.findPath(positions[first], positions[second])) return true;
        }
      }
    }
    return false;
  }

  shuffleRemaining(useCredit = true) {
    if (useCredit && this.shuffles <= 0) return false;
    const positions = [];
    const values = [];
    for (let row = 1; row <= LINK_MATCH_RULES.rows; row += 1) {
      for (let column = 1; column <= LINK_MATCH_RULES.columns; column += 1) {
        if (!this.board[row][column]) continue;
        positions.push({ row, column });
        values.push(this.board[row][column]);
      }
    }
    if (useCredit) this.shuffles -= 1;
    for (let attempt = 0; attempt < 80; attempt += 1) {
      this.shuffleArray(values);
      positions.forEach((position, index) => {
        this.board[position.row][position.column] = values[index];
      });
      if (this.hasAvailablePair()) return true;
    }
    return this.hasAvailablePair();
  }

  ensureMove() {
    if (this.remaining && !this.hasAvailablePair()) this.shuffleRemaining(false);
  }

  shuffleArray(values) {
    for (let index = values.length - 1; index > 0; index -= 1) {
      const swap = Math.floor(this.random() * (index + 1));
      [values[index], values[swap]] = [values[swap], values[index]];
    }
  }
}
