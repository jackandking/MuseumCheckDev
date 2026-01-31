# 游戏UI视觉测试指南

## 问题背景

AI无法直接看到浏览器中的游戏UI，导致在修复虚拟键盘等视觉问题时只能依靠代码分析，无法真正验证视觉效果。

## 解决方案

### 方案1：手动截图上传（推荐）

**优点：**
- 最直接、最快速
- AI能准确看到实际UI问题
- 适合快速迭代修复

**使用方法：**
1. 在浏览器中打开游戏页面
2. 使用系统截图工具（Mac: Cmd+Shift+4，Windows: Win+Shift+S）
3. 在对话中上传截图
4. 描述具体问题

**示例：**
```
"坦克大战的虚拟键盘右边被截断了"
[上传截图]
```

---

### 方案2：自动化视觉测试（已实现）

**优点：**
- 自动截图保存
- 可批量测试所有游戏
- 可验证按钮尺寸等技术指标

**使用方法：**

#### 1. 启动本地服务器
```bash
python3 -m http.server 8000
```

#### 2. 运行视觉测试
```bash
# 运行所有游戏的视觉测试
npx playwright test e2e/visual-game-controls.spec.ts

# 只测试特定游戏
npx playwright test e2e/visual-game-controls.spec.ts -g "坦克大战"

# 显示浏览器界面（调试模式）
npx playwright test e2e/visual-game-controls.spec.ts --headed
```

#### 3. 查看截图
测试完成后，截图保存在 `test-results/` 目录：

```
test-results/
├── visual-snake-full.png           # 贪食蛇全屏
├── visual-snake-controls.png       # 贪食蛇虚拟键盘
├── visual-space-invaders-full.png  # 小蜜蜂全屏
├── visual-space-invaders-controls.png
├── visual-tank-battle-full.png     # 坦克大战全屏
├── visual-tank-battle-controls.png
├── visual-maze-full.png            # 迷宫全屏
├── compare-snake.png               # 对比截图
├── compare-space-invaders.png
├── compare-tank-battle.png
└── compare-maze.png
```

#### 4. 分享截图给AI
将 `test-results/` 中的截图上传到对话中，AI就能看到实际UI效果。

---

### 方案3：浏览器开发者工具

**使用方法：**

1. **打开开发者工具**
   - Mac: Cmd+Option+I
   - Windows: F12

2. **切换到移动设备模式**
   - Mac: Cmd+Shift+M
   - Windows: Ctrl+Shift+M

3. **选择设备**
   - iPhone SE (375x667)
   - iPhone 12 Pro (390x844)
   - Pixel 5 (393x851)

4. **检查元素**
   - 右键点击虚拟键盘按钮
   - 选择"检查"
   - 查看CSS样式和尺寸

5. **测量尺寸**
   - 使用"测量"工具（开发者工具中的尺子图标）
   - 验证按钮是否 ≥44x44px

---

## 测试检查清单

### 虚拟键盘检查项

- [ ] **完整性** - 所有按钮都在屏幕内
- [ ] **尺寸** - 按钮 ≥44x44px（WCAG AAA标准）
- [ ] **间距** - 按钮间距 ≥8px
- [ ] **位置** - 不遮挡游戏画布
- [ ] **视觉反馈** - 按下时有明显变化
- [ ] **响应式** - 不同屏幕尺寸都正常

### 游戏UI检查项

- [ ] **画布显示** - 游戏画布清晰可见
- [ ] **顶部信息** - 分数、生命值等信息完整
- [ ] **结束提示** - 游戏结束时有模态框
- [ ] **布局协调** - 各元素位置合理
- [ ] **颜色对比** - 文字清晰可读

---

## 常见问题排查

### 问题1：虚拟键盘被截断

**症状：** 右边的火按钮看不到

**检查：**
```css
/* 查看按钮容器宽度 */
.ugc-dpad-fire {
    gap: ?px;  /* 间距是否太大 */
}

.ugc-btn {
    width: ?px;  /* 按钮是否太大 */
}
```

**解决：** 减小按钮尺寸或间距

---

### 问题2：虚拟键盘遮挡游戏

**症状：** 虚拟键盘浮在游戏画布上

**检查：**
```css
.ugc-container {
    position: fixed;  /* ❌ 会浮动 */
    position: relative;  /* ✅ 在文档流中 */
}
```

**解决：** 改为 `position: relative`

---

### 问题3：按钮太小难以点击

**症状：** 手指点不准

**检查：**
```javascript
// 在控制台运行
document.querySelector('.ugc-btn').getBoundingClientRect()
// 查看 width 和 height 是否 ≥44
```

**解决：** 增大按钮尺寸到至少44x44px

---

## 最佳实践

### 1. 开发流程
```
1. 修改代码
2. 刷新浏览器
3. 截图或运行视觉测试
4. 上传截图给AI
5. AI分析并提供改进建议
6. 重复1-5直到满意
```

### 2. 测试设备
- **主要测试：** iPhone SE (375x667) - 最小常见尺寸
- **次要测试：** iPhone 12 Pro (390x844) - 现代尺寸
- **边缘测试：** 小屏幕 (360x640) - 极限情况

### 3. 截图技巧
- 截取全屏，显示完整布局
- 如果有特定问题，额外截取局部放大图
- 在截图上标注问题区域（可选）

---

## 工具推荐

### 截图工具
- **Mac:** 自带截图（Cmd+Shift+4）
- **Windows:** Snipping Tool / Snip & Sketch
- **Chrome扩展:** Awesome Screenshot

### 测试工具
- **Playwright:** 自动化浏览器测试
- **Chrome DevTools:** 开发者工具
- **Responsively:** 多设备同时预览

---

## 相关文档

- [GAME_CONTROLS_MIGRATION.md](./GAME_CONTROLS_MIGRATION.md) - 虚拟键盘迁移文档
- [GAME_CONTROLS_VERIFICATION.md](./GAME_CONTROLS_VERIFICATION.md) - 虚拟键盘验证报告
- [Playwright文档](https://playwright.dev/) - 自动化测试

---

## 总结

**推荐工作流程：**
1. 开发时使用浏览器实时预览
2. 遇到问题时截图上传给AI
3. 定期运行自动化视觉测试
4. 重要更新前进行完整的视觉回归测试

这样可以确保AI能够准确理解UI问题并提供有效的解决方案。
