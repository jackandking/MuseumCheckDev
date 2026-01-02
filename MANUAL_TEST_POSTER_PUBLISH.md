# 手动测试指南：打卡页面发布海报功能

## 测试目标
验证在打卡页面完成所有任务后，用户可以：
1. 发布海报到"大家的成就"页面
2. 删除自己已发布的海报

## 测试前准备

### 1. 启动本地服务器
```bash
cd /home/runner/work/MuseumCheck/MuseumCheck
python3 -m http.server 8000
```
访问: http://localhost:8000

### 2. 清空测试数据（可选）
在浏览器控制台运行：
```javascript
// 清空已发布海报记录
localStorage.removeItem('publishedPosters');

// 查看当前已发布的海报
console.log(JSON.parse(localStorage.getItem('publishedPosters') || '{}'));
```

## 测试场景 1: 发布海报到大家的成就

### 步骤：

1. **进入打卡页面**
   - 从主页选择任意博物馆（建议选择有镇馆之宝的博物馆）
   - 点击"🔗 打卡"按钮进入打卡页面
   - URL 应该类似: `museum-checkin.html?museum=forbidden-city&age=7-12`

2. **完成所有孩子任务**
   - 在打卡页面完成所有任务（点击每个任务卡片，标记为完成）
   - 可以上传照片（可选）
   - 完成后会自动显示完成庆祝页面

3. **查看完成庆祝页面**
   - ✅ 验证点：应该看到生成的海报
   - ✅ 验证点：海报下方应该有"📣 发布到大家的成就"按钮
   - ✅ 验证点：应该看到"🗑️ 删除已发布海报"按钮（初始状态为隐藏）

4. **点击发布按钮**
   - 点击"📣 发布到大家的成就"按钮
   - ✅ 验证点：按钮文字变为"⏳ 发布中..."
   - ✅ 验证点：等待几秒后，弹出"已成功发布到大家的成就！感谢分享。"提示
   - ✅ 验证点：询问是否打开"大家的成就"页面

5. **验证发布状态**
   - ✅ 验证点：发布按钮变为"✅ 已发布"并被禁用
   - ✅ 验证点：删除按钮显示出来

6. **查看本地存储**
   在浏览器控制台运行：
   ```javascript
   const published = JSON.parse(localStorage.getItem('publishedPosters') || '{}');
   console.log('已发布的海报:', published);
   // 应该看到类似结构:
   // {
   //   "forbidden-city": {
   //     recordId: 123,
   //     imageUrl: "https://...",
   //     title: "故宫博物院 海报",
   //     userName: "小淘气",
   //     publishedAt: 1234567890
   //   }
   // }
   ```

7. **打开大家的成就页面**
   - 点击"是"打开大家的成就页面，或手动访问 `everyone-achievements.html`
   - ✅ 验证点：应该看到刚刚发布的海报
   - ✅ 验证点：在自己发布的海报右上角应该看到红色的"🗑️"删除按钮

## 测试场景 2: 删除已发布的海报

### 从打卡页面删除：

1. **重新打开完成庆祝页面**
   - 刷新打卡页面或重新完成任务
   - 打开完成庆祝页面

2. **验证已发布状态**
   - ✅ 验证点：发布按钮显示为"✅ 已发布"并被禁用
   - ✅ 验证点：删除按钮可见

3. **点击删除按钮**
   - 点击"🗑️ 删除已发布海报"按钮
   - ✅ 验证点：弹出确认对话框："确定要删除已发布的海报吗？删除后将从「大家的成就」中移除。"

4. **确认删除**
   - 点击"确定"
   - ✅ 验证点：按钮文字变为"⏳ 删除中..."
   - ✅ 验证点：弹出"已成功删除发布的海报"提示

5. **验证删除后状态**
   - ✅ 验证点：删除按钮隐藏
   - ✅ 验证点：发布按钮恢复为"📣 发布到大家的成就"并可点击

6. **验证大家的成就页面**
   - 刷新或重新打开 `everyone-achievements.html`
   - ✅ 验证点：刚才删除的海报不再显示

### 从大家的成就页面删除：

1. **发布一个新海报**
   - 重复测试场景 1，发布一个海报

2. **打开大家的成就页面**
   - 访问 `everyone-achievements.html`
   - ✅ 验证点：找到刚发布的海报
   - ✅ 验证点：海报右上角有红色"🗑️"删除按钮

3. **点击删除按钮**
   - 点击海报右上角的"🗑️"按钮
   - ✅ 验证点：弹出确认对话框

4. **确认删除**
   - 点击"确定"
   - ✅ 验证点：弹出"海报已成功删除"提示
   - ✅ 验证点：页面自动刷新，删除的海报消失

## 测试场景 3: 权限控制验证

### 目标：验证用户只能删除自己发布的海报

1. **模拟其他用户的海报**
   在浏览器控制台运行：
   ```javascript
   // 注意：这只是模拟，实际上其他用户的海报ID不会在你的localStorage中
   const published = JSON.parse(localStorage.getItem('publishedPosters') || '{}');
   console.log('你的海报IDs:', Object.values(published).map(p => p.recordId));
   ```

2. **在大家的成就页面验证**
   - 访问 `everyone-achievements.html`
   - ✅ 验证点：只有你发布的海报（localStorage 中记录的 recordId）显示删除按钮
   - ✅ 验证点：其他海报没有删除按钮

## 测试场景 4: 重复发布保护

1. **发布一个海报**
   - 完成任务并发布海报

2. **尝试再次发布**
   - 刷新打卡页面或重新打开完成庆祝页面
   - 点击发布按钮（如果没有被禁用）
   - ✅ 验证点：应该弹出"此海报已经发布过了！"提示
   - ✅ 验证点：不会重复上传和插入数据库

## 测试场景 5: 错误处理

### 网络错误处理：

1. **断开网络**
   - 在浏览器开发工具中切换到"Network"标签
   - 勾选"Offline"模式

2. **尝试发布**
   - 点击发布按钮
   - ✅ 验证点：应该显示错误提示："发布失败：..."
   - ✅ 验证点：按钮恢复到可点击状态

3. **尝试删除**
   - 点击删除按钮
   - ✅ 验证点：应该显示错误提示："删除失败：..."
   - ✅ 验证点：按钮恢复到可点击状态

## 浏览器控制台命令参考

### 查看已发布海报
```javascript
console.log(JSON.parse(localStorage.getItem('publishedPosters') || '{}'));
```

### 清空已发布海报记录
```javascript
localStorage.removeItem('publishedPosters');
console.log('已清空');
```

### 手动添加测试数据
```javascript
const published = {
  'test-museum': {
    recordId: 999,
    imageUrl: 'https://example.com/test.png',
    title: '测试海报',
    userName: '测试用户',
    publishedAt: Date.now()
  }
};
localStorage.setItem('publishedPosters', JSON.stringify(published));
console.log('测试数据已添加');
```

### 模拟按钮状态更新
```javascript
// 在打卡页面完成庆祝modal打开时运行
const publishBtn = document.getElementById('publishPosterButton');
const deleteBtn = document.getElementById('deletePosterButton');
console.log('发布按钮:', publishBtn);
console.log('删除按钮:', deleteBtn);
console.log('删除按钮可见:', deleteBtn.style.display !== 'none');
```

## 预期行为总结

### 发布按钮状态：
- **未发布**：显示"📣 发布到大家的成就"，可点击
- **发布中**：显示"⏳ 发布中..."，禁用
- **已发布**：显示"✅ 已发布"，禁用

### 删除按钮状态：
- **未发布**：隐藏（display: none）
- **已发布**：显示（display: flex）

### localStorage 结构：
```javascript
{
  "publishedPosters": {
    "museum-id-1": {
      "recordId": 123,
      "imageUrl": "https://...",
      "title": "博物馆名称 海报",
      "userName": "用户昵称",
      "publishedAt": 1234567890
    },
    "museum-id-2": { ... }
  }
}
```

## 常见问题排查

### 1. 发布按钮点击后没有反应
- 检查浏览器控制台是否有错误
- 确认 `letmetry-cloud-api.js` 和 `image-upload-util.js` 已正确加载
- 检查网络连接

### 2. 删除按钮不显示
- 确认海报已经发布
- 检查 localStorage 中是否有对应的记录
- 刷新页面并重新打开完成庆祝页面

### 3. 大家的成就页面看不到海报
- 确认发布成功（查看 localStorage）
- 刷新大家的成就页面
- 检查数据库连接（查看控制台日志）

### 4. 删除按钮在别人的海报上也显示
- 这是一个bug，需要检查 everyone-achievements.js 的 renderPosters 函数
- 确认 localStorage 中的 recordId 匹配逻辑正确

## 报告测试结果

测试完成后，请记录：
- ✅ 通过的测试场景
- ❌ 失败的测试场景
- 📝 发现的问题和改进建议
- 🖼️ 截图（特别是关键步骤和错误信息）
