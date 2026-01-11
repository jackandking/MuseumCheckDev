# 考一考功能 - 博物馆知识测验系统

## 📋 功能概述

"考一考"是一个为7-12岁儿童设计的博物馆知识测验系统，通过答题的方式巩固博物馆参观知识，获得积分奖励，并具备防沉迷机制。

### 核心特点

- ✅ **自动题库生成**：基于已访问博物馆的数据自动生成题目
- ✅ **积分奖励系统**：答对题目获得积分，连对有额外奖励
- ✅ **防沉迷机制**：7-12岁每日最多30题
- ✅ **错题本功能**：自动收集错题，支持复习
- ✅ **多种答题模式**：每日挑战、随机答题、博物馆专题、错题复习
- ✅ **实时反馈**：答题后立即显示正确答案和知识点解析
- ✅ **统计分析**：记录答题历史、正确率、连胜记录等

## 🎯 用户流程

### 1. 进入答题页面

从主页点击 🎓 按钮进入答题首页

### 2. 选择答题模式

- **每日挑战**：5题快速挑战，完成获得50积分
- **随机答题**：从所有已访问博物馆中随机出题
- **博物馆专题**：选择特定博物馆进行专项答题
- **错题复习**：复习之前答错的题目

### 3. 答题过程

- 阅读题目和选项
- 选择答案
- 提交后立即看到反馈
- 查看知识点解析
- 自动跳转到下一题（3秒倒计时）

### 4. 查看结果

- 答题完成后显示成绩总结
- 包括正确率、获得积分、连胜记录等
- 高分会有特殊动画效果

## 🏗️ 技术架构

### 目录结构

```
quiz/                       # Self-contained quiz module
├── index.html              # 答题首页
├── session.html            # 答题会话页面
├── result.html             # 结果页面
├── wrong-questions.html    # 错题本
├── README.md               # Module documentation
├── css/
│   └── quiz-style.css      # 答题页面样式
└── js/
    ├── points-manager.js   # 统一积分管理
    ├── quiz-data.js        # 题库数据管理
    ├── quiz-engine.js      # 答题引擎核心
    ├── quiz-statistics.js  # 统计分析
    ├── quiz-limit.js       # 防沉迷限制
    └── quiz-ui.js          # UI辅助函数
```

### 架构设计原则

本模块采用**自包含架构**（Self-Contained Architecture）：

- ✅ **高内聚**：相关功能集中在一个目录
- ✅ **低耦合**：最小化外部依赖
- ✅ **清晰边界**：模块范围明确定义
- ✅ **易于维护**：变更局限在模块内部
- ✅ **样式隔离**：CSS与页面代码靠近，避免样式冲突

### 外部依赖

仅依赖两个核心模块：
- `museums-data.js` - 博物馆元数据（用于生成题目）
- `achievement-gamification.js` - 成就系统（通过PointsManager集成）

### 核心模块

#### 1. PointsManager (积分管理器)

统一管理所有积分来源，与现有的 `achievement-gamification.js` 系统集成。

```javascript
// 获取当前积分
const points = PointsManager.getPoints();

// 添加积分
PointsManager.addPoints(10, 'quiz', { mode: 'daily' });

// 消耗积分
PointsManager.spendPoints(5, 'skip_question');
```

#### 2. QuizData (题库管理)

从 `museums-data.js` 自动生成题目，包括：

- **基础信息题**：博物馆位置、类型
- **藏品题**：镇馆之宝名称、特征
- **历史题**：相关历史事件
- **判断题**：基于以上信息生成

```javascript
// 为特定博物馆生成题目
const questions = QuizData.generateQuestionsForMuseum('forbidden-city', '7-12');

// 获取随机题目
const randomQuestions = QuizData.getRandomQuestions(10, '7-12');
```

#### 3. QuizEngine (答题引擎)

管理答题会话、检查答案、记录错题。

```javascript
const engine = new QuizEngine();

// 开始新会话
engine.startSession('forbidden-city', '7-12', 'normal');

// 提交答案
const result = engine.submitAnswer(0); // 选项索引

// 完成会话
const finalResult = engine.completeSession();
```

#### 4. QuizLimit (防沉迷)

控制每日答题数量，防止过度使用。

```javascript
// 检查每日限制
const limit = QuizLimit.checkDailyLimit('7-12');
// { limit: 30, answered: 5, remaining: 25, canAnswer: true }

// 增加答题计数
QuizLimit.incrementDailyCount('7-12');
```

#### 5. QuizStatistics (统计分析)

追踪和分析答题表现。

```javascript
// 获取总体统计
const stats = QuizStatistics.getStatistics();

// 获取今日统计
const today = QuizStatistics.getTodayStatistics();

// 获取表现趋势
const trend = QuizStatistics.getPerformanceTrend();
```

## 📊 数据存储

所有数据使用 localStorage 存储：

### quizHistory
```json
[
  {
    "id": "quiz_1234567890_abc123",
    "museumId": "forbidden-city",
    "mode": "normal",
    "totalQuestions": 10,
    "correctCount": 8,
    "accuracy": "80.0",
    "points": 85,
    "bestStreak": 5,
    "duration": 120,
    "timestamp": 1704931200000
  }
]
```

### quizWrongQuestions
```json
[
  {
    "id": "forbidden-city_location",
    "museumId": "forbidden-city",
    "question": "故宫博物院位于哪个城市？",
    "options": ["北京", "上海", "西安", "南京"],
    "correctAnswer": 0,
    "selectedAnswer": 1,
    "explanation": "故宫博物院位于北京。",
    "wrongCount": 1,
    "lastAttempt": 1704931200000,
    "resolved": false
  }
]
```

### quizDailyLimit
```json
{
  "2024-01-11": {
    "7-12": {
      "count": 15,
      "startTime": 1704931200000,
      "lastUpdate": 1704935000000
    }
  }
}
```

## 🎮 积分规则

### 基础积分
- 简单题目（easy）：10 分
- 中等题目（medium）：15 分
- 困难题目（hard）：20 分

### 额外奖励
- **连对奖励**：连续答对5题额外获得 10 分
- **每日挑战**：完成5题挑战额外获得 50 分
- **错题复习**：复习错题正确可获得 5 分

### 积分扣除
- **跳过题目**：扣除 5 分

## 🛡️ 防沉迷机制

### 年龄分组限制

- **3-6岁**：每天最多 20 题
- **7-12岁**：每天最多 30 题
- **13-18岁**：每天最多 40 题

### 超限处理

- 达到每日限制后弹窗提示
- 可以继续答题学习但不获得积分
- 每日凌晨自动重置计数

## 🎨 UI设计

### 色彩体系

采用活泼明亮的配色，适合7-12岁儿童：

- **主色调**：紫色渐变 (#4F46E5 → #7C3AED)
- **成功色**：绿色 (#10B981)
- **错误色**：红色 (#EF4444)
- **警告色**：橙色 (#F59E0B)
- **背景色**：浅灰 (#F3F4F6)

### 动画效果

- ✅ **答对动画**：弹跳效果
- ❌ **答错动画**：抖动效果
- 🎉 **高分庆祝**：五彩纸屑
- ⭐ **连对反馈**：星星堆叠

### 响应式设计

- 适配手机、平板、桌面
- 按钮足够大，方便触摸
- 字体清晰易读

## 🔧 开发指南

### 添加新题目类型

1. 在 `quiz-data.js` 中添加生成函数
2. 定义题目格式和选项
3. 添加正确答案和解析

```javascript
static generateNewTypeQuestions(museum, ageGroup) {
    const questions = [];
    
    questions.push({
        id: `${museum.id}_new_type`,
        museumId: museum.id,
        type: 'single-choice',
        difficulty: 'medium',
        question: '你的问题',
        options: ['选项1', '选项2', '选项3', '选项4'],
        correctAnswer: 0,
        explanation: '解析说明',
        points: 15,
        tags: ['标签1', '标签2'],
        ageGroup: '7-12'
    });
    
    return questions;
}
```

### 修改积分规则

在 `quiz-engine.js` 的 `submitAnswer` 方法中修改：

```javascript
submitAnswer(answerIndex) {
    // ... 现有代码 ...
    
    // 自定义积分计算
    let earnedPoints = points;
    if (isCorrect && this.currentSession.streak >= 5) {
        earnedPoints += 10; // 连对奖励
    }
    
    // ... 剩余代码 ...
}
```

### 调整防沉迷限制

在 `quiz-limit.js` 中修改：

```javascript
static get DAILY_LIMITS() {
    return {
        '3-6': 20,
        '7-12': 30,   // 修改这里
        '13-18': 40
    };
}
```

## 🐛 调试技巧

### 查看本地数据

在浏览器控制台：

```javascript
// 查看答题历史
JSON.parse(localStorage.getItem('quizHistory'))

// 查看错题本
JSON.parse(localStorage.getItem('quizWrongQuestions'))

// 查看每日限制
JSON.parse(localStorage.getItem('quizDailyLimit'))

// 清除所有答题数据
localStorage.removeItem('quizHistory');
localStorage.removeItem('quizWrongQuestions');
localStorage.removeItem('quizDailyLimit');
```

### 重置每日限制（测试用）

```javascript
QuizLimit.resetDailyCount('7-12');
```

### 模拟已访问博物馆

```javascript
localStorage.setItem('visitedMuseums', JSON.stringify([
    'forbidden-city',
    'national-museum',
    'shanghai-museum'
]));
```

## 📱 移动端优化

- 触摸友好的按钮尺寸（最小 44x44px）
- 滑动手势支持
- 自适应屏幕方向
- 优化字体大小和行距
- 减少动画以提高性能

## ♿ 无障碍支持

- 语义化 HTML 标签
- ARIA 标签支持
- 键盘导航支持
- 高对比度文字
- 清晰的视觉反馈

## 🔮 未来计划

- [ ] 支持多人对战模式
- [ ] 添加排行榜系统
- [ ] 增加更多题目类型（填空、排序等）
- [ ] AI生成个性化题目
- [ ] 语音朗读题目和选项
- [ ] 成就系统集成
- [ ] 分享成绩到社交媒体
- [ ] 家长监控面板

## 📞 技术支持

如有问题或建议，请提交 Issue 或联系开发团队。

---

**版本**：v1.0.0  
**最后更新**：2026-01-11  
**适用年龄**：7-12岁
