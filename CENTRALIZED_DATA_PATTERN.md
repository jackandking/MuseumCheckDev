# 博物馆数据集中管理模式 (Centralized Museum Data Pattern)

## 概述 (Overview)

本文档说明如何将博物馆的所有数据（包括工作流workflows）集中管理在单个数据文件中。这种模式提高了内容管理效率，使博物馆数据更易于维护和优化。

This document explains how to centralize all museum data (including workflows) in a single data file. This pattern improves content management efficiency and makes museum data easier to maintain and optimize.

## 设计目标 (Design Goals)

1. **集中管理**: 将博物馆的所有相关数据放在一个文件中
2. **易于维护**: 内容创作者可以在一个地方管理所有博物馆内容
3. **向后兼容**: 支持现有的全局工作流数据结构
4. **可扩展**: 其他博物馆可以逐步采用这种模式

## 实现示例：平湖博物馆 (Implementation Example: Pinghu Museum)

### 文件位置 (File Location)
```
museums/pinghu-museum.js
```

### 数据结构 (Data Structure)

```javascript
window.MUSEUM_PINGHU = {
  id: 'pinghu-museum',
  name: '平湖博物馆',
  location: '平湖',
  description: '展示平湖历史与地方文化的综合性博物馆',
  tags: ['历史', '地方', '文化'],
  
  // 藏品信息
  collections: [
    { name: '唐铸铁佛头', url: '...' },
    // ...
  ],
  
  // 新增：工作流数据（Workflows）
  workflows: [
    {
      id: 'treasure-discovery',
      name: '镇馆之宝探索',
      description: '围绕平湖博物馆三大镇馆之宝的亲子探索路线',
      ages: ['3-6', '7-12'],
      tasks: {
        enroute: [],
        visit: [
          { 
            id: 'gate-photo', 
            role: 'parent', 
            type: 'photo', 
            title: '门口打卡', 
            subtitle: '博物馆门口合影', 
            ages: ['3-6','7-12','13-18'] 
          },
          // ...更多任务
        ]
      }
    },
    // ...更多工作流
  ],
  
  // 原有的清单数据
  checklists: {
    parent: { /* ... */ },
    child: { /* ... */ }
  }
};
```

## 工作流结构说明 (Workflow Structure)

每个工作流包含以下字段：

### 必需字段 (Required Fields)
- `id`: 工作流唯一标识符
- `name`: 工作流显示名称
- `description`: 工作流描述
- `ages`: 适用年龄组数组，如 `['3-6', '7-12']`
- `tasks`: 任务对象，包含不同阶段的任务

### 任务阶段 (Task Stages)
- `enroute`: 路上/准备阶段
- `visit`: 参观阶段
- `share`: 分享阶段（可选）

### 任务字段 (Task Fields)
- `id`: 任务唯一标识符
- `role`: 'parent' 或 'child'（谁执行这个任务）
- `type`: 任务类型
  - `'photo'`: 拍照任务
  - `'confirm'`: 确认完成任务
  - `'tts'`: 语音提示任务
  - `'link'`: 链接任务
- `title`: 任务标题
- `subtitle`: 任务副标题/详细说明
- `ages`: 适用年龄组（可选，用于进一步过滤）
- `url`: URL链接（仅用于link类型）
- `tts`: 语音文本（仅用于tts类型）

## 代码实现 (Code Implementation)

### 加载优先级 (Loading Priority)

系统按以下优先级查找工作流：

1. **首选**: 博物馆对象中的 `museum.workflows`（集中管理）
2. **备选**: 全局 `window.WORKFLOWS[museum.id]`（兼容旧系统）

### 核心函数 (Core Function)

在 `single-museum.js` 中的 `getWorkflowsForMuseum()` 函数：

```javascript
function getWorkflowsForMuseum(museum){
  try{
    const id = museum && museum.id;
    // 首先检查博物馆对象中的工作流（集中数据）
    let all = [];
    if (museum && Array.isArray(museum.workflows)) {
      all = museum.workflows;
    } else if (window.WORKFLOWS && window.WORKFLOWS[id]) {
      // 备选：使用全局工作流数据
      all = window.WORKFLOWS[id];
    }
    const list = Array.isArray(all) ? all : [];
    const age = getAgeGroup();
    // 根据年龄组过滤工作流
    return list.filter(wf => !wf.ages || wf.ages.includes(age));
  }catch(e){ return []; }
}
```

## 迁移指南 (Migration Guide)

### 将现有博物馆迁移到集中管理模式 (Migrating Existing Museums)

1. **从 workflows-data.js 复制工作流数据**
   ```javascript
   // 原位置：workflows-data.js
   const WORKFLOWS = {
     'your-museum-id': [ /* workflows */ ]
   };
   
   // 新位置：museums/your-museum.js
   window.MUSEUM_YOUR = {
     id: 'your-museum-id',
     // ...其他字段
     workflows: [ /* 粘贴这里 */ ]
   };
   ```

2. **测试验证**
   - 在浏览器中打开 `single-museum.html?museum=your-museum-id`
   - 检查工作流选择器是否正常显示
   - 验证不同年龄组的工作流过滤是否正确

3. **保留兼容性**（可选）
   - 暂时保留 workflows-data.js 中的旧数据
   - 确认新系统稳定后再删除

## 优势总结 (Benefits Summary)

### ✅ 对内容创作者
- 所有博物馆内容在一个文件中
- 减少文件切换，提高编辑效率
- 更容易理解博物馆的完整内容结构

### ✅ 对开发者
- 更清晰的数据组织
- 减少全局命名空间污染
- 更好的模块化和可维护性

### ✅ 对系统
- 按需加载博物馆数据
- 减少全局配置文件大小
- 更灵活的扩展能力

## 未来计划 (Future Plans)

1. 逐步将其他博物馆迁移到集中管理模式
2. 开发自动化工具辅助数据迁移
3. 考虑将 `checklists` 数据也整合到工作流中
4. 提供数据验证工具，确保数据格式正确

## 参考资料 (References)

- [平湖博物馆数据文件](museums/pinghu-museum.js)
- [单博物馆页面代码](single-museum.js)
- [原工作流数据文件](workflows-data.js)
