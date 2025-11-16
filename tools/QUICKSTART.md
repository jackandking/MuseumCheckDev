# Quick Start: Museum Image Search Tools

## 🚀 三种方法，选择最适合您的！

### 方法1: 浏览器助手（最简单！）⭐ 推荐新手

**完全免费，无需任何设置，立即使用！**

```bash
# 直接用浏览器打开
open tools/bing-image-search-helper.html

# 或通过HTTP服务器
python3 -m http.server 8000
# 访问: http://localhost:8000/tools/bing-image-search-helper.html
```

**使用步骤：**
1. 在网页中输入博物馆名称（如"故宫博物院"）
2. 点击"搜索博物馆图片"按钮
3. 在Bing搜索结果中浏览图片
4. 右键点击图片，选择"复制图片地址"
5. 将URL粘贴到博物馆数据中

✅ 图形界面，操作简单  
✅ 完全免费，无需API密钥  
✅ 智能优化搜索关键词  
✅ 预设常用博物馆快速搜索  

**详细文档**: [BING_IMAGE_SEARCH_HELPER.md](BING_IMAGE_SEARCH_HELPER.md)

---

### 方法2: Wikimedia Commons（推荐批量处理）

**免费命令行工具，开源许可，无需API密钥！**

```bash
# 搜索博物馆建筑
node tools/search-museum-images-wikimedia.js "故宫博物院"

# 搜索博物馆和文物
node tools/search-museum-images-wikimedia.js "故宫博物院" "清明上河图"
```

✅ 完全免费，无需API密钥  
✅ 所有图片都是开源许可（公共领域或CC许可）  
✅ 命令行自动化，适合批量处理  
✅ 直接返回可用的图片URL  

---

### 方法3: Bing API（高级用户）

**需要API密钥，功能最强大**

#### Step 1: 试用演示版本（无需设置）

```bash
node tools/search-museum-images-demo.js "故宫博物院" "清明上河图"
```

这将展示工具如何工作，使用模拟数据，无需API密钥。

#### Step 2: 获取免费Bing API密钥（约5分钟）

1. 访问 https://azure.microsoft.com/en-us/free/
2. 注册免费Azure账户
3. 创建Bing Search v7资源（免费层：每月1000次搜索）
4. 从"Keys and Endpoint"复制API密钥

#### Step 3: 使用真实工具

```bash
# 设置API密钥
export BING_SEARCH_API_KEY=your_api_key_here

# 搜索图片
node tools/search-museum-images.js "故宫博物院" "清明上河图"
```

---

## 🎯 对比三种方法

| 特性 | 浏览器助手 | Wikimedia | Bing API |
|------|-----------|-----------|----------|
| **费用** | 完全免费 | 完全免费 | 免费（有限额） |
| **设置** | 无需设置 | 无需设置 | 需要API密钥 |
| **界面** | 图形界面 | 命令行 | 命令行 |
| **自动化** | 手动 | 自动 | 自动 |
| **许可** | 需手动检查 | 开源许可 | 需手动检查 |
| **结果数量** | 无限 | 中等 | 丰富 |
| **适用场景** | 临时搜索 | 批量处理 | 大规模自动化 |

---

## 📖 常见使用场景

### 查找博物馆建筑照片

**浏览器助手：**
1. 打开 `tools/bing-image-search-helper.html`
2. 输入"上海博物馆"
3. 点击"搜索博物馆图片"

**Wikimedia命令行：**
```bash
node tools/search-museum-images-wikimedia.js "上海博物馆"
```

**Bing API：**
```bash
node tools/search-museum-images.js "上海博物馆"
```

### 查找文物照片

**浏览器助手：**
1. 博物馆名称: "中国国家博物馆"
2. 文物名称: "后母戊鼎"
3. 点击"搜索文物图片"

**Wikimedia命令行：**
```bash
node tools/search-museum-images-wikimedia.js "中国国家博物馆" "后母戊鼎"
```

**Bing API：**
```bash
node tools/search-museum-images.js "中国国家博物馆" "后母戊鼎"
```

### 同时查找两者

**浏览器助手：**
- 点击"同时搜索两者"按钮，自动打开两个搜索标签页

**Wikimedia/Bing：**
- 在命令中同时提供博物馆和文物名称

---

## 💡 您将获得什么

**Bing浏览器助手：**
- ✅ 在新标签页中打开优化的Bing图片搜索
- ✅ 智能搜索关键词（自动添加"博物馆 外观 建筑"等）
- ✅ 快速访问常用博物馆
- ✅ 手动选择最合适的图片

**Wikimedia/Bing API工具：**
- ✅ 5-10张博物馆建筑照片（外观、建筑特征）
- ✅ 5-10张文物照片（高清文物照片）
- ✅ 可直接使用的图片URL
- ✅ 缩略图、尺寸、来源信息

---

## 📝 使用搜索结果

1. **复制图片URL**
   - 浏览器助手: 在Bing结果中右键点击图片 → "复制图片地址"
   - Wikimedia/Bing API: 从命令行输出中复制URL

2. **验证URL有效性**: 
   ```bash
   node tools/verify-treasure-images.js <url>
   ```

3. **添加到博物馆数据** (`museums-data.js`):
   ```javascript
   {
       id: 'museum-id',
       name: '博物馆名称',
       image: 'COPIED_URL_HERE',  // 博物馆建筑照片
       collections: [
           {
               name: '宝物名称',
               imageUrl: 'COPIED_URL_HERE'  // 文物照片
           }
       ]
   }
   ```

4. **验证数据**: 
   ```bash
   npm run validate-data
   ```

---

## 🎯 搜索技巧

- 使用中文官方博物馆名称
- 文物使用常用名称（如"清明上河图"而非英文名）
- 浏览器助手会自动优化关键词
- Wikimedia/Bing API工具自动添加"博物馆外观"、"建筑"、"文物"、"高清"等关键词
- 结果仅限照片，启用安全搜索

---

## 🔧 故障排除

**浏览器助手：**
- "找不到合适的图片" → 尝试简化搜索词或使用英文名
- "无法复制图片URL" → 确保右键点击图片本身，而非缩略图

**Wikimedia工具：**
- "No results found" → 尝试使用英文博物馆名称或简化搜索词

**Bing API工具：**
- "API key not set" → 运行 `export BING_SEARCH_API_KEY=your_key`
- "No results found" → 尝试更简单的搜索词或不同名称
- "Request timeout" → 检查网络连接，稍后重试

---

## 📚 完整文档

- **浏览器助手**: `tools/BING_IMAGE_SEARCH_HELPER.md`
- **完整指南**: `tools/MUSEUM_IMAGE_SEARCH.md`
- **工具总览**: `tools/README.md`
- **开发者指南**: `.github/copilot-instructions.md`

---

## 🆘 需要帮助？

1. 查看 `tools/BING_IMAGE_SEARCH_HELPER.md` 获取浏览器助手详细文档
2. 查看 `tools/MUSEUM_IMAGE_SEARCH.md` 获取API工具详细文档
3. 运行演示版本了解输出格式
4. 查看文档中的示例
5. 如果发现bug，请提交issue

---

**准备开始了吗？** 

**最简单的方式（推荐）：**
```bash
# 打开浏览器助手
open tools/bing-image-search-helper.html
```

**或者运行命令行演示：**
```bash
node tools/search-museum-images-demo.js "故宫博物院" "清明上河图"
```
