# 方案 A 执行计划 - CSS 和 JS 目录迁移

## 决策确认

✅ **已选择方案 A：分页面 + 分类型**

```
/
├── index.html
├── museum-checkin.html
├── settings.html
├── achievements.html
├── ... 其他 HTML
│
├── css/                    # 所有 CSS 文件
│   ├── global-ui.css       # ✅ 已在
│   ├── style.css           # 待迁移
│   ├── achievement-gamification.css  # 待迁移
│   ├── virtual-pet.css     # 待迁移
│   └── ... 其他 CSS
│
├── js/                     # 所有 JS 文件
│   ├── global-ui.js        # ✅ 已在
│   ├── script.js           # 待迁移
│   ├── achievement-gamification.js   # 待迁移
│   ├── admin-*.js          # 待迁移
│   ├── letmetry-cloud-api.js         # 待迁移
│   └── ... 其他 JS
│
├── assets/
│   ├── images/
│   ├── audio/
│   └── qrcodes/
│
├── core/
├── docs/
└── 配置文件
```

---

## 第一阶段：准备工作（今天）

### 1.1 创建迁移清单

**需要迁移的 CSS 文件：**
```
根目录 → css/
├── style.css (182KB)                    优先级: 🔴 高
├── achievement-gamification.css (16KB)  优先级: 🟡 中
└── virtual-pet.css (36KB)               优先级: 🟡 中

总计：234KB，3 个文件
```

**需要迁移的 JS 文件：**
```
根目录 → js/
├── script.js                            优先级: 🔴 高
├── achievement-gamification.js (32KB)   优先级: 🟡 中
├── admin.js (11KB)                      优先级: 🟢 低
├── admin-fireworks.js (17KB)            优先级: 🟢 低
├── admin-leaderboard.js (12KB)          优先级: 🟢 低
├── admin-everyone-achievements.js       优先级: 🟢 低
├── assessment-integration-fix.js        优先级: 🟡 中
├── baidu-image-search.js (11KB)         优先级: 🟢 低
├── deepseek-api.js (5.6KB)              优先级: 🟢 低
├── event-wall-service.js (7KB)          优先级: 🟢 低
├── everyone-achievements.js (45KB)      优先级: 🔴 高
├── firework.js (2.5KB)                  优先级: 🟢 低
├── image-*.js (多个)                    优先级: 🟢 低
├── letmetry-cloud-api.js                优先级: 🟡 中
├── museum-data-loader.js                优先级: 🟡 中
├── museum-mcp-server.js                 优先级: 🟢 低
└── ... 其他

总计：25+ 个文件
```

### 1.2 需要更新 HTML 引用的文件

**受影响的 HTML 文件（18 个）：**
```
根目录 HTML 文件：
├── index.html                    ← style.css, script.js 引用
├── museum-checkin.html          ← style.css, script.js 引用
├── settings.html                ← 可能有 CSS/JS 引用
├── achievements.html            ← achievement-*.css/.js 引用
├── fireworks-wall.html          ← 可能有多个引用
├── fireworks.html               ← 可能有多个引用
├── event-wall.html              ← 可能有多个引用
├── treasures.html               ← 可能有多个引用
├── everyone-achievements.html   ← achievement-*.css/.js 引用
├── admin.html                   ← admin.js, style.css 引用
├── admin-fireworks.html         ← admin-fireworks.js 引用
├── admin-leaderboard.html       ← admin-leaderboard.js 引用
├── admin-treasure-reports.html  ← 可能有多个引用
├── admin-everyone-achievements.html ← admin-everyone-achievements.js 引用
├── museum-data-manager.html     ← 可能有多个引用
├── simple.html                  ← 可能有多个引用
└── test-new-architecture.html   ← 可能有多个引用
```

---

## 第二阶段：迁移执行计划

### 阶段 2.1：最关键大文件（优先级 🔴 高）

**时间估算：2-3 小时**

#### Step 1: 迁移 style.css

```bash
# 1. 将文件移到 css/
mv style.css css/

# 2. 验证文件完整性
ls -lh css/style.css
```

#### Step 2: 更新所有 HTML 中的 style.css 引用

需要搜索替换（在所有 18 个 HTML 文件中）：

**搜索：** `href="style.css"`
**替换为：** `href="css/style.css"`

**搜索：** `href='style.css'`
**替换为：** `href='css/style.css'`

**影响的 HTML 文件：**
```
index.html
museum-checkin.html
settings.html
achievements.html
fireworks-wall.html
fireworks.html
event-wall.html
treasures.html
everyone-achievements.html
admin.html
admin-fireworks.html
admin-leaderboard.html
admin-treasure-reports.html
admin-everyone-achievements.html
museum-data-manager.html
simple.html
test-new-architecture.html
```

#### Step 3: 测试

```bash
# 启动 HTTP 服务器
python3 -m http.server 8000

# 在浏览器打开 http://localhost:8000
# 检查样式是否正常加载（无 404 错误）
# 验证页面布局正确
```

**检查清单：**
- [ ] 主页样式正确加载
- [ ] 打卡页面样式正确加载
- [ ] 所有其他页面样式正确加载
- [ ] 浏览器控制台无 CSS 404 错误
- [ ] 响应式设计在移动设备上正常工作

---

#### Step 4: 迁移 script.js

```bash
# 1. 将文件移到 js/
mv script.js js/

# 2. 验证文件完整性
ls -lh js/script.js
```

#### Step 5: 更新所有 HTML 中的 script.js 引用

需要搜索替换：

**搜索：** `src="script.js"`
**替换为：** `src="js/script.js"`

**搜索：** `src='script.js'`
**替换为：** `src='js/script.js'`

#### Step 6: 测试

```bash
# 在浏览器中进行完整功能测试
# 检查 JavaScript 是否正常加载和执行
```

**检查清单：**
- [ ] 菜单按钮能打开/关闭菜单
- [ ] 设置按钮能打开/关闭设置
- [ ] 博物馆卡片能点击打开模态框
- [ ] 浏览器控制台无 JS 404 错误或 JS 错误
- [ ] 所有交互功能正常

---

#### Step 7: 迁移 everyone-achievements.js

```bash
mv everyone-achievements.js js/
# 更新相关 HTML 引用
```

---

### 阶段 2.2：成就相关文件（优先级 🟡 中）

**时间估算：1-2 小时**

#### Step 1-7: 重复上述步骤

```bash
# 迁移文件
mv achievement-gamification.css css/
mv achievement-gamification.js js/

# 更新引用（在 HTML 中搜索替换）
# 搜索：achievement-gamification.
# 替换为：css/achievement-gamification. 或 js/achievement-gamification.
```

**需要更新的 HTML 文件：**
- achievements.html
- everyone-achievements.html
- admin-everyone-achievements.html

---

#### 迁移其他中等优先级文件

```bash
# 迁移其他 JS 文件
mv assessment-integration-fix.js js/
mv baidu-image-search.js js/
mv deepseek-api.js js/
mv event-wall-service.js js/
mv letmetry-cloud-api.js js/
mv museum-data-loader.js js/

# 迁移其他 CSS 文件
mv virtual-pet.css css/
```

**需要搜索和更新的引用：**
- 每个文件在 HTML 中的引用
- 任何 JS 文件中的相对 import 路径

---

### 阶段 2.3：管理工具文件（优先级 🟢 低）

**时间估算：1-2 小时**

```bash
# 迁移所有管理相关 JS
mv admin.js js/
mv admin-fireworks.js js/
mv admin-leaderboard.js js/
mv admin-everyone-achievements.js js/

# 迁移其他功能 JS
mv firework.js js/
mv image-fallback-config.js js/
mv image-loader-util.js js/
mv image-proxy-helper.js js/
mv image-upload-util.js js/
mv museum-mcp-server.js js/
# ... 其他 JS 文件
```

**更新相关 HTML 文件：**
- admin.html
- admin-fireworks.html
- admin-leaderboard.html
- admin-treasure-reports.html
- admin-everyone-achievements.html

---

## 第三阶段：验收和清理

### 3.1 完整功能测试

```
✅ 通过以下完整测试后才算完成：

页面加载：
□ 首页加载无错误
□ 打卡页面加载无错误
□ 所有其他 18 页都能加载

样式加载：
□ 所有 CSS 文件 200 OK（无 404）
□ 页面布局和颜色正确
□ 响应式设计工作正常

功能测试：
□ 菜单打开/关闭
□ 设置打开/关闭
□ 博物馆卡片点击
□ 成就系统工作
□ 所有管理页面工作
□ 所有交互正常

浏览器控制台：
□ 无任何 404 错误
□ 无任何 JS 运行错误
□ 无任何警告（可选）
```

### 3.2 验证文件完整性

```bash
# 检查所有文件是否都已迁移
echo "=== CSS 文件 ==="
ls -lh css/ | wc -l
find . -maxdepth 1 -name "*.css" | wc -l  # 应该为 0

echo "=== JS 文件 ==="
ls -lh js/ | wc -l
find . -maxdepth 1 -name "*.js" ! -name "screenshot.js" | wc -l  # 应该为 0
```

### 3.3 根目录清理

迁移完成后，根目录应该只有：
```
/
├── .git/
├── .github/
├── .gitignore
├── package.json
├── CNAME
├── README.md
├── index.html
├── museum-checkin.html
├── settings.html
├── achievements.html
├── ... 其他 HTML
│
├── css/          ← ✅ 所有 CSS 都在这里
├── js/           ← ✅ 所有 JS 都在这里
├── assets/
├── core/
├── docs/
└── ... 其他必要目录
```

---

## 搜索和替换模板

### CSS 引用更新模板

```
全局搜索（在所有 HTML 文件中）：

href="style.css"                    → href="css/style.css"
href='style.css'                    → href='css/style.css'
href="achievement-gamification.css" → href="css/achievement-gamification.css"
href="virtual-pet.css"              → href="css/virtual-pet.css"
```

### JS 引用更新模板

```
全局搜索（在所有 HTML 文件中）：

src="script.js"                     → src="js/script.js"
src='script.js'                     → src='js/script.js'
src="achievement-gamification.js"   → src="js/achievement-gamification.js"
src="admin.js"                      → src="js/admin.js"
src="admin-fireworks.js"            → src="js/admin-fireworks.js"
src="admin-leaderboard.js"          → src="js/admin-leaderboard.js"
... 其他类似
```

---

## 风险和对策

| 风险 | 影响 | 对策 |
|------|------|------|
| 遗漏某个 HTML 文件 | 页面加载失败 | 完整列表检查 |
| 相对路径错误 | 资源 404 | 测试所有页面 |
| 动态 JS 加载路径 | JS 模块加载失败 | 搜索所有 JS 文件中的相对路径 |
| CSS 中的 @import | 导入失败 | 检查所有 CSS 中的相对路径 |

---

## 时间估算

| 阶段 | 工作 | 时间 |
|------|------|------|
| 准备 | 创建清单，分析依赖 | 30 分钟 |
| 2.1 | 迁移核心文件 (style.css, script.js) | 2-3 小时 |
| 2.2 | 迁移成就相关 | 1-2 小时 |
| 2.3 | 迁移管理和其他工具 | 1-2 小时 |
| 3 | 验收和清理 | 1-2 小时 |
| **总计** | | **6-9 小时** |

**建议分开两天完成：**
- Day 1: 阶段 2.1 + 2.2 (3-5 小时)
- Day 2: 阶段 2.3 + 3 (3-4 小时)

---

## 后续建立的规范

迁移完成后，需要在开发指南中添加：

```markdown
## 文件放置规范

### CSS 文件
- 所有 CSS 文件放在 `css/` 目录下
- 新增 CSS 文件命名规则：`[功能名]-[功能名].css`
  - 例：`achievement-gamification.css`

### JS 文件
- 所有 JS 文件放在 `js/` 目录下
- 新增 JS 文件命名规则：`[功能名]-[功能名].js`
  - 例：`admin-fireworks.js`

### 目录结构
```
/
├── index.html, *.html          HTML 页面
├── css/                        所有样式
├── js/                         所有逻辑
├── assets/                     资源文件
├── core/                       核心逻辑
├── docs/                       文档
└── 配置文件
```

### 引用方式
```html
<!-- CSS -->
<link rel="stylesheet" href="css/style.css">

<!-- JS -->
<script src="js/script.js"></script>
```
```

---

## 立即行动

✅ **今天可以做：**

1. 确认这个计划是否完整
2. 选择从哪个阶段开始
3. 我可以帮助自动化迁移流程

需要我帮助自动化文件迁移吗？我可以写一个脚本来处理批量移动和路径更新。

