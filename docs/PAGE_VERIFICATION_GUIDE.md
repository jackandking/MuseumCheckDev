# 快速页面验证系统使用指南

## 概述

已为MuseumCheck项目创建了快速页面验证系统，确保每次修改后重要页面能正常打开，没有错误。

## 验证命令

### 1. 快速验证（推荐）
```bash
npm run verify:pages:simple
```
- **速度**: 最快（约2-3秒）
- **检查内容**: 文件存在性、HTML语法、JS/CSS引用
- **特点**: 无需启动服务器，纯静态检查

### 2. 完整验证
```bash
npm run verify:pages
```
- **速度**: 较慢（约10-15秒）
- **检查内容**: 包含快速验证所有项目 + HTTP可访问性
- **特点**: 启动临时服务器进行实际访问测试

## 检查的页面

系统会自动检查以下9个核心页面：

1. **index.html** - 主页
2. **museum-checkin.html** - 博物馆打卡页面
3. **everyone-achievements.html** - 大家成就页面
4. **achievements.html** - 个人成就页面
5. **leaderboard.html** - 排行榜页面
6. **quiz/index.html** - 考试页面
7. **survey/index.html** - 调查页面
8. **fireworks.html** - 烟花页面
9. **event-wall.html** - 事件墙页面

## 检查项目

### ✅ 通过 (PASS)
- 文件存在
- HTML结构完整
- 所有JS/CSS文件引用正确

### ⚠️ 警告 (WARN)
- HTML结构轻微问题（如缺少某些标签）
- 不影响页面正常加载

### ❌ 失败 (FAIL)
- 文件不存在
- 关键JS/CSS文件缺失
- 严重HTML语法错误

## 使用建议

### 开发工作流
1. **修改代码后**: 运行 `npm run verify:pages:simple`
2. **提交前**: 运行 `npm run verify:pages` 进行完整检查
3. **部署前**: 确保所有检查通过

### 集成到Git Hooks
可以在提交前自动运行验证：
```bash
# 在 .husky/pre-commit 中添加
npm run verify:pages:simple
```

## 输出示例

```
🚀 开始快速页面健康检查...

检查 index.html... ✅ PASS
检查 museum-checkin.html... ✅ PASS
检查 everyone-achievements.html... ✅ PASS
...

==================================================
📊 检查结果总结:
✅ 通过: 7
⚠️  警告: 0
❌ 失败: 2
📈 总计: 9 个页面
```

## 性能优化

- **并行检查**: 所有页面同时检查，最大化速度
- **智能缓存**: 避免重复文件系统操作
- **最小依赖**: 仅使用Node.js内置模块

## 故障排除

### 常见问题
1. **端口占用**: 完整验证会自动处理端口冲突
2. **权限问题**: 确保脚本有执行权限 (`chmod +x`)
3. **路径问题**: 在项目根目录运行命令

### 调试模式
如需详细输出，可以修改脚本中的调试选项。

## 扩展功能

系统设计为可扩展的，可以轻松添加：
- 新的检查页面
- 更多的检查规则
- 自定义验证逻辑

---

**推荐**: 日常开发使用 `npm run verify:pages:simple`，提交前使用 `npm run verify:pages`。
