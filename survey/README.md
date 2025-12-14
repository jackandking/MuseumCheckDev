# Survey 目录说明文档

本目录包含 MuseumCheck 应用的调查问卷和互动测验页面。这些页面用于收集用户数据、增强用户参与度，并帮助优化应用功能。

## 目录结构

```
survey/
├── README.md           # 本文档
├── util.js             # 共享工具函数库
├── popularity/         # 博物馆人气调查
│   ├── index.html
│   ├── app.js
│   └── styles.css
├── treasure/           # 镇馆之宝猜测游戏
│   ├── index.html
│   ├── app.js
│   └── styles.css
└── guess/              # 博物馆数量猜测
    ├── index.html
    ├── app.js
    └── styles.css
```

## 页面功能说明

### 1. Popularity Survey (博物馆人气调查)

**路径**: `survey/popularity/`

**功能描述**:
- 向用户展示 5 个随机选择的博物馆
- 用户投票选择他们认为最受欢迎的博物馆
- 收集数据用于优化博物馆的默认排序

**用户流程**:
1. 用户看到 5 个博物馆选项（包含图片、名称、位置）
2. 用户点击他们认为最受欢迎的博物馆
3. 查看广告后显示全网投票统计结果
4. 结果显示排行榜，包括投票数和百分比

**数据存储**:

- **Storage Key**: `museumPopularity.data`
- **数据结构**:
  ```javascript
  {
    "museum-id-1": 123,  // 投票数
    "museum-id-2": 456,
    "museum-id-3": 789,
    // ... 其他博物馆ID及其投票数
  }
  ```
- **示例数据**:
  ```javascript
  {
    "forbidden-city": 1523,
    "national-museum": 1204,
    "shanghai-museum": 987,
    "terracotta-warriors": 1856,
    "suzhou-museum": 654
  }
  ```

**配置参数**:
```javascript
const surveyConfig = {
    title: "你猜哪个博物馆最受欢迎？",
    question: "以下5个博物馆中，你认为哪个最受大众欢迎？",
    storageKey: "museumPopularity.data",
    museumsPerRound: 5,
    kvStoreEndpoint: "https://rlyhccdr2g.execute-api.us-west-2.amazonaws.com/default/keyValueStore"
};
```

**数据来源**:
- **优先使用 (最高优先级)**: `MUSEUMS_META` (来自 `/museums-meta.js`)
- **兜底方案**: 内置的默认博物馆列表

### 2. Treasure Survey (镇馆之宝猜测游戏)

**路径**: `survey/treasure/`

**功能描述**:
- 展示特定博物馆（默认：首都博物馆）的图片
- 用户从 4 个藏品选项（1个正确答案 + 3个其他博物馆的藏品作为干扰项）中猜测哪个是该博物馆的镇馆之宝
- 显示全网用户的答题统计和正确答案

**用户流程**:
1. 用户看到博物馆图片和名称
2. 用户看到 4 个藏品选项（1个正确 + 3个干扰项）
3. 用户选择他们认为正确的镇馆之宝
4. 查看广告后显示统计结果和正确答案
5. 结果包括每个选项的投票数、百分比和答对率

**数据存储**:

- **Storage Key**: `capitalMuseumTreasure.data`
- **数据结构**:
  ```javascript
  {
    "treasure-name-1": 234,  // 投票数
    "treasure-name-2": 567,
    "treasure-name-3": 123,
    "treasure-name-4": 89
  }
  ```
- **示例数据**:
  ```javascript
  {
    "元代景德镇窑青花凤首扁壶": 456,  // 正确答案
    "《清明上河图》": 234,           // 干扰项
    "后母戊鼎": 123,                  // 干扰项
    "大克鼎": 89                      // 干扰项
  }
  ```

**配置参数**:
```javascript
const surveyConfig = {
    title: "猜猜哪个是首都博物馆的镇馆之宝？",
    question: "以下哪个是首都博物馆的镇馆之宝？",
    museumId: "beijing-capital-museum",
    storageKey: "capitalMuseumTreasure.data",
    kvStoreEndpoint: "https://rlyhccdr2g.execute-api.us-west-2.amazonaws.com/default/keyValueStore",
    kvStoreKeyPrefix: "museum-data-"
};
```

**数据来源**:
- **优先级顺序**:
  1. **最高优先级**: KV Store (动态数据): `museum-data-{museumId}` with sortKey `museum`
  2. **次优先**: 静态文件: `/museums/{museumId}.json`
  3. **兜底方案**: 内置默认数据

**干扰项来源**:
- 从其他知名博物馆加载镇馆之宝作为干扰项
- 默认使用故宫博物院、中国国家博物馆、上海博物馆的藏品

### 3. Guess Survey (博物馆数量猜测)

**路径**: `survey/guess/`

**功能描述**:
- 让用户猜测中国有多少博物馆
- 提供多个数量范围选项
- 显示全网用户的投票分布

**用户流程**:
1. 用户看到问题："猜中国有多少博物馆？"
2. 用户从 5 个数量范围中选择一个
3. 查看广告后显示统计结果
4. 结果以柱状图形式展示各选项的投票数和百分比

**数据存储**:

- **Storage Key**: `museumCount.data`
- **数据结构**:
  ```javascript
  {
    "100以下": 45,     // 投票数
    "500": 123,
    "1000": 234,
    "3000": 567,
    "6000以上": 890
  }
  ```
- **示例数据**:
  ```javascript
  {
    "100以下": 12,
    "500": 45,
    "1000": 89,
    "3000": 234,
    "6000以上": 567   // 正确答案范围
  }
  ```

**配置参数**:
```javascript
const questionConfig = {
    title: "猜中国有多少博物馆？",
    question: "猜中国有多少博物馆？",
    options: [
        { value: "1", label: "100以下" },
        { value: "2", label: "500" },
        { value: "3", label: "1000" },
        { value: "4", label: "3000" },
        { value: "5", label: "6000以上" }
    ],
    storageKey: "museumCount.data"
};
```

## 共享工具函数 (util.js)

`util.js` 提供了所有调查页面共用的核心函数。

### 主要函数说明

#### 1. `updateConfig(configName, configValue)`

**功能**: 保存配置数据到远程 KV 存储

**参数**:
- `configName` (string): 配置键名（即 storage key）
- `configValue` (any): 要保存的配置值（会自动转换为 JSON）

**示例**:
```javascript
// 保存投票数据
updateConfig('museumPopularity.data', {
    'forbidden-city': 123,
    'national-museum': 456
});
```

#### 2. `getConfig(configName, callback)`

**功能**: 从远程 KV 存储读取配置数据

**参数**:
- `configName` (string): 配置键名（即 storage key）
- `callback` (function): 回调函数，接收读取到的数据

**示例**:
```javascript
// 读取投票数据
getConfig('museumPopularity.data', (data) => {
    if (data) {
        console.log('Current votes:', data);
    } else {
        console.log('No data found');
    }
});
```

#### 3. `updateKeyValueStore(key, value, sortKey, expireAt)`

**功能**: 底层 KV 存储写入函数（异步）

**参数**:
- `key` (string): 存储键
- `value` (string): 存储值（必须是字符串）
- `sortKey` (string, 默认 'None'): 排序键，用于组织数据
- `expireAt` (number, 默认 TIMESTAMP_2124): 过期时间戳

**返回**: Promise<Object>

**示例**:
```javascript
await updateKeyValueStore(
    'museumPopularity.data',
    JSON.stringify(voteData),
    'None',
    4866674732
);
```

#### 4. `readKeyValueStore(key, callback, sortKey)`

**功能**: 底层 KV 存储读取函数

**参数**:
- `key` (string): 存储键
- `callback` (function): 回调函数
- `sortKey` (string, 默认 'None'): 排序键

**示例**:
```javascript
readKeyValueStore('museumPopularity.data', (value) => {
    const data = JSON.parse(value);
    console.log(data);
}, 'None');
```

## API 端点

所有调查页面使用同一个 AWS Lambda KV 存储端点:

**端点 URL**: 
```
https://rlyhccdr2g.execute-api.us-west-2.amazonaws.com/default/keyValueStore
```

### GET 请求 (读取数据)

**格式**:
```
GET {endpoint}?key={key}&sortKey={sortKey}
```

**示例**:
```
GET https://rlyhccdr2g.execute-api.us-west-2.amazonaws.com/default/keyValueStore?key=museumPopularity.data&sortKey=None
```

**响应**:
```javascript
{
    "value": "{\"forbidden-city\":123,\"national-museum\":456}"
}
```

### POST 请求 (写入数据)

**格式**:
```
POST {endpoint}
Content-Type: application/json

{
    "key": "string",
    "sortKey": "string",
    "value": "string",
    "expireAt": number
}
```

**示例**:
```javascript
POST https://rlyhccdr2g.execute-api.us-west-2.amazonaws.com/default/keyValueStore

{
    "key": "museumPopularity.data",
    "sortKey": "None",
    "value": "{\"forbidden-city\":123}",
    "expireAt": 4866674732
}
```

## Storage Key 汇总表

| 页面 | Storage Key | 数据类型 | 说明 |
|------|------------|---------|------|
| Popularity Survey | `museumPopularity.data` | Object | 博物馆ID到投票数的映射 |
| Treasure Survey | `capitalMuseumTreasure.data` | Object | 藏品名称到投票数的映射 |
| Guess Survey | `museumCount.data` | Object | 数量范围到投票数的映射 |

## 数据结构详细说明

### Popularity Survey 数据结构

```typescript
interface PopularityData {
    [museumId: string]: number;  // 博物馆ID => 投票数
}

// 示例
const popularityData: PopularityData = {
    "forbidden-city": 1523,
    "national-museum": 1204,
    "shanghai-museum": 987
};
```

### Treasure Survey 数据结构

```typescript
interface TreasureData {
    [treasureName: string]: number;  // 藏品名称 => 投票数
}

// 示例
const treasureData: TreasureData = {
    "元代景德镇窑青花凤首扁壶": 456,
    "《清明上河图》": 234,
    "后母戊鼎": 123,
    "大克鼎": 89
};
```

### Guess Survey 数据结构

```typescript
interface GuessData {
    [rangeLabel: string]: number;  // 数量范围标签 => 投票数
}

// 示例
const guessData: GuessData = {
    "100以下": 12,
    "500": 45,
    "1000": 89,
    "3000": 234,
    "6000以上": 567
};
```

## 博物馆数据加载机制

### Treasure Survey 的 3-Tier 加载策略

Treasure Survey 使用分层数据加载策略，按优先级顺序依次尝试:

> **注意**: 以下 Tier 编号表示实际执行的优先级顺序（Tier 1 最先尝试），与代码注释中的 Tier 编号不同。

**Tier 1 (优先级最高)**: KV Store 动态数据
```javascript
const key = `museum-data-${museumId}`;
const sortKey = 'museum';
const url = `${kvStoreEndpoint}?key=${encodeURIComponent(key)}&sortKey=${encodeURIComponent(sortKey)}`;
```

**Tier 2 (次优先)**: 静态 JSON 文件
```javascript
const response = await fetch(`/museums/${museumId}.json`);
```

**Tier 3 (兜底方案)**: 内置默认数据
```javascript
const museumData = getDefaultMuseumData();
```

### Popularity Survey 的数据来源

Popularity Survey 按优先级顺序依次尝试加载博物馆数据:

**优先使用 (优先级最高)**: `window.MUSEUMS_META` (来自 `/museums-meta.js`)
```javascript
if (typeof window !== 'undefined' && window.MUSEUMS_META) {
    allMuseums = window.MUSEUMS_META.filter(m => m && m.id && m.name);
}
```

**动态获取 (次优先)**: 尝试 fetch `/museums-meta.js`
```javascript
const response = await fetch('/museums-meta.js');
const text = await response.text();
const match = text.match(/window\.MUSEUMS_META\s*=\s*(\[[\s\S]*?\]);/);
```

**兜底方案 (最低优先级)**: 使用内置的 15 个热门博物馆列表

## 小程序集成

所有调查页面支持快手小程序环境:

### 导航函数

**跳转到广告页**:
```javascript
function showAd() {
    if (typeof ks !== 'undefined' && ks.navigateTo) {
        ks.navigateTo({
            url: "/pages/rewardedWebview/rewardedWebview?target=survey/popularity&flow=rewarded"
        });
    }
}
```

**返回首页**:
```javascript
function jumpToIndex() {
    if (typeof ks !== 'undefined' && ks.navigateTo) {
        ks.navigateTo({
            url: "/pages/index/index"
        });
    } else {
        window.location.href = '/';
    }
}
```

### URL 参数处理

**finishedAd 参数**: 控制是否显示结果
```javascript
// 广告完成后，小程序会附加参数 ?finishedAd=true
const urlParams = new URLSearchParams(window.location.search);
if (urlParams.get('finishedAd') === 'true') {
    // 显示投票结果
}
```

## 开发和测试

### 本地运行

```bash
# 进入项目根目录
cd {项目根目录}

# 启动本地服务器
python3 -m http.server 8000

# 访问调查页面
# Popularity: http://localhost:8000/survey/popularity/
# Treasure: http://localhost:8000/survey/treasure/
# Guess: http://localhost:8000/survey/guess/
```

### 测试检查清单

- [ ] 页面加载正常
- [ ] 选项显示正确（图片、文字）
- [ ] 用户选择功能正常
- [ ] 投票数据正确保存到 KV Store
- [ ] 结果统计和显示准确
- [ ] 移动端响应式布局正常
- [ ] 小程序环境导航功能正常
- [ ] Web 浏览器环境回退机制正常

### 数据验证

**验证存储的数据**:
```javascript
// 在浏览器控制台中执行
getConfig('museumPopularity.data', (data) => {
    console.log('Popularity votes:', data);
});

getConfig('capitalMuseumTreasure.data', (data) => {
    console.log('Treasure votes:', data);
});

getConfig('museumCount.data', (data) => {
    console.log('Count guess votes:', data);
});
```

## 常见问题

### Q: 如何添加新的调查页面？

1. 在 `survey/` 下创建新目录
2. 创建 `index.html`, `app.js`, `styles.css`
3. 在 `app.js` 中定义 `storageKey` (使用 `{name}.data` 格式)
4. 使用 `util.js` 的 `getConfig` 和 `updateConfig` 函数
5. 在本文档中添加说明

### Q: Storage Key 命名规范是什么？

格式: `{description}.data`

示例:
- `museumPopularity.data`
- `capitalMuseumTreasure.data`
- `museumCount.data`

### Q: 如何修改数据过期时间？

在 `updateKeyValueStore` 调用时传入 `expireAt` 参数:

```javascript
const oneHourLater = Math.floor(Date.now() / 1000) + 3600;
updateKeyValueStore(key, value, sortKey, oneHourLater);
```

### Q: 如何处理 KV Store 连接失败？

所有页面都有兜底机制:
- 使用本地默认数据继续运行
- 在控制台记录错误信息
- 不中断用户体验

## 维护和更新

### 更新博物馆列表

**Popularity Survey**:
- 修改 `/museums-meta.js` 中的 `MUSEUMS_META`
- 或更新 `getDefaultMuseums()` 函数

**Treasure Survey**:
- 更新 `/museums/{museumId}.json` 文件
- 或通过 KV Store API 上传新数据
- 或修改 `getDefaultMuseumData()` 函数

### 更新投票选项

**Guess Survey**:
修改 `questionConfig.options`:
```javascript
options: [
    { value: "1", label: "新选项1" },
    { value: "2", label: "新选项2" },
    // ...
]
```

## 相关文档

- [MUSEUM_DATA_MANAGEMENT.md](../MUSEUM_DATA_MANAGEMENT.md) - 博物馆数据管理文档
- [CENTRALIZED_DATA_PATTERN.md](../CENTRALIZED_DATA_PATTERN.md) - 集中式数据模式
- [README.md](../README.md) - 项目主文档

## 贡献指南

添加或修改调查页面时，请确保:

1. 更新本 README 文档
2. 遵循现有的代码结构和命名规范
3. 使用 `util.js` 的标准函数
4. 添加适当的错误处理和兜底机制
5. 测试小程序和 Web 浏览器环境
6. 验证数据正确保存和读取

---

**最后更新**: 2025-12-14
**维护者**: MuseumCheck Team
