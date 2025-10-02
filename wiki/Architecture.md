# 项目架构 🏗️

这份文档详细介绍了博物馆打卡项目的技术架构、代码结构和设计决策。

## 🎯 架构概览

### 技术栈
- **前端：** 纯HTML、CSS、JavaScript (ES6+)
- **存储：** 浏览器 localStorage
- **部署：** GitHub Pages
- **测试：** Jest + jsdom
- **版本控制：** Git + GitHub

### 架构原则
- **简约优先：** 避免过度工程化
- **用户体验：** 响应式设计，快速加载
- **隐私保护：** 本地存储，无服务器收集
- **可维护性：** 模块化代码，完整测试覆盖

## 📁 文件结构

```
MuseumCheck/
├── 🌐 前端资源
│   ├── index.html          # 主页面 (10KB)
│   ├── script.js           # 核心逻辑 (393KB)
│   └── style.css           # 样式表 (16KB)
│
├── 📚 文档系统
│   ├── README.md           # 项目说明
│   ├── TESTING_GUIDE.md    # 测试指南
│   └── wiki/              # Wiki文档目录
│       ├── Home.md         # Wiki首页
│       ├── User-Guide.md   # 用户指南
│       ├── Features.md     # 功能详解
│       ├── FAQ.md          # 常见问题
│       ├── Development-Setup.md # 开发环境
│       ├── Contributing.md # 贡献指南
│       ├── Architecture.md # 项目架构
│       └── Marketing.md    # 营销内容
│
├── 🧪 测试系统
│   ├── package.json        # 依赖配置
│   └── tests/
│       ├── setup.js        # 测试环境配置
│       ├── core.test.js    # 核心功能测试
│       └── regression.test.js # 回归测试
│
├── 🛠️ 工具和配置
│   ├── .gitignore         # Git忽略配置
│   ├── robots.txt         # 搜索引擎配置
│   └── sitemap.xml        # 网站地图
│
├── 🚀 部署配置
│   └── CNAME              # 自定义域名配置
│
└── 📝 营销内容
    ├── 短视频文案_故宫博物院.md
    └── 短视频文案_中国国家博物馆.md
```

## 🧩 代码架构

### 核心模块 (script.js)

#### 1. 数据层
```javascript
// 博物馆数据库 (258家博物馆)
const MUSEUMS = [
    {
        id: 'forbidden-city',
        name: '故宫博物院',
        location: '北京',
        description: '...',
        tags: ['历史', '建筑', '文物'],
        checklists: {
            parent: {
                '3-6': [...],
                '7-12': [...],
                '13-18': [...]
            },
            child: {
                '3-6': [...],
                '7-12': [...],
                '13-18': [...]
            }
        }
    },
    // ... 其他119家博物馆
];
```

#### 2. 状态管理
```javascript
// 全局状态
let currentAgeGroup = '7-12';
let visitedMuseums = [];
let museumChecklists = {};

// 状态初始化
function initializeApp() {
    loadUserData();
    setupEventListeners();
    updateDisplay();
}

// 数据持久化
function saveUserData() {
    localStorage.setItem('visitedMuseums', JSON.stringify(visitedMuseums));
    localStorage.setItem('museumChecklists', JSON.stringify(museumChecklists));
}
```

#### 3. 用户界面层
```javascript
// DOM 操作
function updateMuseumGrid() {
    const grid = document.getElementById('museumGrid');
    grid.innerHTML = generateMuseumCards();
}

// 事件处理
function setupEventListeners() {
    document.getElementById('ageGroup').addEventListener('change', handleAgeGroupChange);
    // ... 其他事件监听器
}

// 模态框管理
function openMuseumModal(museumId) {
    const modal = document.getElementById('museumModal');
    modal.classList.remove('hidden');
    renderMuseumDetails(museumId);
}
```

#### 4. 业务逻辑层
```javascript
// 清单管理
function toggleChecklistItem(museumId, listType, ageGroup, index) {
    const key = `${museumId}-${listType}-${ageGroup}`;
    if (!museumChecklists[key]) {
        museumChecklists[key] = [];
    }
    // 切换完成状态
    const itemIndex = museumChecklists[key].indexOf(index);
    if (itemIndex > -1) {
        museumChecklists[key].splice(itemIndex, 1);
    } else {
        museumChecklists[key].push(index);
    }
    saveUserData();
}

// 进度计算
function calculateProgress() {
    const totalMuseums = MUSEUMS.length;
    const visitedCount = visitedMuseums.length;
    return {
        count: visitedCount,
        total: totalMuseums,
        percentage: ((visitedCount / totalMuseums) * 100).toFixed(1)
    };
}
```

### 样式架构 (style.css)

#### 1. CSS 变量系统
```css
:root {
    /* 主色调 */
    --primary-color: #d32f2f;
    --secondary-color: #f57c00;
    --accent-color: #1976d2;
    
    /* 中性色 */
    --text-primary: #212121;
    --text-secondary: #757575;
    --background: #fafafa;
    
    /* 间距系统 */
    --spacing-xs: 4px;
    --spacing-sm: 8px;
    --spacing-md: 16px;
    --spacing-lg: 24px;
    --spacing-xl: 32px;
    
    /* 字体大小 */
    --font-xs: 12px;
    --font-sm: 14px;
    --font-md: 16px;
    --font-lg: 18px;
    --font-xl: 24px;
}
```

#### 2. 响应式布局
```css
/* 移动优先设计 */
.museum-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: var(--spacing-md);
}

/* 平板适配 */
@media (min-width: 768px) {
    .museum-grid {
        grid-template-columns: repeat(2, 1fr);
    }
}

/* 桌面适配 */
@media (min-width: 1024px) {
    .museum-grid {
        grid-template-columns: repeat(3, 1fr);
    }
}
```

#### 3. 组件样式
```css
/* 博物馆卡片 */
.museum-card {
    background: white;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    padding: var(--spacing-lg);
    transition: transform 0.2s ease;
}

.museum-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 16px rgba(0,0,0,0.15);
}

/* 模态框 */
.modal {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0,0,0,0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
}
```

## 🔄 数据流架构

### 数据流向
```
用户操作 → 事件处理 → 状态更新 → localStorage → 界面重渲染
```

### 具体流程

#### 1. 应用启动
```
1. 页面加载 → DOMContentLoaded
2. 初始化应用 → initializeApp()
3. 从 localStorage 加载数据 → loadUserData()
4. 渲染初始界面 → updateMuseumGrid()
5. 绑定事件监听器 → setupEventListeners()
```

#### 2. 用户交互
```
年龄组选择：
用户选择 → change事件 → handleAgeGroupChange() → 
更新全局状态 → 重新渲染博物馆网格 → 保存偏好

博物馆点击：
点击卡片 → click事件 → openMuseumModal() → 
获取博物馆数据 → 渲染模态框内容 → 显示详情

任务勾选：
勾选任务 → change事件 → toggleChecklistItem() → 
更新完成状态 → 保存到localStorage → 更新界面
```

#### 3. 数据持久化
```
状态变更 → saveUserData() → localStorage.setItem() → 
浏览器本地存储 → 下次访问时恢复状态
```

## 🚀 性能优化

### 加载性能
- **代码分割：** 单文件架构避免网络请求开销
- **资源压缩：** CSS/JS文件结构优化
- **缓存策略：** 浏览器缓存和localStorage
- **懒加载：** 模态框内容按需渲染

### 运行时性能
- **DOM操作优化：** 批量更新，避免频繁重排
- **事件委托：** 减少事件监听器数量
- **内存管理：** 及时清理不需要的引用
- **算法优化：** 高效的数据查找和过滤

### 数据存储优化
```javascript
// 高效的数据结构
const museumMap = new Map();
MUSEUMS.forEach(museum => {
    museumMap.set(museum.id, museum);
});

// 快速查找
function findMuseum(id) {
    return museumMap.get(id);
}

// 压缩存储
function compressData(data) {
    return JSON.stringify(data);
}
```

## 🔒 安全考虑

### 数据安全
- **本地存储：** 数据不离开用户设备
- **XSS防护：** innerHTML使用严格验证
- **隐私保护：** 不收集任何个人信息

### 代码安全
```javascript
// 输入验证
function sanitizeInput(input) {
    return input.replace(/[<>\"']/g, '');
}

// 安全的DOM操作
function setTextContent(element, text) {
    element.textContent = sanitizeInput(text);
}
```

## 🧪 测试架构

### 测试策略
- **单元测试：** 核心功能逻辑测试
- **集成测试：** 组件间交互测试
- **回归测试：** 防止已修复bug复现
- **手动测试：** 用户界面和体验测试

### 测试环境配置
```javascript
// Jest配置 (package.json)
{
  "testEnvironment": "jsdom",
  "setupFilesAfterEnv": ["./tests/setup.js"],
  "collectCoverageFrom": ["script.js"],
  "coverageThreshold": {
    "global": {
      "branches": 70,
      "functions": 70,
      "lines": 70,
      "statements": 70
    }
  }
}
```

### Mock和模拟
```javascript
// localStorage 模拟
const localStorageMock = (() => {
    let store = {};
    return {
        getItem: jest.fn(key => store[key] || null),
        setItem: jest.fn((key, value) => store[key] = value),
        clear: jest.fn(() => store = {}),
        removeItem: jest.fn(key => delete store[key])
    };
})();
```



## 🌐 部署架构

### GitHub Pages部署
```
GitHub Repository → Actions Workflow → 
GitHub Pages → CDN → 用户浏览器
```

### 自定义域名
```
museumcheck.cn → CNAME配置 → 
GitHub Pages → SSL证书 → HTTPS访问
```

### CI/CD流程（规划中）
```yaml
# .github/workflows/deploy.yml
name: Deploy to GitHub Pages
on:
  push:
    branches: [ main ]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v2
    - name: Run tests
      run: npm test
    - name: Deploy to Pages
      uses: peaceiris/actions-gh-pages@v3
```

## 🔮 架构演进

### 短期优化
- **代码分割：** 将script.js按功能模块拆分
- **构建工具：** 引入Webpack或Vite进行构建优化
- **PWA支持：** 添加Service Worker实现离线访问

### 中期重构
- **TypeScript：** 增强类型安全性
- **状态管理：** 引入Vuex或Redux管理复杂状态
- **组件化：** 使用Vue.js或React重构界面

### 长期规划
- **微服务架构：** 后端API和前端分离
- **数据库：** 支持用户账户和云端同步
- **多端支持：** 开发移动端App

---

**当前架构简洁高效，支持快速迭代和功能扩展！** 🏗️✨