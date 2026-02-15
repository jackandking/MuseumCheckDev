# MVP 功能测试指南

本文档提供详细的测试步骤，用于验证 MVP Phase 1 (官方搜索) 和 Phase 2 (动态创建) 的功能。

## 📋 测试前准备

### 1. 环境要求

```bash
# 确认在项目根目录
cd /path/to/MuseumCheck

# 检查 Node.js 和 Python
node --version  # 应有 Node.js
python3 --version  # 应有 Python 3.x
```

### 2. 安装依赖

```bash
# 安装测试依赖（如果还没安装）
npm install
```

## 🧪 自动化测试

### 运行单元测试

```bash
# 运行所有单元测试
npm test

# 运行特定测试文件
npm test -- tests/core.test.js

# 运行测试并查看覆盖率
npm run test:coverage
```

### 运行数据质量检查

```bash
# 检查博物馆数据完整性
npm run test:data-quality
```

### 运行 E2E 测试

```bash
# 安装 Playwright（首次运行）
npx playwright install

# 运行端到端测试
npm run test:e2e

# 运行特定的 E2E 测试
npx playwright test e2e/homepage.spec.ts
```

## 🖥️ 手动测试

### 步骤 1: 启动本地服务器

```bash
# 方法 1: 使用 Python HTTP Server（推荐）
python3 -m http.server 8000

# 方法 2: 使用 Node.js HTTP Server
npm install -g http-server
http-server -p 8000

# 方法 3: 使用 VS Code Live Server
# 右键点击 index.html -> "Open with Live Server"
```

服务器启动后，访问 http://localhost:8000

### 步骤 2: 测试 Phase 1 - 官方搜索功能

#### 2.1 测试搜索界面

1. **打开浏览器开发者工具**
   - Chrome/Edge: `F12` 或 `Ctrl+Shift+I`
   - Firefox: `F12` 或 `Ctrl+Shift+K`
   - Safari: `Cmd+Option+I`

2. **验证模块加载**
   ```javascript
   // 在 Console 中运行
   console.log('OfficialMuseumSearch:', typeof OfficialMuseumSearch);
   console.log('DynamicMuseumCreator:', typeof DynamicMuseumCreator);
   
   // 应该输出:
   // OfficialMuseumSearch: function
   // DynamicMuseumCreator: function
   ```

3. **验证模块初始化**
   ```javascript
   // 检查 app 对象是否有 MVP 模块
   console.log('app.officialMuseumSearch:', app.officialMuseumSearch);
   console.log('app.dynamicMuseumCreator:', app.dynamicMuseumCreator);
   
   // 应该看到对象实例，不是 null 或 undefined
   ```

#### 2.2 测试搜索功能

1. **基础搜索测试**
   - 在搜索框输入 "故宫"
   - 观察 Network 标签（可选，当前未激活官方 API）
   - 验证搜索结果显示正确
   - 应该看到 "显示 1 个搜索结果"

2. **搜索缓存测试**
   ```javascript
   // 在 Console 中测试官方搜索模块
   const search = new OfficialMuseumSearch();
   
   // 执行搜索（会调用 Letmetry API）
   search.search('北京').then(result => {
     console.log('搜索结果:', result);
     console.log('博物馆数量:', result.museums.length);
     console.log('是否缓存:', result.cached);
   });
   
   // 再次搜索相同关键词（应该返回缓存）
   search.search('北京').then(result => {
     console.log('第二次搜索 - 是否缓存:', result.cached);
     // 应该输出: true
   });
   ```

3. **检查 localStorage 缓存**
   ```javascript
   // 查看缓存的搜索结果
   for (let i = 0; i < localStorage.length; i++) {
     const key = localStorage.key(i);
     if (key.startsWith('museum-search-cache-')) {
       const cached = JSON.parse(localStorage.getItem(key));
       console.log('缓存键:', key);
       console.log('缓存时间:', new Date(cached.timestamp));
       console.log('结果数量:', cached.data.museums.length);
     }
   }
   ```

4. **测试缓存过期**
   ```javascript
   // 手动设置过期的缓存（用于测试）
   const testKey = 'museum-search-cache-test';
   const expiredCache = {
     data: { success: true, museums: [] },
     timestamp: Date.now() - (2 * 60 * 60 * 1000) // 2小时前
   };
   localStorage.setItem(testKey, JSON.stringify(expiredCache));
   
   // 验证过期缓存不会被使用
   const search = new OfficialMuseumSearch();
   const result = search.getCachedSearch('test');
   console.log('过期缓存结果:', result); // 应该是 null
   ```

### 步骤 3: 测试 Phase 2 - 动态创建功能

#### 3.1 准备测试环境

```javascript
// 在 Console 中创建测试实例
const creator = new DynamicMuseumCreator();

// 测试博物馆数据
const testMuseum = {
  id: 'test-museum-' + Date.now(),
  name: '测试博物馆',
  location: '北京',
  province: '北京市',
  level: '三级',
  category: '综合',
  tags: ['测试', '示例'],
  image: 'https://via.placeholder.com/400x300'
};
```

#### 3.2 测试 KV Store 检查

```javascript
// 检查博物馆是否存在（应该返回 false）
creator.checkMuseumInKVStore('forbidden-city').then(exists => {
  console.log('故宫是否在 KV Store:', exists);
});

// 检查不存在的博物馆
creator.checkMuseumInKVStore('non-existent-museum').then(exists => {
  console.log('不存在的博物馆:', exists); // 应该是 false
});
```

#### 3.3 测试博物馆创建

```javascript
// 创建测试博物馆记录
creator.createMuseumFromOfficial(testMuseum).then(result => {
  if (result) {
    console.log('创建成功!');
    console.log('博物馆ID:', result.id);
    console.log('官方数据:', result.officialData);
    console.log('用户数据:', result.userContributed);
    console.log('访问统计:', result.visitStats);
  } else {
    console.error('创建失败');
  }
});
```

#### 3.4 测试 getOrCreateMuseum

```javascript
// 测试统一入口（自动检查并创建）
creator.getOrCreateMuseum(testMuseum).then(museum => {
  console.log('获取或创建结果:', museum);
  
  // 再次调用应该直接返回已存在的记录
  creator.getOrCreateMuseum(testMuseum).then(museum2 => {
    console.log('第二次调用（应该直接加载）:', museum2);
  });
});
```

### 步骤 4: 测试集成流程

#### 4.1 测试打开博物馆触发创建

1. **准备测试**
   ```javascript
   // 清空某个博物馆的 KV Store 记录（仅用于测试）
   // 注意：这个操作需要实际的 KV Store 访问权限
   ```

2. **触发创建流程**
   - 在页面上点击任意博物馆卡片
   - 观察 Console 输出
   - 应该看到类似日志：
     ```
     [MVP] Museum xxx not in KV Store, will create dynamically
     [MVP] Creating museum record for xxx
     [MVP] Successfully created museum xxx
     ```

3. **验证数据结构**
   ```javascript
   // 在 Console 中检查加载的博物馆数据
   // 打开博物馆后，检查返回的数据结构
   ```

#### 4.2 测试搜索 → 打开 → 创建流程

完整的用户流程测试：

1. **搜索博物馆**
   - 输入 "故宫博物院"
   - 验证搜索结果显示

2. **打开博物馆详情**
   - 点击搜索结果中的博物馆卡片
   - 观察 Network 标签，查看 KV Store API 调用
   - 验证博物馆详情页正确加载

3. **验证动态创建（如果首次打开）**
   - 检查 Console 日志
   - 确认创建流程被触发
   - 验证数据正确保存

## 🐛 调试技巧

### 启用详细日志

```javascript
// 在 Console 中启用调试模式
localStorage.setItem('debug', 'true');
location.reload();

// 查看所有 console.log 输出，包括 [MVP] 前缀的日志
```

### 检查 Network 请求

1. 打开 Network 标签
2. 筛选 XHR/Fetch 请求
3. 查找以下 API 调用：
   - `https://letmetry.cloud/museum/search` - 官方搜索
   - `https://rlyhccdr2g.execute-api.us-west-2.amazonaws.com/default/keyValueStore` - KV Store

### 查看 localStorage 数据

```javascript
// 查看所有缓存
Object.keys(localStorage).forEach(key => {
  if (key.startsWith('museum-')) {
    console.log(key, ':', localStorage.getItem(key).substring(0, 100) + '...');
  }
});

// 清空所有 MVP 相关缓存
Object.keys(localStorage).forEach(key => {
  if (key.startsWith('museum-search-cache-')) {
    localStorage.removeItem(key);
  }
});
```

### 模拟 API 响应

如果需要测试但没有网络连接：

```javascript
// 模拟官方搜索 API（仅用于测试）
const mockSearch = {
  search: async (query) => ({
    success: true,
    museums: [
      {
        name: '测试博物馆 - ' + query,
        location: '北京',
        level: '一级',
        category: '综合'
      }
    ],
    cached: false
  })
};

// 替换实际搜索对象
app.officialMuseumSearch = mockSearch;
```

## ✅ 验收标准

### Phase 1 - 官方搜索

- [ ] OfficialMuseumSearch 模块成功加载
- [ ] search() 方法可以调用 Letmetry API
- [ ] 搜索结果正确缓存到 localStorage
- [ ] 缓存 TTL 为 1 小时
- [ ] 最多缓存 50 个搜索结果
- [ ] 过期缓存自动清理
- [ ] API 结果正确转换为博物馆卡片格式

### Phase 2 - 动态创建

- [ ] DynamicMuseumCreator 模块成功加载
- [ ] checkMuseumInKVStore() 正确检查存在性
- [ ] createMuseumFromOfficial() 创建完整记录
- [ ] 博物馆 ID 生成正确
- [ ] KV Store 写入成功
- [ ] 数据结构包含所有必需字段（officialData, userContributed, collections, checklists, visitStats）
- [ ] 集成到博物馆加载流程

### 集成测试

- [ ] 搜索 → 打开 → 创建流程完整工作
- [ ] 向后兼容现有 MUSEUMS_META
- [ ] HomepageAdapter 正常工作
- [ ] 不影响现有功能

## 📝 测试报告模板

完成测试后，可以使用以下模板记录结果：

```markdown
## MVP 测试报告

**测试日期**: YYYY-MM-DD
**测试人员**: [姓名]
**测试环境**: Chrome/Firefox/Safari [版本]

### Phase 1: 官方搜索
- [ ] 模块加载: ✅ / ❌
- [ ] API 调用: ✅ / ❌
- [ ] 缓存功能: ✅ / ❌
- [ ] 结果转换: ✅ / ❌

### Phase 2: 动态创建
- [ ] 存在性检查: ✅ / ❌
- [ ] 记录创建: ✅ / ❌
- [ ] KV Store 写入: ✅ / ❌
- [ ] 数据结构: ✅ / ❌

### 集成测试
- [ ] 完整流程: ✅ / ❌
- [ ] 向后兼容: ✅ / ❌

### 发现的问题
1. [问题描述]
2. [问题描述]

### 测试截图
[附加截图]
```

## 🔧 常见问题

### Q: 为什么搜索没有调用官方 API？

A: 当前 MVP 实现中，官方 API 搜索模块已就绪但未激活。搜索仍使用 HomepageAdapter（MUSEUMS_META）以确保向后兼容。要激活官方搜索，可以修改 `script.js` 中的条件判断。

### Q: 如何清空测试数据？

A: 使用浏览器开发者工具：
1. Application/Storage 标签
2. Local Storage → 选择域名
3. 清空所有 `museum-search-cache-` 开头的键

### Q: 测试失败怎么办？

A: 
1. 检查 Console 是否有错误信息
2. 验证网络连接（Letmetry API 需要网络）
3. 确认模块正确加载
4. 查看本指南的"调试技巧"章节

### Q: 如何验证 KV Store 写入？

A: 目前需要：
1. 查看 Network 标签的 API 响应
2. 使用管理员工具查询 KV Store
3. 或者通过再次加载博物馆验证数据存在

## 📚 相关文档

- [MVP 实施计划](../architecture/official-api-search.md)
- [Letmetry API 文档](../LETMETRY_API_COMPLETE_COVERAGE.md)
- [架构概览](../ARCHITECTURE_OVERVIEW.md)
- [博物馆数据工作流程](./museum-7-step-workflow.md)
