# 老用户返回体验 - 访问过的博物馆优先显示

## 📋 功能说明

当用户再次打开应用时（且已访问过至少一个博物馆），应用会自动：

1. **检测返回用户**：检查 `visitedMuseumsMeta` 存储中是否有访问记录
2. **仅显示已访问的博物馆**：只展示用户之前检查过的博物馆卡片
3. **按最近访问排序**：最近访问的博物馆显示在列表最上面

## 🔍 实现细节

### 1. 返回用户检测逻辑
位置：[js/script.js](js/script.js#L7304-L7306)

```javascript
// 返回用户简化定义：用户已访问（打卡）过任何博物馆
const isReturningUser = (Array.isArray(this.visitedMuseums) && this.visitedMuseums.length > 0)
    || (Object.keys(this.loadVisitedMuseumsMeta() || {}).length > 0);
```

### 2. 老用户展示逻辑
位置：[js/script.js](js/script.js#L7319-L7321)

```javascript
// 返回用户：只显示已访问的博物馆，按最近访问排序
if (isReturningUser) {
    museumsToRender = this.getVisitedMuseumsSorted();
}
```

### 3. 排序实现
位置：[js/script.js](js/script.js#L5531-L5545)

```javascript
getVisitedMuseumsSorted() {
    // 返回按 lastVisited 降序排列的博物馆对象数组
    const meta = this.loadVisitedMuseumsMeta() || {};
    const entries = Object.entries(meta || {});
    
    if (entries.length > 0) {
        // 按时间戳从大到小排序（最新的在前）
        entries.sort((a, b) => b[1] - a[1]);
        return entries.map(([id]) => MUSEUMS.find(m => m.id === id)).filter(Boolean);
    }
    
    // 备用方案：使用 visitedMuseums 数组顺序（从新到旧）
    if (Array.isArray(this.visitedMuseums) && this.visitedMuseums.length > 0) {
        return [...this.visitedMuseums].map(id => MUSEUMS.find(m => m.id === id)).filter(Boolean).reverse();
    }
    
    return [];
}
```

## 📊 数据结构

### visitedMuseumsMeta 存储格式
```javascript
{
    "museum-id-1": 1705282400000,  // 时间戳（毫秒）
    "museum-id-2": 1705195000000,
    "museum-id-3": 1705107600000
}
```

- **Key**：博物馆 ID（例如 `forbidden-city`）
- **Value**：最后一次访问的时间戳（毫秒，用于排序）

## 🔄 使用流程

### 首次用户
1. 打开应用 → `visitedMuseumsMeta` 为空
2. `isReturningUser = false`
3. 展示：所有博物馆（或按城市推荐）

### 第二次打开（已访问过）
1. 打开应用 → `visitedMuseumsMeta` 有记录
2. `isReturningUser = true`
3. 展示：仅已访问博物馆，按访问时间排序

### 访问新博物馆时
1. 用户打卡新博物馆
2. 位置：[js/script.js](js/script.js#L7606-L7612)
3. 更新 `visitedMuseumsMeta` 中对应的博物馆时间戳为 `Date.now()`
4. 下次打开应用时，这个博物馆会显示在最上面

## ✅ 测试覆盖

所有相关测试位置：[tests/returning-user-display.test.js](tests/returning-user-display.test.js)

### 覆盖场景
- ✅ 返回用户检测逻辑
- ✅ 按最近访问时间排序
- ✅ 仅显示已访问博物馆
- ✅ 新访问更新排序顺序
- ✅ 清除数据时移除元数据
- ✅ 新用户与返回用户的区分

## 🧪 手动测试步骤

### 验证新用户体验
1. 打开浏览器开发工具 → Application → Local Storage
2. 清除所有数据
3. 访问 http://localhost:8000
4. 应该看到所有博物馆或推荐列表

### 验证返回用户体验
1. 点击第一个博物馆卡片，进入详情
2. 点击"已打卡"标记为已访问
3. 返回主页（刷新或导航）
4. **预期行为**：
   - 只显示已访问的博物馆卡片
   - 最近打卡的博物馆在最上面

### 验证排序更新
1. 继续访问其他博物馆并标记为已访问
2. 每次访问一个新博物馆后，刷新主页
3. **预期行为**：最新打卡的博物馆自动移到最上面

## 🐛 故障排除

### 如果返回用户仍然看到所有博物馆
- 检查浏览器 DevTools → Application → Local Storage
- 确保 `visitedMuseumsMeta` 键存在且有值
- 检查浏览器控制台是否有错误

### 如果排序不正确
- 验证 `visitedMuseumsMeta` 中的时间戳值是否递减
- 确认 `getVisitedMuseumsSorted()` 方法使用的排序公式：`b[1] - a[1]`（降序）

## 📈 用户体验优势

| 特性 | 优势 |
|------|------|
| **减少搜索时间** | 用户立即看到自己关心的博物馆 |
| **保持进度** | 无需再次查找已访问的博物馆 |
| **鼓励继续探索** | 看到访问历史能激励用户访问新博物馆 |
| **最近访问优先** | 最近的计划或进行中的行程显示在最上面 |

## 📝 相关代码位置

| 功能 | 文件 | 行号 |
|------|------|------|
| 返回用户检测 | [js/script.js](js/script.js#L7304) | 7304-7306 |
| 老用户展示 | [js/script.js](js/script.js#L7319) | 7319-7321 |
| 排序实现 | [js/script.js](js/script.js#L5531) | 5531-5545 |
| 访问时间更新 | [js/script.js](js/script.js#L7606) | 7606-7612 |
| 单元测试 | [tests/returning-user-display.test.js](tests/returning-user-display.test.js) | 全文 |

## ✨ 完成状态

✅ **功能实现完成** - 老用户自动看到访问过的博物馆，按最近访问排序  
✅ **测试完整覆盖** - 7个关键场景全部测试通过  
✅ **代码经过验证** - 排序逻辑、时间戳更新、数据清理都已实现
