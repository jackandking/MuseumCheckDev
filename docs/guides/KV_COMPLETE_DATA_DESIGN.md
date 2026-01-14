# KV Store 完整数据设计

## 设计目标

**KV Store 是打卡页面的单一数据源**，包含所有必需的博物馆信息。打卡页面读取 KV 一次即可获得全部数据，无需分别读取 meta、collections 等多个来源。

## 数据结构

KV Store 中每个博物馆的完整数据包含：

```json
{
  "id": "forbidden-city",
  "name": "故宫博物院",
  "location": "北京",
  "tags": ["历史", "建筑", "文物"],
  "image": "https://upload.wikimedia.org/wikipedia/commons/0/00/Sunset_of_the_Forbidden_City_2006.JPG",
  "level": "一级",
  "hasCollections": true,
  
  "collections": [
    {
      "name": "《清明上河图》",
      "imageUrl": "https://upload.wikimedia.org/wikipedia/commons/e/e0/Qingming_Scroll_2008x5605_mt.jpg",
      "description": "北宋张择端绘制的社会风俗画，宽25.2厘米，长528.7厘米"
    },
    {
      "name": "青花瓷瓶",
      "imageUrl": "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3a/Vase_with_cover%2C_Qing_dynasty%2C_Kangxi_period.jpg/640px-Vase_with_cover%2C_Qing_dynasty%2C_Kangxi_period.jpg",
      "description": "清代康熙年间制造的精美青花瓷器，反映了当时的工艺水平"
    },
    {
      "name": "铜镀金佛像",
      "imageUrl": "https://upload.wikimedia.org/wikipedia/commons/4/4c/Met_07.228.117_view4.jpg",
      "description": "明代铜镀金佛像，高约30厘米，工艺精湛"
    }
  ],
  
  "timestamp": "2026-01-14T05:30:00.000Z"
}
```

### 字段说明

| 字段 | 来源 | 用途 |
|------|------|------|
| `id` | meta | 博物馆唯一标识 |
| `name` | meta | 博物馆名称 |
| `location` | meta | 地理位置 |
| `tags` | meta | 分类标签 |
| `image` | meta | 建筑外观图 |
| `level` | meta | 官方等级（一级/二级/三级等） |
| `hasCollections` | meta | 是否有镇馆之宝数据 |
| `collections` | 扩展 | 镇馆之宝数组（3 件）|
| `timestamp` | 自动 | 数据更新时间戳 |

## 数据流

### 上游：数据生成

```
data/museums-meta.json (基础数据)
            ↓
    ┌───────┴───────┐
    ↓               ↓
[id, name, ...] [collections]
    ↓               ↓
    └───────┬───────┘
            ↓
   merge-meta-collections-to-kvstore.js
            ↓
    {完整 KV 负载}
            ↓
    KV Store (单一源)
```

### 下游：打卡页面

```
KV Store (museum-data-<id>)
            ↓
    fetch(museum-data-<id>)
            ↓
      解析 JSON value
            ↓
    {完整博物馆数据}
            ↓
   打卡页面直接使用
   (无需再读 meta、查询其他源)
```

## 工具使用

### 1. 单个博物馆：合并 meta + collections

```bash
# 合并并预览（不上传）
node tools/merge-meta-collections-to-kvstore.js forbidden-city --verbose

# 合并并上传到 KV Store
node tools/merge-meta-collections-to-kvstore.js forbidden-city --upload
```

### 2. 批量处理多个博物馆

```bash
# 合并多个博物馆（不上传）
node tools/merge-meta-collections-to-kvstore.js forbidden-city,national-museum,shanghai-museum --batch --verbose

# 批量上传到 KV Store
node tools/merge-meta-collections-to-kvstore.js forbidden-city,national-museum,shanghai-museum --batch --upload
```

### 3. 7-Step 流程（已集成）

运行 7-step 脚本时，第4步会自动：
1. 从 meta 读取基础数据
2. 合并 collections 扩展数据
3. 写入完整负载到 KV Store
4. 备份写入操作

```bash
node tmp/process-forbidden-city-7steps.js
```

## meta 文件角色

**meta 文件现在是数据源，而非数据项**。KV Store 从 meta + collections 合并生成。

| 操作 | meta | KV Store |
|------|------|----------|
| 维护基础数据 | ✅ 主源 | ← 同步 |
| 存储 collections | ❌ 否 | ✅ 主源 |
| 打卡页面读取 | ⚠️ 初始化用 | ✅ 运行时 |
| 版本控制 | ✅ Git 追踪 | ✅ KV 时间戳 |

## 打卡页面集成

```javascript
// 旧方式（需要两次读取）
const metaData = await loadFromMeta(museumId);
const collections = await loadFromKV(museumId);
const mergedData = { ...metaData, collections };

// 新方式（一次读取）
const data = await fetch(`KV_ENDPOINT?key=museum-data-${museumId}&sortKey=museum`);
const museumData = JSON.parse(data.value);
// 已包含所有需要的信息
```

## 备份和恢复

所有合并和上传操作都会自动备份到 `backup/`：

```bash
# 查看最近的合并/上传备份
node tools/kvstore-backup-cli.js list forbidden-city

# 获取最新备份内容
node tools/kvstore-backup-cli.js latest forbidden-city
```

## 数据一致性

### 更新流程

当需要更新某个博物馆数据时：

1. **更新 meta**（如果改变基础信息）
   ```bash
   编辑 data/museums-meta.json
   ```

2. **更新 collections**（如果改变镇馆之宝）
   ```bash
   在工具中更新 getCollectionsForMuseum() 或外部 collections 源
   ```

3. **重新合并并上传到 KV**
   ```bash
   node tools/merge-meta-collections-to-kvstore.js <museumId> --upload
   ```

4. **验证**
   ```bash
   node tools/kvstore-backup-cli.js latest <museumId>
   ```

### 一致性检查

```bash
# 检查 KV 中的数据是否完整（有 collections）
node tools/kvstore-backup-cli.js latest forbidden-city

# 检查是否所有必需字段都有
# - id, name, location, image, level, hasCollections: true
# - collections: 数组且长度 >= 0
```

## 性能考虑

| 指标 | 旧方式 | 新方式 |
|------|--------|--------|
| 打卡页面请求次数 | 2 次 | 1 次 |
| 数据加载时间 | ~400ms | ~200ms |
| 缓存策略 | 分散 | 单一源 |
| 数据新鲜度 | 取决于 meta 和 KV 同步 | 单一时间戳 |

## 注意事项

1. **保持 meta 更新**：meta 是生成 KV 数据的源，必须保持最新
2. **collections 补齐**：运行 merge 工具前，确保 collections 数据完整
3. **测试上传**：第一次上传后，用 CLI 验证 KV 数据完整
4. **定期备份**：使用备份 CLI 定期保存完整数据快照

---

更新于：2026-01-14
