import { SNAKE_RULES } from './config.js';

export class SnakeGame {
  constructor({ columns = SNAKE_RULES.columns, rows = SNAKE_RULES.rows, random = Math.random } = {}) {
    this.columns = columns;
    this.rows = rows;
    this.random = random;
    this.reset();
  }

  reset() {
    const centerX = Math.floor(this.columns / 2);
    const centerY = Math.floor(this.rows / 2);
    this.snake = [{ x: centerX, y: centerY }, { x: centerX - 1, y: centerY }, { x: centerX - 2, y: centerY }];
    this.direction = { x: 1, y: 0 };
    this.nextDirection = { x: 1, y: 0 };
    this.score = 0;
    this.speed = SNAKE_RULES.initialSpeed;
    this.gameOver = false;
    this.spawnFood();
  }

  turn(x, y) {
    if (this.gameOver) return false;
    if (this.direction.x + x === 0 && this.direction.y + y === 0) return false;
    this.nextDirection = { x, y };
    return true;
  }

  step() {
    if (this.gameOver) return { gameOver: true, ate: false };
    this.direction = this.nextDirection;
    const head = { x: this.snake[0].x + this.direction.x, y: this.snake[0].y + this.direction.y };
    if (this.hitsWall(head) || this.hitsSnake(head)) {
      this.gameOver = true;
      return { gameOver: true, ate: false };
    }
    this.snake.unshift(head);
    const ate = head.x === this.food.x && head.y === this.food.y;
    if (ate) {
      this.score += SNAKE_RULES.foodScore;
      this.speed = Math.max(SNAKE_RULES.minimumSpeed, this.speed - SNAKE_RULES.speedStep);
      this.spawnFood();
    } else this.snake.pop();
    return { gameOver: false, ate };
  }

  hitsWall(point) {
    return point.x < 0 || point.x >= this.columns || point.y < 0 || point.y >= this.rows;
  }

  hitsSnake(point) {
    return this.snake.some((part) => part.x === point.x && part.y === point.y);
  }

  spawnFood() {
    do {
      this.food = {
        x: Math.floor(this.random() * this.columns),
        y: Math.floor(this.random() * this.rows),
      };
    } while (this.snake.some((part) => part.x === this.food.x && part.y === this.food.y));
  }
}
