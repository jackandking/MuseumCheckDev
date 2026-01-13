# API 参考文档

## DataManager API

### 单例获取
```javascript
const dm = DataManager.getInstance(config);
```

**参数:**
- `config` (Object, 可选)
  - `userId` (String): 当前用户 ID
  - `localStorage` (Object): LocalStorage 配置
    - `enabled` (Boolean): 启用？(默认 true)
    - `prefix` (String): 键前缀 (默认 'museumcheck_')
    - `quotaWarningPercent` (Number): 配额警告百分比 (默认 80)
  - `kvStore` (Object): KV Store 配置
    - `enabled` (Boolean): 启用？(默认 true)
    - `endpoint` (String): API 端点
    - `timeout` (Number): 超时时间 (ms, 默认 5000)
  - `mysql` (Object): MySQL 配置
    - `enabled` (Boolean): 启用？(默认 true)
    - `endpoint` (String): API 端点
    - `timeout` (Number): 超时时间 (ms, 默认 10000)
  - `eventBus` (EventBus): 事件总线实例 (可选)

**返回:** DataManager 单例实例

**示例:**
```javascript
const dm = DataManager.getInstance({
  userId: 'user-123',
  localStorage: {
    enabled: true,
    prefix: 'museumcheck_'
  },
  kvStore: {
    enabled: true,
    endpoint: 'https://letmetry.cloud/kv'
  }
});
```

---

### get(key, options)

从多层缓存中读取数据，按优先级：overlay → localStorage → KV → SQL → CDN

**签名:**
```typescript
async get(key: string, options?: GetOptions): Promise<any>
```

**参数:**
- `key` (String, 必需): 数据键
- `options` (Object, 可选)
  - `userId` (String): 用户 ID（用于 overlay）
  - `includeOverlay` (Boolean): 包含 overlay 数据？(默认 true)
  - `maxAge` (Number): 最大缓存年龄 (ms，默认 Infinity)
  - `layers` (Array): 指定查询层级 (默认 all)
    - 示例: `['localStorage', 'kv', 'sql']`

**返回:** 数据对象或 null

**错误处理:** 返回 null 如果所有层都找不到数据；返回部分错误如果某些层故障

**示例:**
```javascript
// 基础读取
const data = await dm.get('visited-museums');
// 返回: ['forbidden-city', 'national-museum'] 或 null

// 用户私有数据
const userData = await dm.get('user-settings', { 
  userId: 'user-123',
  includeOverlay: true 
});

// 仅从特定层读取
const fromSQL = await dm.get('ancient-treasures', {
  layers: ['sql', 'file']  // 跳过本地缓存
});

// 检查最大缓存年龄
const fresh = await dm.get('current-version', {
  maxAge: 3600000  // 不超过 1 小时
});
```

---

### set(key, value, options)

写入数据到缓存和持久层。立即写入 overlay/localStorage，后台异步写入 KV/SQL

**签名:**
```typescript
async set(key: string, value: any, options?: SetOptions): Promise<boolean>
```

**参数:**
- `key` (String, 必需): 数据键
- `value` (Any, 必需): 数据值（将被 JSON 序列化）
- `options` (Object, 可选)
  - `userId` (String): 用户 ID（用于 overlay）
  - `useOverlay` (Boolean): 存入 overlay？(默认 false)
  - `layers` (Array): 指定写入层级 (默认 all)
    - 示例: `['localStorage', 'kv']`
  - `ttl` (Number): 生存时间 (秒，用于 KV)
  - `immediate` (Boolean): 等待持久层完成？(默认 false)
  - `compress` (Boolean): 压缩大对象？(默认 true)

**返回:** true 如果至少写入一个层；false 如果全部失败

**示例:**
```javascript
// 基础写入
await dm.set('visited-museums', ['forbidden-city']);

// 用户私有数据（即时反馈）
await dm.set('draft-comment', commentDraft, {
  userId: 'user-123',
  useOverlay: true
});

// 设置过期时间（KV 层）
await dm.set('temp-token', token, {
  layers: ['kv'],
  ttl: 3600  // 1 小时后过期
});

// 等待持久层完成（重要数据）
const saved = await dm.set('achievement-unlocked', achievement, {
  layers: ['localStorage', 'sql'],
  immediate: true  // 等待完成
});

if (!saved) {
  console.error('Failed to save achievement');
}
```

---

### delete(key, options)

从所有层删除数据

**签名:**
```typescript
async delete(key: string, options?: DeleteOptions): Promise<boolean>
```

**参数:**
- `key` (String, 必需): 数据键
- `options` (Object, 可选)
  - `userId` (String): 用户 ID（仅删除用户 overlay）
  - `layers` (Array): 指定删除层级 (默认 all)
  - `immediate` (Boolean): 等待完成？(默认 false)

**返回:** true 如果至少删除一个层

**示例:**
```javascript
// 删除所有层数据
await dm.delete('temp-data');

// 仅删除用户的 overlay
await dm.delete('draft-comment', {
  userId: 'user-123'
});

// 等待完成再继续
const deleted = await dm.delete('important-data', {
  immediate: true
});
```

---

### batchGet(keys, options)

批量读取多个键的数据

**签名:**
```typescript
async batchGet(
  keys: string[],
  options?: BatchOptions
): Promise<Map<string, any>>
```

**参数:**
- `keys` (Array, 必需): 键数组
- `options` (Object, 可选)
  - `userId` (String): 用户 ID
  - `parallel` (Number): 并行度 (默认 5)
  - `timeout` (Number): 单个操作超时 (ms，默认 5000)

**返回:** Map，键 → 值（未找到的键不包含在内）

**示例:**
```javascript
const results = await dm.batchGet([
  'visited-museums',
  'achievements',
  'user-settings'
]);

console.log(results.get('achievements'));
// 返回: { unlocked: [...], locked: [...] }

if (!results.has('user-settings')) {
  console.log('Settings not found');
}
```

---

### batchSet(items, options)

批量写入多个键-值对

**签名:**
```typescript
async batchSet(
  items: Array<{key: string, value: any}>,
  options?: BatchOptions
): Promise<{success: number, failed: number}>
```

**参数:**
- `items` (Array, 必需): {key, value} 对象数组
- `options` (Object, 可选)
  - `userId` (String): 用户 ID
  - `useOverlay` (Boolean): 全部使用 overlay？
  - `parallel` (Number): 并行度 (默认 5)
  - `timeout` (Number): 单个操作超时 (ms)

**返回:** {success: 成功数, failed: 失败数}

**示例:**
```javascript
const result = await dm.batchSet([
  { key: 'visited-museums', value: museums },
  { key: 'achievements', value: achievements },
  { key: 'pet-level', value: petLevel }
]);

console.log(`写入成功: ${result.success}, 失败: ${result.failed}`);
```

---

### query(condition, options)

执行复杂查询（主要用于 SQL 层）

**签名:**
```typescript
async query(
  condition: QueryCondition,
  options?: QueryOptions
): Promise<any[]>
```

**参数:**
- `condition` (Object, 必需)
  - 对于 SQL: `{sql: string, params: array[]}`
  - 对于模式匹配: `{pattern: string}`
  - 对于范围查询: `{range: {start, end}, table}`
- `options` (Object, 可选)
  - `layer` (String): 指定查询层 (默认自动选择)
  - `limit` (Number): 结果数量限制
  - `offset` (Number): 分页偏移

**返回:** 结果数组

**示例:**
```javascript
// SQL 查询
const museums = await dm.query({
  sql: 'SELECT * FROM museums WHERE city = ? ORDER BY name',
  params: ['北京']
});

// 模式匹配（localStorage）
const userKeys = await dm.query({
  pattern: 'user-*'
});
// 返回匹配 'user-' 前缀的所有键

// 范围查询
const results = await dm.query({
  range: { start: 'A', end: 'M' },
  table: 'museums'
}, { limit: 50 });
```

---

### LocalStorage 便利方法

```javascript
// 简写：仅操作 localStorage
await dm.setLocal(key, value);      // 同 set(..., {layers: ['localStorage']})
const val = await dm.getLocal(key); // 同 get(..., {layers: ['localStorage']})
await dm.deleteLocal(key);          // 同 delete(..., {layers: ['localStorage']})
```

**示例:**
```javascript
await dm.setLocal('user-settings', { theme: 'dark', lang: 'zh' });
const settings = await dm.getLocal('user-settings');
```

---

### getAdaptersHealth()

获取所有适配器的健康状态

**签名:**
```typescript
async getAdaptersHealth(): Promise<AdapterHealth[]>
```

**返回:** 适配器状态数组

**返回结构:**
```javascript
[
  {
    adapter: 'LocalStorageAdapter',
    status: 'healthy' | 'degraded' | 'failed',
    latency: number,           // ms
    itemCount: number,         // 项目数
    totalSize: number,         // 字节
    quotaPercent: number,      // 0-100
    lastError: string | null,
    failureCount: number,
    lastErrorTime: number      // 时间戳
  },
  // ... 其他适配器
]
```

**示例:**
```javascript
const health = await dm.getAdaptersHealth();

health.forEach(h => {
  console.log(`${h.adapter}: ${h.status} (${h.latency}ms)`);
});

// 检查是否有故障
const hasFailure = health.some(h => h.status === 'failed');
if (hasFailure) {
  console.warn('Some adapters are failing!');
}
```

---

### getStats()

获取详细的统计信息

**签名:**
```typescript
async getStats(): Promise<Statistics>
```

**返回结构:**
```javascript
{
  adapters: [
    { name: string, status, latency, operations, errors }
  ],
  overlay: {
    itemCount: number,
    byStatus: { pending: number, approved: number, rejected: number },
    byUser: Map<userId, count>
  },
  performance: {
    avgLatency: number,
    p95Latency: number,
    p99Latency: number,
    cacheHitRate: number
  },
  storage: {
    localStorage: { used: bytes, total: bytes, percent: 0-100 },
    kv: { estimate: bytes },
    sql: { estimate: bytes }
  }
}
```

**示例:**
```javascript
const stats = await dm.getStats();

console.log('缓存命中率:', stats.performance.cacheHitRate);
console.log('localStorage 使用:', stats.storage.localStorage.percent, '%');
```

---

### diagnose()

执行完整诊断

**签名:**
```typescript
async diagnose(): Promise<DiagnosticReport>
```

**返回:** 诊断报告

**示例:**
```javascript
const report = await dm.diagnose();

console.log(report.summary);
// 包含: 状态、问题、建议

report.issues.forEach(issue => {
  console.warn(`${issue.level}: ${issue.message}`);
});
```

---

## OverlayManager API

### set(key, value, userId)

向用户的 overlay 添加数据

```javascript
await overlayManager.set(key, value, userId);
```

**返回:** overlay 项对象

---

### get(key, userId)

获取用户的 overlay 数据

```javascript
const data = await overlayManager.get(key, userId);
```

**返回:** 数据或 null

---

### approve(key, userId, adminId)

批准 overlay 项

```javascript
const approved = await overlayManager.approve(key, userId, adminId);
```

**返回:** 已更新的 overlay 项

---

### reject(key, userId, reason)

拒绝 overlay 项

```javascript
const rejected = await overlayManager.reject(key, userId, reason);
```

**返回:** 已更新的 overlay 项

---

### listByUser(userId, filters)

列出用户的所有 overlay

```javascript
const overlays = await overlayManager.listByUser(userId, {
  status: 'pending'  // 可选：按状态过滤
});
```

**返回:** overlay 项数组

---

## EventBus API

### on(event, callback)

监听事件

```javascript
bus.on('data:changed', (event) => {
  console.log('数据已改变:', event.key);
});
```

---

### off(event, callback)

取消监听

```javascript
bus.off('data:changed', callback);
```

---

### once(event, callback)

监听一次

```javascript
bus.once('overlay:approved', (event) => {
  console.log('批准了:', event.key);
});
```

---

### emit(event, data)

发出事件

```javascript
bus.emit('custom-event', { message: 'hello' });
```

---

### emitAsync(event, data)

发出异步事件，等待所有监听器完成

```javascript
const results = await bus.emitAsync('validate-data', { data });
```

**返回:** 结果数组

---

## StorageAdapter API (基类)

所有适配器都实现这个接口：

```javascript
class StorageAdapter {
  // 基础操作
  async get(key, options) { }
  async set(key, value, options) { }
  async delete(key, options) { }
  
  // 批量操作
  async batchGet(keys, options) { }
  async batchSet(items, options) { }
  
  // 查询
  async query(condition, options) { }
  
  // 管理
  async clear(options) { }
  async getStorageInfo() { }
  
  // 监控
  async health() { }
}
```

---

## 错误处理

所有 API 返回 Promise，使用标准的 async/await：

```javascript
try {
  const data = await dm.get('key');
  if (!data) {
    console.log('Data not found');
  }
} catch (error) {
  console.error('Query failed:', error.message);
  // error.code: 'TIMEOUT' | 'NETWORK' | 'STORAGE_FULL' | ...
  // error.adapter: 哪个适配器发生错误
}
```

---

## 类型定义 (TypeScript)

```typescript
interface DataManagerConfig {
  userId?: string;
  localStorage?: LocalStorageConfig;
  kvStore?: KVStoreConfig;
  mysql?: MySQLConfig;
  eventBus?: EventBus;
}

interface GetOptions {
  userId?: string;
  includeOverlay?: boolean;
  maxAge?: number;
  layers?: string[];
}

interface SetOptions {
  userId?: string;
  useOverlay?: boolean;
  layers?: string[];
  ttl?: number;
  immediate?: boolean;
  compress?: boolean;
}

interface QueryCondition {
  sql?: string;
  params?: any[];
  pattern?: string;
  range?: { start: any; end: any };
  table?: string;
}
```

---

**最后更新**: 2026-01-11

