# 快速开始指南

## 5 分钟快速入门

### 1️⃣ 初始化 DataManager

```javascript
// 应用启动时执行一次
const dm = DataManager.getInstance({
  userId: getCurrentUserId(),
  localStorage: {
    enabled: true,
    prefix: 'museumcheck_'
  }
});

// 全局可用
window.dataManager = dm;
```

### 2️⃣ 基础读写

```javascript
// ✅ 写入数据
await dm.set('visited-museums', ['forbidden-city']);

// ✅ 读取数据
const museums = await dm.get('visited-museums');

// ✅ 用户私有数据（立即可见）
await dm.set('draft-post', draftContent, {
  userId: 'user-123',
  useOverlay: true
});

// ✅ 删除数据
await dm.delete('temp-data');
```

### 3️⃣ 监听数据变化

```javascript
// 监听数据改变事件
EventBus.getInstance().on('data:changed', (event) => {
  console.log('数据已改变:', event.key);
  updateUI();
});

// 监听 overlay 批准
EventBus.getInstance().on('overlay:approved', (event) => {
  console.log('数据已批准:', event.key);
  showNotification('您的提交已批准！');
});
```

### 4️⃣ 错误处理

```javascript
try {
  const data = await dm.get('important-data');
  
  if (!data) {
    console.log('数据未找到');
  }
  
  // 使用 data...
} catch (error) {
  console.error('查询失败:', error.message);
  // 降级处理或显示错误提示
}
```

---

## 常见任务

### 任务 1: 保存用户设置

```javascript
// 用户改变了主题设置
const settings = { theme: 'dark', language: 'zh' };

await dm.setLocal('user-settings', settings);

// 下次应用启动
const savedSettings = await dm.getLocal('user-settings') || { theme: 'light' };
```

### 任务 2: 实现即时反馈 (Overlay)

```javascript
// 用户提交评论
const comment = { text: '很不错的博物馆！', timestamp: Date.now() };

// 立即显示给用户
await dm.set('pending-comment', comment, {
  userId: userId,
  useOverlay: true  // 关键！使用 overlay
});

// 用户立即看到自己的评论（不是灰显的）

// 后台：
// 1. 管理员审核评论
// 2. 批准后发出 'overlay:approved' 事件
// 3. 应用更新 UI（评论变成正式状态）
```

### 任务 3: 批量操作

```javascript
// 批量读取多个数据
const results = await dm.batchGet([
  'visited-museums',
  'achievements',
  'pet-level',
  'user-stats'
]);

const visited = results.get('visited-museums');
const achievements = results.get('achievements');

// 批量写入
await dm.batchSet([
  { key: 'sync-status', value: 'synced' },
  { key: 'last-sync', value: Date.now() },
  { key: 'sync-version', value: '1.0.0' }
]);
```

### 任务 4: 健康检查

```javascript
// 定期检查适配器状态
setInterval(async () => {
  const health = await dm.getAdaptersHealth();
  
  health.forEach(adapter => {
    console.log(`${adapter.adapter}: ${adapter.status}`);
    
    if (adapter.status === 'failed') {
      console.error(`${adapter.adapter} 故障！`);
      // 发送告警
      sendAlert(`${adapter.adapter} 不可用`);
    }
  });
}, 60000); // 每分钟检查一次
```

### 任务 5: 版本管理

```javascript
const vm = new VersionManager();

// 检查是否有新版本
if (await vm.hasUpdate('museums-data')) {
  console.log('有新版本的博物馆数据！');
  
  // 后台加载新版本
  const newData = await dm.get('museums-data');
  updateMuseumsUI(newData);
}
```

---

## 层级参考

### 多级缓存示意

```
应用需要数据
    │
    ├─→ [1] Overlay (用户私有) ✓ 1ms
    │     用户提交的未批准数据
    │
    ├─→ [2] localStorage (本地) ✓ 1-5ms
    │     缓存的热数据
    │
    ├─→ [3] KV Store (Letmetry) ✓ 100-200ms
    │     实时协作数据
    │
    ├─→ [4] MySQL (Letmetry) ✓ 200-400ms
    │     持久化数据
    │
    └─→ [5] CDN/File ✓ 50-150ms
          静态存档数据
```

### 最佳实践

| 数据类型 | 推荐位置 | 原因 |
|---------|---------|------|
| 用户设置 | localStorage | 快速、离线可用 |
| 用户提交（待审核） | Overlay | 即时反馈，隔离 |
| 热数据（高频访问） | localStorage | 最小延迟 |
| 共享数据（实时更新） | KV Store | 多用户同步 |
| 官方数据（博物馆库） | MySQL/CDN | 持久、稳定 |
| 存档数据（历史记录） | MySQL | 完整查询 |

---

## 调试技巧

### 查看 localStorage 内容

```javascript
// 在浏览器控制台执行
localStorage.getItem('museumcheck_visited-museums')

// 查看所有 museumcheck 键
Object.keys(localStorage).filter(k => k.startsWith('museumcheck_'))
```

### 查看诊断信息

```javascript
// 运行完整诊断
const diag = await dm.diagnose();
console.log(diag);

// 查看统计
const stats = await dm.getStats();
console.log('缓存命中率:', stats.performance.cacheHitRate);
console.log('localStorage 使用:', stats.storage.localStorage.percent, '%');
```

### 监控事件

```javascript
// 监听所有 'data:changed' 事件
EventBus.getInstance().on('data:changed', (event) => {
  console.log('Change detected:', {
    key: event.key,
    source: event.source,  // 'overlay' | 'localStorage' | 'kv' | 'sql' | 'file'
    timestamp: new Date(event.timestamp).toLocaleString()
  });
});
```

### 强制刷新缓存

```javascript
// 删除所有本地缓存
await dm.delete('visited-museums');

// 强制重新加载
const fresh = await dm.get('visited-museums', {
  layers: ['kv', 'sql', 'file']  // 跳过本地缓存
});
```

---

## 常见陷阱 ⚠️

### ❌ 直接访问 localStorage
```javascript
// 不推荐！
const data = localStorage.getItem('visitedMuseums');

// ✅ 改用 DataManager
const data = await dm.get('visited-museums');
```

### ❌ 忘记 await
```javascript
// ❌ 错误
const data = dm.set('key', value);  // Promise，还没完成！

// ✅ 正确
await dm.set('key', value);  // 等待完成
```

### ❌ 在 overlay 中存储大数据
```javascript
// ❌ 不好（overlay 只用于临时数据）
await dm.set('all-museums', bigArray, { useOverlay: true });

// ✅ 改用持久层
await dm.set('all-museums', bigArray, { layers: ['sql'] });
```

### ❌ 忽视错误
```javascript
// ❌ 危险
const data = await dm.get('key');
console.log(data.length);  // 如果 data 是 null 会崩溃！

// ✅ 安全
const data = await dm.get('key');
if (data) {
  console.log(data.length);
} else {
  console.log('数据不存在');
}
```

---

## API 速查表

```javascript
// 基础
dm.get(key)              // 读取
dm.set(key, value)       // 写入
dm.delete(key)           // 删除

// 本地存储
dm.getLocal(key)         // 仅读本地
dm.setLocal(key, value)  // 仅写本地

// 批量
dm.batchGet(keys)        // 批量读取
dm.batchSet(items)       // 批量写入

// 查询
dm.query(condition)      // 复杂查询
dm.find(filter)          // 条件查询

// 监控
dm.getAdaptersHealth()   // 健康状态
dm.getStats()            // 统计信息
dm.diagnose()            // 完整诊断

// 事件
bus.on(event, callback)           // 监听
bus.off(event, callback)          // 取消
bus.emit(event, data)             // 发出
bus.emitAsync(event, data)        // 异步发出

// Overlay 管理
om.set(key, value, userId)        // 创建 overlay
om.approve(key, userId)           // 批准
om.reject(key, userId, reason)    // 拒绝
om.listByUser(userId)             // 列表

// 版本管理
vm.hasUpdate(name)                // 检查更新
vm.getCurrentVersion(name)        // 当前版本
vm.publishVersion(name, ver)      // 发布版本
```

---

## 资源

| 资源 | 位置 | 用途 |
|------|------|------|
| 完整 API 文档 | [API_REFERENCE.md](docs/architecture/API_REFERENCE.md) | 详细 API |
| 数据流设计 | [DATA_FLOW.md](docs/architecture/DATA_FLOW.md) | 理解架构 |
| 完整实现报告 | [PHASE1_IMPLEMENTATION.md](docs/architecture/PHASE1_IMPLEMENTATION.md) | 深入了解 |
| 核心模块 README | [core/README.md](core/README.md) | 快速参考 |
| 单元测试 | [tests/unit/core/core.test.js](tests/unit/core/core.test.js) | 代码示例 |

---

## 需要帮助？

1. **查看文档** → `/docs/architecture/`
2. **阅读 API 参考** → `API_REFERENCE.md`
3. **查看测试代码** → `tests/unit/core/`
4. **运行诊断** → `await dm.diagnose()`

---

**提示**: 保存本文件链接，快速查询时使用！

