export const TANK_RULES = {
  playerSpeed: 165,
  enemySpeed: 80,
  playerBulletSpeed: 360,
  enemyBulletSpeed: 235,
  shotCooldown: 280,
  hitImmunity: 700,
  enemyScore: 200,
  initialLives: 3,
};

export const TANK_ARENA = {
  x: 22,
  y: 58,
  width: 816,
  height: 580,
};

export const TANK_WALLS = [
  [150, 190, 180, 28], [710, 190, 180, 28], [430, 310, 220, 28],
  [180, 450, 230, 28], [680, 450, 230, 28], [330, 560, 28, 130], [530, 560, 28, 130],
];

export const ENEMY_SPAWNS = [[110, 105], [430, 105], [750, 105], [250, 255], [610, 255]];

export const TANK_DIRECTIONS = [
  { x: 0, y: -1, angle: 0 },
  { x: 1, y: 0, angle: 90 },
  { x: 0, y: 1, angle: 180 },
  { x: -1, y: 0, angle: -90 },
];
