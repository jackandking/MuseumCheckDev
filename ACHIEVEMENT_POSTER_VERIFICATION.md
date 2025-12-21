# 成就海报修复 - 用户验证指南

## 问题回顾

**用户报告**：在打卡页面完成上海博物馆的 5 个任务后，看到了成就海报。但是在成就页面却没有看到相应的海报。

**修复内容**：添加了缺失的 `savePosterToGallery()` 调用，确保海报被保存到 localStorage。

---

## 快速验证步骤（推荐）

### 方式 1：完整工作流验证（5 分钟）

#### 步骤 1：打开博物馆打卡页面
```
打开网址: http://localhost:8000/museum-checkin.html?museum=shanghai-museum
```

#### 步骤 2：完成所有任务
- 选择年龄组（例如：7-12岁）
- 逐一完成 5 个任务
  - 每个任务点击后会打开任务详情
  - 根据任务描述完成操作
  - 点击"完成"按钮
  
预期：第 5 个任务完成后，会自动生成成就海报，你会看到：
- 🎉 celebration fireworks（庆祝烟花）
- 成就海报预览

#### 步骤 3：打开成就页面
```
打开网址: http://localhost:8000/achievements.html
```

预期：**应该看到上海博物馆的成就海报卡片**

#### 步骤 4：点击海报查看详情
- 点击海报卡片会打开全屏预览
- 可以选择下载或分享海报

---

### 方式 2：使用开发者工具验证（3 分钟）

#### 打开浏览器开发者工具
按 `F12` 打开开发者工具

#### 查看 Console 日志
1. 打开博物馆打卡页面
2. 切换到 **Console** 标签
3. 完成任务时，查看日志输出：

**成功日志样例**：
```
✅ Poster saved to gallery for: 上海博物馆
📊 Total posters in gallery: 1
🎨 Poster metadata: {
  museumId: "shanghai-museum"
  museumName: "上海博物馆"
  ageGroup: "7-12"
  timestamp: "2024/12/21 10:30:45"
}
```

#### 检查 localStorage 数据
1. 打开开发者工具的 **Application** 标签
2. 左侧栏选择 **Local Storage**
3. 选择网站（http://localhost:8000）
4. 查找 `museumPosters` 键
5. 展开后应该能看到 `shanghai-museum` 数据

**成功示例**：
```json
{
  "shanghai-museum": {
    "dataURL": "data:image/png;base64,iVBORw0KGgo...",
    "museumId": "shanghai-museum",
    "museumName": "上海博物馆",
    "ageGroup": "7-12",
    "timestamp": 1703079600000,
    "date": "2024/12/21"
  }
}
```

#### 再次打开成就页面时验证加载
1. 打开成就页面（achievements.html）
2. 切换到 Console 标签
3. 应该看到日志：
```
✅ Loaded posters from localStorage: 1 posters
Poster keys: ["shanghai-museum"]
```

---

### 方式 3：使用刷新按钮验证（1 分钟）

1. 打开成就页面
2. 观察右上角有一个 🔄 刷新按钮（新增）
3. 点击刷新按钮
4. 按钮会旋转，页面重新加载海报
5. 查看是否看到成就海报

---

## 完整测试场景

如果你想更全面地测试，可以按照以下场景进行：

### 场景 A：新用户完成一个博物馆

1. 清空 localStorage（可选）：在 Console 中执行
   ```javascript
   localStorage.clear()
   ```

2. 打开博物馆打卡页面：上海博物馆
3. 完成所有 5 个任务
4. 打开成就页面，确认能看到海报
5. 刷新页面，确认海报仍然存在

### 场景 B：完成多个博物馆

1. 完成上海博物馆的任务（同上）
2. 再打开其他博物馆（例如故宫博物院）
3. 完成其任务
4. 打开成就页面，应该看到 2 个海报

### 场景 C：不同年龄组

1. 完成上海博物馆的任务（年龄组：7-12）
2. 用另一个年龄组重新打卡同一博物馆（例如：3-6）
3. 成就页面应该显示最新的海报（年龄组 3-6 的）

### 场景 D：检查浏览器日志

在每个场景中都检查 Console 日志，确保没有错误信息。

---

## 常见问题

### Q1: 我完成了任务但没看到海报
**A**: 检查以下几点：
1. 你是否完成了**所有** 5 个任务（完成进度应该是 5/5）？
2. 打开开发者工具（F12），查看 Console 是否有错误信息
3. 检查 Application > Local Storage 中是否有 `museumPosters` 数据
4. 尝试刷新浏览器

### Q2: 成就页面看不到海报
**A**: 
1. 确认你已经完成了任务和生成了海报
2. 检查 Console 日志，查看是否成功加载了 localStorage 数据
3. 点击右上角的 🔄 刷新按钮
4. 尝试清空浏览器缓存后重新打开

### Q3: 某个博物馆的海报没有照片
**A**: 这是正常的。如果没有用户上传照片，系统会使用博物馆的收藏图片作为替代。如果两者都没有，会显示文字信息。

### Q4: localStorage 容量不足
**A**: 如果看到 "Storage quota exceeded" 错误，海报会被保存到一个最小化的版本中。此时可以：
1. 清空一些旧的数据
2. 删除一些不需要的博物馆记录
3. 使用浏览器的数据导出功能备份数据

---

## 技术细节（开发者参考）

### 修复的代码位置

**文件**: `museum-checkin.html`

**位置 1 - 异步加载成功**（第 7545 行）：
```javascript
museumImg.onload = function(){
    // ... 绘制逻辑 ...
    const posterDataURL = canvas.toDataURL('image/png');
    preview.innerHTML = `<img src="${posterDataURL}" style="max-width:100%;border-radius:12px;">`;
    
    // ✅ CRITICAL FIX: Save poster to localStorage
    savePosterToGallery(posterDataURL);
};
```

**位置 2 - 异步加载失败**（第 7561 行）：
```javascript
museumImg.onerror = function(){
    // ... 绘制逻辑 ...
    const posterDataURL = canvas.toDataURL('image/png');
    preview.innerHTML = `<img src="${posterDataURL}" style="max-width:100%;border-radius:12px;">`;
    
    // ✅ CRITICAL FIX: Save poster to localStorage
    savePosterToGallery(posterDataURL);
};
```

### 新增功能

**文件**: `achievements.html`

1. **刷新按钮**（右上角 🔄）：允许用户手动刷新海报列表
2. **调试日志**：提供详细的日志信息，便于排查问题
3. **改进的加载函数**：更好的错误处理和数据验证

### 单元测试

**文件**: `tests/achievement-poster-persistence.test.js`

包含 7 个测试用例，覆盖：
- 基础数据保存和检索
- 跨页面数据持久化
- 异步回调中的数据保存（核心修复）
- 存储配额限制处理
- 数据结构验证

运行测试：
```bash
npm test -- tests/achievement-poster-persistence.test.js
```

---

## 反馈和支持

如果在测试中遇到问题，请：

1. **收集日志信息**：
   - 打开 Console，复制所有日志
   - 打开 Application，截图 localStorage 数据

2. **提供详细信息**：
   - 使用的浏览器和版本
   - 操作系统
   - 完整的错误信息

3. **提交 Issue**：
   - GitHub 上新建 Issue
   - 附上上述信息和复现步骤

---

**修复版本**: v2.1.5+  
**发布日期**: 2024 年 12 月  
**状态**: ✅ 已修复并测试
