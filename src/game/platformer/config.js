export const PLATFORMER_WORLD = {
  width: 2600,
  height: 680,
  gravity: 980,
  spawn: { x: 120, y: 560 },
  goal: { x: 2500, y: 560 },
};

export const PLATFORMS = [
  [1300, 650, 2600, 60],
  [420, 520, 220, 24],
  [740, 430, 170, 24],
  [1040, 550, 180, 24],
  [1350, 450, 220, 24],
  [1690, 535, 150, 24],
  [1970, 410, 180, 24],
  [2260, 525, 190, 24],
];

export const COINS = [[430, 475], [740, 385], [1050, 505], [1330, 405], [1710, 490], [1980, 365], [2270, 480]];
export const ENEMIES = [620, 1160, 1540, 2140];

export const PLATFORMER_RULES = {
  moveSpeed: 230,
  jumpSpeed: 520,
  enemySpeed: 70,
  stompBounce: 330,
  coinScore: 100,
  enemyScore: 200,
};
