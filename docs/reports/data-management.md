# 动态优先博物馆数据管理系统

## 概述

MuseumCheck 使用**动态优先**的数据管理架构。当需要博物馆具体数据时，系统总是优先尝试从远程获取最新的动态数据，只有在远程获取失败时才回退到静态文件。

**核心理念**：宁可告知用户网络有问题，也好过提供过时或错误的数据让孩子失望。

## 架构设计

### 数据层级（动态优先）

```
┌─────────────────────────────────────────────────┐
│  Tier 2: 远程存储 (KV Store) 【优先】          │
│  - 最新的博物馆数据                              │
│  - 支持在线编辑、即时更新                        │
│  - 确保用户获取最新内容                          │
└─────────────────────────────────────────────────┘
              ↓ (网络失败时回退)
┌─────────────────────────────────────────────────┐
│  Tier 1: 静态文件 (/museums/{id}.json)         │
│  - 已验证的稳定博物馆数据                        │
│  - 版本控制友好，可缓存                          │
│  - 作为网络不可用时的备用                        │
└─────────────────────────────────────────────────┘
              ↓ (均失败时)
┌─────────────────────────────────────────────────┐
│  返回 null - 提示用户检查网络                    │
│  ⚠️ 不再使用 museums-data.js 作为回退           │
│  宁可提示网络问题，不提供可能错误的数据           │
└─────────────────────────────────────────────────┘
```

### 关于 Tier 3 (museums-data.js)

**重要变更**：`museums-data.js` 中的静态数据**不再用于**博物馆详情页的数据加载。

原因：
1. 静态文件可能包含过时或不准确的信息
2. 孩子和家长依赖准确的博物馆信息进行参观
3. 提供错误的展品信息或任务清单会影响用户体验
4. 明确的网络错误提示比错误数据更好

**仅用于首页列表**：`museums-data.js` 仅用于首页博物馆列表展示（名称、位置、标签等基本信息）。当用户点击查看博物馆详情时，系统会从远程获取最新数据。

### 加载流程

1. **优先远程**：首先尝试从 KV Store（Tier 2）加载最新数据
2. **静态备用**：远程失败时尝试静态 JSON 文件（Tier 1）
3. **提示错误**：两者都失败时返回 null，UI 层显示网络错误提示
4. **缓存机制**：成功加载的数据会缓存在内存中

## Tier 1: 静态文件

### 特点
- **路径**：`/museums/{museum-id}.json`
- **用途**：已验证、稳定的博物馆数据
- **优势**：
  - 快速加载（HTTP 缓存）
  - 版本控制友好（Git 管理）
  - 支持 CDN 加速
  - 文件系统级别的备份

### 文件格式

```json
{
  "id": "forbidden-city",
  "name": "故宫博物院",
  "location": "北京",
  "description": "世界上现存规模最大、保存最为完整的木质结构古建筑群",
  "tags": ["历史", "建筑", "文物"],
  "image": "https://example.com/image.jpg",
  "collections": [
    {
      "name": "《清明上河图》",
      "imageUrl": "https://example.com/qingming.jpg",
      "description": "北宋画家张择端作品..."
    }
  ],
  "checklists": {
    "parent": {
      "3-6": ["任务1", "任务2"],
      "7-12": ["任务1", "任务2"],
      "13-18": ["任务1", "任务2"]
    },
    "child": {
      "3-6": ["任务1", "任务2"],
      "7-12": ["任务1", "任务2"],
      "13-18": ["任务1", "任务2"]
    }
  }
}
```

### 创建静态文件

```bash
# 方法 1：使用导出工具从 KV Store 导出（推荐）
npm run export:kvstore                    # 导出所有博物馆
npm run export:kvstore:dry-run            # 试运行，查看将导出什么
npm run export:kvstore:force              # 强制覆盖现有文件

# 或者导出特定博物馆
node tools/export-kvstore-to-static.js --museum forbidden-city
node tools/export-kvstore-to-static.js --museums forbidden-city,national-museum

# 详细文档
# 参见 tools/README_EXPORT_KVSTORE.md

# 方法 2：从 museums-data.js 提取
node -e "
const fs = require('fs');
const MUSEUMS = require('./museums-data.js').MUSEUMS;
const museum = MUSEUMS.find(m => m.id === 'forbidden-city');
fs.writeFileSync('museums/forbidden-city.json', JSON.stringify(museum, null, 2));
"

# 方法 3：从远程存储导出
# 访问 museum-data-manager.html
# 点击"查看" → 复制 JSON → 保存为文件

# 方法 4：手动创建
cat > museums/new-museum.json << 'EOF'
{
  "id": "new-museum",
  "name": "新博物馆",
  ...
}
EOF
```

## Tier 2: 远程存储 (KV Store)

### 特点
- **位置**：AWS Lambda + DynamoDB
- **API**：`https://rlyhccdr2g.execute-api.us-west-2.amazonaws.com/default/keyValueStore`
- **用途**：开发调试、快速迭代、A/B 测试
- **优势**：
  - 无需部署即可更新
  - 支持在线编辑
  - 可设置过期时间
  - 适合内容开发流程

### 管理界面

访问 `museum-data-manager.html` 页面进行管理：

**功能**：
- 查看远程存储中的博物馆列表
- 上传新博物馆数据
- 编辑现有博物馆数据
- 删除博物馆数据
- 设置数据过期时间

**操作步骤**：
1. 打开应用 → 设置 → 管理远程数据
2. 点击"上传新数据"按钮
3. 输入博物馆 ID（例如：`test-museum`）
4. 粘贴完整的 JSON 数据
5. 选择过期时间（推荐开发数据 1-7 天）
6. 点击"提交"

### API 操作

```javascript
// 保存数据到远程存储
await museumDataLoader.saveToKVStore(
  'museum-id',        // 博物馆 ID
  museumData,         // 完整的博物馆数据对象
  expireTimestamp     // 过期时间戳（秒）
);

// 从远程存储加载数据
const data = await museumDataLoader.loadFromTier2('museum-id');

// 删除远程数据
await museumDataLoader.deleteFromKVStore('museum-id');
```

### 过期时间设置

```javascript
// 永久保存（年份 2124）
const expireAt = 4866674732;

// 1 天后过期
const expireAt = Math.floor(Date.now() / 1000) + 86400;

// 7 天后过期
const expireAt = Math.floor(Date.now() / 1000) + 604800;

// 30 天后过期
const expireAt = Math.floor(Date.now() / 1000) + 2592000;
```

## Tier 3: 内置数据

### 特点
- **文件**：`museums-meta.js`（首页元数据）+ `/museums/{id}.json`（静态详情数据）
- **用途**：首页轻量列表 + 详情静态回退
- **状态**：`museums-data.js` 已弃用且不再在运行时使用，后续将删除

### 文件结构

**museums-meta.js** - 轻量级元数据（首次加载）
```javascript
window.MUSEUMS_META = [
  {
    id: 'forbidden-city',
    name: '故宫博物院',
    location: '北京',
    tags: ['历史', '建筑', '文物'],
    image: 'https://...'
  },
  // ... 更多博物馆
];
```

⚠️ **注意**：`museums-data.js` 已从加载路径移除。首页列表依赖 `museums-meta.js`，详情页通过数据加载器按 Tier 2 → Tier 1 获取。

## 优先级配置

### 动态优先模式（默认且唯一推荐）

**优先级**：远程存储 → 静态文件（过滤 tier3）

系统默认使用动态优先模式，且会自动过滤掉 tier3 的配置。这确保用户始终获取最新、最准确的博物馆信息。

**配置**：
```javascript
// 默认配置，无需手动设置
museumDataLoader.updatePrioritySettings(['tier2', 'tier1']);

// 即使设置包含 tier3，也会被自动过滤
museumDataLoader.updatePrioritySettings(['tier2', 'tier1', 'tier3']);
// 实际生效的配置为: ['tier2', 'tier1']
```

### 关于离线模式

离线时：首页可使用 `museums-meta.js` 展示列表；详情若缺数据则提示检查网络或使用已缓存的 Tier 2/1 结果。不会回退到 `museums-data.js`。

### 用户界面配置

1. 打开应用 → 点击设置按钮（⚙️）
2. 找到"数据管理"部分
3. 选择"博物馆数据优先级"下拉菜单
4. 选择优先级模式
5. 设置自动保存到 localStorage

## 开发工作流

### 场景 1：添加新博物馆

```mermaid
graph TD
    A[创建博物馆数据] --> B[上传到远程存储]
    B --> C[设置为开发模式]
    C --> D[测试验证]
    D --> E{验证通过?}
    E -->|否| F[修改数据]
    F --> B
    E -->|是| G[导出为静态文件]
    G --> H[提交 /museums/{id}.json]
    H --> I[更新元数据（生成 museums-meta.js）]
    I --> J[提交代码]
```

**详细步骤**：

```bash
# 1. 在远程存储中创建草稿
# 访问 museum-data-manager.html
# 上传新博物馆数据，设置过期时间为 7 天

# 2. 切换到开发模式测试
# 设置 → 数据优先级 → "远程存储 → 静态文件 → 内置数据"

# 3. 验证内容
# 浏览新博物馆，检查所有字段和功能

# 4. 导出为静态文件
# 从管理界面复制 JSON 数据
echo '{ "id": "new-museum", ... }' > museums/new-museum.json

# 5. 生成/更新 museums-meta.js（如需）

# 6. 提交代码
git add museums/new-museum.json museums-meta.js
git commit -m "Add new museum: XXX"
git push
```

### 场景 2：更新现有博物馆

```bash
# 1. 在远程存储中更新
# 访问管理界面 → 编辑博物馆 → 修改内容

# 2. 验证更新
# 刷新应用，检查更新是否正确

# 3. 同步到静态文件
# 从管理界面导出 JSON，覆盖现有文件
cat museum-data.json > museums/existing-museum.json

# 4. 如需更新元数据，重新生成 museums-meta.js

# 5. 提交代码
git add museums/existing-museum.json museums-meta.js
git commit -m "Update museum: XXX"
git push
```

### 场景 3：快速修复

```bash
# 紧急修复（不等待部署）
# 1. 直接在远程存储中修改数据
# 2. 用户立即看到更新（如果使用开发模式）
# 3. 后续同步到静态文件和内置数据
```

## 性能优化

### 缓存策略

```javascript
// 自动缓存成功加载的数据
const museum1 = await museumDataLoader.loadMuseum('forbidden-city');
const museum2 = await museumDataLoader.loadMuseum('forbidden-city'); // 从缓存读取

// 强制刷新（跳过缓存）
const museum = await museumDataLoader.loadMuseum('forbidden-city', false);

// 清除缓存
museumDataLoader.clearCache(); // 清除所有
museumDataLoader.clearCache('forbidden-city'); // 清除特定博物馆
```

### 延迟加载

```javascript
// 首次加载只获取元数据（museums-meta.js）
const museums = await museumDataLoader.loadAllMuseums();

// 点击博物馆时才加载完整数据
const fullData = await museumDataLoader.loadMuseum(museum.id);
```

### HTTP 缓存

静态文件自动享受 HTTP 缓存机制：
- 浏览器缓存
- CDN 缓存
- Service Worker 缓存

## 故障排查

### 问题 1：博物馆数据未更新

**症状**：修改了远程数据，但应用未显示更新

**原因**：缓存未清除或优先级配置问题

**解决**：
```javascript
// 1. 清除缓存
museumDataLoader.clearCache();

// 2. 检查优先级
console.log(museumDataLoader.getPrioritySettings());

// 3. 强制刷新
location.reload();
```

### 问题 2：远程数据加载失败

**症状**：控制台显示网络错误

**原因**：网络问题、API 不可用、数据过期

**解决**：
```javascript
// 1. 检查网络
fetch('https://rlyhccdr2g.execute-api.us-west-2.amazonaws.com/default/keyValueStore?key=test')
  .then(r => console.log('API 可用'))
  .catch(e => console.error('API 不可用', e));

// 2. 验证数据未过期
// 访问管理界面检查过期时间

// 3. 切换到备用数据源
museumDataLoader.updatePrioritySettings(['tier3', 'tier1', 'tier2']);
```

### 问题 3：静态文件 404

**症状**：浏览器显示 404 错误

**原因**：文件路径或命名错误

**解决**：
```bash
# 1. 检查文件是否存在
ls -la museums/{museum-id}.json

# 2. 验证文件命名
# 文件名必须匹配博物馆 ID
# 例如：forbidden-city.json (不是 Forbidden-City.json)

# 3. 检查 HTTP 服务器
# 确保服务器正确提供静态文件
curl http://localhost:8000/museums/forbidden-city.json
```

## 最佳实践

### 1. 开发流程
- ✅ 使用远程存储进行内容开发
- ✅ 验证通过后发布为静态文件
- ✅ 定期同步到内置数据
- ✅ 开发数据设置较短过期时间（1-7 天）

### 2. 数据管理
- ✅ 为每个稳定博物馆创建静态文件
- ✅ 使用 Git 管理静态文件版本
- ✅ 保持内置数据与静态文件同步
- ✅ 定期清理过期的远程数据

### 3. 性能优化
- ✅ 优先使用静态文件（默认模式）
- ✅ 合理使用缓存
- ✅ 按需加载完整数据
- ✅ 利用 HTTP 缓存机制

### 4. 安全考虑
- ✅ 验证 JSON 数据格式
- ✅ 不在远程存储中保存敏感信息
- ✅ 定期备份重要数据
- ✅ 监控异常数据访问

## 总结

三级数据管理系统为 MuseumCheck 提供了灵活、高效的数据管理能力：

- **Tier 1（静态文件）**：稳定、快速、版本控制友好
- **Tier 2（远程存储）**：灵活、快速迭代、支持在线编辑
- **Tier 3（内置数据）**：离线可用、保底方案

通过合理配置优先级和工作流程，可以在保证用户体验的同时，大幅提升内容开发效率。
