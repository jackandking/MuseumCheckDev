# 管理后台文档

MuseumCheck 提供了两个管理后台页面，用于管理应用的远程数据。

## 访问方式

所有管理后台页面都需要通过 URL 参数 `?admin=1` 进行访问控制。

### 排行榜管理后台

**访问地址**: `/admin-leaderboard.html?admin=1`

用于管理全网排行榜数据。

#### 功能特性

1. **数据查看**
   - 显示所有排行榜参与用户
   - 按参观数量排序显示
   - 显示用户昵称、参观数、最后更新时间
   - 提供排名徽章（🥇🥈🥉）

2. **数据统计**
   - 总用户数
   - 总参观次数
   - 平均参观数
   - 不合法记录数
   - 重复用户ID检测

3. **数据验证**
   - 自动验证每条记录的有效性
   - 标记异常数据（缺少字段、数据过旧等）
   - 显示详细的错误信息

4. **数据操作**
   - ✏️ 编辑：修改用户昵称和参观数
   - 🗑️ 删除：删除单条记录
   - 🗑️ 批量删除不合法：一次性删除所有不合法记录
   - 📤 导出数据：导出为 JSON 文件
   - 🔄 刷新：重新加载最新数据

#### 数据格式

```json
{
  "userId": "user-1234567890-abc123",
  "nickname": "小朋友",
  "visitedCount": 10,
  "lastUpdate": 1699478000000
}
```

### 烟花管理后台

**访问地址**: `/admin-fireworks.html?admin=1`

用于管理烟花成就数据。

#### 功能特性

1. **远程数据管理**
   - 查看所有远程烟花记录
   - 验证数据有效性
   - 批量删除不合法数据

2. **本地数据管理**
   - 查看本地烟花记录
   - 对比远程和本地数据
   - 清理本地无效数据

3. **设置管理**
   - 配置烟花保留时间

## 导航

两个管理后台页面之间可以互相导航：
- 排行榜管理 → 烟花管理
- 烟花管理 → 排行榜管理

## 技术架构

### 数据存储

使用 AWS Lambda + DynamoDB 存储远程数据：

- **API Endpoint**: `https://rlyhccdr2g.execute-api.us-west-2.amazonaws.com/default/keyValueStore`
- **排行榜存储键**: `museumcheck-leaderboard`
- **烟花存储键**: `museumcheck-firework`

### API 方法

1. **GET** - 读取数据
   ```
   GET /keyValueStore?key=museumcheck-leaderboard
   ```

2. **POST** - 写入/更新数据
   ```json
   POST /keyValueStore
   {
     "key": "museumcheck-leaderboard",
     "sortKey": "user-xxx",
     "value": "{...}",
     "ttl": 4866674732
   }
   ```

3. **DELETE** - 通过设置过期时间删除
   ```json
   POST /keyValueStore
   {
     "key": "museumcheck-leaderboard",
     "sortKey": "user-xxx",
     "value": "{\"deleted\":true}",
     "expireAt": 1234567890
   }
   ```

## 安全注意事项

1. **访问控制**: 所有管理页面都需要 `?admin=1` 参数
2. **noindex**: 设置了 `robots` meta 标签防止搜索引擎索引
3. **确认操作**: 删除操作都需要用户确认
4. **数据验证**: 自动验证所有数据的有效性

## 使用场景

### 日常维护

- 定期检查排行榜数据质量
- 清理异常或过期的记录
- 监控用户参与情况

### 数据分析

- 导出数据进行离线分析
- 统计用户参观趋势
- 识别活跃用户

### 问题排查

- 查找重复或错误的数据
- 验证数据一致性
- 清理测试数据

## 开发说明

### 文件结构

```
admin-leaderboard.html    # 排行榜管理页面 HTML
admin-leaderboard.js      # 排行榜管理页面逻辑
admin-fireworks.html      # 烟花管理页面 HTML
admin-fireworks.js        # 烟花管理页面逻辑
```

### 本地测试

```bash
# 启动本地服务器
python3 -m http.server 8000

# 访问管理页面
http://localhost:8000/admin-leaderboard.html?admin=1
http://localhost:8000/admin-fireworks.html?admin=1
```

### 添加新的验证规则

在 `admin-leaderboard.js` 中的 `validateEntry` 函数添加新的验证逻辑：

```javascript
function validateEntry(entry) {
  const errors = [];
  
  // 添加新的验证规则
  if (entry.someField && entry.someField > 100) {
    errors.push('someField 超出限制');
  }
  
  return { ok: errors.length === 0, errors };
}
```

## 常见问题

### Q: 为什么看不到数据？

A: 检查以下几点：
1. 确保使用了 `?admin=1` 参数
2. 检查网络连接
3. 查看浏览器控制台是否有错误
4. 确认 API endpoint 可访问

### Q: 删除操作失败怎么办？

A: 删除操作通过设置过期时间实现，可能需要等待一段时间才会真正从数据库中清除。如果多次尝试失败，请检查网络连接和 API 权限。

### Q: 如何备份数据？

A: 使用"📤 导出数据"功能将数据导出为 JSON 文件，定期备份到本地或云存储。

## 更新日志

### v1.0.0 (2024-11-08)

- ✨ 新增排行榜管理后台
- 🔗 添加管理页面之间的导航链接
- 📊 实现数据统计和验证功能
- 🗑️ 支持单条和批量删除操作
- ✏️ 支持数据编辑功能
- 📤 支持数据导出功能
