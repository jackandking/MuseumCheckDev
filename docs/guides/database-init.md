# 数据库初始化指南

## 问题说明

当用户在打卡页面发布海报时，如果遇到以下错误：

```
SQL报错：unknown column id: museum_id
```

这表示数据库表 `achievement_posters` 未初始化或缺少必需的列。

## 解决方案

### 方法1：使用自动初始化脚本（推荐）

运行以下命令初始化数据库表：

```bash
node init-achievement-posters-table.js
```

该脚本会：
1. 检查表是否存在
2. 如果表不存在，自动创建包含所有必需列的表
3. 如果表存在，验证表结构是否正确
4. 添加必要的索引以提高查询性能

### 方法2：手动创建表（备选）

如果自动脚本无法运行，可以手动执行以下SQL语句：

```sql
CREATE TABLE achievement_posters (
  id INT PRIMARY KEY AUTO_INCREMENT,
  image_url VARCHAR(500),
  title VARCHAR(200),
  user_name VARCHAR(100),
  museum_id VARCHAR(100),
  age_group VARCHAR(20),
  visibility VARCHAR(20) DEFAULT 'public',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_visibility (visibility),
  INDEX idx_museum_id (museum_id),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

#### 手动执行SQL的方式：

**通过Letmetry API**:
```bash
curl -X POST https://letmetry.cloud/mysql/query \
  -H "Content-Type: application/json" \
  -d '{
    "sql": "CREATE TABLE IF NOT EXISTS achievement_posters (id INT PRIMARY KEY AUTO_INCREMENT, image_url VARCHAR(500), title VARCHAR(200), user_name VARCHAR(100), museum_id VARCHAR(100), age_group VARCHAR(20), visibility VARCHAR(20) DEFAULT '\''public'\'', created_at DATETIME DEFAULT CURRENT_TIMESTAMP, INDEX idx_visibility (visibility), INDEX idx_museum_id (museum_id), INDEX idx_created_at (created_at)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4"
  }'
```

**通过MySQL客户端**:
```bash
mysql -u your_username -p your_database < create_table.sql
```

## 表结构说明

| 列名 | 类型 | 说明 |
|------|------|------|
| `id` | INT | 主键，自动递增 |
| `image_url` | VARCHAR(500) | 海报图片的URL |
| `title` | VARCHAR(200) | 海报标题 |
| `user_name` | VARCHAR(100) | 发布用户昵称 |
| `museum_id` | VARCHAR(100) | 博物馆ID |
| `age_group` | VARCHAR(20) | 年龄组（3-6、7-12、13-18） |
| `visibility` | VARCHAR(20) | 可见性（public/private） |
| `created_at` | DATETIME | 创建时间 |

## 验证表是否创建成功

运行以下命令检查表结构：

```bash
node -e "
const LetmetryAPI = require('./letmetry-cloud-api.js');
LetmetryAPI.queryMysql('DESCRIBE achievement_posters')
  .then(result => console.table(result))
  .catch(err => console.error('Error:', err));
"
```

或者通过MySQL客户端：

```sql
DESCRIBE achievement_posters;
```

## 常见问题

### Q: 脚本执行失败怎么办？

**A**: 检查以下几点：
1. 确保 `letmetry-cloud-api.js` 文件存在
2. 确保网络连接正常，可以访问 Letmetry API
3. 检查MySQL数据库权限是否正确
4. 查看错误信息，可能需要联系管理员

### Q: 表已存在但缺少某些列？

**A**: 这种情况需要手动添加缺失的列。例如：

```sql
-- 添加 museum_id 列（如果缺失）
ALTER TABLE achievement_posters 
ADD COLUMN museum_id VARCHAR(100) AFTER user_name;

-- 添加索引
CREATE INDEX idx_museum_id ON achievement_posters(museum_id);
```

### Q: 如何删除表并重新创建？

**A**: **警告：这将删除所有现有数据！**

```sql
DROP TABLE IF EXISTS achievement_posters;
```

然后重新运行初始化脚本。

## 权限要求

执行数据库初始化需要以下MySQL权限：
- `CREATE` - 创建表
- `SELECT` - 查询表结构
- `ALTER` - 修改表结构（如果需要添加缺失列）

## 技术支持

如果遇到问题，请：
1. 查看浏览器控制台的错误信息
2. 检查 `init-achievement-posters-table.js` 的执行日志
3. 提供完整的错误信息给技术支持团队
4. 创建GitHub Issue并附上错误详情

## 相关文档

- [POSTER_PUBLISH_FEATURE_SUMMARY.md](./POSTER_PUBLISH_FEATURE_SUMMARY.md) - 海报发布功能说明
- [.github/copilot-instructions.md](./.github/copilot-instructions.md) - MySQL Schema Management 章节
- [Letmetry API文档](https://letmetry.cloud/api-docs/)
