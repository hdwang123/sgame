import assert from 'node:assert/strict';
import { TetrisGame } from '../src/game/tetris/TetrisGame.js';
import { SnakeGame } from '../src/game/snake/SnakeGame.js';
import { MaryJumpGame } from '../src/game/mary-jump/MaryJumpGame.js';
import { TankGame } from '../src/game/tank/TankGame.js';
import { ENEMY_SPAWNS, TANK_ARENA } from '../src/game/tank/config.js';

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
assert.equal(maryJump.isStomp({ y: 10, velocityY: 200 }, { y: 30 }), true);
assert.equal(maryJump.finish('won'), true);

const tank = new TankGame(() => 0);
assert.equal(tank.canPlayerShoot(1000), true);
assert.equal(tank.canPlayerShoot(1100), false);
tank.hitEnemy(2);
assert.equal(tank.score, 200);
tank.hitPlayer();
assert.equal(tank.lives, 2);
for (const [x, y] of ENEMY_SPAWNS) {
  assert.ok(x >= TANK_ARENA.x + 22 && x <= TANK_ARENA.x + TANK_ARENA.width - 22);
  assert.ok(y >= TANK_ARENA.y + 21 && y <= TANK_ARENA.y + TANK_ARENA.height - 21);
}
assert.equal(tank.finish(false), true);
assert.equal(tank.won, false);

console.log('All game model tests passed.');
