# 游戏模块化集成指南

## 概述
所有游戏已从 `museum-checkin.html` 中独立出来，存放在 `/games/` 目录。

```
/games/
├── tank-battle.html          # 🎖️ AR坦克大战 (v3d AR主题)
├── space-invaders.html       # 👽 小蜜蜂防卫战
├── snake.html                # 🐍 文物收集蛇
```

## 文件结构

### 独立游戏文件特点

每个游戏HTML都包含：
- ✅ 完整的UI标记（头部、游戏区、控制区）
- ✅ 独立的CSS样式（主题颜色和特效）
- ✅ 游戏初始化脚本
- ✅ iframe通信支持

### 共享资源

所有游戏使用共享的 JavaScript 库：
```
/js/
├── unified-game-controls.js   # 统一控制系统 (D-Pad + Fire)
├── base-game.js               # 游戏基类
├── unified-tank-battle-game.js
├── unified-space-invaders-game.js
├── unified-snake-game.js
└── game-launcher.js           # 游戏启动管理器 (新增)
```

## 集成方式

### 方式1：使用 GameLauncher (推荐)

```javascript
// 在 museum-checkin.html 中引入
<script src="js/game-launcher.js"></script>

// 初始化启动器
const gameLauncher = new GameLauncher({
    baseUrl: '/games/',
    onClose: () => {
        console.log('游戏已关闭');
        // 返回博物馆详情视图
    }
});

// 启动游戏
function startTankBattle() {
    gameLauncher.launchGame('tank-battle', {
        museumId: 'forbidden-city',
        museumName: '故宫博物院'
    });
}

// HTML中的按钮
<button onclick="startTankBattle()">🎖️ 玩坦克大战</button>
```

### 方式2：使用 iframe 手动嵌入

```html
<!-- 直接在 museum-checkin.html 中用 iframe -->
<div id="game-container" style="display: none;">
    <iframe 
        id="gameFrame" 
        src="" 
        style="width: 100%; height: 100%; border: none;">
    </iframe>
</div>

<script>
function launchGame(gameType) {
    const gameMap = {
        'tank-battle': '/games/tank-battle.html',
        'space-invaders': '/games/space-invaders.html',
        'snake': '/games/snake.html'
    };
    
    const gameUrl = gameMap[gameType];
    const container = document.getElementById('game-container');
    const frame = document.getElementById('gameFrame');
    
    frame.src = gameUrl;
    container.style.display = 'block';
    
    // 监听关闭事件
    window.addEventListener('message', (event) => {
        if (event.data.type === 'game-close') {
            container.style.display = 'none';
            frame.src = '';
        }
    });
}
</script>
```

## 游戏特性

### 坦克大战 (tank-battle.html)
- **主题**: v3d AR风格（青蓝色霓虹）
- **特效**: 扫描线动画、浮动文物卡片、3D变换
- **颜色**: 青色 (#00ffff)、蓝色 (#0099ff)
- **背景**: 深蓝梯度与扫描特效

### 小蜜蜂 (space-invaders.html)
- **主题**: 紫色霓虹防卫战
- **特效**: 紫色光晕、边框特效
- **颜色**: 紫色 (#c832ff)、品红 (#8b32f6)
- **背景**: 深紫梯度

### 贪食蛇 (snake.html)
- **主题**: 绿色探索收集
- **特效**: 绿色荧光、生态主题
- **颜色**: 亮绿 (#32ff64)、深绿 (#00cc44)
- **背景**: 深绿梯度

## 从museum-checkin.html中移除的代码

### 删除的HTML标记
```html
<!-- 删除以下游戏覆盖层，改用iframe -->
<div id="spaceInvadersOverlay" class="game-overlay">...</div>
<div id="tank-battleGameOverlay" class="game-overlay">...</div>
<div id="snakeGameOverlay" class="game-overlay">...</div>
```

### 更新的脚本加载
```javascript
// 删除直接初始化游戏的代码
// 改为使用GameLauncher或iframe加载

// 旧代码（删除）:
// const spaceInvaders = new UnifiedSpaceInvadersGame();
// const tankBattle = new UnifiedTankBattleGame();
// const snake = new UnifiedSnakeGame();

// 新代码（使用):
const gameLauncher = new GameLauncher();
```

## CSS样式组织

### 保留在 museum-checkin.css 中的样式
- 博物馆卡片样式
- 模态框基础样式
- 选项卡样式

### 移到游戏HTML内的样式
- 游戏特定的主题颜色
- 游戏覆盖层特效
- 游戏特定的动画

## 优点

✅ **模块化** - 每个游戏独立维护  
✅ **独立测试** - 可单独测试每个游戏  
✅ **代码复用** - 游戏可用于其他项目  
✅ **性能优化** - 减少 museum-checkin.html 大小  
✅ **并行开发** - 多人可同时开发不同游戏  
✅ **易于扩展** - 添加新游戏很简单  

## 添加新游戏

### 步骤1：创建游戏HTML
```bash
cp /games/tank-battle.html /games/new-game.html
```

### 步骤2：自定义样式和标记
```html
<!-- 更改游戏标题、颜色、特效等 -->
<div class="museum-name">新游戏名称</div>
<link rel="stylesheet" href="../css/new-game-theme.css">
```

### 步骤3：加载游戏脚本
```html
<script src="../js/your-new-game.js"></script>
```

### 步骤4：初始化游戏
```javascript
const gameInstance = new YourNewGame();
await gameInstance.init(gameIndex, {});
```

### 步骤5：在GameLauncher中注册
```javascript
this.games = {
    'tank-battle': 'tank-battle.html',
    'space-invaders': 'space-invaders.html',
    'snake': 'snake.html',
    'new-game': 'new-game.html'  // 新增
};
```

## 通信协议

### iframe 消息传递

**父窗口 → 子窗口**
```javascript
iframe.contentWindow.postMessage({
    type: 'start-game',
    gameType: 'tank-battle',
    museumId: 'forbidden-city'
}, '*');
```

**子窗口 → 父窗口**
```javascript
// 游戏关闭
window.parent.postMessage({
    type: 'game-close'
}, '*');

// 游戏得分更新
window.parent.postMessage({
    type: 'game-score',
    score: 1000,
    achievement: 'defender'
}, '*');
```

## 迁移清单

- [ ] 在museum-checkin.html中引入GameLauncher
- [ ] 创建启动游戏的按钮或菜单
- [ ] 测试坦克大战游戏加载
- [ ] 测试小蜜蜂游戏加载
- [ ] 测试贪食蛇游戏加载
- [ ] 验证游戏关闭返回正常流程
- [ ] 测试游戏得分记录
- [ ] 更新成就系统集成
- [ ] 从museum-checkin.html移除旧游戏代码
- [ ] 减少museum-checkin.css的大小

## 测试建议

```bash
# 测试坦克大战
open http://localhost:8000/games/tank-battle.html

# 测试小蜜蜂
open http://localhost:8000/games/space-invaders.html

# 测试贪食蛇
open http://localhost:8000/games/snake.html
```

## 常见问题

**Q: 游戏如何知道当前博物馆是哪个？**
A: 通过postMessage传递 `museumId` 参数

**Q: 游戏数据如何同步到成就系统？**
A: 通过postMessage返回 `game-score` 消息

**Q: 可以同时打开多个游戏吗？**
A: GameLauncher只支持一个活跃游戏，其他会被替换

**Q: 如何自定义游戏主题？**
A: 在游戏HTML文件中修改CSS颜色和动画
