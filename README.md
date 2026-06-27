# Phaser 网页小游戏框架

基于 **Vite + Phaser 3 + 原生 JavaScript** 的纯网页小游戏合集，包含俄罗斯方块、贪吃蛇、横版平台跳跃和坦克大战。

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

在手机或窄屏设备上，游戏画布下方会自动显示触摸控制面板和当前游戏的操作提示：

- 俄罗斯方块：左右移动、软降、旋转、直落、暂停
- 贪吃蛇：四方向转向和暂停
- 平台游戏：按住左右移动，轻触跳跃
- 坦克大战：四方向驾驶，按住开火

手机横屏游玩能够获得更大的游戏画面。

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
│   ├── platformer/
│   │   ├── PlatformerGame.js     # 得分、踩踏判断、胜负状态
│   │   └── config.js             # 平台、金币、敌人与关卡参数
│   └── tank/
│       ├── TankGame.js           # 生命、计分、射击节流、敌人决策
│       └── config.js             # 地图、出生点、方向与数值配置
├── scenes/                       # Phaser 适配与表现层
│   ├── MenuScene.js              # 游戏厅菜单
│   ├── TetrisScene.js            # 俄罗斯方块输入与绘制
│   ├── SnakeScene.js             # 贪吃蛇输入与绘制
│   ├── PlatformerScene.js        # 平台游戏物理与绘制
│   └── TankScene.js              # 坦克物理、碰撞与绘制
├── main.js                       # Phaser 初始化与场景注册
└── styles.css                    # 网页外壳样式
```

分层原则：`game/` 决定“游戏怎么算”，`scenes/` 决定“怎么接收输入、使用 Phaser 物理并显示出来”。

平台游戏与坦克大战的原创像素素材位于 `public/assets/`。四款游戏共用 `SoundFX.js` 提供的移动、旋转、吞食、跳跃、金币、射击、爆炸和胜负音效。

## 俄罗斯方块操作

- `←` / `→`：左右移动
- `↑` / `Z`：顺/逆时针旋转
- `↓`：加速下落
- `Space`：直接落下
- `P`：暂停/继续
- `Enter`：游戏结束后重新开始
