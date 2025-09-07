# 开发环境设置 🛠️

这份指南将帮助开发者快速设置 MuseumCheck 的本地开发环境。

## 📋 前置要求

### 必需软件
- **Python 3.6+** - 用于本地HTTP服务器
- **Node.js 14+** - 用于运行测试和工具
- **Git** - 版本控制
- **现代代码编辑器** - 推荐 VS Code

### 推荐软件
- **VS Code** - 优秀的 Web 开发支持
- **Chrome DevTools** - 调试和性能分析
- **GitHub Desktop** - Git 图形界面（可选）

## 🚀 快速开始

### 1. 克隆项目
```bash
# 克隆仓库
git clone https://github.com/jackandking/MuseumCheck.git
cd MuseumCheck

# 查看项目结构
ls -la
```

### 2. 启动本地服务器
```bash
# 使用 Python HTTP 服务器（推荐）
python3 -m http.server 8000

# 或者使用 Node.js http-server
npm install -g http-server
http-server -p 8000
```

### 3. 访问应用
在浏览器中打开：http://localhost:8000

### 4. 验证功能
- 选择年龄组
- 点击博物馆卡片
- 测试任务勾选功能
- 检查数据持久化

## 📁 项目结构

```
MuseumCheck/
├── README.md              # 项目说明文档
├── index.html             # 主HTML文件
├── script.js              # 核心JavaScript逻辑
├── style.css              # 样式表
├── TESTING_GUIDE.md       # 测试指南
├── VERSION_MANAGEMENT.md  # 版本管理指南
├── validate-version.js    # 版本验证脚本
├── package.json           # Node.js依赖和脚本
├── .gitignore             # Git忽略文件
├── CNAME                  # GitHub Pages域名配置
├── robots.txt             # 搜索引擎爬虫配置
├── sitemap.xml            # 网站地图
├── wiki/                  # Wiki文档目录
│   ├── Home.md            # Wiki首页
│   ├── User-Guide.md      # 用户指南
│   ├── Features.md        # 功能详解
│   └── ...                # 其他Wiki页面
├── tests/                 # 测试文件目录
│   ├── setup.js           # 测试环境配置
│   ├── core.test.js       # 核心功能测试
│   └── regression.test.js # 回归测试
└── .github/               # GitHub配置
    ├── copilot-instructions.md  # Copilot指令
    └── workflows/         # CI/CD工作流
```

## 🧪 测试环境

### 安装测试依赖
```bash
# 安装Jest和相关依赖
npm install

# 验证安装
npm test --version
```

### 运行测试
```bash
# 运行所有测试
npm test

# 运行测试并查看覆盖率
npm run test:coverage

# 监视模式（开发时推荐）
npm run test:watch

# 运行特定测试文件
npx jest tests/core.test.js
```

### 测试文件说明
- **setup.js** - 测试环境配置和模拟
- **core.test.js** - 核心功能单元测试
- **regression.test.js** - 回归测试，防止已修复的bug再次出现

## 🔧 开发工具配置

### VS Code 设置

**推荐扩展：**
```json
{
  "recommendations": [
    "ms-vscode.vscode-json",
    "bradlc.vscode-tailwindcss",
    "esbenp.prettier-vscode",
    "ms-vscode.vscode-eslint",
    "ritwickdey.liveserver"
  ]
}
```

**工作区设置 (.vscode/settings.json)：**
```json
{
  "editor.tabSize": 2,
  "editor.insertSpaces": true,
  "files.encoding": "utf8",
  "files.eol": "\n",
  "editor.formatOnSave": true,
  "emmet.includeLanguages": {
    "javascript": "javascriptreact"
  }
}
```

### 浏览器开发者工具

**Chrome DevTools 配置：**
1. 打开开发者工具 (F12)
2. 设置 → Preferences → Network → Disable cache (while DevTools is open)
3. Console → Settings → Show timestamps
4. Application → Local Storage → 查看数据存储

**调试技巧：**
- 使用 Console 面板调试 JavaScript
- Network 面板监控资源加载
- Application 面板查看 localStorage 数据
- Performance 面板分析性能瓶颈

## 📝 开发流程

### 1. 功能开发
```bash
# 创建功能分支
git checkout -b feature/your-feature-name

# 开发和测试
# ... 编码 ...

# 运行测试确保质量
npm test

# 提交变更
git add .
git commit -m "Add: your feature description"
```

### 2. 版本管理
```bash
# 更新版本信息（编辑 script.js 中的 RECENT_CHANGES）
# 验证版本一致性
node validate-version.js

# 如有问题，按提示修复
```

### 3. 代码质量检查
```bash
# 运行所有测试
npm test

# 检查测试覆盖率
npm run test:coverage

# 手动测试核心功能
python3 -m http.server 8000
# 在浏览器中测试
```

### 4. 文档更新
- 更新相关的 Wiki 页面
- 更新 README.md（如需要）
- 添加版本更新日志

## 🐛 调试指南

### 常见问题排查

**应用无法加载：**
```bash
# 检查HTTP服务器是否正常启动
curl http://localhost:8000

# 检查文件权限
ls -la index.html

# 查看浏览器控制台错误
# F12 → Console
```

**localStorage 不工作：**
```javascript
// 在浏览器控制台中检查
console.log(localStorage.getItem('visitedMuseums'));
console.log(localStorage.getItem('museumChecklists'));

// 清除 localStorage 数据
localStorage.clear();
```

**测试失败：**
```bash
# 查看详细测试输出
npm test -- --verbose

# 运行特定测试
npx jest --testNamePattern="localStorage"

# 调试模式运行测试
node --inspect-brk node_modules/.bin/jest --runInBand
```

### 日志和监控

**JavaScript 日志：**
```javascript
// 在代码中添加调试日志
console.log('Debug info:', variable);
console.error('Error occurred:', error);

// 使用断点调试
debugger; // 在 DevTools 中会暂停执行
```

**性能监控：**
```javascript
// 测量函数执行时间
console.time('functionName');
// ... 你的代码 ...
console.timeEnd('functionName');
```

## 🔨 构建和部署

### 本地预览
```bash
# 启动本地服务器
python3 -m http.server 8000

# 在浏览器中预览
open http://localhost:8000
```

### 部署到 GitHub Pages
```bash
# 推送到主分支会自动部署
git push origin main

# 检查部署状态
# 访问 GitHub → Actions 查看部署流程
```

### 自定义域名
项目使用 `museumcheck.cn` 域名，配置在 `CNAME` 文件中。

## 📚 参考资料

### 核心技术文档
- [HTML5 规范](https://html.spec.whatwg.org/)
- [CSS3 参考](https://developer.mozilla.org/en-US/docs/Web/CSS)
- [JavaScript ES6+ 特性](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
- [Web Storage API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API)

### 测试相关
- [Jest 文档](https://jestjs.io/docs/getting-started)
- [JavaScript 测试最佳实践](https://github.com/goldbergyoni/javascript-testing-best-practices)

### 性能优化
- [Web 性能优化指南](https://developers.google.com/web/fundamentals/performance)
- [Chrome DevTools 性能分析](https://developers.google.com/web/tools/chrome-devtools/performance)

## 🤝 贡献指南

### 代码风格
- 使用 2 空格缩进
- 优先使用 const 和 let，避免 var
- 函数和变量使用驼峰命名
- 注释使用中文，代码使用英文

### 提交规范
```
类型: 简短描述

详细描述（可选）

- 修复了 xxx 问题
- 添加了 xxx 功能
- 改进了 xxx 性能
```

类型包括：
- **Add**: 新增功能
- **Fix**: 修复问题
- **Update**: 更新内容
- **Improve**: 性能改进
- **Refactor**: 代码重构

### Pull Request 流程
1. Fork 项目
2. 创建功能分支
3. 完成开发和测试
4. 提交 Pull Request
5. 等待代码审查

---

**开发环境配置完成！现在可以开始贡献代码了！** 🚀