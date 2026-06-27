export const BOARD_WIDTH = 10;
export const BOARD_HEIGHT = 20;
export const CELL_SIZE = 28;

export const PIECES = {
  I: { color: 0x38d9ff, cells: [[0, 1], [1, 1], [2, 1], [3, 1]] },
  O: { color: 0xffd43b, cells: [[1, 0], [2, 0], [1, 1], [2, 1]] },
  T: { color: 0xc77dff, cells: [[1, 0], [0, 1], [1, 1], [2, 1]] },
  S: { color: 0x69db7c, cells: [[1, 0], [2, 0], [0, 1], [1, 1]] },
  Z: { color: 0xff6b6b, cells: [[0, 0], [1, 0], [1, 1], [2, 1]] },
  J: { color: 0x5c7cfa, cells: [[0, 0], [0, 1], [1, 1], [2, 1]] },
  L: { color: 0xff922b, cells: [[2, 0], [0, 1], [1, 1], [2, 1]] },
};

export const PIECE_NAMES = Object.keys(PIECES);

export function rotateCells(cells) {
  return cells.map(([x, y]) => [3 - y, x]);
}

export function createEmptyBoard() {
  return Array.from({ length: BOARD_HEIGHT }, () => Array(BOARD_WIDTH).fill(null));
}
