const THEMES = [
  { name: 'village', setting: 'outdoor', sky: 0x9bd6eb, ground: 0x74b65b, objects: ['sun', 'cloud', 'house', 'tree', 'flower', 'fence', 'pond', 'kite'] },
  { name: 'beach', setting: 'outdoor', sky: 0x74c0fc, ground: 0xffd89b, objects: ['sun', 'cloud', 'boat', 'umbrella', 'ball', 'palm', 'fish', 'shell'] },
  { name: 'space', setting: 'space', sky: 0x17113f, ground: 0x302b63, objects: ['planet', 'rocket', 'star', 'moon', 'ufo', 'comet', 'satellite', 'planet'] },
  { name: 'forest', setting: 'outdoor', sky: 0x8ed1b2, ground: 0x3d7d46, objects: ['tree', 'pine', 'mushroom', 'pond', 'flower', 'fox', 'cloud', 'butterfly'] },
  { name: 'farm', setting: 'outdoor', sky: 0x91d5ff, ground: 0x91b75b, objects: ['sun', 'barn', 'tractor', 'hay', 'fence', 'cow', 'cloud', 'flower'] },
  { name: 'ocean', setting: 'ocean', sky: 0x1971c2, ground: 0x0b4f8a, objects: ['fish', 'bubble', 'coral', 'submarine', 'octopus', 'shell', 'starfish', 'treasure'] },
  { name: 'desert', setting: 'outdoor', sky: 0xffc078, ground: 0xd99b50, objects: ['sun', 'cactus', 'pyramid', 'dune', 'camel', 'cloud', 'rock', 'tent'] },
  { name: 'snow', setting: 'outdoor', sky: 0xbfe3f2, ground: 0xf1f5f8, objects: ['snowman', 'pine', 'cabin', 'moon', 'sled', 'snowflake', 'cloud', 'gift'] },
  { name: 'city', setting: 'outdoor', sky: 0x91a7ff, ground: 0x495057, objects: ['building', 'car', 'light', 'cloud', 'bus', 'tree', 'lamp', 'sign'] },
  { name: 'park', setting: 'outdoor', sky: 0xa5d8ff, ground: 0x69b85a, objects: ['tree', 'bench', 'kite', 'swing', 'ball', 'flower', 'cloud', 'fountain'] },
  { name: 'livingRoom', setting: 'indoor', sky: 0xffe8cc, ground: 0xb08968, objects: ['sofa', 'table', 'chair', 'lamp', 'television', 'rug', 'plant', 'clock'] },
  { name: 'bedroom', setting: 'indoor', sky: 0xe5dbff, ground: 0xc9ada7, objects: ['bed', 'wardrobe', 'pillow', 'desk', 'window', 'book', 'teddy', 'clock'] },
  { name: 'kitchen', setting: 'indoor', sky: 0xfff3bf, ground: 0xced4da, objects: ['fridge', 'stove', 'sink', 'cabinet', 'kettle', 'plate', 'table', 'plant'] },
  { name: 'classroom', setting: 'indoor', sky: 0xd3f9d8, ground: 0xa98467, objects: ['blackboard', 'desk', 'chair', 'book', 'globe', 'pencil', 'backpack', 'clock'] },
  { name: 'toyRoom', setting: 'indoor', sky: 0xffdeeb, ground: 0xdeb887, objects: ['teddy', 'toytrain', 'blocks', 'doll', 'drum', 'robot', 'ball', 'kite'] },
  { name: 'pirates', setting: 'cartoon', sky: 0x74c0fc, ground: 0x228be6, objects: ['pirate', 'boat', 'treasure', 'parrot', 'map', 'barrel', 'island', 'flag'] },
  { name: 'robotLab', setting: 'indoor', sky: 0x343a40, ground: 0x212529, objects: ['robot', 'gear', 'battery', 'antenna', 'screen', 'wrench', 'lamp', 'blocks'] },
  { name: 'magicSchool', setting: 'cartoon', sky: 0x3b2b63, ground: 0x5f3dc4, objects: ['wizard', 'hat', 'wand', 'potion', 'cauldron', 'owl', 'book', 'moon'] },
  { name: 'circus', setting: 'cartoon', sky: 0xffd8a8, ground: 0xf08c46, objects: ['clown', 'tent', 'balloon', 'elephant', 'drum', 'hoop', 'star', 'flag'] },
  { name: 'superheroes', setting: 'cartoon', sky: 0x91a7ff, ground: 0x495057, objects: ['hero', 'cape', 'mask', 'shield', 'star', 'building', 'cloud', 'light'] },
];

const POSITIONS = [
  { x: 48, y: 65 }, { x: 165, y: 62 }, { x: 232, y: 125 }, { x: 78, y: 185 },
  { x: 180, y: 205 }, { x: 235, y: 290 }, { x: 75, y: 330 }, { x: 165, y: 360 },
];

function colorShift(color, step) {
  const r = Math.min(255, Math.max(0, ((color >> 16) & 255) + step));
  const g = Math.min(255, Math.max(0, ((color >> 8) & 255) + Math.floor(step / 2)));
  const b = Math.min(255, Math.max(0, (color & 255) - Math.floor(step / 3)));
  return (r << 16) | (g << 8) | b;
}

function createLevel(index) {
  const theme = THEMES[Math.floor(index / 5)];
  const variant = index % 5;
  const objects = theme.objects.map((kind, slot) => {
    const position = POSITIONS[(slot * 3 + variant * 5) % POSITIONS.length];
    const jitterX = ((index * 17 + slot * 29) % 25) - 12;
    const jitterY = ((index * 23 + slot * 11) % 21) - 10;
    return {
      id: `${kind}-${slot}`, kind,
      x: Math.max(35, Math.min(245, position.x + jitterX)),
      y: Math.max(45, Math.min(375, position.y + jitterY)),
      size: 0.82 + ((index + slot * 3) % 7) * 0.06,
      colorIndex: (variant + slot) % 6,
    };
  });
  const differenceIds = new Set(Array.from({ length: 5 }, (_, offset) => objects[(variant * 3 + offset * 5) % objects.length].id));
  const differences = objects.filter((object) => differenceIds.has(object.id)).map(({ id, x, y }) => ({ id, x, y }));
  return {
    number: index + 1, theme: theme.name, setting: theme.setting, variant,
    sky: colorShift(theme.sky, (variant - 4) * 4),
    ground: colorShift(theme.ground, (4 - variant) * 3),
    objects, differences,
  };
}

export const SPOT_LEVELS = Array.from({ length: 100 }, (_, index) => createLevel(index));

export class SpotDifferenceGame {
  constructor(levelIndex = 0) { this.levelIndex = levelIndex; this.found = new Set(); this.mistakes = 0; this.score = 0; }
  get level() { return SPOT_LEVELS[this.levelIndex]; }
  get differences() { return this.level.differences; }
  find(id) { if (!this.differences.some((item) => item.id === id) || this.found.has(id)) return false; this.found.add(id); this.score += 250; return true; }
  miss() { this.mistakes += 1; this.score = Math.max(0, this.score - 25); }
  nextLevel() { if (!this.complete || this.levelIndex >= SPOT_LEVELS.length - 1) return false; this.levelIndex += 1; this.found.clear(); return true; }
  get complete() { return this.found.size === this.differences.length; }
  get allComplete() { return this.complete && this.levelIndex === SPOT_LEVELS.length - 1; }
}
