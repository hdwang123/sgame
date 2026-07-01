import assert from 'node:assert/strict';
import { TetrisGame } from '../src/game/tetris/TetrisGame.js';
import { SnakeGame } from '../src/game/snake/SnakeGame.js';
import { MaryJumpGame } from '../src/game/mary-jump/MaryJumpGame.js';
import { MARY_JUMP_LEVELS } from '../src/game/mary-jump/config.js';
import { TankGame } from '../src/game/tank/TankGame.js';
import { ENEMY_SPAWNS, TANK_ARENA, TANK_LEVELS } from '../src/game/tank/config.js';
import { CarrotDefenseGame } from '../src/game/carrot-defense/CarrotDefenseGame.js';
import { CARROT_PATH, CARROT_TOWER_SPOTS, CARROT_WAVES } from '../src/game/carrot-defense/config.js';
import { LinkMatchGame } from '../src/game/link-match/LinkMatchGame.js';
import { LINK_MATCH_RULES } from '../src/game/link-match/config.js';

const tetris = new TetrisGame(() => 0.5);
assert.equal(tetris.board.length, 20);
assert.equal(tetris.board[0].length, 10);
assert.ok(tetris.activePiece);
assert.ok(tetris.hardDrop().distance >= 0);
assert.ok(tetris.board.some((row) => row.some(Boolean)));

const snake = new SnakeGame({ columns: 8, rows: 6, random: () => 0 });
assert.equal(snake.setSpeed('slow'), true);
assert.equal(snake.speed, 235);
assert.equal(snake.setSpeed('normal'), true);
assert.equal(snake.speed, 175);
assert.equal(snake.setSpeed('fast'), true);
assert.equal(snake.speed, 125);
assert.equal(snake.setSpeed('invalid'), false);
assert.equal(snake.turn(-1, 0), false);
assert.equal(snake.turn(0, -1), true);
assert.equal(snake.step().gameOver, false);
snake.snake = [{ x: 0, y: 0 }];
snake.direction = { x: -1, y: 0 };
snake.nextDirection = { x: -1, y: 0 };
assert.equal(snake.step().gameOver, true);

const maryJump = new MaryJumpGame();
assert.equal(maryJump.collectCoin(), 100);
assert.equal(maryJump.defeatEnemy(), 300);
assert.equal(maryJump.collectPowerUp('mushroom'), 600);
assert.equal(maryJump.collectPowerUp('flower'), 1100);
assert.equal(maryJump.isStomp({ y: 10, velocityY: 200 }, { y: 30 }), true);
assert.equal(maryJump.isStomp(
  { y: 10, velocityY: 40 },
  { y: 40 },
), true);
assert.equal(maryJump.isStomp(
  { y: 35, velocityY: 80 },
  { y: 40 },
), false);
assert.equal(maryJump.finish('won'), true);
assert.equal(MARY_JUMP_LEVELS.length, 10);
MARY_JUMP_LEVELS.forEach((level) => {
  assert.ok(level.goal.x < level.width);
  assert.ok(level.platforms.length > 0);
  assert.ok(level.coins.length > 0);
  assert.ok(level.powerUps.some(({ type }) => type === 'mushroom'));
  assert.ok(level.powerUps.some(({ type }) => type === 'flower'));
});

const tank = new TankGame(() => 0);
assert.equal(tank.canPlayerShoot(1000), true);
assert.equal(tank.canPlayerShoot(1100), false);
tank.hitEnemy(2);
assert.equal(tank.score, 200);
assert.equal(tank.hitEnemy(0), true);
assert.equal(tank.finished, false);
tank.addStageBonus(500);
assert.equal(tank.score, 900);
tank.hitPlayer();
assert.equal(tank.lives, 2);
tank.addLife();
assert.equal(tank.lives, 3);
for (const [x, y] of ENEMY_SPAWNS) {
  assert.ok(x >= TANK_ARENA.x + 22 && x <= TANK_ARENA.x + TANK_ARENA.width - 22);
  assert.ok(y >= TANK_ARENA.y + 21 && y <= TANK_ARENA.y + TANK_ARENA.height - 21);
}
assert.equal(tank.finish(false), true);
assert.equal(tank.won, false);
assert.equal(TANK_LEVELS.length, 10);
TANK_LEVELS.forEach((level) => {
  assert.ok(level.walls.length > 0);
  assert.ok(level.breakableWalls.length >= 4);
  assert.ok(level.breakableWalls.some(([x, y, width]) => (
    x === level.base[0] && y < level.base[1] && width >= 100
  )));
  assert.ok(level.enemySpawns.length > 0);
  assert.ok(level.enemySpeed > 0);
  [...level.enemySpawns, level.playerSpawn, level.base].forEach(([x, y]) => {
    assert.ok(x >= TANK_ARENA.x && x <= TANK_ARENA.x + TANK_ARENA.width);
    assert.ok(y >= TANK_ARENA.y && y <= TANK_ARENA.y + TANK_ARENA.height);
  });
  [...level.enemySpawns, level.playerSpawn].forEach(([x, y]) => {
    const intersectsWall = [...level.walls, ...level.breakableWalls].some(([wallX, wallY, width, height]) => (
      Math.abs(x - wallX) < width / 2 + 22 && Math.abs(y - wallY) < height / 2 + 26
    ));
    assert.equal(intersectsWall, false);
  });
});

const carrot = new CarrotDefenseGame();
assert.equal(carrot.buildTower(0), true);
assert.equal(carrot.buildTower(0), false);
assert.equal(carrot.upgradeTower(0), true);
assert.equal(carrot.towers.get(0), 2);
carrot.reward(100);
assert.equal(carrot.upgradeTower(0), true);
assert.equal(carrot.towers.get(0), 3);
assert.equal(carrot.upgradeTower(0), false);
assert.equal(carrot.damageCarrot(3), 7);
assert.ok(CARROT_PATH.length >= 6);
assert.ok(CARROT_TOWER_SPOTS.length >= 6);
assert.ok(CARROT_WAVES.length >= 5);
const carrotWin = new CarrotDefenseGame();
CARROT_WAVES.forEach(() => carrotWin.completeWave());
assert.equal(carrotWin.finished, true);
assert.equal(carrotWin.won, true);
const carrotLoss = new CarrotDefenseGame();
carrotLoss.damageCarrot(99);
assert.equal(carrotLoss.finished, true);
assert.equal(carrotLoss.won, false);

const linkMatch = new LinkMatchGame(() => 0.37);
assert.equal(linkMatch.remaining, LINK_MATCH_RULES.rows * LINK_MATCH_RULES.columns);
assert.equal(linkMatch.hasAvailablePair(), true);
linkMatch.board.forEach((row) => row.fill(0));
linkMatch.board[2][2] = 1;
linkMatch.board[4][4] = 1;
linkMatch.board[2][4] = 2;
linkMatch.board[4][2] = 3;
const twoTurnPath = linkMatch.findPath({ row: 2, column: 2 }, { row: 4, column: 4 });
assert.ok(twoTurnPath);
assert.equal(twoTurnPath.length, 4);
linkMatch.remaining = 2;
assert.ok(linkMatch.removePair({ row: 2, column: 2 }, { row: 4, column: 4 }));
assert.equal(linkMatch.remaining, 0);
assert.equal(linkMatch.score, LINK_MATCH_RULES.pairScore);

console.log('All game model tests passed.');
