# Scripts 目录

自动化脚本和工具集合。

## 📋 脚本清单

### 🗄️ 数据库初始化

#### `init-db-with-curl.sh`
初始化远程数据库表结构（使用 curl 调用 API）。

**用途**: 创建必要的数据库表（成就海报、烟花等）

**使用方法**:
```bash
chmod +x scripts/init-db-with-curl.sh
./scripts/init-db-with-curl.sh
```

**功能**:
- 创建 `achievement_posters` 表
- 创建 `fireworks` 表
- 创建 `leaderboard` 表
- 使用 Letmetry Cloud API 执行 SQL

---

### 📱 移动端功能验证

#### `validate-mobile-features.sh`
验证移动端关键功能是否正常工作。

**用途**: 自动化测试移动端用户体验

**使用方法**:
```bash
chmod +x scripts/validate-mobile-features.sh
./scripts/validate-mobile-features.sh
```

**验证项**:
- 页面加载速度
- 触摸交互响应
- 响应式布局
- 移动端特定功能

---

#### `validate-pinghu-mobile-test.sh`
专门测试平湖博物馆打卡流程（移动端）。

**用途**: 验证特定博物馆的完整用户旅程

**使用方法**:
```bash
chmod +x scripts/validate-pinghu-mobile-test.sh
./scripts/validate-pinghu-mobile-test.sh
```

**测试场景**:
- 打卡页面加载
- 任务列表显示
- 照片上传流程
- 进度追踪

---

### 📝 文档规范检查

#### `check-docs-location.sh`
检查根目录是否有违反规范的 MD 文件。

**用途**: 确保所有文档按规范放置在 `docs/` 子目录中

**使用方法**:
```bash
chmod +x scripts/check-docs-location.sh
./scripts/check-docs-location.sh
```

**检查内容**:
- ✅ 扫描根目录所有大写命名的 .md 文件
- ✅ 对比白名单（README.md, CHANGELOG.md 等）
- ✅ 报告违规文件并建议迁移目录
- ✅ 基于文件名智能推荐目标位置

**输出示例**:
```
🔍 检查文档位置规范...
================================

❌ 发现 13 个违规文档（在根目录且大写命名）：
  ❌ ARCHITECTURE_OVERVIEW.md
  ❌ QUICK_START_GUIDE.md
  
📋 建议迁移方案：
  ARCHITECTURE_OVERVIEW.md → docs/architecture/
  QUICK_START_GUIDE.md → docs/guides/
```

**相关文档**: 
- `.github/copilot-instructions-docs.md` - 完整文档规范
- `.github/workflows/check-docs-location.yml` - GitHub Actions 自动检查

---

### 🏗️ 架构验证

#### `verify-new-architecture.sh`
验证简化后的数据加载架构是否正常工作。

**用途**: 确保新架构（KV Store + Browser Cache）运行正常

**使用方法**:
```bash
chmod +x scripts/verify-new-architecture.sh
./scripts/verify-new-architecture.sh
```

**验证内容**:
- ✅ 核心文件存在性检查
- ✅ 架构代码更新验证
- ✅ 静态文件清理确认
- ✅ 文档完整性检查
- ✅ 测试套件运行状态

**输出示例**:
```
🏛️  MuseumCheck 新架构验证脚本
================================

📁 检查核心文件...
✓ 文件存在: museum-data-loader.js
✓ 文件存在: museums-meta.js
✓ 文件存在: index.html

🔍 验证架构更新...
✓ 内容验证: museum-data-loader.js 包含 'KV Store + Browser Cache'

🗑️  验证静态文件清理...
✓ 静态 JSON 文件已全部删除

✅ 所有验证通过！新架构已成功实施。
```

---

## 🔧 脚本开发指南

### 命名规范

- **初始化脚本**: `init-<功能>.sh`
- **验证脚本**: `validate-<场景>.sh` 或 `verify-<功能>.sh`
- **构建脚本**: `build-<目标>.sh`
- **部署脚本**: `deploy-<环境>.sh`

### 脚本模板

```bash
#!/bin/bash
# 脚本描述
# 
# 使用方法: chmod +x scripts/script-name.sh && ./scripts/script-name.sh

set -e  # 遇到错误立即退出

echo "🏛️  脚本名称"
echo "================================"
echo ""

# 脚本逻辑
# ...

echo ""
echo "✅ 完成！"
```

### 最佳实践

1. **错误处理**: 使用 `set -e` 确保脚本在错误时停止
2. **用户反馈**: 使用 emoji 和清晰的输出信息
3. **权限检查**: 在脚本开头检查必要的权限
4. **路径处理**: 使用相对路径或 `cd` 到正确目录
5. **文档注释**: 在脚本顶部说明用途和用法

---

## 📚 相关文档

- [架构简化文档](../docs/SIMPLIFIED_ARCHITECTURE.md)
- [数据库初始化指南](../docs/guides/database-init.md)
- [测试指南](../docs/guides/testing.md)

---

**最后更新**: 2026-01-12  
**维护者**: MuseumCheck Team
