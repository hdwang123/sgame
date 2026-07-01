export const CARROT_RULES = {
  initialMoney: 240,
  initialHealth: 10,
  towerCost: 100,
  upgradeCost: 120,
  towerRange: 145,
  towerFireDelay: 620,
  bulletSpeed: 480,
  waveDelay: 2200,
};

export const CARROT_PATH = [
  [-30, 170], [145, 170], [145, 420], [330, 420], [330, 235],
  [525, 235], [525, 500], [710, 500], [710, 340], [806, 340],
];

export const CARROT_TOWER_SPOTS = [
  [235, 120], [235, 305], [235, 515], [420, 335],
  [430, 555], [615, 165], [615, 400], [785, 555],
];

export const CARROT_WAVES = [
  { count: 6, health: 2, speed: 54, interval: 820, reward: 24 },
  { count: 8, health: 3, speed: 60, interval: 760, reward: 26 },
  { count: 10, health: 4, speed: 66, interval: 700, reward: 28 },
  { count: 12, health: 5, speed: 72, interval: 650, reward: 30 },
  { count: 14, health: 6, speed: 78, interval: 600, reward: 32 },
  { count: 16, health: 8, speed: 84, interval: 540, reward: 36 },
];
