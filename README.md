# Phaser 网页小游戏

基于 **Vite + Phaser 3 + 原生 JavaScript** 的纯网页小游戏合集，包含俄罗斯方块、贪吃蛇、玛丽跳跃和坦克大战。

## 运行

```bash
npm install
npm run dev
```

生产构建：

```bash
npm run build
```

游戏厅中使用方向键选择，按 `Enter` 进入，也可以按数字键 `1` 至 `4` 快速进入。游戏中按 `Esc` 返回游戏厅。

在手机或窄屏设备上，游戏画布下方会自动显示触摸控制面板和当前游戏的操作提示。**手机版仅支持竖屏游玩，请将手机保持为竖屏方向。**

- 俄罗斯方块：左右移动、软降、旋转、直落、暂停
- 贪吃蛇：四方向转向、暂停，并可选择慢速、标准、快速三档速度
- 玛丽跳跃：方向键或摇杆移动，支持普通跳、大跳和暂停
- 坦克大战：方向键或摇杆驾驶，按住开火、暂停

每款游戏都提供触摸“重开”和“返回”按钮。俄罗斯方块在手机上使用紧凑双栏布局：棋盘在左，标题、计分和下一个方块在右，通过压缩空白区域放大整体画面。

## 分层结构

```text
src/
├── audio/
│   └── SoundFX.js                  # Web Audio 程序化音效
├── ui/
│   └── MobileControls.js           # 手机触摸状态与场景控制绑定
├── game/                         # 不依赖 Phaser 画面的游戏规则层
│   ├── tetris/
│   │   ├── TetrisGame.js         # 棋盘、移动、旋转、消行、计分
│   │   └── config.js             # 七种方块与棋盘参数
│   ├── snake/
│   │   ├── SnakeGame.js          # 蛇移动、转向、食物、碰撞、成长
│   │   └── config.js             # 棋盘、速度和计分参数
│   ├── mary-jump/
│   │   ├── MaryJumpGame.js       # 得分、踩踏判断、胜负状态
│   │   └── config.js             # 平台、金币、敌人与关卡参数
│   └── tank/
│       ├── TankGame.js           # 生命、计分、射击节流、敌人决策
│       └── config.js             # 地图、出生点、方向与数值配置
├── scenes/                       # Phaser 适配与表现层
│   ├── MenuScene.js              # 游戏厅菜单
│   ├── TetrisScene.js            # 俄罗斯方块输入与绘制
│   ├── SnakeScene.js             # 贪吃蛇输入与绘制
│   ├── MaryJumpScene.js          # 玛丽跳跃物理与绘制
│   └── TankScene.js              # 坦克物理、碰撞与绘制
├── main.js                       # Phaser 初始化与场景注册
└── styles.css                    # 网页外壳样式
```

分层原则：`game/` 决定“游戏怎么算”，`scenes/` 决定“怎么接收输入、使用 Phaser 物理并显示出来”。

平台游戏与坦克大战的原创像素素材位于 `public/assets/`。四款游戏共用 `SoundFX.js` 提供的移动、旋转、吞食、跳跃、金币、射击、爆炸和胜负音效。

## 俄罗斯方块流程图

```mermaid
%%{init: {"flowchart": {"nodeSpacing": 12, "rankSpacing": 18, "curve": "linear"}, "themeVariables": {"fontSize": "20px"}}}%%
flowchart TB
  START["进入 TetrisScene"] --> INIT["创建 TetrisGame<br/>初始化 10×20 棋盘与七袋随机方块"]
  INIT --> SPAWN["生成当前方块<br/>同时准备下一个方块"]
  SPAWN --> COLLIDE_SPAWN{"出生位置发生碰撞？"}
  COLLIDE_SPAWN -->|"是"| GAME_OVER["游戏结束<br/>显示得分与重新开始提示"]
  COLLIDE_SPAWN -->|"否"| DRAW["绘制棋盘、活动方块、幽灵落点<br/>下一个方块、分数、行数和等级"]

  DRAW --> LOOP["Phaser update 循环"]
  LOOP --> STATE{"暂停或游戏结束？"}
  STATE -->|"是"| WAIT["停止自动下落<br/>等待继续、重开或返回"]
  STATE -->|"否"| INPUT{"键盘 / 触屏输入"}

  INPUT -->|"左右"| MOVE["尝试水平移动"]
  INPUT -->|"上 / Z / 旋转"| ROTATE["旋转矩阵<br/>尝试左右踢墙修正"]
  INPUT -->|"下 / 软降"| SOFT["缩短下落间隔<br/>每格增加分数"]
  INPUT -->|"Space / 直落"| HARD["移动到幽灵落点<br/>按距离增加分数"]
  INPUT -->|"无操作"| TIMER["累计自动下落时间"]

  MOVE --> VALID_MOVE{"新位置碰撞？"}
  ROTATE --> VALID_MOVE
  VALID_MOVE -->|"否"| REDRAW["播放反馈并重绘"]
  VALID_MOVE -->|"是"| LOOP
  TIMER --> INTERVAL{"达到当前等级的下落间隔？"}
  INTERVAL -->|"否"| LOOP
  INTERVAL -->|"是"| DOWN["尝试向下移动一格"]
  SOFT --> DOWN
  DOWN --> BLOCKED{"下方发生碰撞？"}
  BLOCKED -->|"否"| REDRAW
  BLOCKED -->|"是"| LOCK["把活动方块写入棋盘"]
  HARD --> LOCK

  LOCK --> CLEAR["检查并删除填满的行<br/>顶部补充空行"]
  CLEAR --> SCORE["按消除行数和等级计分<br/>每 10 行提升等级并加快下落"]
  SCORE --> SPAWN
  REDRAW --> LOOP
  WAIT -->|"继续"| LOOP
  WAIT -->|"重开"| START
  WAIT -->|"ESC / 返回"| MENU["回到游戏厅"]
```

## 玛丽跳跃流程图

```mermaid
%%{init: {"flowchart": {"nodeSpacing": 12, "rankSpacing": 18, "curve": "linear"}, "themeVariables": {"fontSize": "20px"}}}%%
flowchart TB
  START["进入 MaryJumpScene"] --> LEVEL["读取当前关卡配置<br/>尺寸、重力、平台、金币、敌人和终点"]
  LEVEL --> WORLD["创建 Arcade Physics 世界<br/>生成角色、平台、金币、敌人和终点旗帜"]
  WORLD --> INTRO["显示关卡介绍<br/>开始跟随角色的摄像机"]
  INTRO --> LOOP["Phaser update 循环"]

  LOOP --> PHASE{"当前状态是 playing？"}
  PHASE -->|"否"| WAIT["等待继续、重试或返回"]
  PHASE -->|"是"| INPUT["读取键盘 / 触屏输入"]
  INPUT --> HORIZONTAL{"左 / 右 / 无方向"}
  HORIZONTAL -->|"左或右"| RUN["设置水平速度与角色朝向"]
  HORIZONTAL -->|"无方向"| STOP["水平速度归零"]
  INPUT --> JUMP{"收到跳跃输入？"}
  JUMP -->|"是"| BUFFER["记录 160ms 跳跃缓冲"]
  BUFFER --> GROUNDED{"角色着地<br/>或仍在 110ms 土狼时间内？"}
  GROUNDED -->|"是"| TAKEOFF["施加向上的跳跃速度"]
  GROUNDED -->|"否"| PHYSICS
  JUMP -->|"否"| PHYSICS["物理引擎更新重力、位置与碰撞"]
  RUN --> PHYSICS
  STOP --> PHYSICS
  TAKEOFF --> PHYSICS

  PHYSICS --> EVENT{"本帧发生什么？"}
  EVENT -->|"收集金币"| COIN["销毁金币<br/>增加分数并更新 HUD"]
  EVENT -->|"碰到敌人"| STOMP{"角色正在下落且位于敌人上方？"}
  STOMP -->|"是"| DEFEAT["消灭敌人、反弹<br/>增加分数"]
  STOMP -->|"否"| LOSE["挑战失败<br/>暂停物理世界"]
  EVENT -->|"掉出地图"| LOSE
  EVENT -->|"碰到终点旗帜"| COMPLETE["关卡完成<br/>增加通关奖励"]
  EVENT -->|"无事件"| ENEMY["敌人在巡逻边界或撞墙时掉头"]

  COIN --> ENEMY
  DEFEAT --> ENEMY
  ENEMY --> LOOP
  LOSE --> WAIT
  COMPLETE --> FINAL{"是否为最后一关？"}
  FINAL -->|"否"| NEXT["短暂显示过关提示<br/>携带分数进入下一关"]
  FINAL -->|"是"| ALL_CLEAR["显示全部通关与总分"]
  NEXT --> LEVEL
  ALL_CLEAR --> WAIT

  WAIT -->|"Enter / 重试"| RETRY["从本关起点恢复本关初始分数"]
  WAIT -->|"R / 第1关"| FIRST["分数归零并从第 1 关开始"]
  WAIT -->|"ESC / 返回"| MENU["回到游戏厅"]
  RETRY --> LEVEL
  FIRST --> LEVEL
```

## 贪吃蛇流程图

```mermaid
%%{init: {"flowchart": {"nodeSpacing": 12, "rankSpacing": 18, "curve": "linear"}, "themeVariables": {"fontSize": "20px"}}}%%
flowchart TB
  START["进入 SnakeScene"] --> INIT["创建 SnakeGame<br/>在棋盘中央生成蛇身、方向和食物"]
  INIT --> SPEED["设置标准速度<br/>绘制棋盘、蛇、食物和分数"]
  SPEED --> LOOP["Phaser update 循环"]

  LOOP --> STATE{"游戏结束或暂停？"}
  STATE -->|"是"| WAIT["停止步进<br/>等待继续、重开或返回"]
  STATE -->|"否"| INPUT{"键盘 / 触屏输入"}
  INPUT -->|"方向键 / WASD"| TURN["记录下一移动方向<br/>拒绝直接反向"]
  INPUT -->|"慢速 / 标准 / 快速"| SET_SPEED["切换基础步进间隔<br/>重置本轮计时"]
  INPUT -->|"P / 暂停"| PAUSE["切换暂停状态并显示提示"]
  INPUT -->|"无操作"| TIMER["累计步进时间"]
  TURN --> TIMER
  SET_SPEED --> TIMER
  PAUSE --> LOOP

  TIMER --> READY{"达到当前步进间隔？"}
  READY -->|"否"| LOOP
  READY -->|"是"| HEAD["按下一方向计算新蛇头位置"]
  HEAD --> COLLISION{"撞到边界或自身？"}
  COLLISION -->|"是"| GAME_OVER["标记游戏结束<br/>播放失败音效并显示得分"]
  COLLISION -->|"否"| ADVANCE["把新蛇头加入蛇身"]
  ADVANCE --> EAT{"新蛇头碰到食物？"}
  EAT -->|"否"| TAIL["移除蛇尾<br/>保持蛇身长度"]
  EAT -->|"是"| GROW["保留蛇尾使蛇身增长<br/>增加分数和进食次数"]
  GROW --> ACCELERATE["根据进食次数逐步加速<br/>随机生成不与蛇身重叠的新食物"]
  TAIL --> REDRAW["重绘蛇与食物"]
  ACCELERATE --> REDRAW
  REDRAW --> LOOP

  GAME_OVER --> WAIT
  WAIT -->|"P / 继续"| LOOP
  WAIT -->|"Enter / 重开"| START
  WAIT -->|"ESC / 返回"| MENU["回到游戏厅"]
```

## 坦克大战流程图

```mermaid
%%{init: {"flowchart": {"nodeSpacing": 12, "rankSpacing": 18, "curve": "linear"}, "themeVariables": {"fontSize": "20px"}}}%%
flowchart TB
  START["进入 TankScene"] --> LEVEL["读取当前战区配置<br/>地图、墙体、基地、出生点和敌军参数"]
  LEVEL --> INIT["创建 TankGame<br/>恢复本关起始分数与生命"]
  INIT --> WORLD["创建 Arcade Physics 战场<br/>生成基地、玩家、敌军和子弹组"]
  WORLD --> SHIELD["玩家出生并开启短暂无敌护盾"]
  SHIELD --> LOOP["Phaser update 循环"]

  LOOP --> PHASE{"当前状态是 playing？"}
  PHASE -->|"否"| WAIT["等待重试、从第1关开始或返回"]
  PHASE -->|"是"| PLAYER{"玩家是否正在等待重生？"}
  PLAYER -->|"是"| ENEMY_AI["跳过玩家输入<br/>更新敌军行为"]
  PLAYER -->|"否"| INPUT["读取键盘 / 触屏输入"]
  INPUT -->|"方向键 / WASD"| MOVE["设置单方向速度与坦克朝向"]
  INPUT -->|"Space / 开火"| COOLDOWN{"射击冷却结束？"}
  COOLDOWN -->|"是"| SHOOT["从炮口生成玩家子弹"]
  COOLDOWN -->|"否"| ENEMY_AI
  MOVE --> ENEMY_AI
  SHOOT --> ENEMY_AI

  ENEMY_AI --> DECIDE["敌军按随机延迟选择方向<br/>遇到障碍时掉头"]
  DECIDE --> ENEMY_SHOOT["达到射击时间时生成敌军子弹"]
  ENEMY_SHOOT --> PHYSICS["物理引擎更新坦克、子弹与碰撞"]
  PHYSICS --> EVENT{"发生哪类碰撞？"}

  EVENT -->|"玩家子弹命中敌军"| HIT_ENEMY["销毁敌军与子弹<br/>播放爆炸并增加分数"]
  HIT_ENEMY --> REMAIN{"本关仍有敌军？"}
  REMAIN -->|"有"| LOOP
  REMAIN -->|"无"| BONUS["增加战区通关奖励"]
  BONUS --> FINAL{"是否为最后一关？"}
  FINAL -->|"否"| NEXT["携带分数和剩余生命<br/>进入下一战区"]
  FINAL -->|"是"| CLEAR["显示全部战区解放与总分"]
  NEXT --> LEVEL
  CLEAR --> WAIT

  EVENT -->|"敌军子弹命中玩家"| IMMUNE{"正在恢复或处于无敌期？"}
  IMMUNE -->|"是"| LOOP
  IMMUNE -->|"否"| HIT_PLAYER["播放爆炸并扣除一条生命"]
  HIT_PLAYER --> ALIVE{"仍有生命？"}
  ALIVE -->|"否"| LOST["任务失败并暂停物理世界"]
  ALIVE -->|"是"| RESPAWN["隐藏并禁用玩家 1 秒<br/>清除敌军子弹"]
  RESPAWN --> REAPPEAR["在出生点重新出现<br/>恢复操作并开启护盾"]
  REAPPEAR --> LOOP

  EVENT -->|"任意子弹命中基地"| BASE["基地切换为燃烧废墟<br/>播放爆炸与震屏"]
  BASE --> LOST
  EVENT -->|"子弹撞墙或双方子弹相撞"| REMOVE["销毁发生碰撞的子弹"]
  EVENT -->|"无关键碰撞"| LOOP
  REMOVE --> LOOP

  LOST --> WAIT
  WAIT -->|"Enter / 重试"| RETRY["恢复本关起始分数和生命"]
  WAIT -->|"R / 第1关"| FIRST["分数归零、生命重置<br/>从第 1 战区开始"]
  WAIT -->|"ESC / 返回"| MENU["回到游戏厅"]
  RETRY --> LEVEL
  FIRST --> LEVEL
```

