# Plan A 迁移 - 快速开始指南

> 🎯 **一键执行**: 使用提供的自动化脚本迁移所有文件

---

## 🚀 快速开始（5 分钟）

### 步骤 1: 备份（必须）
```bash
# 创建 Git 备份点
cd /workspaces/MuseumCheck
git add -A
git commit -m "Backup before Plan A migration"
```

### 步骤 2: 执行迁移
```bash
# 使脚本可执行
chmod +x migrate.sh

# 执行完整迁移（推荐）
bash migrate.sh all

# 或分步执行
bash migrate.sh css      # 仅迁移 CSS
bash migrate.sh js       # 仅迁移 JS
bash migrate.sh html     # 仅更新 HTML 引用
bash migrate.sh verify   # 验证结果
```

### 步骤 3: 测试
```bash
# 启动服务器
python3 -m http.server 8000

# 浏览 http://localhost:8000
# 按 F12 打开开发者工具，检查没有 404 错误
```

---

## 📋 自动脚本做了什么

### migrate.sh 包含的操作：

**CSS 迁移**:
- ✅ style.css
- ✅ achievement-gamification.css  
- ✅ virtual-pet.css

**JS 迁移**:
- ✅ script.js（主应用）
- ✅ achievement-gamification.js
- ✅ admin*.js（所有管理员文件）
- ✅ API 和工具文件（25+ 个）

**HTML 引用更新**:
- ✅ 自动在 18 个 HTML 文件中替换所有引用
- ✅ CSS: `href="style.css"` → `href="css/style.css"`
- ✅ JS: `src="script.js"` → `src="js/script.js"`

**验证**:
- ✅ 检查文件是否正确迁移
- ✅ 统计 css/ 和 js/ 目录中的文件
- ✅ 报告任何错误

---

## 📊 迁移前后对比

### 迁移前（当前结构）
```
/
├── style.css                    (182KB - 根目录)
├── script.js                    (主脚本 - 根目录)
├── achievement-gamification.css (16KB - 根目录)
├── achievement-gamification.js
├── admin*.js (5 个文件)
├── virtual-pet.css
├── ... (25+ 更多 JS 文件在根目录)
└── css/
    └── global-ui.css           (仅有这个)
```

### 迁移后（方案 A 结构）
```
/
├── css/
│   ├── style.css               ✅ 迁移
│   ├── achievement-gamification.css
│   ├── virtual-pet.css
│   └── global-ui.css           (已存在)
├── js/
│   ├── script.js               ✅ 迁移
│   ├── achievement-gamification.js
│   ├── admin*.js (5 个文件)
│   ├── global-ui.js            (已存在)
│   └── ... (20+ 更多文件)
└── 18 × .html 文件 (引用已更新)
```

---

## ✅ 验证清单

执行脚本后，检查以下项目：

### 文件系统
- [ ] `ls css/` 显示 4 个文件
- [ ] `ls js/` 显示 26+ 个文件
- [ ] 根目录中没有 CSS/JS 文件
- [ ] 所有原始 HTML 文件仍在根目录

### 浏览器测试
- [ ] 访问 http://localhost:8000 加载正常
- [ ] 按 F12 打开控制台
- [ ] Console 标签页中没有 404 错误
- [ ] Network 标签页中所有资源都返回 200/304

### 功能测试
- [ ] 菜单按钮 (☰) 可点击
- [ ] 设置按钮 (⚙️) 可点击
- [ ] 博物馆卡片显示正确
- [ ] 样式应用正确（不是纯文本）

---

## 🔧 如果出现问题

### 问题 1: 脚本执行失败
```bash
# 检查脚本权限
chmod +x migrate.sh

# 查看错误信息
bash migrate.sh all 2>&1

# 查看 bash 版本（确保兼容）
bash --version
```

### 问题 2: 404 错误在浏览器中
```bash
# 验证文件是否真的迁移了
ls -la css/style.css
ls -la js/script.js

# 检查 HTML 文件中的引用
grep 'href="css/style.css"' index.html
grep 'src="js/script.js"' index.html

# 如果没有找到，需要手动执行迁移步骤
```

### 问题 3: 需要回滚
```bash
# 使用 Git 回滚到备份点
git reset --hard HEAD~1

# 重新启动服务
python3 -m http.server 8000
```

---

## 📖 详细指南

需要更多详细信息？查看完整的执行指南：
- 📄 [PLAN_A_EXECUTION.md](./docs/architecture/PLAN_A_EXECUTION.md) - 详细的 3 阶段计划
- 📄 [PROJECT_STRUCTURE.md](./docs/architecture/PROJECT_STRUCTURE.md) - 项目结构对比
- 📄 [CSS_JS_DIRECTORY_POSITIONING.md](./docs/architecture/CSS_JS_DIRECTORY_POSITIONING.md) - 目录定位说明

---

## ⏱️ 预期时间

| 操作 | 时间 |
|------|------|
| 备份 | 1 分钟 |
| 运行脚本 | 2-5 分钟 |
| 验证和测试 | 5-10 分钟 |
| **总计** | **10-20 分钟** |

---

## 🎯 下一步

迁移完成后，建议：

1. **验证所有功能** - 测试各个页面和功能
2. **更新开发文档** - 让团队知道新的文件结构
3. **提交变更** - 使用 `git commit`
4. **部署** - 推送到 GitHub Pages

---

## 📞 需要帮助？

如果遇到问题，检查以下内容：

1. 是否在正确的目录？ (`pwd` 应显示 `/workspaces/MuseumCheck`)
2. CSS 和 JS 目录是否存在？ (`ls css/` 和 `ls js/`)
3. 脚本是否有执行权限？ (`chmod +x migrate.sh`)
4. HTML 文件是否被正确更新？ (`grep "css/" *.html`)

---

**准备好了吗？** 

执行以下命令开始迁移：
```bash
cd /workspaces/MuseumCheck
bash migrate.sh all
```

让我知道任何问题！ 🚀
