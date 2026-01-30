````markdown
# 游戏模块化 - 快速参考指南

## 📂 文件结构

```
/games/                          # 独立游戏目录
├── tank-battle.html            # 🎖️ AR坦克大战
├── space-invaders.html         # 👽 小蜜蜂
├── snake.html                  # 🐍 贪食蛇
└── README.md                   # 游戏集成指南

/js/
├── game-launcher.js            # GameLauncher 启动器
├── game-integration-example.js # 集成示例代码
├── unified-game-controls.js    # 共享控制系统
├── base-game.js                # 游戏基类
├── unified-tank-battle-game.js
├── unified-space-invaders-game.js
└── unified-snake-game.js

/css/
├── museum-checkin.css          # (需要添加游戏按钮样式)
└── unified-game-ui.css         # 共享UI样式

/docs/
├── GAME_ARCHITECTURE_REFACTOR.md    # 架构对比
└── (其他文档)

GAME_MODULARIZATION_CHECKLIST.md     # 迁移清单
GAME_INTEGRATION_TESTING.md          # 测试说明
```

## 🚀 快速集成（3步）

### 第1步：引入启动器

```html
<!-- 在 museum-checkin.html 的 <head> 中添加 -->
<script src="js/game-launcher.js"></script>
```

### 第2步：初始化

```javascript
// 在主应用代码中
const gameLauncher = new GameLauncher({
    baseUrl: '/games/',
    onClose: () => {
        console.log('游戏已关闭');
        // 更新UI等
    }
});
```

### 第3步：启动游戏

```html
<!-- 添加按钮 -->
<button onclick="gameLauncher.launchGame('tank-battle')">
    🎖️ 坦克大战
</button>
```

## 💡 常用API

### GameLauncher 类

```javascript
// 创建启动器
const launcher = new GameLauncher(options);

// 启动游戏
launcher.launchGame(gameType, gameOptions);
// gameType: 'tank-battle', 'space-invaders', 'snake'
// gameOptions: { museumId, museumName, ... }

// 获取可用游戏列表
const games = launcher.getAvailableGames();
// 返回: ['tank-battle', 'space-invaders', 'snake']

// 关闭当前游戏
launcher.closeGame();
```

... (rest of quick reference content)

````
````markdown
# 游戏模块化 - 快速参考指南

## 📂 文件结构

```
/games/                          # 独立游戏目录
├── tank-battle.html            # 🎖️ AR坦克大战
├── space-invaders.html         # 👽 小蜜蜂
├── snake.html                  # 🐍 贪食蛇
└── README.md                   # 游戏集成指南

/js/
├── game-launcher.js            # GameLauncher 启动器
├── game-integration-example.js # 集成示例代码
├── unified-game-controls.js    # 共享控制系统
├── base-game.js                # 游戏基类
├── unified-tank-battle-game.js
├── unified-space-invaders-game.js
└── unified-snake-game.js

/css/
├── museum-checkin.css          # (需要添加游戏按钮样式)
└── unified-game-ui.css         # 共享UI样式

/docs/
├── GAME_ARCHITECTURE_REFACTOR.md    # 架构对比
└── (其他文档)

GAME_MODULARIZATION_CHECKLIST.md     # 迁移清单
GAME_INTEGRATION_TESTING.md          # 测试说明
```

## 🚀 快速集成（3步）

### 第1步：引入启动器

```html
<!-- 在 museum-checkin.html 的 <head> 中添加 -->
<script src="js/game-launcher.js"></script>
```

### 第2步：初始化

```javascript
// 在主应用代码中
const gameLauncher = new GameLauncher({
    baseUrl: '/games/',
    onClose: () => {
        console.log('游戏已关闭');
        // 更新UI等
    }
});
```

### 第3步：启动游戏

```html
<!-- 添加按钮 -->
<button onclick="gameLauncher.launchGame('tank-battle')">
    🎖️ 坦克大战
</button>
```

## 💡 常用API

### GameLauncher 类

```javascript
// 创建启动器
const launcher = new GameLauncher(options);

// 启动游戏
launcher.launchGame(gameType, gameOptions);
// gameType: 'tank-battle', 'space-invaders', 'snake'
// gameOptions: { museumId, museumName, ... }

// 获取可用游戏列表
const games = launcher.getAvailableGames();
// 返回: ['tank-battle', 'space-invaders', 'snake']

// 关闭当前游戏
launcher.closeGame();
```

### 游戏参数示例

```javascript
launcher.launchGame('tank-battle', {
    museumId: 'forbidden-city',
    museumName: '故宫博物院',
    location: '北京',
    difficulty: 'normal'
});
```

### 消息传递

```javascript
// 父窗口监听游戏消息
window.addEventListener('message', (event) => {
    switch(event.data.type) {
        case 'game-close':
            console.log('游戏已关闭');
            break;
        case 'game-score':
            console.log('得分:', event.data.score);
            break;
    }
});

// 游戏内发送消息
window.parent.postMessage({
    type: 'game-close'
}, '*');
```

## 🎨 游戏主题颜色

### 坦克大战 (Tank Battle)
```
主色: 青色 #00ffff
副色: 蓝色 #0099ff
背景: 深蓝 #05070f
主题: AR/科技风
```

### 小蜜蜂 (Space Invaders)
```
主色: 紫色 #c832ff
副色: 品红 #8b32f6
背景: 深紫 #330066
主题: 科幻/霓虹风
```

### 贪食蛇 (Snake)
```
主色: 亮绿 #32ff64
副色: 深绿 #00cc44
背景: 深绿 #0a2015
主题: 生态/自然风
```

## 📱 响应式设计

所有游戏都支持：
- ✅ 桌面浏览器 (1920x1080+)
- ✅ 平板设备 (768x1024)
- ✅ 手机设备 (375x667 - 414x896)
- ✅ 横屏模式

## 🎮 控制系统

所有游戏使用统一的控制系统：

```
┌─────────────────────┐
│  D-Pad   │   Fire   │
│  ◀ ▶ ▲ ▼ │    ◎     │
└─────────────────────┘
```

**D-Pad**: 移动/方向
**Fire**: 射击/确认/跳跃

## 🧪 快速测试

```bash
# 测试独立游戏
open http://localhost:8000/games/tank-battle.html
open http://localhost:8000/games/space-invaders.html
open http://localhost:8000/games/snake.html

# 测试集成
open http://localhost:8000/museum-checkin.html
```

## 🔧 常见任务

### 修改游戏主题

编辑游戏HTML中的`<style>`部分：

```html
<!-- /games/tank-battle.html -->
<style>
    .museum-icon {
        background: linear-gradient(135deg, #00ffff, #0099ff);
        /* 修改颜色 */
    }
</style>
```

### 修改游戏按钮样式

编辑 `museum-checkin.css`：

```css
.game-btn {
    /* 修改这里 */
    padding: 16px 12px;
    border-radius: 12px;
}
```

### 添加新游戏

```
1. 复制 /games/tank-battle.html → /games/my-game.html
2. 修改 HTML 标题和内容
3. 修改 CSS 样式和颜色
4. 修改 JS 初始化代码
5. 在 GameLauncher 中注册：
   this.games['my-game'] = 'my-game.html'
6. 在 museum-checkin.html 中添加按钮
```

### 调试游戏

```javascript
// 在浏览器控制台中

// 打开坦克大战游戏并调试
const launcher = new GameLauncher();
launcher.launchGame('tank-battle');

// 监听所有消息
window.addEventListener('message', (e) => {
    console.log('Message:', e.data);
});

// 直接访问游戏
window.open('/games/tank-battle.html');
```

## 📊 性能指标

| 项目 | 预期 | 实际 |
|------|------|------|
| museum-checkin.html 加载 | <1s | — |
| 游戏启动时间 | <0.5s | — |
| 游戏FPS | 60 | — |
| 内存占用 | <50MB | — |
```

## ✅ 检查清单

集成前检查：
- [ ] GameLauncher.js 已引入
- [ ] 游戏HTML文件都存在
- [ ] 共享库都存在
- [ ] CSS样式已添加
- [ ] 按钮HTML已添加
- [ ] 事件处理已实现

集成后检查：
- [ ] 所有游戏可以启动
- [ ] 游戏可以正常玩
- [ ] 关闭后能返回正常
- [ ] 移动端可以玩
- [ ] 没有控制台错误

## 🐛 常见错误

### 错误1: GameLauncher is not defined

```
解决: 检查 <script src="js/game-launcher.js"></script> 是否加载
```

### 错误2: GET /games/tank-battle.html 404

```
解决: 确保 /games/ 目录存在，文件路径正确
```

### 错误3: Game failed to load

```
解决: 打开浏览器控制台看具体错误，检查共享库是否加载
```

### 错误4: Touch controls not working

```
解决: 检查 unified-game-controls.js 是否加载
确保 <div id="tankBattleControls" class="ugc-mount"></div> 存在
```

## 📚 详细文档

- **集成指南**: `/games/README.md`
- **架构对比**: `/docs/GAME_ARCHITECTURE_REFACTOR.md`
- **迁移清单**: `/GAME_MODULARIZATION_CHECKLIST.md`
- **测试说明**: `/GAME_INTEGRATION_TESTING.md`
- **集成示例**: `/js/game-integration-example.js`

## 🎯 下一步

1. 在 museum-checkin.html 中集成 GameLauncher
2. 添加游戏启动按钮
3. 运行测试
4. 删除旧代码
5. 发布新版本

---

**状态**: ✅ 已准备好集成
**最后更新**: 2025-01-XX
**维护者**: MuseumCheck Team

