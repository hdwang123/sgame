const translations = {
  zh: {
    'global.brand': '小游戏厅', 'global.touch': '触控模式 / TOUCH',
    'global.buttons': '方向键', 'global.joystick': '摇杆', 'global.speed': '速度',
    'global.slow': '慢速', 'global.normal': '标准', 'global.fast': '快速',
    'global.action': '操作', 'global.pause': '暂停', 'global.restart': '重开', 'global.home': '返回',
    'global.footer': '四款游戏 · 纯 JavaScript · Phaser 3', 'global.ready': '系统就绪', 'global.stage': '关卡',
    'menu.title': '选择游戏', 'menu.hint': '按 ENTER 开始',
    'menu.controls': '方向键选择  ·  ENTER 开始  ·  数字键快速进入', 'menu.play': '开始  →',
    'menu.language': '语言', 'menu.zh': '中文', 'menu.en': 'ENGLISH',
    'game.tetris': '俄罗斯方块', 'game.tetris.sub': '霓虹方块', 'game.tetris.desc': '堆叠、旋转、消除',
    'game.snake': '贪吃蛇', 'game.snake.sub': '赛博贪吃蛇', 'game.snake.desc': '吞噬能量，不断生长',
    'game.mary': '玛丽跳跃', 'game.mary.sub': '平台跳跃', 'game.mary.desc': '奔跑、跳跃、抵达终点',
    'game.tank': '坦克大战', 'game.tank.sub': '像素坦克战', 'game.tank.desc': '守住基地，消灭敌军',
    'touch.rotate': '旋转', 'touch.drop': '直落', 'touch.jump': '跳跃', 'touch.bigJump': '大跳',
    'touch.first': '第1关', 'touch.fire': '开火',
    'tetris.next': '下一个', 'tetris.score': '分数', 'tetris.lines': '消除行', 'tetris.level': '等级',
    'tetris.controls': '操作', 'tetris.move': '移动方块', 'tetris.rotate': '旋转方块',
    'tetris.softDrop': '加速下落', 'tetris.hardDrop': '直接落下', 'tetris.pause': '暂停游戏',
    'tetris.home': '返回游戏厅', 'tetris.paused': '暂停', 'tetris.resume': '按 P 或触摸暂停键继续',
    'tetris.gameOver': '游戏结束', 'tetris.gameOverHint': '得分 {score}\n按 ENTER 重新开始',
    'snake.score': '分数', 'snake.controls': '方向键 / WASD 移动  ·  P 暂停  ·  ESC 返回游戏厅',
    'snake.speed': '速度', 'snake.paused': '游戏暂停', 'snake.resumeKey': '按 P 继续',
    'snake.resumeTouch': '轻触暂停键继续', 'snake.gameOver': '游戏结束',
    'snake.gameOverHint': '得分 {score}\n按 ENTER 重来',
    'mary.controls': '方向键 / AD 移动  ·  ↑ / W / SPACE 跳跃  ·  X / SHIFT 大跳  ·  P 暂停  ·  ESC 返回',
    'mary.failed': '挑战失败', 'mary.retry': 'ENTER 重试本关  ·  R 从第1关开始',
    'mary.allClear': '全部关卡完成！', 'mary.total': '总分 {score}\n按 ENTER 重新挑战',
    'mary.stageClear': '第 {stage} 关完成', 'mary.next': '奖励 +{bonus}\n即将进入下一关…',
    'mary.paused': '游戏暂停', 'mary.resume': '按 P 或轻触暂停键继续', 'mary.score': '分数',
    'mary.missed': '掉出平台', 'mary.hit': '碰到史莱姆',
    'tank.controls': 'WASD / 方向键移动  ·  SPACE 射击  ·  P 暂停  ·  R 从第1关开始  ·  ESC 返回游戏厅',
    'tank.score': '得分', 'tank.life': '生命', 'tank.stage': '战区', 'tank.mission': '任务',
    'tank.baseLost': '基地失守', 'tank.friendlyFire': '误伤基地', 'tank.tankLost': '战车被击毁',
    'tank.allClear': '全部战区解放！', 'tank.total': '总分 {score}\n按 ENTER 重新出击',
    'tank.stageClear': '战区解放', 'tank.next': '奖励 +{bonus}\n即将进入下一关…',
    'tank.retry': '得分 {score}\nENTER 重试本关  ·  R 从第1关开始',
    'tank.paused': '游戏暂停', 'tank.resume': '按 P 或轻触暂停键继续',
    'tank.power': '道具', 'tank.freeze': '敌军冻结 30 秒', 'tank.bomb': '全屏歼灭',
    'tank.shield': '无敌 30 秒', 'tank.extraLife': '生命 +1', 'tank.fortify': '基地钢墙 30 秒',
    'tank.freezeShort': '冻结', 'tank.shieldShort': '无敌', 'tank.baseShort': '钢墙',
    'loader.loading': '正在加载  {percent}%', 'loader.error': '资源加载失败\n轻触重试',
  },
  en: {
    'global.brand': 'ARCADE', 'global.touch': 'TOUCH CONTROLS',
    'global.buttons': 'D-PAD', 'global.joystick': 'JOYSTICK', 'global.speed': 'SPEED',
    'global.slow': 'SLOW', 'global.normal': 'NORMAL', 'global.fast': 'FAST',
    'global.action': 'ACTION', 'global.pause': 'PAUSE', 'global.restart': 'RESTART', 'global.home': 'BACK',
    'global.footer': '4 GAMES · PURE JAVASCRIPT · PHASER 3', 'global.ready': 'READY', 'global.stage': 'STAGE',
    'menu.title': 'SELECT A GAME', 'menu.hint': 'PRESS ENTER TO START',
    'menu.controls': 'ARROWS TO SELECT  ·  ENTER TO START  ·  NUMBER KEYS FOR QUICK PLAY', 'menu.play': 'PLAY  →',
    'menu.language': 'LANGUAGE', 'menu.zh': '中文', 'menu.en': 'ENGLISH',
    'game.tetris': 'NEON BLOCKS', 'game.tetris.sub': 'TETRIS', 'game.tetris.desc': 'STACK, ROTATE, CLEAR',
    'game.snake': 'CYBER SNAKE', 'game.snake.sub': 'SNAKE', 'game.snake.desc': 'EAT ENERGY AND KEEP GROWING',
    'game.mary': 'MARY JUMP', 'game.mary.sub': 'PLATFORM ADVENTURE', 'game.mary.desc': 'RUN, JUMP, REACH THE GOAL',
    'game.tank': 'TANK STRIKE', 'game.tank.sub': 'RETRO TANKS', 'game.tank.desc': 'DEFEND THE BASE, DEFEAT ENEMIES',
    'touch.rotate': 'ROTATE', 'touch.drop': 'DROP', 'touch.jump': 'JUMP', 'touch.bigJump': 'BIG JUMP',
    'touch.first': 'STAGE 1', 'touch.fire': 'FIRE',
    'tetris.next': 'NEXT', 'tetris.score': 'SCORE', 'tetris.lines': 'LINES', 'tetris.level': 'LEVEL',
    'tetris.controls': 'CONTROLS', 'tetris.move': 'MOVE', 'tetris.rotate': 'ROTATE',
    'tetris.softDrop': 'SOFT DROP', 'tetris.hardDrop': 'HARD DROP', 'tetris.pause': 'PAUSE',
    'tetris.home': 'BACK TO ARCADE', 'tetris.paused': 'PAUSED', 'tetris.resume': 'PRESS P OR TAP PAUSE TO RESUME',
    'tetris.gameOver': 'GAME OVER', 'tetris.gameOverHint': 'SCORE {score}\nPRESS ENTER TO RESTART',
    'snake.score': 'SCORE', 'snake.controls': 'ARROWS / WASD MOVE  ·  P PAUSE  ·  ESC BACK',
    'snake.speed': 'SPEED', 'snake.paused': 'PAUSED', 'snake.resumeKey': 'PRESS P TO RESUME',
    'snake.resumeTouch': 'TAP PAUSE TO RESUME', 'snake.gameOver': 'GAME OVER',
    'snake.gameOverHint': 'SCORE {score}\nPRESS ENTER TO RESTART',
    'mary.controls': 'ARROWS / AD MOVE  ·  ↑ / W / SPACE JUMP  ·  X / SHIFT BIG JUMP  ·  P PAUSE  ·  ESC BACK',
    'mary.failed': 'CHALLENGE FAILED', 'mary.retry': 'ENTER RETRY STAGE  ·  R START FROM STAGE 1',
    'mary.allClear': 'ALL STAGES CLEAR!', 'mary.total': 'TOTAL SCORE {score}\nPRESS ENTER TO RESTART',
    'mary.stageClear': 'STAGE {stage} CLEAR', 'mary.next': 'BONUS +{bonus}\nNEXT STAGE STARTING…',
    'mary.paused': 'PAUSED', 'mary.resume': 'PRESS P OR TAP PAUSE TO RESUME', 'mary.score': 'SCORE',
    'mary.missed': 'MISSED THE PLATFORM', 'mary.hit': 'HIT BY SLIME',
    'tank.controls': 'WASD / ARROWS MOVE  ·  SPACE FIRE  ·  P PAUSE  ·  R STAGE 1  ·  ESC BACK',
    'tank.score': 'SCORE', 'tank.life': 'LIFE', 'tank.stage': 'STAGE', 'tank.mission': 'MISSION',
    'tank.baseLost': 'BASE LOST', 'tank.friendlyFire': 'FRIENDLY FIRE', 'tank.tankLost': 'TANK DESTROYED',
    'tank.allClear': 'ALL MISSIONS CLEAR!', 'tank.total': 'TOTAL SCORE {score}\nPRESS ENTER TO RESTART',
    'tank.stageClear': 'STAGE CLEAR', 'tank.next': 'BONUS +{bonus}\nNEXT STAGE STARTING…',
    'tank.retry': 'SCORE {score}\nENTER RETRY STAGE  ·  R START FROM STAGE 1',
    'tank.paused': 'PAUSED', 'tank.resume': 'PRESS P OR TAP PAUSE TO RESUME',
    'tank.power': 'POWER UP', 'tank.freeze': 'FREEZE ENEMIES 30S', 'tank.bomb': 'DESTROY ALL ENEMIES',
    'tank.shield': 'INVINCIBLE 30S', 'tank.extraLife': 'EXTRA LIFE', 'tank.fortify': 'STEEL BASE 30S',
    'tank.freezeShort': 'FREEZE', 'tank.shieldShort': 'SHIELD', 'tank.baseShort': 'BASE',
    'loader.loading': 'LOADING  {percent}%', 'loader.error': 'LOAD FAILED\nTAP TO RETRY',
  },
};

let language = 'zh';

export function getLanguage() { return language; }

export function t(key, values = {}) {
  let text = translations[language]?.[key] ?? translations.zh[key] ?? key;
  Object.entries(values).forEach(([name, value]) => {
    text = text.replaceAll(`{${name}}`, String(value));
  });
  return text;
}

export function setLanguage(nextLanguage) {
  language = nextLanguage === 'en' ? 'en' : 'zh';
  applyDocumentLanguage();
}

export function applyDocumentLanguage() {
  document.documentElement.lang = language === 'en' ? 'en' : 'zh-CN';
  document.querySelectorAll('[data-i18n]').forEach((element) => {
    element.textContent = t(element.dataset.i18n);
  });
}

applyDocumentLanguage();
