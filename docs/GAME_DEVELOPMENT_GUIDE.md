# 游戏开发规范指南

## 虚拟按钮实现规范

### ⚠️ 关键问题
独立游戏页面的虚拟按钮必须创建完整的 `KeyboardEvent` 对象，而不是简单的对象字面量。

### ❌ 错误做法
```javascript
button.addEventListener('click', () => {
    gameInstance.handleKeydownInput({ key: 'ArrowUp' }); // 不工作！
});
```

### ✅ 正确做法
```javascript
button.addEventListener('click', (e) => {
    e.preventDefault();
    const event = new KeyboardEvent('keydown', {
        key: 'ArrowUp',
        code: 'ArrowUp',
        bubbles: true,
        cancelable: true
    });
    gameInstance.handleKeydownInput(event);
});
```

## 推荐实现：使用共享模块（最佳实践）

**优势：**
- ✅ 不需要在每个游戏中重复代码
- ✅ 统一的实现，避免不一致
- ✅ 统一的键盘UX（方向键 + WASD）
- ✅ 一次修复，所有游戏受益

### 方式1：虚拟按钮 + 统一键盘控制（推荐）

```javascript
// 1. 引入共享模块
<script src="../js/shared-virtual-controls.js"></script>

// 2. 统一设置虚拟按钮和键盘
SharedVirtualControls.setupUnified({
    gameInstance,
    buttons: {
        up: 'mazeUp',
        down: 'mazeDown',
        left: 'mazeLeft',
        right: 'mazeRight'
    },
    keyboard: {
        up: true,
        down: true,
        left: true,
        right: true,
        fire: false  // 如果游戏不需要发射
    },
    gameName: 'Maze'
});
```

**统一键盘映射：**
- ⬆️ 上：`ArrowUp` 或 `W`
- ⬇️ 下：`ArrowDown` 或 `S`
- ⬅️ 左：`ArrowLeft` 或 `A`
- ➡️ 右：`ArrowRight` 或 `D`
- 🔥 发射：`Space`

### 方式2：仅虚拟按钮

```javascript
// 标准四方向按钮（迷宫、坦克、贪食蛇）
SharedVirtualControls.setupStandard(gameInstance, 'game', 'GameName');

// 或者：左右+发射按钮（小蜜蜂）
SharedVirtualControls.setupWithFire(gameInstance, 'si', 'SpaceInvaders');

// 或者：自定义配置
SharedVirtualControls.setup({
    gameInstance,
    buttons: {
        up: 'buttonId',
        down: 'buttonId',
        left: 'buttonId',
        right: 'buttonId'
    },
    gameName: 'GameName'
});
```

### 方式3：仅统一键盘控制

```javascript
// 适用于已有键盘处理但想统一UX的游戏
SharedVirtualControls.setupKeyboard({
    gameInstance,
    actions: ['up', 'down', 'left', 'right', 'fire'],
    gameName: 'GameName'
});
```

## 手动实现（仅供参考）

如果你需要完全自定义的实现，可以参考以下代码：

```javascript
// 创建模拟键盘事件的辅助函数
const simulateKeyPress = (key) => {
    const event = new KeyboardEvent('keydown', {
        key: key,
        code: key,
        bubbles: true,
        cancelable: true
    });
    gameInstance.handleKeydownInput(event);
};

// 绑定按钮
document.getElementById('upBtn').addEventListener('click', (e) => {
    e.preventDefault();
    simulateKeyPress('ArrowUp');
});
```

**注意：** 推荐使用共享模块而不是手动实现。

## 测试要求

### 必须测试的功能
1. ✅ 物理键盘控制
2. ✅ 虚拟按钮点击
3. ✅ 游戏逻辑响应
4. ✅ 步数/分数更新

### 自动化测试
每个游戏都应该有对应的自动化测试：
- `e2e/maze-game-auto.spec.ts`
- `e2e/tank-battle-auto.spec.ts`
- `e2e/space-invaders-auto.spec.ts`
- `e2e/snake-game-auto.spec.ts`

运行测试：
```bash
npx playwright test e2e/[game]-auto.spec.ts
```

## 开发检查清单

### 添加新游戏时
- [ ] 创建独立游戏HTML文件
- [ ] 添加虚拟按钮HTML结构
- [ ] 使用正确的KeyboardEvent实现虚拟按钮
- [ ] 将gameInstance暴露到window
- [ ] 添加游戏上下文管理
- [ ] 实现closeGame返回逻辑
- [ ] 创建自动化测试
- [ ] 运行测试验证所有功能

### 修改现有游戏时
- [ ] 运行自动化测试确保没有破坏功能
- [ ] 测试物理键盘和虚拟按钮
- [ ] 验证游戏完成和返回流程

## 常见问题

### Q: 为什么虚拟按钮不工作？
A: 检查是否创建了完整的KeyboardEvent对象，而不是简单的对象字面量。

### Q: 如何调试虚拟按钮？
A: 添加console.log查看按钮点击事件是否触发，检查gameInstance是否存在。

### Q: 游戏状态检查失败怎么办？
A: 独立游戏页面没有overlay，需要修改状态检查逻辑：
```javascript
// 检查游戏状态
if (this.state !== 'playing') {
    return;
}

// 如果有overlay（嵌入式模式），检查是否显示
if (this.overlay && !this.overlay.classList.contains('show')) {
    return;
}
```

## 微信小程序兼容性

### 关键限制
- ❌ 不支持iframe
- ✅ 支持页面跳转
- ✅ 支持localStorage
- ✅ 支持Canvas和触摸事件

### 技术选型
- 使用页面跳转而不是iframe
- 使用localStorage传递数据
- 虚拟按钮必须正常工作（移动端主要控制方式）

## 参考资料
- [迷宫游戏实现](/games/maze.html)
- [自动化测试示例](/e2e/maze-game-auto.spec.ts)
- [游戏上下文管理](/js/game-context-manager.js)
