# 文件目录规范指南

**日期**: 2026-01-24  
**目的**: 确保每个新增文件都存放到合适的目录，维护项目结构清晰性

---

## 🎯 规范目标

- 保持根目录简洁清晰
- 建立可预测的文件组织结构
- 提高代码可维护性和查找效率
- 自动化检查防止违规文件

---

## 📁 目录结构规范

### 根目录允许的文件

#### 核心应用文件
- `index.html` - 主应用入口
- `script.js` - 主逻辑文件
- `style.css` - 主样式文件
- `util.js` - 工具函数

#### 主要功能页面
- `museum-checkin.html` - 博物馆打卡
- `achievements.html` - 成就系统
- `treasures.html` - 文物展示
- `settings.html` - 用户设置
- `fireworks.html` - 烟花效果
- `event-wall.html` - 事件墙
- `everyone-achievements.html` - 大家成就
- `leaderboard.html` - 排行榜
- `fireworks-wall.html` - 烟花墙

#### 项目配置文件
- `package.json` - NPM 配置
- `package-lock.json` - NPM 锁定文件
- `.gitignore` - Git 忽略列表
- `CNAME` - GitHub Pages 域名
- `robots.txt` - SEO 配置
- `netlify.toml` - Netlify 配置
- `.copilot-mcp.json` - MCP 配置

#### 项目文档 (白名单)
- `README.md` - 项目主文档
- `CHANGELOG.md` - 版本更新日志
- `CONTRIBUTING.md` - 贡献指南
- `LICENSE.md` - 许可证

### 子目录规范

#### 📚 docs/ - 文档目录
```
docs/
├─ architecture/     # 架构设计文档
├─ features/         # 功能说明文档
├─ guides/           # 开发指南
├─ api/              # API 文档
├─ reports/          # 进度报告
└─ archive/          # 历史文档
```

#### 🧪 tests/ - 测试文件
```
tests/
├─ unit/             # 单元测试
├─ integration/      # 集成测试
├─ e2e/              # 端到端测试
└─ *.test.js         # 测试文件
```

#### ⚙️ scripts/ - 工具脚本
```
scripts/
├─ check-*.sh        # 检查脚本
├─ build-*.sh        # 构建脚本
└─ deploy-*.sh       # 部署脚本
```

#### 🔧 config/ - 配置文件
```
config/
├─ api-endpoints.js  # API 端点配置
├─ webpack.config.js # Webpack 配置
└─ *.config.js       # 其他配置
```

#### 📊 data/ - 数据文件
```
data/
├─ museums-meta.json # 博物馆元数据
├─ *.json            # JSON 数据文件
└─ *.yaml            # YAML 配置
```

#### 🖼️ assets/ - 资源文件
```
assets/
├─ images/           # 图片资源
├─ audio/            # 音频文件
└─ qrcodes/          # 二维码
```

#### 🛠️ tools/ - 工具文件
```
tools/
├─ *.js              # Node.js 工具
├─ generate-*.js     # 生成器
└─ verify-*.js       # 验证工具
```

#### 🏗️ core/ - 核心模块
```
core/
├─ adapters/         # 适配器
├─ storage/          # 存储模块
└─ *.js              # 核心逻辑
```

#### 🔄 shared/ - 共享模块
```
shared/
├─ data/             # 共享数据
└─ features/         # 共享功能
```

---

## 🔍 文件类型规则

### 文档文件 (*.md)
- ✅ `docs/architecture/` - 架构文档
- ✅ `docs/features/` - 功能文档
- ✅ `docs/guides/` - 开发指南
- ✅ `docs/api/` - API 文档
- ✅ `docs/reports/` - 进度报告
- ✅ `docs/archive/` - 历史文档
- ❌ 根目录 (除白名单外)

### 测试文件 (*.test.js, *.spec.js)
- ✅ `tests/unit/` - 单元测试
- ✅ `tests/integration/` - 集成测试
- ✅ `e2e/` - 端到端测试
- ❌ 其他位置

### 脚本文件 (*.sh)
- ✅ `scripts/` - 工具脚本
- ❌ 其他位置

### 配置文件 (*.config.js, *.json)
- ✅ `config/` - 应用配置
- ✅ `.github/workflows/` - CI/CD 配置
- ❌ 根目录 (除特殊配置外)

### 资源文件
- 图片 (*.png, *.jpg, *.svg): `assets/`, `archive/`, `docs/`
- 音频 (*.wav, *.mp3): `assets/audio/`
- 数据 (*.json, *.yaml): `data/`, `backup/`, `config/`

---

## 🚫 常见违规示例

### ❌ 错误的文件位置
```bash
# 在根目录创建文档
NEW_FEATURE.md                    # 应该在 docs/features/
DEBUG_REPORT.md                  # 应该在 docs/reports/

# 测试文件位置错误
test-new-feature.js              # 应该在 tests/unit/
helper.test.js                   # 应该在 tests/

# 脚本文件位置错误
deploy.sh                        # 应该在 scripts/
backup-data.sh                   # 应该在 scripts/

# 资源文件位置错误
logo.png                         # 应该在 assets/
background.jpg                   # 应该在 assets/
```

### ✅ 正确的文件位置
```bash
# 文档在合适目录
docs/features/new-feature.md
docs/reports/debug-report.md

# 测试文件在测试目录
tests/unit/test-new-feature.js
tests/integration/helper.test.js

# 脚本文件在脚本目录
scripts/deploy.sh
scripts/backup-data.sh

# 资源文件在资源目录
assets/images/logo.png
assets/images/background.jpg
```

---

## 🔧 自动化检查

### Pre-commit Hook
每次提交前自动运行：
```bash
# 检查文档位置
bash scripts/check-docs-location.sh

# 检查文件位置
bash scripts/check-file-placement.sh
```

### 手动检查命令
```bash
# 检查文件位置规范
npm run verify:file-placement

# 检查文档位置规范
npm run verify:docs-location

# 检查页面健康状态
npm run verify:pages:simple
```

### 检查结果示例

#### ✅ 通过示例
```
🔍 检查文件目录规范...
================================
📋 检查暂存文件：
  - docs/features/new-feature.md
  - tests/unit/test-feature.js

🔍 验证文件位置：

✅ 所有文件位置符合规范 (共检查 2 个文件)
```

#### ❌ 失败示例
```
🔍 检查文件目录规范...
================================
📋 检查暂存文件：
  - new-feature.md
  - test.js

🔍 验证文件位置：
  ❌ new-feature.md (文档应在docs/子目录)
  ❌ test.js (测试文件应在tests/或e2e/目录)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
❌ 文件目录规范检查失败
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

发现 2 个文件位置违规 (共检查 2 个文件)
```

---

## 💡 最佳实践

### 1. 创建文件前先思考
- 这个文件是什么类型？
- 它应该属于哪个目录？
- 是否有现有的合适目录？

### 2. 使用 `git mv` 移动文件
```bash
# 保留历史记录的文件移动
git mv wrong-location.md docs/features/correct-location.md
```

### 3. 更新相关引用
移动文件后，检查并更新所有引用该文件的地方。

### 4. 定期清理
每个季度检查一次根目录，确保没有违规文件。

---

## 📞 支持和帮助

### 查看详细规范
- `docs/DIRECTORY_STRUCTURE.md` - 完整目录结构说明
- `.github/copilot-instructions-docs.md` - 开发规范

### 获取帮助
```bash
# 查看所有验证命令
npm run

# 运行完整检查
npm run verify:file-placement
npm run verify:docs-location
npm run verify:pages:simple
```

### 绕过检查 (不推荐)
```bash
# 紧急情况下可以绕过检查
git commit --no-verify
```

---

*规范版本: v1.0*  
*最后更新: 2026-01-24*  
*维护者: MuseumCheck Team*
