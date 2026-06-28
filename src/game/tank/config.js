export const TANK_RULES = {
  playerSpeed: 165,
  playerBulletSpeed: 360,
  shotCooldown: 280,
  hitImmunity: 1100,
  enemyScore: 200,
  initialLives: 3,
};

export const TANK_ARENA = {
  x: 22,
  y: 58,
  width: 816,
  height: 580,
};

export const TANK_LEVELS = [
  {
    name: '前线哨站',
    subtitle: 'FRONTIER POST',
    playerSpawn: [430, 540],
    base: [430, 610],
    enemySpeed: 80,
    enemyBulletSpeed: 235,
    enemyTurnDelay: [650, 1500],
    enemyShotDelay: [1100, 2200],
    clearBonus: 500,
    walls: [
      [150, 190, 180, 28], [710, 190, 180, 28], [430, 310, 220, 28],
      [180, 450, 230, 28], [680, 450, 230, 28], [330, 560, 28, 130], [530, 560, 28, 130],
    ],
    enemySpawns: [[110, 105], [430, 105], [750, 105], [250, 255], [610, 255]],
  },
  {
    name: '钢铁迷宫',
    subtitle: 'IRON MAZE',
    playerSpawn: [430, 535],
    base: [430, 610],
    enemySpeed: 92,
    enemyBulletSpeed: 265,
    enemyTurnDelay: [520, 1250],
    enemyShotDelay: [900, 1750],
    clearBonus: 800,
    walls: [
      [150, 170, 180, 26], [710, 170, 180, 26], [430, 185, 26, 90],
      [205, 310, 210, 26], [655, 310, 210, 26], [120, 440, 150, 26],
      [740, 440, 150, 26], [280, 515, 26, 110], [580, 515, 26, 110],
    ],
    enemySpawns: [[90, 95], [270, 95], [590, 95], [770, 95], [190, 255], [670, 255]],
  },
  {
    name: '暗夜围城',
    subtitle: 'NIGHT SIEGE',
    playerSpawn: [430, 535],
    base: [430, 610],
    enemySpeed: 108,
    enemyBulletSpeed: 300,
    enemyTurnDelay: [400, 950],
    enemyShotDelay: [650, 1350],
    clearBonus: 1200,
    walls: [
      [110, 185, 150, 26], [300, 185, 120, 26], [560, 185, 120, 26], [750, 185, 150, 26],
      [220, 315, 26, 170], [640, 315, 26, 170], [430, 300, 210, 26],
      [120, 470, 160, 26], [740, 470, 160, 26], [350, 500, 26, 150], [510, 500, 26, 150],
    ],
    enemySpawns: [[80, 95], [200, 95], [330, 95], [530, 95], [660, 95], [780, 95], [430, 245]],
  },
];

export const TANK_DIRECTIONS = [
  { x: 0, y: -1, angle: 0 },
  { x: 1, y: 0, angle: 90 },
  { x: 0, y: 1, angle: 180 },
  { x: -1, y: 0, angle: -90 },
];

// Backward-compatible aliases for the original first stage.
export const TANK_WALLS = TANK_LEVELS[0].walls;
export const ENEMY_SPAWNS = TANK_LEVELS[0].enemySpawns;
