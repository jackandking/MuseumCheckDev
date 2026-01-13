# 全局 UI 系统实现指南

## 快速开始

### 第 1 步：在页面中引入全局资源

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    
    <!-- 引入全局 UI 样式 -->
    <link rel="stylesheet" href="css/global-ui.css">
    
    <!-- 其他页面特定的样式 -->
    <link rel="stylesheet" href="css/style.css">
</head>
<body>
    <!-- 内容将在这里 -->
</body>
</html>
```

### 第 2 步：添加全局头部和菜单结构

```html
<body>
    <!-- 全局头部（所有页面相同） -->
    <header class="global-header">
        <button id="mobileMenuButton" class="menu-button" title="菜单">☰</button>
        <h1 class="page-title">页面标题</h1>
        <button id="settingsButton" class="settings-button" title="设置">⚙️</button>
    </header>
    
    <!-- 全局菜单模态框（所有页面相同） -->
    <div id="mobileMenuModal" class="modal">
        <div class="modal-content">
            <div class="modal-header">
                <h2>菜单</h2>
                <span class="close">&times;</span>
            </div>
            <div class="modal-body">
                <ul class="menu-items">
                    <li><a href="index.html">🏛️ 首页</a></li>
                    <li><a href="museum-checkin.html">✅ 打卡</a></li>
                    <li><a href="achievements.html">🎖️ 成就</a></li>
                    <li><a href="settings.html">⚙️ 设置</a></li>
                </ul>
            </div>
        </div>
    </div>
    
    <!-- 主要内容 -->
    <main>
        <!-- 页面特定的内容 -->
    </main>
    
    <!-- 页面特定的设置模态框（可选） -->
    <div id="settingsModal" class="modal">
        <div class="modal-content">
            <div class="modal-header">
                <h2>设置</h2>
                <span class="close">&times;</span>
            </div>
            <div class="modal-body">
                <!-- 设置内容 -->
            </div>
        </div>
    </div>
    
    <!-- 引入全局 UI 管理系统 -->
    <script src="js/global-ui.js"></script>
    
    <!-- 页面初始化脚本 -->
    <script>
        // 初始化全局 UI
        const globalUI = new GlobalUI();
        
        // 如果页面有设置，配置设置按钮处理
        const settingsModal = document.getElementById('settingsModal');
        if (settingsModal) {
            globalUI.setSettingsHandler(() => {
                globalUI.openSettings();
            });
            
            // 设置模态框关闭按钮
            const closeBtn = settingsModal.querySelector('.close');
            if (closeBtn) {
                closeBtn.addEventListener('click', () => {
                    globalUI.closeSettings();
                });
            }
            
            // 点击外部关闭
            settingsModal.addEventListener('click', (e) => {
                if (e.target === settingsModal) {
                    globalUI.closeSettings();
                }
            });
        }
    </script>
</body>
```

---

## 高级用法

### 监听菜单事件

```javascript
const globalUI = new GlobalUI();

// 菜单打开时
globalUI.on('menuOpened', () => {
    console.log('菜单已打开');
});

// 菜单关闭时
globalUI.on('menuClosed', () => {
    console.log('菜单已关闭');
});

// 设置打开时
globalUI.on('settingsOpened', () => {
    console.log('设置已打开');
});

// 设置关闭时
globalUI.on('settingsClosed', () => {
    console.log('设置已关闭');
});
```

### 动态更新菜单项

```javascript
const globalUI = new GlobalUI();

// 动态更新菜单项
globalUI.updateMenuItems([
    { label: '首页', icon: '🏛️', href: 'index.html' },
    { label: '打卡', icon: '✅', href: 'museum-checkin.html' },
    { label: '成就', icon: '🎖️', href: 'achievements.html' },
    { label: '设置', icon: '⚙️', href: 'settings.html' }
]);
```

### 自定义设置处理

```javascript
const globalUI = new GlobalUI();

// 设置按钮点击时的自定义处理
globalUI.setSettingsHandler(() => {
    console.log('打开设置');
    // 自定义逻辑
    document.getElementById('settingsModal').style.display = 'flex';
});
```

### 程序化控制菜单

```javascript
const globalUI = new GlobalUI();

// 打开菜单
globalUI.openMenu();

// 关闭菜单
globalUI.closeMenu();

// 切换菜单
globalUI.toggleMenu();

// 检查菜单是否打开
if (globalUI.isMenuOpen()) {
    console.log('菜单已打开');
}
```

---

## 迁移清单

### 对于每个需要迁移的页面：

- [ ] 第 1 步：引入全局资源
  ```html
  <link rel="stylesheet" href="css/global-ui.css">
  ```

- [ ] 第 2 步：替换头部
  - 删除页面内的菜单按钮定义
  - 添加统一的 `.global-header`

- [ ] 第 3 步：添加菜单模态框
  - 如果没有，复制标准菜单模态框
  - 如果已有，确保使用标准的 HTML 结构

- [ ] 第 4 步：初始化脚本
  ```javascript
  <script src="js/global-ui.js"></script>
  <script>
      const globalUI = new GlobalUI();
      // 页面特定的初始化
  </script>
  ```

- [ ] 第 5 步：清理旧代码
  - 删除页面内的菜单样式定义
  - 删除页面内的菜单逻辑

- [ ] 第 6 步：测试
  - 测试菜单打开/关闭
  - 测试菜单项点击导航
  - 测试设置按钮功能
  - 测试响应式设计

---

## CSS 覆盖和自定义

### 如果需要自定义特定页面的头部样式：

```css
/* 在 style.css 或页面的 <style> 中 */

/* 特定页面的头部自定义 */
.settings-page .global-header {
    background-color: #f5f5f5;
}

.settings-page .page-title {
    color: #ff6b6b;
}
```

### 如果需要自定义菜单项样式：

```css
/* 在 style.css 中 */

.menu-items a {
    /* 覆盖全局样式 */
}

.menu-items a:hover {
    background-color: #e3f2fd;
}
```

---

## 浏览器支持

- ✅ Chrome 60+
- ✅ Firefox 55+
- ✅ Safari 12+
- ✅ Edge 79+
- ✅ Mobile Safari (iOS 12+)
- ✅ Chrome Mobile

---

## 常见问题

### Q: 如何修改菜单宽度？
A: 在 CSS 中修改 `.modal-content` 的 `max-width`：
```css
.modal-content {
    max-width: 600px; /* 改为你想要的宽度 */
}
```

### Q: 如何改变菜单打开的动画？
A: 修改 CSS 中的 `@keyframes slideDown`：
```css
@keyframes slideDown {
    from {
        transform: translateX(-100%);
        opacity: 0;
    }
    to {
        transform: translateX(0);
        opacity: 1;
    }
}
```

### Q: 如何禁用 ESC 键关闭菜单？
A: 在初始化前移除这个功能：
```javascript
const globalUI = new GlobalUI();
// 移除 ESC 键处理（目前没有直接选项，可以在 global-ui.js 中修改）
```

### Q: 菜单项如何显示活跃状态？
A: 添加 `active` 类到当前页面的菜单项：
```html
<li><a href="index.html" class="active">🏛️ 首页</a></li>
```

```css
.menu-items a.active {
    background-color: rgba(79, 70, 229, 0.1);
    color: #2c5aa0;
    font-weight: 600;
}
```

---

## 下一步

1. 选择一个页面进行试点迁移
2. 验证所有功能正常
3. 逐个迁移其他页面
4. 删除重复的样式和代码
5. 更新文档

需要帮助迁移第一个页面吗？
