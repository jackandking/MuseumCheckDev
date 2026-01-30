````markdown
# 游戏模块化迁移清单

## 📋 任务概述
将所有游戏从 `museum-checkin.html` 中独立出来，使用 iframe 和 GameLauncher 管理独立的游戏HTML文件。

## ✅ 已完成的工作

### 第1步：创建独立游戏HTML文件
- [x] `/games/tank-battle.html` - v3d AR主题的坦克大战
- [x] `/games/space-invaders.html` - 紫色主题的小蜜蜂
- [x] `/games/snake.html` - 绿色主题的贪食蛇

### 第2步：创建游戏启动管理器
- [x] `/js/game-launcher.js` - GameLauncher类
- [x] 支持iframe加载和通信
- [x] 支持游戏关闭回调

### 第3步：创建集成文档
- [x] `/games/README.md` - 完整的集成指南
- [x] `/js/game-integration-example.js` - 集成示例代码
- [x] 包含CSS样式示例和HTML集成示例

## ⏳ 待完成的工作

### 第4步：在museum-checkin.html中集成GameLauncher

**任务**: 修改 `museum-checkin.html` 以使用新的游戏系统

**步骤**:
```
[ ] 4.1 在 <head> 中添加：
      <script src="js/game-launcher.js"></script>

[ ] 4.2 在应用初始化代码中添加：
      const gameIntegration = new MuseumGameIntegration();

[ ] 4.3 创建显示游戏按钮的函数

[ ] 4.4 在博物馆详情面板中加入游戏按钮

[ ] 4.5 测试所有游戏的启动和关闭
```

**文件**: `/workspaces/MuseumCheck/museum-checkin.html`

**位置**: 
- 引入脚本: `<head>` 部分
- 初始化: 主应用脚本中
- UI按钮: 博物馆详情面板

### 第5步：从museum-checkin.html中移除旧游戏代码

**任务**: 删除不再需要的游戏相关代码

**要删除的HTML**:
```html
<!-- 删除所有旧游戏覆盖层 -->
<div id="spaceInvadersOverlay" class="game-overlay">...</div>
<div id="tank-battleGameOverlay" class="game-overlay">...</div>
<div id="snakeGameOverlay" class="game-overlay">...</div>
```

**要删除的脚本**:
```javascript
// 删除直接游戏初始化
const spaceInvaders = new UnifiedSpaceInvadersGame({...});
const tankBattle = new UnifiedTankBattleGame({...});
const snake = new UnifiedSnakeGame({...});

// 删除旧的游戏显示/隐藏函数
function showGame(gameType) { ... }
function hideGame(gameType) { ... }
```

**要删除的CSS** (从 museum-checkin.css):
```css
/* 删除旧的游戏覆盖层样式 */
.game-overlay { ... }
.tank-battle-overlay { ... }
.space-invaders-overlay { ... }
.snake-overlay { ... }

/* 删除现在在独立HTML中的样式 */
.tank-battle-ar { ... }
.tank-battle-scan-line { ... }
```

**文件**: 
- `/workspaces/MuseumCheck/museum-checkin.html`
- `/workspaces/MuseumCheck/css/museum-checkin.css`

### 第6步：添加游戏按钮UI

**任务**: 在博物馆详情中显示游戏启动按钮

**按钮设计**:
```
┌─────────────────────────────┐
│   🎮 探险游戏               │
├─────────────────────────────┤
│  [🎖️ 坦克]  [👽 小蜜蜂]  [🐍 蛇]  │
│   AR文物守护  防卫战      收集   │
└─────────────────────────────┘
```

**实现文件**: `/workspaces/MuseumCheck/css/museum-checkin.css`

**CSS类**:
- `.museum-games` - 游戏区容器
- `.games-grid` - 游戏按钮网格
- `.game-btn` - 按钮基础样式
- `.game-btn-tank` - 坦克大战按钮
- `.game-btn-invaders` - 小蜜蜂按钮
- `.game-btn-snake` - 贪食蛇按钮

### 第7步：测试游戏集成

**测试场景**:

```
[ ] 7.1 坦克大战游戏
    [ ] 点击"坦克大战"按钮
    [ ] 游戏iframe加载成功
    [ ] 游戏可以正常玩
    [ ] 点击"继续游览"按钮
    [ ] 返回博物馆详情界面
    [ ] 游戏iframe被销毁

[ ] 7.2 小蜜蜂游戏
    [ ] 点击"小蜜蜂"按钮
    [ ] 游戏iframe加载成功
    [ ] 游戏可以正常玩
    [ ] 游戏关闭返回正常

[ ] 7.3 贪食蛇游戏
    [ ] 点击"贪食蛇"按钮
    [ ] 游戏iframe加载成功
    [ ] 游戏可以正常玩
    [ ] 游戏关闭返回正常

[ ] 7.4 移动端测试
    [ ] 按钮在小屏幕上排列正确
    [ ] 游戏在iPhone上可以玩
    [ ] 游戏在Android上可以玩

[ ] 7.5 浏览器兼容性
    [ ] Chrome/Chromium
    [ ] Firefox
    [ ] Safari
    [ ] Edge
```

### 第8步：更新使用统计和成就

**任务**: 确保游戏成绩能被记录和同步

**集成点**:
```
[ ] 8.1 游戏完成时发送postMessage
    const gameResult = {
        type: 'game-complete',
        gameType: 'tank-battle',
        score: 5000,
        level: 3,
        achievement: 'tank-master'
    };
    window.parent.postMessage(gameResult, '*');

[ ] 8.2 museum-checkin.html监听游戏消息
    window.addEventListener('message', (event) => {
        if (event.data.type === 'game-complete') {
            // 更新用户成就
            // 记录游戏成绩
            // 更新统计
        }
    });

[ ] 8.3 更新用户成就数据库
    game-tank-battle-level-1
    game-space-invaders-wave-5
    game-snake-length-50
    game-master (完成所有游戏)

[ ] 8.4 更新成就面板显示
```

**文件**: 
- `/workspaces/MuseumCheck/museum-checkin.html`
- `/workspaces/MuseumCheck/js/game-launcher.js`

### 第9步：性能优化和代码清理

**任务**: 优化加载时间和减少包体积

```
[ ] 9.1 验证museum-checkin.html文件大小减少
    Before: ~XXX KB
    After: ~XXX KB
    Reduction: ~% smaller

[ ] 9.2 验证游戏加载时间
    museum-checkin.html 加载: <1s
    tank-battle.html 加载: <0.5s
    space-invaders.html 加载: <0.5s
    snake.html 加载: <0.5s

[ ] 9.3 删除未使用的代码
    [ ] 删除旧游戏初始化代码
    [ ] 删除不再使用的CSS
    [ ] 合并重复的样式定义

[ ] 9.4 优化关键渲染路径
    [ ] 验证CSS加载顺序
    [ ] 优化JavaScript执行顺序
    [ ] 删除未使用的库
```

### 第10步：文档更新和版本发布

**任务**: 更新项目文档

```
[ ] 10.1 更新README.md
    [ ] 添加游戏模块化架构说明
    [ ] 更新文件结构图
    [ ] 添加新的集成说明

[ ] 10.2 更新开发指南
    [ ] 如何添加新游戏
    [ ] 如何修改游戏主题
    [ ] iframe通信协议

[ ] 10.3 创建变更日志
    [ ] 记录从monolithic到modular的转变
    [ ] 列出所有创建的新文件
    [ ] 列出所有修改的文件
    [ ] 列出所有删除的代码

[ ] 10.4 更新版本号
    [ ] 从 v2.x.x 更新到 v2.1.0 (新功能)
    [ ] 或从 v2.x.x 更新到 v3.0.0 (架构重大改变)
```

## 📊 进度统计

| 任务 | 状态 | 完成度 |
|------|------|--------|
| 创建独立游戏HTML文件 | ✅ 完成 | 100% |
| 创建游戏启动管理器 | ✅ 完成 | 100% |
| 创建集成文档 | ✅ 完成 | 100% |
| 在museum-checkin.html中集成 | ⏳ 进行中 | 0% |
| 删除旧游戏代码 | ⏳ 等待 | 0% |
| 添加游戏按钮UI | ⏳ 等待 | 0% |
| 测试游戏集成 | ⏳ 等待 | 0% |
| 更新成就系统 | ⏳ 等待 | 0% |
| 性能优化 | ⏳ 等待 | 0% |
| 文档更新 | ⏳ 等待 | 0% |
````
````markdown
# 游戏模块化迁移清单

## 📋 任务概述
将所有游戏从 `museum-checkin.html` 中独立出来，使用 iframe 和 GameLauncher 管理独立的游戏HTML文件。

## ✅ 已完成的工作

### 第1步：创建独立游戏HTML文件
- [x] `/games/tank-battle.html` - v3d AR主题的坦克大战
- [x] `/games/space-invaders.html` - 紫色主题的小蜜蜂
- [x] `/games/snake.html` - 绿色主题的贪食蛇

### 第2步：创建游戏启动管理器
- [x] `/js/game-launcher.js` - GameLauncher类
- [x] 支持iframe加载和通信
- [x] 支持游戏关闭回调

### 第3步：创建集成文档
- [x] `/games/README.md` - 完整的集成指南
- [x] `/js/game-integration-example.js` - 集成示例代码
- [x] 包含CSS样式示例和HTML集成示例

## ⏳ 待完成的工作

### 第4步：在museum-checkin.html中集成GameLauncher

**任务**: 修改 `museum-checkin.html` 以使用新的游戏系统

**步骤**:
```
[ ] 4.1 在 <head> 中添加：
      <script src="js/game-launcher.js"></script>

[ ] 4.2 在应用初始化代码中添加：
      const gameIntegration = new MuseumGameIntegration();

[ ] 4.3 创建显示游戏按钮的函数

[ ] 4.4 在博物馆详情面板中加入游戏按钮

[ ] 4.5 测试所有游戏的启动和关闭
```

**文件**: `/workspaces/MuseumCheck/museum-checkin.html`

**位置**: 
- 引入脚本: `<head>` 部分
- 初始化: 主应用脚本中
- UI按钮: 博物馆详情面板

### 第5步：从museum-checkin.html中移除旧游戏代码

**任务**: 删除不再需要的游戏相关代码

**要删除的HTML**:
```html
<!-- 删除所有旧游戏覆盖层 -->
<div id="spaceInvadersOverlay" class="game-overlay">...</div>
<div id="tank-battleGameOverlay" class="game-overlay">...</div>
<div id="snakeGameOverlay" class="game-overlay">...</div>
```

**要删除的脚本**:
```javascript
// 删除直接游戏初始化
const spaceInvaders = new UnifiedSpaceInvadersGame({...});
const tankBattle = new UnifiedTankBattleGame({...});
const snake = new UnifiedSnakeGame({...});

// 删除旧的游戏显示/隐藏函数
function showGame(gameType) { ... }
function hideGame(gameType) { ... }
```

**要删除的CSS** (从 museum-checkin.css):
```css
/* 删除旧的游戏覆盖层样式 */
.game-overlay { ... }
.tank-battle-overlay { ... }
.space-invaders-overlay { ... }
.snake-overlay { ... }

/* 删除现在在独立HTML中的样式 */
.tank-battle-ar { ... }
.tank-battle-scan-line { ... }
```

**文件**: 
- `/workspaces/MuseumCheck/museum-checkin.html`
- `/workspaces/MuseumCheck/css/museum-checkin.css`

### 第6步：添加游戏按钮UI

**任务**: 在博物馆详情中显示游戏启动按钮

**按钮设计**:
```
┌─────────────────────────────┐
│   🎮 探险游戏               │
├─────────────────────────────┤
│  [🎖️ 坦克]  [👽 小蜜蜂]  [🐍 蛇]  │
│   AR文物守护  防卫战      收集   │
└─────────────────────────────┘
```

**实现文件**: `/workspaces/MuseumCheck/css/museum-checkin.css`

**CSS类**:
- `.museum-games` - 游戏区容器
- `.games-grid` - 游戏按钮网格
- `.game-btn` - 按钮基础样式
- `.game-btn-tank` - 坦克大战按钮
- `.game-btn-invaders` - 小蜜蜂按钮
- `.game-btn-snake` - 贪食蛇按钮

### 第7步：测试游戏集成

**测试场景**:

```
[ ] 7.1 坦克大战游戏
    [ ] 点击"坦克大战"按钮
    [ ] 游戏iframe加载成功
    [ ] 游戏可以正常玩
    [ ] 点击"继续游览"按钮
    [ ] 返回博物馆详情界面
    [ ] 游戏iframe被销毁

[ ] 7.2 小蜜蜂游戏
    [ ] 点击"小蜜蜂"按钮
    [ ] 游戏iframe加载成功
    [ ] 游戏可以正常玩
    [ ] 游戏关闭返回正常

[ ] 7.3 贪食蛇游戏
    [ ] 点击"贪食蛇"按钮
    [ ] 游戏iframe加载成功
    [ ] 游戏可以正常玩
    [ ] 游戏关闭返回正常

[ ] 7.4 移动端测试
    [ ] 按钮在小屏幕上排列正确
    [ ] 游戏在iPhone上可以玩
    [ ] 游戏在Android上可以玩

[ ] 7.5 浏览器兼容性
    [ ] Chrome/Chromium
    [ ] Firefox
    [ ] Safari
    [ ] Edge
```

### 第8步：更新使用统计和成就

**任务**: 确保游戏成绩能被记录和同步

**集成点**:
```
[ ] 8.1 游戏完成时发送postMessage
    const gameResult = {
        type: 'game-complete',
        gameType: 'tank-battle',
        score: 5000,
        level: 3,
        achievement: 'tank-master'
    };
    window.parent.postMessage(gameResult, '*');

[ ] 8.2 museum-checkin.html监听游戏消息
    window.addEventListener('message', (event) => {
        if (event.data.type === 'game-complete') {
            // 更新用户成就
            // 记录游戏成绩
            // 更新统计
        }
    });

[ ] 8.3 更新用户成就数据库
    game-tank-battle-level-1
    game-space-invaders-wave-5
    game-snake-length-50
    game-master (完成所有游戏)

[ ] 8.4 更新成就面板显示
```

### 第9步：性能优化和代码清理

**任务**: 优化加载时间和减少包体积

```
[ ] 9.1 验证museum-checkin.html文件大小减少
    Before: ~XXX KB
    After: ~XXX KB
    Reduction: ~% smaller

[ ] 9.2 验证游戏加载时间
    museum-checkin.html 加载: <1s
    tank-battle.html 加载: <0.5s
    space-invaders.html 加载: <0.5s
    snake.html 加载: <0.5s

[ ] 9.3 删除未使用的代码
    [ ] 删除旧游戏初始化代码
    [ ] 删除不再使用的CSS
    [ ] 合并重复的样式定义

[ ] 9.4 优化关键渲染路径
    [ ] 验证CSS加载顺序
    [ ] 优化JavaScript执行顺序
    [ ] 删除未使用的库
```

### 第10步：文档更新和版本发布

**任务**: 更新项目文档

```
[ ] 10.1 更新README.md
    [ ] 添加游戏模块化架构说明
    [ ] 更新文件结构图
    [ ] 添加新的集成说明

[ ] 10.2 更新开发指南
    [ ] 如何添加新游戏
    [ ] 如何修改游戏主题
    [ ] iframe通信协议

[ ] 10.3 创建变更日志
    [ ] 记录从monolithic到modular的转变
    [ ] 列出所有创建的新文件
    [ ] 列出所有修改的文件
    [ ] 列出所有删除的代码

[ ] 10.4 更新版本号
    [ ] 从 v2.x.x 更新到 v2.1.0 (新功能)
    [ ] 或从 v2.x.x 更新到 v3.0.0 (架构重大改变)
```

## 📊 进度统计

| 任务 | 状态 | 完成度 |
|------|------|--------|
| 创建独立游戏HTML文件 | ✅ 完成 | 100% |
| 创建游戏启动管理器 | ✅ 完成 | 100% |
| 创建集成文档 | ✅ 完成 | 100% |
| 在museum-checkin.html中集成 | ⏳ 进行中 | 0% |
| 删除旧游戏代码 | ⏳ 等待 | 0% |
| 添加游戏按钮UI | ⏳ 等待 | 0% |
| 测试游戏集成 | ⏳ 等待 | 0% |
| 更新成就系统 | ⏳ 等待 | 0% |
| 性能优化 | ⏳ 等待 | 0% |
| 文档更新 | ⏳ 等待 | 0% |

## 📝 关键文件参考

### 新创建的文件
```
/games/
├── tank-battle.html           # ✅ 完成
├── space-invaders.html        # ✅ 完成
├── snake.html                 # ✅ 完成
└── README.md                  # ✅ 完成

/js/
├── game-launcher.js           # ✅ 完成
└── game-integration-example.js # ✅ 完成
```

### 需要修改的文件
```
museum-checkin.html            # ⏳ 需要修改
css/museum-checkin.css         # ⏳ 需要修改
```

### 参考文档
```
/games/README.md               # 集成指南
/js/game-integration-example.js # 代码示例
```

### 🚀 快速开始

### 1. 测试独立游戏
```bash
# 在浏览器中直接打开游戏
open http://localhost:8000/games/tank-battle.html
open http://localhost:8000/games/space-invaders.html
open http://localhost:8000/games/snake.html
```

### 2. 在museum-checkin.html中集成
```javascript
// 第1步：引入
<script src="js/game-launcher.js"></script>

// 第2步：初始化
const gameLauncher = new GameLauncher();

// 第3步：启动游戏
gameLauncher.launchGame('tank-battle', { museumId: 'forbidden-city' });
```

### 3. 监听游戏事件
```javascript
window.addEventListener('message', (event) => {
    if (event.data.type === 'game-close') {
        console.log('游戏已关闭');
    }
});
```

## ⚠️ 常见问题

**Q: 所有新游戏HTML都已准备好了吗？**
A: 是的，`tank-battle.html`, `space-invaders.html`, `snake.html` 都已创建。

**Q: 游戏可以单独打开测试吗？**
A: 是的，可以在浏览器中直接打开 `/games/*.html` 测试。

**Q: 现在应该做什么？**
A: 现在需要：
1. 在 museum-checkin.html 中引入 GameLauncher
2. 创建启动游戏的按钮
3. 删除旧的游戏代码
4. 测试全部流程

**Q: 多长时间能完成？**
A: 大约1-2小时，取决于testing量。

**Q: 是否影响现有功能？**
A: 不影响。可以先添加新系统，然后逐步删除旧代码。

## 📞 支持

- 集成问题? 查看 `/games/README.md`
- 代码示例? 查看 `/js/game-integration-example.js`
- API问题? 查看 `/js/game-launcher.js` 中的注释

