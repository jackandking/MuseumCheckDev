# 从 KV Store 导出静态文件工具

## 概述

`export-kvstore-to-static.js` 是一个用于将 KV Store (Tier 2) 中的动态博物馆数据导出为静态 JSON 文件 (Tier 1) 的工具。

这个工具支持三级数据管理系统的工作流程：
1. **开发**：在 KV Store 中快速迭代和测试博物馆数据
2. **导出**：验证通过后，使用此工具导出为静态文件
3. **发布**：静态文件部署到生产环境，享受更快的加载速度和更好的缓存支持

## 快速开始

### 使用 npm 脚本（推荐）

```bash
# 查看所有博物馆（不实际导出）
npm run export:kvstore:dry-run

# 导出所有博物馆到 /museums/ 目录
npm run export:kvstore

# 强制覆盖现有文件
npm run export:kvstore:force
```

### 直接使用命令行

```bash
# 导出特定博物馆
node tools/export-kvstore-to-static.js --museum forbidden-city

# 导出多个博物馆
node tools/export-kvstore-to-static.js --museums forbidden-city,national-museum,shanghai-museum

# 导出所有博物馆
node tools/export-kvstore-to-static.js --all

# 试运行（查看将导出什么，但不实际写入文件）
node tools/export-kvstore-to-static.js --all --dry-run

# 强制覆盖现有文件
node tools/export-kvstore-to-static.js --all --force

# 导出到自定义目录
node tools/export-kvstore-to-static.js --all --output ./my-museums
```

## 命令行选项

| 选项 | 说明 | 示例 |
|------|------|------|
| `--all` | 导出 `museums-data.js` 中的所有博物馆 | `--all` |
| `--museum <id>` | 导出特定博物馆 | `--museum forbidden-city` |
| `--museums <ids>` | 导出多个博物馆（逗号分隔） | `--museums forbidden-city,national-museum` |
| `--output <dir>` | 自定义输出目录（默认：`./museums`） | `--output ./static-data` |
| `--dry-run` | 试运行，不实际写入文件 | `--dry-run` |
| `--force` | 覆盖已存在的文件 | `--force` |
| `--help` | 显示帮助信息 | `--help` |

## 使用场景

### 场景 1：首次导出所有博物馆

如果你刚设置好 KV Store，想要创建所有博物馆的静态文件：

```bash
# 1. 先查看将导出多少博物馆
npm run export:kvstore:dry-run

# 2. 确认无误后导出
npm run export:kvstore
```

### 场景 2：增量更新特定博物馆

当你在 KV Store 中更新了某个博物馆的数据：

```bash
# 导出单个博物馆（如果文件已存在会跳过）
node tools/export-kvstore-to-static.js --museum forbidden-city

# 强制覆盖现有文件
node tools/export-kvstore-to-static.js --museum forbidden-city --force
```

### 场景 3：批量更新多个博物馆

当你更新了多个博物馆：

```bash
node tools/export-kvstore-to-static.js \
  --museums forbidden-city,national-museum,shanghai-museum \
  --force
```

### 场景 4：完整的开发到发布工作流

```bash
# 1. 在 museum-data-manager.html 中编辑和测试博物馆数据
# 2. 验证数据正确后，导出为静态文件
node tools/export-kvstore-to-static.js --museum my-new-museum

# 3. 验证导出的文件
cat museums/my-new-museum.json

# 4. 提交到 Git
git add museums/my-new-museum.json
git commit -m "Add new museum: My New Museum"
git push
```

## 输出说明

### 成功导出

```
🏛️  Museum Data Export Tool

Fetching forbidden-city from KV store...
  ✓  Written: forbidden-city.json
```

### 文件已存在（需要 --force）

```
Fetching forbidden-city from KV store...
  ⚠  File exists, skipping (use --force to overwrite): forbidden-city.json
```

### KV Store 中没有数据

```
Fetching test-museum from KV store...
  ✗  Not found in KV store: test-museum
```

### 批量导出摘要

```
Export Summary:
  Total museums:     261
  ✓ Successfully exported: 45
  ✗ Not found in KV store: 210
  ⚠ Already exists:       5
  ✗ Errors:              1
```

## 导出文件格式

导出的静态文件使用标准的博物馆数据 JSON 格式：

```json
{
  "id": "forbidden-city",
  "name": "故宫博物院",
  "location": "北京",
  "description": "世界上现存规模最大、保存最为完整的木质结构古建筑群",
  "tags": ["历史", "建筑", "文物"],
  "image": "https://...",
  "collections": [
    {
      "name": "《清明上河图》",
      "imageUrl": "https://...",
      "description": "..."
    }
  ],
  "checklists": {
    "parent": {
      "3-6": [...],
      "7-12": [...],
      "13-18": [...]
    },
    "child": {
      "3-6": [...],
      "7-12": [...],
      "13-18": [...]
    }
  }
}
```

## 性能考虑

### API 速率限制

工具内置了速率限制机制：
- 每批处理 5 个博物馆
- 批次之间延迟 500ms
- 避免对 KV Store API 造成过大压力

### 大规模导出

导出所有 261 个博物馆大约需要：
- 时间：约 30-60 秒（取决于网络速度）
- 存储：每个文件约 5-10KB，总计约 1.5-2.5MB

## 常见问题

### Q: 为什么有些博物馆没有在 KV Store 中？

**A**: 只有在 museum-data-manager.html 中上传到 KV Store 的博物馆才能导出。如果博物馆只在 `museums-data.js` 中存在，需要先手动上传到 KV Store。

### Q: 导出失败怎么办？

**A**: 检查以下几点：
1. 网络连接是否正常
2. KV Store API 是否可访问
3. 查看控制台错误信息
4. 使用 `--dry-run` 测试

### Q: 如何批量上传博物馆到 KV Store？

**A**: 目前需要通过 museum-data-manager.html 界面逐个上传。未来可能会添加批量上传工具。

### Q: 导出的文件可以直接使用吗？

**A**: 是的！导出的文件符合 Tier 1 格式，可以直接被 museum-data-loader.js 加载使用。

## 与其他工具集成

### 1. 验证导出的数据

```bash
# 导出后验证数据质量
npm run validate-data
```

### 2. 生成元数据

```bash
# 导出静态文件后更新元数据
npm run build:meta
```

### 3. 提交到版本控制

```bash
# 导出所有博物馆
npm run export:kvstore:force

# 查看变更
git status
git diff museums/

# 提交变更
git add museums/
git commit -m "Update museum static files from KV store"
git push
```

## 工作流程建议

### 推荐工作流程

```
1. 内容开发
   ↓ 使用 museum-data-manager.html
   
2. KV Store 测试
   ↓ 在开发模式中验证数据
   
3. 导出静态文件
   ↓ npm run export:kvstore
   
4. 本地验证
   ↓ 测试静态文件加载
   
5. 提交发布
   ↓ git commit & push
```

### 持续集成建议

可以在 CI/CD 流程中集成导出操作：

```yaml
# .github/workflows/export-museums.yml
name: Export Museums from KV Store

on:
  schedule:
    - cron: '0 0 * * 0'  # 每周日运行
  workflow_dispatch:  # 手动触发

jobs:
  export:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: npm install
      - run: npm run export:kvstore:force
      - uses: stefanzweifel/git-auto-commit-action@v4
        with:
          commit_message: "Auto-export museums from KV store"
```

## 技术细节

### 实现原理

1. 从 `museums-data.js` 读取博物馆 ID 列表
2. 对每个 ID，调用 KV Store API 获取数据
3. 解析返回的 JSON 数据
4. 格式化并写入 `/museums/{id}.json` 文件

### 依赖项

工具使用 Node.js 内置模块，无需额外依赖：
- `fs` - 文件系统操作
- `path` - 路径处理
- `https` - HTTP 请求

### 错误处理

工具包含完善的错误处理：
- 网络请求超时
- JSON 解析错误
- 文件写入失败
- API 返回错误

## 更新日志

### v1.0.0 (2024-11-18)
- 初始版本发布
- 支持单个和批量导出
- 实现试运行和强制覆盖模式
- 添加速率限制和批处理
- 完整的命令行参数支持

## 相关文档

- [三级博物馆数据管理系统](../docs/reports/data-management.md)
- [数据管理界面使用指南](../museum-data-manager.html)
- [博物馆数据加载器](../museum-data-loader.js)

## 反馈与贡献

如有问题或建议，请：
1. 提交 GitHub Issue
2. 发起 Pull Request
3. 联系维护者

---

**Happy Exporting! 🏛️✨**
