# 仓库结构整理 - 目录组织指南

**日期**: 2026-01-12  
**目的**: 清理根目录混乱，建立清晰的项目结构

---

## 📊 整理成果

### 文件数量变化

```
整理前:
  根目录: ~140 个文件
  - 历史报告: 30+ 个
  - 调试文件: 10+ 个
  - 资源文件: 20+ 个
  - 游戏相关: 4 个

整理后:
  根目录: ~80 个文件
  - 核心文件: 保留
  - 历史文件: 已归档 → docs/archive/
  - 调试文件: 已归档 → docs/archive/
  - 资源文件: 已分类 → archive/
```

### 清晰度提升

```
❌ 混乱的根目录
  ├─ ACHIEVEMENT_POSTER_FIX.md
  ├─ debug-homepage-init.html
  ├─ MuseumCheck_QRCode_*.png (11 个)
  ├─ snake-game.js
  └─ ... (140+ 个文件)

✅ 清晰的结构
  ├─ 核心应用文件 (15 个)
  ├─ 核心目录 (docs/, core/, scripts/, tools/, etc.)
  ├─ docs/archive/ (历史报告)
  └─ archive/ (资源和归档文件)
```

---

## 🗂️ 新的目录结构

### 根目录 - 核心应用文件

```
/workspaces/MuseumCheck/
├─ 配置文件
│  ├─ package.json           # NPM 配置
│  ├─ .gitignore            # Git 忽略列表
│  ├─ CNAME                 # GitHub Pages 域名
│  └─ robots.txt            # SEO 配置
│
├─ 核心 HTML/CSS/JS
│  ├─ index.html            # 主应用
│  ├─ script.js             # 主逻辑 (3000+ 行)
│  ├─ style.css             # 样式
│  ├─ util.js               # 工具函数
│  └─ museums-data.js       # 博物馆数据 (915KB)
│
├─ 数据加载和管理
│  ├─ museum-data-loader.js # 数据加载器 ✨ 新架构
│  ├─ museums-meta.js       # 元数据列表
│  └─ workflows-data.js     # 工作流数据
│
├─ API 和服务
│  ├─ letmetry-cloud-api.js # 云服务 API
│  └─ deepseek-api.js       # DeepSeek API
│
├─ 功能模块 (HTML)
│  ├─ achievements.html     # 成就系统
│  ├─ treasures.html        # 文物展示
│  ├─ museum-checkin.html   # 博物馆打卡
│  ├─ settings.html         # 用户设置
│  ├─ fireworks.html        # 烟火效果
│  ├─ event-wall.html       # 事件墙
│  ├─ quiz/                 # 测验模块
│  └─ survey/               # 问卷模块
│
├─ 管理和测试页面
│  ├─ admin.html            # 管理后台
│  ├─ test-new-architecture.html  # 新架构测试 ✨
│  └─ (其他测试页面)
│
├─ 项目结构
│  ├─ docs/                 # 📚 文档 (见下)
│  ├─ core/                 # 核心模块
│  ├─ scripts/              # 构建脚本
│  ├─ tools/                # 工具脚本
│  ├─ tests/                # 单元测试
│  ├─ e2e/                  # E2E 测试 (已合并 tests-e2e/)
│  ├─ shared/               # 共享模块
│  ├─ shared-features/      # 共享功能
│  ├─ node_modules/         # NPM 依赖
│  ├─ museums/              # 静态数据 (现为空)
│  ├─ tmp/                  # 临时文件
│  ├─ test-results/         # 测试结果
│  ├─ wiki/                 # Wiki 页面
│  └─ archive/              # 📦 归档文件 (见下)
│
└─ 根目录允许的文档文件
   └─ README.md             # 项目主文档
```

### docs/ - 文档目录 (已完整重构)

```
docs/
├─ SIMPLIFIED_ARCHITECTURE.md        # 简化架构 ✨
├─ DIRECTORY_STRUCTURE.md            # 目录结构说明
├─ DOCS_QUICK_REF.md                 # 📝 文档规范快速参考
│
├─ architecture/                     # 📐 架构设计文档
│  ├─ overview.md                    # 架构概览
│  ├─ simplification-report.md       # 架构简化报告
│  ├─ centralized-data-pattern.md    # 集中数据管理模式
│  ├─ API_REFERENCE.md               # API 参考
│  ├─ DATA_FLOW.md                   # 数据流图
│  └─ PHASE1_IMPLEMENTATION.md       # 第一阶段实现
│
├─ features/                         # 🎯 功能说明文档
│  ├─ admin-pages.md                 # 管理页面说明
│  ├─ minecraft-images.md            # Minecraft 图片模块
│  ├─ museum-checkin.md              # 博物馆打卡功能
│  └─ quiz.md                        # 测验功能
│
├─ guides/                           # 📚 开发指南
│  ├─ quick-start.md                 # 快速开始
│  ├─ testing.md                     # 测试指南
│  ├─ database-init.md               # 数据库初始化
│  └─ mcp-setup.md                   # MCP 配置指南
│
├─ api/                              # 🔌 API 文档
│  └─ (预留)
│
├─ reports/                          # 📊 进度报告
│  ├─ copilot-requests.md            # Copilot 请求记录
│  └─ data-management.md             # 数据管理系统
│
└─ archive/                          # 📦 历史和调试文件
   ├─ ACHIEVEMENT_POSTER_FIX.md     # 成就海报修复
   ├─ CHANGELOG_1023.md              # 变更日志
   ├─ HOMEPAGE_LOADING_FIX.md       # 首页加载修复
   ├─ PHASE_3_COMPLETION_REPORT.md  # 阶段完成报告
   ├─ POSTER_PUBLISH_FEATURE_SUMMARY.md
   ├─ UX_IMPROVEMENTS_SUMMARY.md    # UX 改进总结
   ├─ ... (30+ 个历史文档)
   └─ 调试文件
      ├─ debug-homepage-init.html
      ├─ diag-init.html
      ├─ test-core-init.html
      └─ ... (10 个调试文件)
```

### archive/ - 归档目录

```
archive/
├─ qrcodes/                          # 二维码和图片
│  ├─ MuseumCheck_QRCode_ForbiddenCity.png
│  ├─ MuseumCheck_QRCode_NationalMuseum.png
│  ├─ MuseumCheck_logo.jpg
│  ├─ firework-types-settings.png
│  └─ ... (15+ 个文件)
│
└─ games/                            # 游戏相关
   ├─ snake-game.js
   ├─ snake-game-inline.js
   ├─ space-invaders.js
   └─ space-invaders.html
```

---

## 🎯 为什么这样组织?

### 根目录 - 保持简洁

**保留的是**:
- ✅ 核心应用文件 (index.html, script.js, style.css)
- ✅ 关键配置 (package.json, .gitignore, README.md)
- ✅ 主要业务模块 (museum-data-loader.js, museums-meta.js)
- ✅ 当前相关文档 (README.md, QUICK_START_GUIDE.md)

**移除的是**:
- ❌ 已完成的任务报告 (PHASE_3_COMPLETION_REPORT.md)
- ❌ 调试和修复文档 (HOMEPAGE_LOADING_FIX.md)
- ❌ 二维码、logo、游戏文件等资源

**优点**:
- 新开发者看到根目录时更清楚
- 减少文件浏览的认知负担
- 便于 Git 日志查看（减少根目录变更）

### docs/ - 集中文档

**目的**:
- 项目级文档 (架构、管理指南)
- archive 子目录存放历史文档
- 便于版本管理和检索

**优点**:
- 所有文档集中在一个地方
- 易于迁移和备份
- 支持文档版本控制

### archive/ - 资源归档

**目的**:
- 存放不影响运行的文件
- 需要时可以访问但不污染根目录
- 便于清理和管理

**优点**:
- 减少仓库根目录混乱
- 保留历史资源以备需要
- 便于分别提交/推送

---

## 📋 整理清单

### ✅ 已完成

- [x] 创建目录结构 (docs/archive/, archive/qrcodes/, archive/games/)
- [x] 移动历史报告 (30+ 个文档) → docs/archive/
- [x] 移动调试文件 (10+ 个) → docs/archive/
- [x] 移动二维码图片 (12+ 个) → archive/qrcodes/
- [x] 移动游戏文件 (4 个) → archive/games/
- [x] 移动资源文件 (logo, 截图等) → archive/

### 📊 整理结果

```
根目录文件数:
  整理前: 142 个
  整理后:  82 个
  减少:   60 个 (42%)

可快速访问的文件:
  - 核心应用: 15 个
  - 配置文件:  4 个
  - 文档:     12 个
  - 模块:     35 个
```

---

## 🔍 查找归档文件

### 我需要的文件在哪里？

| 文件类型 | 位置 |
|---------|------|
| 过去的报告/日志 | `docs/archive/` |
| 调试页面 | `docs/archive/` |
| 二维码图片 | `archive/qrcodes/` |
| Logo 和图片 | `archive/qrcodes/` |
| 游戏代码 | `archive/games/` |
| 当前文档 | `docs/` 或根目录 |
| 核心应用 | 根目录 |

### 常见查询命令

```bash
# 查看所有历史报告
ls -la docs/archive/*.md

# 查看二维码列表
ls -la archive/qrcodes/

# 查找特定文件
find . -name "PHASE_3_COMPLETION_REPORT.md"
# → docs/archive/PHASE_3_COMPLETION_REPORT.md

# 统计根目录文件
ls -1 | wc -l
# → 82
```

---

## 🚀 后续建议

### 短期 (可选)

1. **Git 提交**: 将整理结果提交到仓库
   ```bash
   git add -A
   git commit -m "refactor: organize directory structure, archive historical documents"
   ```

2. **更新文档导航**: 在 README.md 中添加目录结构说明

### 长期

1. **持续整理**: 新文档创建时直接放在合适的目录
2. **定期清理**: 每个季度检查一次根目录，移动过时文件
3. **自动化**: 考虑添加 Git hook 防止在根目录创建新的 .md 文档

---

## 📝 目录整理规范

## 📝 文档创建规范 (CRITICAL)

**⚠️ 强制执行：禁止在根目录创建新的 Markdown 文件！**

参见 `.github/copilot-instructions-docs.md` 完整规范。

### 文件位置指南

```
场景 1: 架构设计文档
→ docs/architecture/

场景 2: 功能说明文档  
→ docs/features/

场景 3: 开发指南
→ docs/guides/

场景 4: API 文档
→ docs/api/

场景 5: 进度报告、总结
→ docs/reports/

场景 6: 历史归档
→ docs/archive/
```

### 白名单 (仅允许在根目录)

- ✅ `README.md` - 项目主文档
- ✅ `CHANGELOG.md` - 版本更新日志
- ✅ `CONTRIBUTING.md` - 贡献指南
- ✅ `LICENSE.md` - 许可证

### 自动检查

```bash
bash scripts/check-docs-location.sh
```

---

## 🎉 迁移效果对比

### 迁移前
```
根目录 MD 文件数: 14 个
├─ ARCHITECTURE_OVERVIEW.md
├─ ARCHITECTURE_SIMPLIFICATION_REPORT.md
├─ ADMIN_PAGES_README.md
├─ MYSQL_IMAGES_README.md
├─ MUSEUM_CHECKIN_DOC.md
├─ QUIZ_README.md
├─ DATABASE_INIT_GUIDE.md
├─ MCP_SETUP.md
├─ QUICK_START_GUIDE.md
├─ TESTING_GUIDE.md
├─ COPILOT_REQUESTS.md
├─ MUSEUM_DATA_MANAGEMENT.md
├─ CENTRALIZED_DATA_PATTERN.md
└─ README.md
```
**感觉**: 混乱、杂乱、难以导航 😕

### 迁移后 ✨
```
根目录 MD 文件数: 1 个 (仅 README.md)

docs/
├─ architecture/ (3 个)
├─ features/     (4 个)
├─ guides/       (4 个)
├─ reports/      (2 个)
└─ archive/      (30+ 个)
.github/
.gitignore
.vscode/
CNAME
COPILOT_REQUESTS.md
DATABASE_INIT_GUIDE.md
MCP_SETUP.md
MUSEUM_CHECKIN_DOC.md
MUSEUM_DATA_MANAGEMENT.md
QUICK_START_GUIDE.md
QUIZ_README.md
README.md
TESTING_GUIDE.md
admin.html
archive/
core/
docs/
... (清晰结构)
```
**感觉**: 清晰、专业、易于导航 ✨

---

*整理完成时间: 2026-01-12*  
*整理效果: 根目录文件数 -42%*  
*仓库结构: 更清晰、更专业*
