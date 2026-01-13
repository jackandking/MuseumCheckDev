# 数据流设计文档

## 数据流概览

```
┌─────────────────────────────────────────────────────────────────────┐
│                        用户交互层                                     │
├─────────────────────────────────────────────────────────────────────┤
│  用户在 UI 上执行操作（选择年龄、访问博物馆、获取成就等）              │
└────────────────────┬────────────────────────────────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────────────────────────────────┐
│                      应用层（10 个独立应用）                           │
├─────────────────────────────────────────────────────────────────────┤
│  admin/ | quiz/ | survey/ | achievements/ | virtual-pet/            │
│  fireworks/ | games/ | event-wall/ | treasures/ | data-management/  │
└────────────────────┬────────────────────────────────────────────────┘
                     │ 调用
                     ↓
         ┌──────────────────────────┐
         │   DataManager API        │
         │  (统一数据访问接口)       │
         └──────────────┬───────────┘
                        │
            ┌───────────┼───────────┐
            │           │           │
            ↓           ↓           ↓
     ┌──────────┐ ┌──────────┐ ┌──────────┐
     │ Overlay  │ │EventBus  │ │ Version  │
     │ Manager  │ │(事件)    │ │ Manager  │
     └────┬─────┘ └──────────┘ └──────────┘
          │
          ↓ 多级缓存读取
┌─────────────────────────────────────────────────────────────────────┐
│                   存储适配器层 (StorageAdapters)                     │
├─────────────────────────────────────────────────────────────────────┤
│ [1] LocalStorageAdapter  →  浏览器 localStorage (5-10MB)            │
│ [2] KVAdapter            →  Letmetry KV Store (AWS DynamoDB)        │
│ [3] SQLAdapter           →  Letmetry MySQL (持久化数据库)            │
│ [4] FileAdapter          →  CDN / GitHub Pages (静态文件)            │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 详细数据流

### 流程 1: 读取数据 (GET)

```
应用代码: await dataManager.get('visited-museums', { userId: 'user-123' })
        │
        ├─→ 有 userId 且 useOverlay=true?
        │   ├─ YES → 检查 OverlayManager
        │   │       ├─ overlay 有数据 → 返回
        │   │       └─ overlay 无数据 ↓
        │   └─ NO ↓
        │
        ├─→ [Adapter 1] LocalStorageAdapter
        │   ├─ 有数据 → 缓存命中，返回
        │   └─ 无数据 ↓
        │
        ├─→ [Adapter 2] KVAdapter (Letmetry KV)
        │   ├─ 有数据 → 写入本地缓存，返回
        │   ├─ 网络错误 → 标记故障，继续 ↓
        │   └─ 无数据 ↓
        │
        ├─→ [Adapter 3] SQLAdapter (Letmetry MySQL)
        │   ├─ 有数据 → 写入缓存层，返回
        │   ├─ 查询错误 → 标记故障，继续 ↓
        │   └─ 无数据 ↓
        │
        ├─→ [Adapter 4] FileAdapter (CDN)
        │   ├─ 有数据 → 写入缓存，返回
        │   └─ 无数据 → 返回 null
        │
        └─→ 应用收到数据或 null

时间复杂度:
  缓存命中 (localStorage):    1-5ms
  KV 命中:                  100-200ms
  SQL 命中:                 200-400ms
  CDN 命中:                 50-150ms
  全部Miss:                 > 750ms
```

### 流程 2: 写入数据 (SET)

```
应用代码: await dataManager.set('visited-museums', ['forbidden-city'], 
                              { useOverlay: true, userId: 'user-123' })
        │
        ├─→ [立即执行] Overlay 写入
        │   └─ OverlayManager.set()
        │       ├─ 写入 localStorage: museumcheck_overlay_user-123
        │       ├─ 设置状态: 'pending'
        │       └─ 返回给应用（用户立即看到）
        │
        ├─→ [立即执行] LocalStorageAdapter 写入
        │   └─ localStorage.setItem('museumcheck_visited-museums', ...)
        │
        └─→ [后台异步执行，无需等待]
            ├─→ KVAdapter.set()
            │   └─ POST https://letmetry.cloud/kv
            │       ├─ 重试逻辑（3 次）
            │       └─ 失败记录日志
            │
            ├─→ SQLAdapter.insert/update()
            │   └─ POST https://letmetry.cloud/mysql/query
            │       ├─ 参数化查询（防 SQL 注入）
            │       └─ 失败记录日志
            │
            └─→ 触发 EventBus 事件
                └─ bus.emit('data:changed', { key, value, source })

时间线:
  [0ms]     用户看到数据已更新（overlay）
  [1-5ms]   localStorage 写入完成
  [后台]    KV 和 SQL 异步写入（无阻塞）
  [完成]    EventBus 通知其他模块
```

### 流程 3: Overlay 数据批准工作流

```
1️⃣ 用户提交数据
   dataManager.set(key, value, { useOverlay: true, userId })
   ↓
   OverlayManager 创建 overlay 项
   {
     key: 'achievement-123',
     value: { type: 'visited', museum: 'forbidden-city' },
     status: 'pending',
     userId: 'user-123',
     createdAt: 1705000000000
   }

2️⃣ 用户界面显示
   应用查询: dataManager.get(key, { userId })
   ↓
   返回 overlay 数据（status='pending'）
   ↓
   用户看到 "等待审批中..."

3️⃣ 管理员审批（或自动规则）
   adminPanel.approveOverlay(key, userId)
   ↓
   overlayManager.approve(key, userId, adminId)
   ↓
   1. 更新 overlay 状态: pending → approved
   2. 写入 SQL: INSERT INTO approvals (...)
   3. 触发事件: 'overlay:approved'
   4. 发送通知给用户

4️⃣ 后台合并流程（定期执行）
   每小时运行一次合并脚本:
   ├─ 查询所有 approved 的 overlay
   ├─ 合并到对应的持久层数据
   ├─ 更新 KV 和 SQL
   ├─ 触发 CDN 数据更新
   └─ 清理已处理的 overlay

时间流:
  [T+0]     用户提交 → overlay 保存 → 立即显示
  [T+5min]  管理员审批 → overlay 标记批准
  [T+1h]    定期合并脚本 → 数据合并到公共层
  [T+24h]   CDN 更新 → 新用户看到完整数据
```

---

## 存储层架构

### LocalStorageAdapter 流程
```
dataManager.set('key', value)
    ↓
localStorage.setItem('museumcheck_key', JSON.stringify(value))
    ↓
浏览器 LocalStorage
  ├─ 容量: 5-10MB
  ├─ 持久性: 永久（除非用户清除）
  ├─ 延迟: <5ms
  └─ 共享范围: 同源下所有标签页
```

### KVAdapter 流程
```
dataManager.set('key', value)
    ↓
POST https://letmetry.cloud/kv
{
  "key": "museum-data-forbidden-city",
  "sortKey": "museum",
  "value": { name: "故宫博物院", ... },
  "expireAt": 1705086400  // 7 天后
}
    ↓
Letmetry 后端 (AWS DynamoDB)
  ├─ 容量: 256MB+ (per partition)
  ├─ 持久性: 高可用
  ├─ 延迟: 100-200ms
  └─ 共享范围: 全部用户
```

### SQLAdapter 流程
```
dataManager.query('SELECT * FROM museums WHERE id = ?', ['forbidden-city'])
    ↓
POST https://letmetry.cloud/mysql/query
{
  "sql": "SELECT * FROM museums WHERE id = ?",
  "params": ["forbidden-city"]
}
    ↓
Letmetry MySQL (后端数据库)
  ├─ 容量: 无限制
  ├─ 持久性: 完全持久
  ├─ 延迟: 200-400ms
  └─ 支持: 复杂查询、事务、JOIN
```

### FileAdapter 流程
```
dataManager.get('museums-data')
    ↓
VersionManager.getCurrentVersion('museums-data')
    ↓
返回: /museums/museums-data.v20260111.js
    ↓
浏览器加载文件 (CDN 缓存)
  ├─ 容量: 无限制
  ├─ 持久性: 永久（版本化）
  ├─ 延迟: 50-150ms (第一次) / 0ms (缓存)
  └─ 共享范围: 全球 CDN
```

---

## 数据同步模式

### 模式 1: 在线写 + 离线读

```
写入流程:
  用户输入 → 立即写 overlay/localStorage → 返回
           ↓ 后台异步
           → 写 KV Store → 写 MySQL → 触发 CDN 更新

读取流程 (在线):
  应用 → DataManager → localStorage → KV → SQL → 返回

读取流程 (离线):
  应用 → DataManager → localStorage → 返回
       （其他层不可用）

优势:
  ✅ 用户体验快速响应
  ✅ 离线模式可工作
  ✅ 最终一致性保证
```

### 模式 2: 定期回源

```
CDN 版本更新流程:
  定时任务 (每日 02:00)
    ↓
  读取所有 approved overlay
    ↓
  合并到核心数据
    ↓
  生成新的 museums-data.vYYYYMMDD.js
    ↓
  上传到 GitHub Pages / CDN
    ↓
  更新版本指针: museums-data.latest.json
    ↓
  旧版本标记待删除（>30 天）

客户端检查更新 (每天或手动):
  应用 → VersionManager.hasUpdate()
       → 比较本地版本 vs latest.json
       → 有新版本 → 通知用户或自动下载

优势:
  ✅ CDN 缓存长期有效
  ✅ 减少 API 请求
  ✅ 支持版本回滚
  ✅ 清晰的发布历史
```

---

## 故障转移和恢复

### 单个适配器失败

```
dataManager.get('key')
    ↓
尝试 LocalStorageAdapter
  │ 失败（例如配额满）
  ├─ 记录错误
  ├─ 触发 'adapter:failed' 事件
  └─ 继续下一个适配器 ↓
    
尝试 KVAdapter
  │ 成功 → 返回
  │ 失败 → 继续 ↓
    
尝试 SQLAdapter
  │ 成功 → 返回
  │ 失败 → 继续 ↓
    
尝试 FileAdapter
  │ 成功 → 返回
  │ 失败 → null

最终状态:
  ├─ 如果有任何适配器成功 → 返回数据
  └─ 所有都失败 → 返回 null + 错误日志
```

### 多云提供商故障转移

```
MultiCloudConfig 健康检查 (每 30 秒)
    ↓
检查 Letmetry 状态
  ├─ 健康 → 继续使用
  ├─ 降级 (>100ms) → 标记
  └─ 故障 (失败 2 次) → 切换到 Cloudflare ↓
    
检查 Cloudflare 备用
  ├─ 健康 → 切换使用
  ├─ 故障 → 降级到 GitHub Pages (CDN) ↓
    
GitHub Pages 仅读
  ├─ 可用 → 静态数据查询工作
  └─ 故障 → 离线模式

恢复检查 (每 30 秒):
  当前故障提供商恢复?
  ├─ YES → 切换回（防止频繁切换）
  └─ NO → 保持当前
```

---

## 事件流

### 核心事件类型

```
'data:changed'
├─ 发出者: DataManager.set()
├─ 携带: { key, value, source, timestamp }
├─ 监听者: 应用模块（UI 更新）
└─ 示例:
   {
     key: 'visited-museums',
     value: ['forbidden-city', 'national-museum'],
     source: 'overlay',  // overlay | kv | sql | file
     timestamp: 1705000000000
   }

'overlay:pending'
├─ 发出者: OverlayManager.set()
├─ 携带: { key, userId, createdAt }
└─ 用途: 通知有新的待审批项

'overlay:approved'
├─ 发出者: OverlayManager.approve()
├─ 携带: { key, userId, approvedAt }
└─ 用途: 触发后台合并流程

'overlay:rejected'
├─ 发出者: OverlayManager.reject()
├─ 携带: { key, userId, reason }
└─ 用途: 通知用户拒绝原因

'adapter:failed'
├─ 发出者: StorageAdapter (任何)
├─ 携带: { adapter, error, timestamp }
└─ 用途: 监控/告警

'adapter:recovered'
├─ 发出者: MultiCloudConfig
├─ 携带: { adapter, timestamp }
└─ 用途: 标记恢复
```

---

## 性能优化

### 读取优化

```
✅ 多级缓存策略
   localStorageAdapter (1-5ms) 优先于 KV (100ms+)
   
✅ 预加载常用数据
   await dm.batchGet(['visited-museums', 'user-settings', 'achievements'])
   
✅ 后台刷新
   当数据 >1 小时未更新 → 后台刷新 KV/SQL
   
✅ 版本感知缓存
   检查 CDN 新版本 → 后台加载 → 不阻塞 UI
```

### 写入优化

```
✅ 异步写入
   set() 返回后立即继续
   后台线程处理 KV/SQL
   
✅ 批量操作
   dataManager.batchSet([{key, value}, ...])
   一次请求而非多次
   
✅ 去重
   相同数据多次 set() → 智能跳过
   
✅ 压缩
   大对象 (>1MB) → gzip 压缩后传输
```

---

## 监控和诊断

### 健康指标

```javascript
const health = await dataManager.getAdaptersHealth();

返回示例:
[
  {
    adapter: 'LocalStorageAdapter',
    status: 'healthy',
    latency: 3,
    itemCount: 120,
    totalSize: 500000,
    lastError: null,
    failureCount: 0
  },
  {
    adapter: 'KVAdapter',
    status: 'healthy',
    latency: 125,
    provider: 'letmetry',
    lastCheck: 1705000000000,
    failureCount: 0
  },
  {
    adapter: 'SQLAdapter',
    status: 'degraded',  // 延迟高
    latency: 450,
    queryCount: 5,
    lastError: null,
    failureCount: 2
  },
  {
    adapter: 'FileAdapter',
    status: 'healthy',
    latency: 80,
    cacheHit: 0.95,  // 95% 缓存命中
    version: 'v20260111'
  }
]
```

### 诊断工具

```javascript
// 完整诊断
const diagnostics = await dataManager.diagnose();

// 包含:
// ├─ 适配器状态
// ├─ 存储容量使用
// ├─ 最近错误
// ├─ 性能统计
// ├─ 版本信息
// └─ 建议

// 示例建议:
// "Warning: localStorage 使用 85%，建议清理旧数据"
// "Info: KV Store 链接正常，延迟 120ms"
// "Error: SQL 连接失败，自动切换到 CDN"
```

---

## 最佳实践

### ✅ 推荐模式
```javascript
// 1. 使用 overlay 实现即时反馈
await dm.set('new-achievement', achievement, {
  userId: 'user-123',
  useOverlay: true
});

// 2. 批量操作
await dm.batchSet([
  { key: 'museums-visited', value: data1 },
  { key: 'achievements', value: data2 }
]);

// 3. 监听数据变化
bus.on('data:changed', (event) => {
  if (event.source === 'overlay') {
    updateUI(); // 立即更新
  }
});

// 4. 定期诊断
setInterval(async () => {
  const health = await dm.getAdaptersHealth();
  if (health.some(h => h.status !== 'healthy')) {
    console.warn('Some adapters unhealthy:', health);
  }
}, 300000); // 每 5 分钟
```

### ❌ 避免的模式
```javascript
// ❌ 不要直接访问 localStorage（除非必要）
const data = localStorage.getItem('key');  // 绕过了适配器层

// ❌ 不要同步等待异步操作
await dm.set(...); // 这会阻塞 UI

// ❌ 不要忽视错误处理
await dm.get('key');  // 无错误检查

// ❌ 不要存储大量数据在 localStorage
// 应该使用 SQL 或 KV
```

---

**最后更新**: 2026-01-11

