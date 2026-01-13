# 🧹 项目清理计划

**时间**: 2026-01-12  
**目标**: 移除不需要的文件和功能，精简项目结构  

---

## 🎯 清理范围

### 第1阶段: 立即删除 (强烈推荐)

#### 1. 调试和演示文件
| 文件 | 大小 | 理由 |
|------|------|------|
| `minecraft-images-demo.html` | - | 仅用于演示，非核心功能 |

#### 2. 临时和存档目录
| 路径 | 内容 | 理由 |
|------|------|------|
| `archive/` | 旧QR码等 | 已过期的内容 |
| `tmp/` | 临时文件 | 开发临时文件，不需要提交 |

#### 3. 演示数据
| 文件 | 理由 |
|------|------|
| `minecraft-images.json` | 与 demo 文件关联，仅用于演示 |

#### 4. 重复的配置文件
| 文件 | 原因 |
|------|------|
| `playwright.config.ts` | TypeScript版，已有 `.js` 版本 |

#### 5. 测试工具文件
| 文件 | 理由 |
|------|------|
| `screenshot.js` | 仅在 CI/CD 和测试时使用 |

### 第2阶段: 可选删除 (根据需求)

#### 1. 调试脚本
```
js/debug-mode.js  (可选)
```

#### 2. 开发文档 (根目录 .md 文件)
- `ACHIEVEMENT_POSTER_FIX.md` - 已完成的任务
- `ACHIEVEMENT_POSTER_VERIFICATION.md` - 验证文档
- 等等...

**建议**: 这些文档可移动到 `docs/archive/` 目录

---

## 📊 清理效果

### 删除前
- 根目录文件数: ~270 个
- 项目大小: ~100 MB+ (含 node_modules)

### 删除后
- 根目录文件数: ~260 个
- 减少的文件: ~10 个
- 减少的目录: 2 个

---

## 🚀 执行步骤

### 步骤1: 备份
```bash
git add -A
git commit -m "Backup before cleanup"
```

### 步骤2: 删除第1阶段文件
```bash
# 删除演示文件
rm minecraft-images-demo.html minecraft-images.json

# 删除临时目录
rm -rf archive tmp

# 删除重复配置
rm playwright.config.ts

# 删除测试工具
rm screenshot.js
```

### 步骤3: 提交清理
```bash
git add -A
git commit -m "chore: cleanup unused demo files and temporary directories

- Remove minecraft-images-demo.html (demo only)
- Remove archive/ directory (obsolete content)
- Remove tmp/ directory (temporary)
- Remove minecraft-images.json (demo data only)
- Remove playwright.config.ts (duplicate, .js version exists)
- Remove screenshot.js (CI/CD tool only)"

git push origin dev
```

---

## ⚠️ 清理前检查

- [ ] 确认 `archive/` 目录中没有重要数据
- [ ] 确认 `tmp/` 目录中没有重要文件
- [ ] 确认 `playwright.config.ts` 不被其他地方引用
- [ ] 备份已创建 (`git commit`)

---

## 📋 验证清理完成

删除后验证:
```bash
# 检查文件是否已删除
ls -la minecraft-images-demo.html 2>&1  # 应显示 "No such file"
ls -d archive 2>&1                       # 应显示 "No such file"
ls -d tmp 2>&1                           # 应显示 "No such file"

# 启动服务测试
python3 -m http.server 8000
# 访问 http://localhost:8000
```

---

## 🔄 可选的进一步清理

### 整理开发文档
将完成的任务文档移动到 `docs/archive/`:
```bash
mkdir -p docs/archive
mv ACHIEVEMENT_POSTER_FIX.md docs/archive/
mv ACHIEVEMENT_POSTER_VERIFICATION.md docs/archive/
# ... 其他已完成的文档
```

### 清理根目录
建议最终保留在根目录的文件:
```
/
├── index.html          # 主应用
├── *.html              # 其他应用页面
├── package.json        # 项目配置
├── CNAME              # GitHub Pages 配置
├── README.md          # 项目说明
├── CHANGELOG.md       # 更新日志
├── .gitignore         # Git 配置
├── css/               # 样式目录
├── js/                # 脚本目录
├── assets/            # 资源目录
├── docs/              # 文档目录
├── tests/             # 测试目录
└── ... (其他必需目录)
```

---

## ✅ 清理清单

### 第1阶段 (必须)
- [ ] 删除 `minecraft-images-demo.html`
- [ ] 删除 `minecraft-images.json`
- [ ] 删除 `archive/` 目录
- [ ] 删除 `tmp/` 目录
- [ ] 删除 `playwright.config.ts`
- [ ] 删除 `screenshot.js`
- [ ] 提交变更
- [ ] 验证应用正常运行

### 第2阶段 (可选)
- [ ] 删除或移动开发文档
- [ ] 整理根目录结构
- [ ] 更新 .gitignore

---

## 🎉 完成后

应用会更加精简，核心文件更清晰。主要功能不受影响，只是移除了：
- ✅ 演示文件
- ✅ 临时文件
- ✅ 重复配置
- ✅ 过期存档

预计这次清理能让项目看起来更专业、更易维护！

