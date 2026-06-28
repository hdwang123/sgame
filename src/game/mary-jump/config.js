export const MARY_JUMP_RULES = {
  moveSpeed: 230,
  jumpSpeed: 520,
  stompBounce: 330,
  coinScore: 100,
  enemyScore: 200,
  levelBonus: 500,
};

export const MARY_JUMP_LEVELS = [
  {
    name: '落日遗迹',
    subtitle: 'SUNSET RUINS',
    width: 2600,
    height: 680,
    gravity: 980,
    enemySpeed: 70,
    spawn: { x: 120, y: 560 },
    goal: { x: 2500, y: 560 },
    platforms: [
      [1300, 650, 2600, 60],
      [420, 520, 220, 24], [740, 430, 170, 24], [1040, 550, 180, 24],
      [1350, 450, 220, 24], [1690, 535, 150, 24], [1970, 410, 180, 24],
      [2260, 525, 190, 24],
    ],
    coins: [[430, 475], [740, 385], [1050, 505], [1330, 405], [1710, 490], [1980, 365], [2270, 480]],
    enemies: [
      { x: 620, y: 590, minX: 510, maxX: 720 },
      { x: 1160, y: 590, minX: 1060, maxX: 1280 },
      { x: 1540, y: 590, minX: 1430, maxX: 1650 },
      { x: 2140, y: 590, minX: 2030, maxX: 2240 },
    ],
    hazards: [],
  },
  {
    name: '熔岩裂谷',
    subtitle: 'LAVA RIFT',
    width: 3000,
    height: 680,
    gravity: 1000,
    enemySpeed: 82,
    spawn: { x: 110, y: 550 },
    goal: { x: 2900, y: 550 },
    platforms: [
      [310, 650, 620, 60], [890, 650, 400, 60], [1450, 650, 560, 60],
      [2050, 650, 420, 60], [2660, 650, 680, 60],
      [500, 505, 190, 24], [790, 420, 180, 24], [1120, 520, 190, 24],
      [1460, 430, 180, 24], [1770, 520, 170, 24], [2070, 405, 190, 24],
      [2390, 505, 190, 24], [2700, 420, 180, 24],
    ],
    coins: [[500, 460], [790, 375], [1120, 475], [1460, 385], [1770, 475], [2070, 360], [2390, 460], [2700, 375]],
    enemies: [
      { x: 360, y: 590, minX: 180, maxX: 540 },
      { x: 950, y: 590, minX: 760, maxX: 1060 },
      { x: 1450, y: 590, minX: 1260, maxX: 1640 },
      { x: 2070, y: 590, minX: 1920, maxX: 2180 },
      { x: 2680, y: 590, minX: 2470, maxX: 2830 },
    ],
    hazards: [[620, 638, 160, 28], [1160, 638, 140, 28], [1785, 638, 110, 28], [2290, 638, 60, 28]],
  },
  {
    name: '星空要塞',
    subtitle: 'STAR FORTRESS',
    width: 3400,
    height: 680,
    gravity: 1030,
    enemySpeed: 96,
    spawn: { x: 100, y: 550 },
    goal: { x: 3300, y: 540 },
    platforms: [
      [260, 650, 520, 60], [800, 650, 360, 60], [1330, 650, 460, 60],
      [1870, 650, 380, 60], [2400, 650, 480, 60], [3080, 650, 640, 60],
      [420, 500, 170, 24], [700, 405, 160, 24], [980, 510, 170, 24],
      [1260, 420, 170, 24], [1550, 520, 180, 24], [1830, 410, 160, 24],
      [2110, 505, 170, 24], [2400, 395, 180, 24], [2700, 510, 170, 24],
      [3010, 420, 170, 24], [3260, 520, 190, 24],
    ],
    coins: [[420, 455], [700, 360], [980, 465], [1260, 375], [1550, 475], [1830, 365], [2110, 460], [2400, 350], [2700, 465], [3010, 375], [3260, 475]],
    enemies: [
      { x: 290, y: 590, minX: 130, maxX: 450 },
      { x: 800, y: 590, minX: 670, maxX: 930 },
      { x: 1330, y: 590, minX: 1160, maxX: 1500 },
      { x: 1870, y: 590, minX: 1730, maxX: 2010 },
      { x: 2400, y: 590, minX: 2220, maxX: 2580 },
      { x: 3050, y: 590, minX: 2840, maxX: 3220 },
    ],
    hazards: [[570, 638, 100, 28], [1040, 638, 120, 28], [1620, 638, 120, 28], [2110, 638, 100, 28], [2700, 638, 120, 28]],
  },
];

// Backward-compatible aliases for code or tests that still expect the first map.
export const MARY_JUMP_WORLD = MARY_JUMP_LEVELS[0];
export const MARY_JUMP_PLATFORMS = MARY_JUMP_LEVELS[0].platforms;
export const MARY_JUMP_COINS = MARY_JUMP_LEVELS[0].coins;
export const MARY_JUMP_ENEMIES = MARY_JUMP_LEVELS[0].enemies.map(({ x }) => x);
