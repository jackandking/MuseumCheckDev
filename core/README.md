# MuseumCheck Core Module

核心数据管理系统，提供统一的存储抽象层。

## 模块列表

### 事件系统
- `event-bus.js` - 事件总线，用于模块间解耦通信

### 存储适配器
- `storage-adapters/base-adapter.js` - 适配器基类
- `storage-adapters/localstorage-adapter.js` - localStorage 适配器
- `storage-adapters/kv-adapter.js` - KV Store 适配器  
- `storage-adapters/sql-adapter.js` - MySQL 适配器
- `storage-adapters/file-adapter.js` - 文件存储适配器（CDN）

### 核心管理器
- `data-manager.js` - 统一数据管理器
- `overlay-manager.js` - 私有数据层管理器
- `multi-cloud-config.js` - 多云配置管理器
- `version-manager.js` - 版本管理器

### 入口
- `index.js` - 统一初始化入口

## 使用方法

### 基本初始化

```html
<!-- 加载核心模块 -->
<script src="/core/event-bus.js"></script>
<script src="/shared/data/storage-adapters/base-adapter.js"></script>
<script src="/shared/data/storage-adapters/localstorage-adapter.js"></script>
<script src="/shared/data/storage-adapters/kv-adapter.js"></script>
<script src="/shared/data/storage-adapters/sql-adapter.js"></script>
<script src="/shared/data/storage-adapters/file-adapter.js"></script>
<script src="/core/overlay-manager.js"></script>
<script src="/core/data-manager.js"></script>
<script src="/core/multi-cloud-config.js"></script>
<script src="/core/version-manager.js"></script>
<script src="/core/index.js"></script>

<script>
// 初始化核心系统
const core = await initializeMuseumCheckCore({
  userId: 'user-123',
  autoHealthCheck: true,
  autoVersionCheck: true
});

// 使用 DataManager
const dataManager = core.dataManager;

// 读取数据
const museum = await dataManager.get('forbidden-city');

// 写入数据（提交者即时可见）
await dataManager.set('my-checklist', checklistData);

// localStorage 便捷方法
await dataManager.setLocal('settings', userSettings);
const settings = await dataManager.getLocal('settings');

// KV Store 便捷方法
await dataManager.kvSet('leaderboard', leaderboardData, { sortKey: 'user-123' });
</script>
```

### 自动初始化

```html
<script>
// 配置自动初始化
window.MUSEUMCHECK_AUTO_INIT = true;
window.MUSEUMCHECK_CONFIG = {
  autoHealthCheck: true,
  autoVersionCheck: true
};
</script>
<script src="/core/index.js"></script>
```

## 架构设计

### 存储优先级

1. **Overlay 层** - 用户私有数据（提交者即时可见）
2. **localStorage** - 浏览器本地缓存（优先级 0）
3. **KV Store** - 远程 KV 存储（优先级 1）
4. **MySQL** - 关系型数据库（优先级 2）
5. **File Storage** - 静态 CDN（优先级 3，只读）

### 数据流

```
用户提交 UGC
  ↓
写入 Overlay（立即可见）
  ↓
异步写入 KV/SQL
  ↓
审核通过
  ↓
合并到公共层
  ↓
定时回填
  ↓
生成静态文件
  ↓
推送 CDN
```

## API 文档

### DataManager

#### 读取数据
```javascript
const data = await dataManager.get(key, options);
```

#### 写入数据
```javascript
await dataManager.set(key, value, options);
```

#### 删除数据
```javascript
await dataManager.delete(key, options);
```

#### 批量操作
```javascript
const results = await dataManager.batchGet([key1, key2, key3]);
await dataManager.batchSet({ key1: value1, key2: value2 });
```

#### Overlay 管理
```javascript
// 审核通过
await dataManager.approveOverlay(key, userId);

// 拒绝
await dataManager.rejectOverlay(key, userId, reason);

// 查询用户的 overlay
const overlays = await dataManager.listUserOverlays(userId);

// 查询所有待审核
const pending = await dataManager.listPendingOverlays();
```

### 事件监听

```javascript
const eventBus = EventBus.getInstance();

// 监听数据命中
eventBus.on('data:hit', (data) => {
  console.log('Data hit:', data.source, data.key);
});

// 监听 overlay 审核
eventBus.on('overlay:approved', (data) => {
  console.log('Overlay approved:', data.key, data.userId);
});

// 监听版本更新
eventBus.on('version:update-available', (data) => {
  console.log('Update available:', data.current, '->', data.latest);
});
```

## 测试

```bash
npm test
```

## 贡献

请参考 [CONTRIBUTING.md](../docs/CONTRIBUTING.md)

## License

MIT
