# 首都博物馆数据文件实现文档

## 概述

成功为首都博物馆创建了独立的数据文件 `museums/capital-museum.js`，参考平湖博物馆的实现模式，完整集成到 MuseumCheck 应用的所有场景中。

## 创建的文件

### museums/capital-museum.js

**文件大小**: 11.5 KB  
**导出对象**: `window.MUSEUM_CAPITAL`

```javascript
window.MUSEUM_CAPITAL = {
  id: 'beijing-capital-museum',
  name: '首都博物馆',
  location: '北京',
  description: '展示北京历史文化的市属综合性博物馆',
  tags: ['北京历史', '古都文化', '民俗'],
  image: '...',
  collections: [...],  // 3个精选藏品
  workflows: [...],    // 3个主题工作流
  checklists: {...}    // 完整清单数据
}
```

## 数据内容

### 1. 藏品信息 (Collections)

共 **3个** 精选藏品，每个都包含名称、图片URL和详细描述：

1. **北京孔庙大成殿牌匾**
   - 北京孔庙的重要文物
   - 见证了古代北京的文教历史
   - 体现了古代皇家对孔子的尊崇和对教育的重视

2. **元大都城墙遗址**
   - 元朝时期建造的都城城墙遗迹
   - 北京城市历史的重要见证
   - 展示元大都的城市规划和建筑技术

3. **景德镇窑青花凤首扁壶**
   - 明代景德镇窑烧制的精美瓷器
   - 中国陶瓷艺术的代表作
   - 扁壶造型独特，凤首设计精美

### 2. 工作流 (Workflows)

共 **3个** 主题工作流，覆盖不同年龄段和兴趣方向：

#### 2.1 镇馆之宝探索 (treasure-discovery)
- **适用年龄**: 3-6岁、7-12岁、13-18岁（全年龄段）
- **任务数量**: 6个
- **主题**: 围绕首都博物馆三大特色藏品的亲子探索路线
- **任务类型**: 
  - 门口打卡
  - 寻找并合影3件文化瑰宝
  - 完成合影
  - 生成成就海报

#### 2.2 老北京文化之旅 (old-beijing-culture)
- **适用年龄**: 3-6岁、7-12岁
- **任务数量**: 6个
- **主题**: 探索老北京的民俗文化和传统生活
- **任务类型**:
  - 门口打卡
  - 胡同探秘
  - 京剧脸谱
  - 传统玩具
  - 胜利合影
  - 成就海报

#### 2.3 古都历史探索 (ancient-capital-history)
- **适用年龄**: 7-12岁、13-18岁
- **任务数量**: 5个
- **主题**: 深入了解北京从蓟城到现代都市的演变历程
- **任务类型**:
  - 古都展区合影
  - 城市演变研究
  - 建筑艺术观察
  - 文化遗产学习
  - 成就海报

### 3. 清单数据 (Checklists)

#### 家长清单 (Parent)
每个年龄段 **9项**，总计 **27项**

**3-6岁** (幼儿阶段):
- 入馆指南、幼儿友好路线
- 文化启蒙工具
- 北京古都知识、老北京民俗文化
- 文化情感连接、胡同文化简介
- 传统手工艺、文化传承庆祝

**7-12岁** (小学阶段):
- 专业导览、北京建城史详解
- 元明清建都历程
- 胡同文化深度解读、京剧艺术知识
- 文化探索鼓励、老北京生活方式
- 文物时代特征识别、文化学习成就庆祝

**13-18岁** (中学阶段):
- 深度历史研习
- 北京城市发展史研究
- 古都文化特色分析
- 文化传承价值探讨
- 城市规划历史研究
- 深度文化对话、民俗文化演变分析
- 文物保护工作了解、文化智慧共享

#### 孩子清单 (Child)
每个年龄段 **5项**，总计 **15项**

**3-6岁**:
- 门口打卡
- 找到并合影3件文化瑰宝
- 亲子合影

**7-12岁**:
- 门口打卡
- 找到并合影3件文化瑰宝
- 亲子合影

**13-18岁**:
- 门口打卡
- 找到并合影3件文化瑰宝
- 亲子合影

## 修改的文件

### 1. index.html
添加了首都博物馆数据文件的引用和合并逻辑：

```html
<script src="museums/capital-museum.js"></script>
<script>
  if(window.MUSEUM_CAPITAL) overrides.push(window.MUSEUM_CAPITAL);
</script>
```

### 2. single-museum.html
添加了首都博物馆数据文件的引用和合并逻辑：

```html
<script src="museums/capital-museum.js"></script>
<script>
  if(window.MUSEUM_CAPITAL) overrides.push(window.MUSEUM_CAPITAL);
</script>
```

### 3. museum-checkin.html
添加了首都博物馆数据文件的引用和合并逻辑：

```html
<script src="museums/capital-museum.js"></script>
<script>
  if(window.MUSEUM_CAPITAL) overrides.push(window.MUSEUM_CAPITAL);
</script>
```

### 4. script.js
将首都博物馆添加到 V3_SUPPORTED 列表：

```javascript
const V3_SUPPORTED = ['forbidden-city', 'pinghu-museum', 'beijing-capital-museum'];
```

### 5. single-museum.js
将首都博物馆添加到 V3_SUPPORTED 列表：

```javascript
const V3_SUPPORTED = ['forbidden-city', 'pinghu-museum', 'beijing-capital-museum'];
```

## 技术实现

### 数据合并机制

使用与平湖博物馆相同的数据合并策略：

```javascript
(function(){
  try{
    if(Array.isArray(window.MUSEUMS)){
      var overrides = [];
      if(window.MUSEUM_CAPITAL) overrides.push(window.MUSEUM_CAPITAL);
      overrides.forEach(function(m){
        if(!m || !m.id) return;
        var idx = window.MUSEUMS.findIndex(function(x){ return x && x.id===m.id; });
        if(idx>=0) window.MUSEUMS[idx] = Object.assign({}, window.MUSEUMS[idx], m);
        else window.MUSEUMS.push(m);
      });
    }
  }catch(e){}
})();
```

**优势**:
1. 独立数据文件优先级高于 `museums-data.js`
2. 可以扩展额外的 collections 和 workflows
3. 保持向后兼容性

### V3 工作流支持

首都博物馆被添加到 `V3_SUPPORTED` 数组，意味着：
- ✅ 支持导览模式 (🧭 导览按钮)
- ✅ 支持工作流任务系统
- ✅ 支持拍照打卡功能
- ✅ 支持成就海报生成

## 验证测试

### 1. 数据结构验证
✅ 使用 Node.js 脚本验证数据文件加载正确  
✅ 确认所有必需字段存在  
✅ 验证 collections、workflows、checklists 完整性

### 2. HTTP 服务器验证
✅ capital-museum.js 文件可访问 (200 OK)  
✅ Content-Type: text/javascript  
✅ Content-Length: 11776 bytes

### 3. 页面集成验证
✅ index.html - 正确引用和合并  
✅ single-museum.html - 正确引用和合并  
✅ museum-checkin.html - 正确引用和合并  
✅ test-capital-integration.html - 测试页面验证通过

### 4. 功能验证
✅ 单馆页面显示正确的博物馆名称  
✅ 工作流任务正确加载（5个步骤）  
✅ 藏品图片引用正确  
✅ 清单数据统计准确

## 使用场景

首都博物馆现在可以在以下场景中使用：

### 1. 主页列表 (index.html)
- 在博物馆列表中展示
- 显示基本信息（名称、位置、标签）
- 提供"🧭 导览"按钮进入V3模式

### 2. 单馆详情页 (single-museum.html)
- URL: `/single-museum.html?museum=beijing-capital-museum`
- 显示完整的工作流
- 支持拍照打卡
- 生成成就海报

### 3. 博物馆打卡 (museum-checkin.html)
- 记录参观进度
- 管理打卡任务
- 查看完成状态

### 4. V3 导览模式
- 镇馆之宝探索
- 老北京文化之旅
- 古都历史探索

## 数据来源

### 基础数据
从 `museums-data.js` 中提取首都博物馆的原始数据，包括：
- 基本信息（id, name, location, description, tags）
- 完整的 checklists（parent 和 child，3个年龄段）

### 扩展数据
新增加的数据：
- **collections**: 3个精选藏品及其图片和描述
- **workflows**: 3个主题工作流，共17个任务

## 文件结构对比

### 平湖博物馆 (pinghu-museum.js)
```
- 基本信息 ✓
- collections: 3个藏品 ✓
- workflows: 1个工作流 ✓
- checklists: 完整清单 ✓
```

### 首都博物馆 (capital-museum.js)
```
- 基本信息 ✓
- collections: 3个藏品 ✓
- workflows: 3个工作流 ✓ (比平湖更丰富)
- checklists: 完整清单 ✓
```

## 总结

✅ **完成目标**: 成功为首都博物馆创建独立数据文件  
✅ **模式一致**: 完全遵循平湖博物馆的实现模式  
✅ **功能完整**: 包含藏品、工作流、清单等完整数据  
✅ **集成正确**: 所有HTML页面正确引用和合并数据  
✅ **测试通过**: 本地服务器验证和集成测试全部通过  
✅ **可用性强**: 支持所有应用场景，包括V3导览模式

首都博物馆数据文件现已完全集成到 MuseumCheck 应用中，可以立即投入使用。
