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
- 玛丽跳跃：按住左右移动，轻触跳跃
- 坦克大战：四方向驾驶，按住开火

每款游戏都提供触摸“重开”和“返回”按钮。俄罗斯方块在手机上使用紧凑双栏布局：棋盘在左，标题、计分和下一个方块在右，通过压缩空白区域放大整体画面。

## 控制逻辑架构图

```mermaid
flowchart TB
  PAGE["index.html<br/>游戏容器与触摸按钮"] --> BOOT["main.js<br/>创建 Phaser.Game"]
  BOOT --> ENGINE["Phaser 3<br/>场景 / 渲染 / Arcade Physics / 时间事件"]
  ENGINE --> MENU["MenuScene<br/>游戏厅与游戏选择"]

  subgraph INPUT["输入层"]
    direction LR
    KEYBOARD["键盘<br/>方向键 / WASD / 功能键"]
    POINTER["鼠标 / 触摸卡片"]
    TOUCH["移动端触摸面板"]
    MOBILE["MobileControls<br/>配置按键、保持按压状态、绑定当前场景"]
    TOUCH --> MOBILE
  end

  KEYBOARD --> MENU
  POINTER --> MENU
  MENU -->|"选择 1 / 2 / 3 / 4"| ROUTER{"启动游戏场景"}

  subgraph SCENES["场景控制层"]
    direction LR
    TETRIS["TetrisScene<br/>移动 / 旋转 / 软降 / 直落<br/>计时下落 → 锁定 → 消行"]
    SNAKE["SnakeScene<br/>转向 / 速度档位 / 暂停<br/>定时步进 → 吃食物 / 碰撞"]
    MARY["MaryJumpScene<br/>移动 / 跳跃 / 踩敌 / 收集<br/>物理碰撞 → 失败 / 到达终点"]
    TANK["TankScene<br/>驾驶 / 射击 / 敌军决策<br/>碰撞 → 爆炸 / 重生 / 基地判定"]
  end

  ROUTER --> TETRIS
  ROUTER --> SNAKE
  ROUTER --> MARY
  ROUTER --> TANK
  KEYBOARD --> SCENES
  MOBILE --> SCENES

  subgraph MODELS["独立规则模型层"]
    direction LR
    TM["TetrisGame<br/>方块、棋盘、碰撞、计分、等级"]
    SM["SnakeGame<br/>蛇身、方向、食物、速度、死亡"]
    MM["MaryJumpGame<br/>金币、踩敌、得分、结果"]
    KM["TankGame<br/>生命、射击节流、敌军行为、得分"]
    CONFIG["各游戏 config.js<br/>地图、关卡、速度、计分规则"]
  end

  TETRIS <-->|"命令 / 状态结果"| TM
  SNAKE <-->|"命令 / 状态结果"| SM
  MARY <-->|"命令 / 状态结果"| MM
  TANK <-->|"命令 / 状态结果"| KM
  CONFIG --> TM
  CONFIG --> SM
  CONFIG --> MM
  CONFIG --> KM
  CONFIG --> SCENES

  subgraph OUTPUT["表现与反馈层"]
    direction LR
    VIEW["Phaser Game Objects<br/>画面、HUD、提示层、动画"]
    PHYSICS["Arcade Physics<br/>角色、平台、墙体、子弹碰撞"]
    AUDIO["SoundFX<br/>移动、得分、射击、爆炸、胜负音效"]
  end

  SCENES --> VIEW
  MARY --> PHYSICS
  TANK --> PHYSICS
  SCENES --> AUDIO

  subgraph FLOW["统一场景流转"]
    direction LR
    PAUSE["暂停 / 恢复"]
    RETRY["重试本关"]
    FIRST["从第 1 关开始"]
    NEXT["过关 → 下一关"]
    HOME["ESC / 返回 → 游戏厅"]
  end

  TETRIS --> PAUSE
  SNAKE --> PAUSE
  PAUSE --> TETRIS
  PAUSE --> SNAKE
  SCENES --> RETRY
  SCENES --> HOME
  RETRY --> SCENES
  MARY --> FIRST
  TANK --> FIRST
  FIRST --> MARY
  FIRST --> TANK
  MARY --> NEXT
  TANK --> NEXT
  NEXT --> MARY
  NEXT --> TANK
  HOME --> MENU
```

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

## 游戏页面

### 小游戏厅

![小游戏厅](doc/GameLobby.png)

### 俄罗斯方块

![俄罗斯方块](doc/Tetris.png)

