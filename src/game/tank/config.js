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

const BASE_BREAKABLE_WALLS = [
  [382, 594, 22, 78], [478, 594, 22, 78],
  [402, 558, 38, 22], [458, 558, 38, 22],
];

const LATE_STAGE_ENEMY_SPAWNS = [
  [70, 95], [190, 95], [310, 95], [430, 95], [550, 95], [670, 95], [790, 95],
];

function createTankLevel({ stage, name, subtitle, walls, breakableWalls = [] }) {
  return {
    name,
    subtitle,
    playerSpawn: [430, 510],
    base: [430, 610],
    enemySpeed: Math.min(148, 84 + stage * 7),
    enemyBulletSpeed: Math.min(390, 225 + stage * 16),
    enemyTurnDelay: [Math.max(300, 680 - stage * 38), Math.max(720, 1500 - stage * 65)],
    enemyShotDelay: [Math.max(420, 1120 - stage * 65), Math.max(900, 2200 - stage * 105)],
    clearBonus: 300 + stage * 300,
    walls,
    breakableWalls: [...BASE_BREAKABLE_WALLS, ...breakableWalls],
    enemySpawns: LATE_STAGE_ENEMY_SPAWNS,
  };
}

export const TANK_LEVELS = [
  {
    name: '前线哨站',
    subtitle: 'FRONTIER POST',
    playerSpawn: [430, 510],
    base: [430, 610],
    enemySpeed: 80,
    enemyBulletSpeed: 235,
    enemyTurnDelay: [650, 1500],
    enemyShotDelay: [1100, 2200],
    clearBonus: 500,
    breakableWalls: [...BASE_BREAKABLE_WALLS, [430, 390, 120, 24]],
    walls: [
      [150, 190, 180, 28], [710, 190, 180, 28], [430, 310, 220, 28],
      [180, 450, 230, 28], [680, 450, 230, 28], [330, 560, 28, 130], [530, 560, 28, 130],
    ],
    enemySpawns: [[110, 105], [430, 105], [750, 105], [250, 255], [610, 255]],
  },
  {
    name: '钢铁迷宫',
    subtitle: 'IRON MAZE',
    playerSpawn: [430, 510],
    base: [430, 610],
    enemySpeed: 92,
    enemyBulletSpeed: 265,
    enemyTurnDelay: [520, 1250],
    enemyShotDelay: [900, 1750],
    clearBonus: 800,
    breakableWalls: [...BASE_BREAKABLE_WALLS, [320, 390, 90, 22], [540, 390, 90, 22]],
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
    playerSpawn: [430, 510],
    base: [430, 610],
    enemySpeed: 108,
    enemyBulletSpeed: 300,
    enemyTurnDelay: [400, 950],
    enemyShotDelay: [650, 1350],
    clearBonus: 1200,
    breakableWalls: [...BASE_BREAKABLE_WALLS, [430, 410, 150, 22]],
    walls: [
      [110, 185, 150, 26], [300, 185, 120, 26], [560, 185, 120, 26], [750, 185, 150, 26],
      [220, 315, 26, 170], [640, 315, 26, 170], [430, 300, 210, 26],
      [120, 470, 160, 26], [740, 470, 160, 26], [350, 500, 26, 150], [510, 500, 26, 150],
    ],
    enemySpawns: [[80, 95], [200, 95], [330, 95], [530, 95], [660, 95], [780, 95], [430, 245]],
  },
  createTankLevel({
    stage: 4, name: '荒漠封锁', subtitle: 'DESERT BLOCKADE',
    walls: [
      [170, 200, 220, 26], [690, 200, 220, 26], [430, 270, 26, 140],
      [180, 430, 220, 26], [680, 430, 220, 26],
    ],
    breakableWalls: [[430, 390, 150, 22], [285, 300, 22, 90], [575, 300, 22, 90]],
  }),
  createTankLevel({
    stage: 5, name: '四门要塞', subtitle: 'FOUR GATES',
    walls: [
      [120, 210, 140, 26], [310, 210, 140, 26], [550, 210, 140, 26], [740, 210, 140, 26],
      [220, 370, 26, 170], [640, 370, 26, 170], [430, 440, 180, 26],
    ],
    breakableWalls: [[430, 290, 180, 22], [330, 510, 70, 22], [530, 510, 70, 22]],
  }),
  createTankLevel({
    stage: 6, name: '破碎防线', subtitle: 'BROKEN LINE',
    walls: [
      [150, 190, 170, 24], [380, 190, 140, 24], [650, 190, 190, 24],
      [250, 330, 24, 150], [610, 330, 24, 150],
      [120, 475, 140, 24], [740, 475, 140, 24],
    ],
    breakableWalls: [[430, 330, 190, 22], [330, 460, 22, 100], [530, 460, 22, 100]],
  }),
  createTankLevel({
    stage: 7, name: '双塔通道', subtitle: 'TWIN TOWERS',
    walls: [
      [180, 250, 30, 250], [680, 250, 30, 250],
      [330, 190, 160, 24], [530, 190, 160, 24],
      [330, 410, 160, 24], [530, 410, 160, 24],
    ],
    breakableWalls: [[430, 270, 120, 22], [430, 350, 120, 22], [260, 510, 90, 22], [600, 510, 90, 22]],
  }),
  createTankLevel({
    stage: 8, name: '烈焰回廊', subtitle: 'BLAZING CORRIDOR',
    walls: [
      [130, 185, 150, 24], [730, 185, 150, 24], [430, 180, 220, 24],
      [270, 315, 260, 24], [590, 315, 260, 24],
      [130, 455, 150, 24], [730, 455, 150, 24],
    ],
    breakableWalls: [[430, 390, 180, 22], [260, 530, 80, 22], [600, 530, 80, 22]],
  }),
  createTankLevel({
    stage: 9, name: '极光壁垒', subtitle: 'AURORA BARRIER',
    walls: [
      [210, 180, 260, 24], [650, 180, 260, 24],
      [110, 330, 120, 24], [430, 330, 250, 24], [750, 330, 120, 24],
      [250, 470, 24, 140], [610, 470, 24, 140],
    ],
    breakableWalls: [[260, 255, 100, 22], [600, 255, 100, 22], [430, 470, 150, 22]],
  }),
  createTankLevel({
    stage: 10, name: '终焉王城', subtitle: 'FINAL CITADEL',
    walls: [
      [110, 175, 140, 24], [300, 175, 140, 24], [560, 175, 140, 24], [750, 175, 140, 24],
      [190, 300, 24, 160], [670, 300, 24, 160], [430, 290, 210, 24],
      [120, 455, 150, 24], [740, 455, 150, 24], [300, 475, 24, 110], [560, 475, 24, 110],
    ],
    breakableWalls: [[430, 400, 170, 22], [350, 520, 50, 22], [510, 520, 50, 22]],
  }),
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
