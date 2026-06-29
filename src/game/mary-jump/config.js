export const MARY_JUMP_RULES = {
  moveSpeed: 230,
  jumpSpeed: 520,
  stompBounce: 330,
  coinScore: 100,
  enemyScore: 200,
  levelBonus: 500,
};

function createMaryJumpLevel({ name, subtitle, width, gravity, enemySpeed, variant }) {
  const segmentCount = 7;
  const gapWidth = 76 + variant * 5;
  const segmentWidth = (width - gapWidth * (segmentCount - 1)) / segmentCount;
  const platforms = [];
  const hazards = [];
  const enemies = [];

  for (let index = 0; index < segmentCount; index += 1) {
    const startX = index * (segmentWidth + gapWidth);
    platforms.push([startX + segmentWidth / 2, 650, segmentWidth, 60]);
    if (index < segmentCount - 1) {
      hazards.push([startX + segmentWidth + gapWidth / 2, 638, gapWidth, 28]);
    }
    if (index > 0 && index < segmentCount - 1) {
      enemies.push({
        x: startX + segmentWidth / 2,
        y: 590,
        minX: startX + 55,
        maxX: startX + segmentWidth - 55,
      });
    }
  }

  const coins = [];
  const platformCount = 9 + (variant % 3);
  for (let index = 0; index < platformCount; index += 1) {
    const x = 330 + index * ((width - 660) / Math.max(1, platformCount - 1));
    const yPattern = [510, 420, 535, 390, 480];
    const y = yPattern[(index + variant) % yPattern.length];
    const platformWidth = 150 + ((index + variant) % 3) * 20;
    platforms.push([x, y, platformWidth, 24]);
    coins.push([x, y - 45]);
  }

  return {
    name,
    subtitle,
    width,
    height: 680,
    gravity,
    enemySpeed,
    spawn: { x: 100, y: 550 },
    goal: { x: width - 100, y: 550 },
    platforms,
    coins,
    enemies,
    hazards,
  };
}

export const MARY_JUMP_LEVELS = [
  createMaryJumpLevel({
    name: '落日遗迹', subtitle: 'SUNSET RUINS', width: 2700,
    gravity: 960, enemySpeed: 68, variant: 0,
  }),
  createMaryJumpLevel({
    name: '熔岩裂谷', subtitle: 'LAVA RIFT', width: 2800,
    gravity: 975, enemySpeed: 76, variant: 1,
  }),
  createMaryJumpLevel({
    name: '星空要塞', subtitle: 'STAR FORTRESS', width: 2900,
    gravity: 985, enemySpeed: 82, variant: 2,
  }),
  createMaryJumpLevel({
    name: '翡翠林地', subtitle: 'EMERALD GROVE', width: 3000,
    gravity: 990, enemySpeed: 86, variant: 1,
  }),
  createMaryJumpLevel({
    name: '风车峡谷', subtitle: 'WINDMILL CANYON', width: 3150,
    gravity: 1010, enemySpeed: 92, variant: 2,
  }),
  createMaryJumpLevel({
    name: '水晶矿洞', subtitle: 'CRYSTAL CAVE', width: 3250,
    gravity: 1020, enemySpeed: 98, variant: 3,
  }),
  createMaryJumpLevel({
    name: '雷鸣高地', subtitle: 'THUNDER HEIGHTS', width: 3350,
    gravity: 1030, enemySpeed: 104, variant: 4,
  }),
  createMaryJumpLevel({
    name: '冰霜长桥', subtitle: 'FROST BRIDGE', width: 3450,
    gravity: 1040, enemySpeed: 110, variant: 5,
  }),
  createMaryJumpLevel({
    name: '月影神殿', subtitle: 'MOON TEMPLE', width: 3550,
    gravity: 1050, enemySpeed: 116, variant: 6,
  }),
  createMaryJumpLevel({
    name: '天空王城', subtitle: 'SKY CITADEL', width: 3700,
    gravity: 1060, enemySpeed: 122, variant: 7,
  }),
];

// Backward-compatible aliases for code or tests that still expect the first map.
export const MARY_JUMP_WORLD = MARY_JUMP_LEVELS[0];
export const MARY_JUMP_PLATFORMS = MARY_JUMP_LEVELS[0].platforms;
export const MARY_JUMP_COINS = MARY_JUMP_LEVELS[0].coins;
export const MARY_JUMP_ENEMIES = MARY_JUMP_LEVELS[0].enemies.map(({ x }) => x);
