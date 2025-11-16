# Museum Data Quality Tools

This directory contains tools to ensure systematic data quality in the MuseumCheck application.

## Tools Overview

### Image Search Tools

**Three powerful tools are available to find museum and treasure photos. ALWAYS try Wikimedia first, then Baidu for Chinese museums, use Bing as final backup.**

#### 🥇 Option 1: search-museum-images-wikimedia.js (RECOMMENDED FIRST)

**Wikimedia Commons免费图片搜索工具 - 首选方案！**

使用Wikimedia Commons的免费API搜索博物馆和文物图片，所有图片均为开源许可。

**为什么优先使用：**
- ✅ **完全免费** - 无需API密钥，立即可用
- ✅ **开源许可** - 所有图片都有明确的自由许可（Public Domain, CC0, CC BY-SA）
- ✅ **无版权问题** - 来自文化机构的高质量策展图片
- ✅ **命令行自动化** - 直接返回图片URL列表
- ✅ **多语言搜索** - 自动尝试中文和英文搜索词

**使用方法：**
```bash
# 搜索博物馆建筑图片
node tools/search-museum-images-wikimedia.js "故宫博物院"

# 搜索博物馆和文物图片
node tools/search-museum-images-wikimedia.js "故宫博物院" "清明上河图"

# 更多例子
node tools/search-museum-images-wikimedia.js "中国国家博物馆" "后母戊鼎"
node tools/search-museum-images-wikimedia.js "上海博物馆" "大克鼎"
```

**输出示例：**
```
📸 Museum Building Photos - 故宫博物院
================================================================================
[1] The Forbidden City, Beijing, China (故宫博物院).jpg
    URL: https://upload.wikimedia.org/wikipedia/commons/...
    Thumbnail: https://upload.wikimedia.org/wikipedia/commons/thumb/...
    Size: 3472x4624 (image/jpeg)
    Source: https://commons.wikimedia.org/wiki/File:...
    License: 💡 All images from Wikimedia Commons are under free licenses
```

---

#### 🥈 Option 2: baidu-image-search-helper.html (中国博物馆首选 - 免费浏览器工具)

**百度图片搜索助手 - 中国博物馆和文物图片搜索最佳选择！**

这是一个基于网页的交互式工具，帮助您通过百度免费搜索博物馆和文物图片。

**为什么选择百度：**
- 🏆 **中国内容最全** - 收录的中国博物馆和文物图片数量最多、最全面
- ✅ **中文搜索最强** - 对中文关键词理解最准确，搜索结果更精准
- ✅ **图片质量高** - 提供高清大图，适合用于展示和设计
- ✅ **搜索功能强大** - 支持按尺寸、颜色、类型等多维度筛选
- ✅ **完全免费** - 无需任何API密钥或付费订阅
- ⚠️ **注意：使用前必须验证图片许可证**

**何时使用此工具：**
- 🏆 搜索中国博物馆和文物图片（首选方案）
- ✅ Wikimedia没有该博物馆的图片
- ✅ 需要更多高质量的中文图片资源
- ✅ 需要利用百度强大的中文搜索能力

**使用方法：**
```bash
# 直接在浏览器中打开
open tools/baidu-image-search-helper.html

# 或通过HTTP服务器访问
python3 -m http.server 8000
# 然后访问: http://localhost:8000/tools/baidu-image-search-helper.html
```

**工作流程：**
1. 在网页中输入博物馆和文物名称
2. 点击搜索按钮，自动在百度打开优化的搜索结果
3. 浏览图片，右键"复制图片地址"
4. 将URL粘贴到博物馆数据中
5. **重要**：访问源页面验证图片许可证

**详细文档：** 查看 [BAIDU_IMAGE_SEARCH_HELPER.md](BAIDU_IMAGE_SEARCH_HELPER.md)

---

#### 🥉 Option 3: bing-image-search-helper.html (国际博物馆备选 - 免费浏览器工具)

**免费的浏览器图片搜索助手 - 适合国际博物馆！**

这是一个基于网页的交互式工具，帮助您通过Bing网站免费搜索博物馆和文物图片。

**何时使用此工具：**
- ✅ 搜索国际博物馆图片
- ❌ Wikimedia和百度都没有理想图片
- ❌ 需要更多样化的角度或视图
- ⚠️ **注意：使用前必须验证图片许可证**

**特点：**
- ✅ **完全免费** - 无需任何API密钥或付费订阅
- ✅ **简单易用** - 图形化界面，无需命令行
- ✅ **智能搜索** - 自动优化搜索关键词
- ✅ **快速访问** - 预设常用博物馆快速搜索

**使用方法：**
```bash
# 直接在浏览器中打开
open tools/bing-image-search-helper.html

# 或通过HTTP服务器访问
python3 -m http.server 8000
# 然后访问: http://localhost:8000/tools/bing-image-search-helper.html
```

**工作流程：**
1. 在网页中输入博物馆和文物名称
2. 点击搜索按钮，自动在Bing打开优化的搜索结果
3. 浏览图片，右键"复制图片地址"
4. 将URL粘贴到博物馆数据中
5. **重要**：访问源页面验证图片许可证

**详细文档：** 查看 [BING_IMAGE_SEARCH_HELPER.md](BING_IMAGE_SEARCH_HELPER.md)

---

#### 🔧 Option 4: search-museum-images.js (高级 - 需要API密钥)

**Bing Image Search API工具 - 用于批量自动化处理**

**仅适用于高级用户和批量处理场景。大多数用户应使用上面的浏览器工具。**

**何时使用此工具：**
- 需要批量处理大量博物馆数据
- 需要编程自动化图片搜索
- 愿意设置Azure账户和API密钥

**前置要求：**
- Bing Search API key from Azure Cognitive Services
- Set environment variable: `BING_SEARCH_API_KEY=your_api_key`

**获取API密钥：**
1. 访问 https://azure.microsoft.com/services/cognitive-services/bing-web-search-api/
2. 注册免费Azure账户
3. 创建Bing Search资源
4. 复制API密钥
5. 设置环境变量：`export BING_SEARCH_API_KEY=your_key_here`

**使用方法：**
```bash
# 搜索博物馆建筑图片
node tools/search-museum-images.js "故宫博物院"

# 搜索博物馆和文物图片
node tools/search-museum-images.js "故宫博物院" "清明上河图"

# 更多例子
node tools/search-museum-images.js "中国国家博物馆" "后母戊鼎"
node tools/search-museum-images.js "上海博物馆" "大克鼎"
```

**输出：**
Returns a formatted list of image URLs with metadata:
- Full image URL (for `image` and `imageUrl` fields)
- Thumbnail URL
- Image dimensions and file size
- Source page URL

**Demo Version (测试用):**
For testing without an API key, use the demo version:
```bash
node tools/search-museum-images-demo.js "故宫博物院" "清明上河图"
```

---

### 📋 推荐的图片搜索工作流程

**标准流程（ALWAYS follow this order）：**

1. **首先尝试Wikimedia Commons**（免费许可保证）
   ```bash
   node tools/search-museum-images-wikimedia.js "博物馆名称" "文物名称"
   ```
   - 检查返回的图片是否合适
   - 所有图片都是免费许可，可以直接使用
   - 如果找到合适的图片，工作完成

2. **如果Wikimedia没有理想图片，使用百度图片搜索（中国博物馆首选）**
   ```bash
   # 打开免费的百度搜索助手（无需API密钥）
   open tools/baidu-image-search-helper.html
   ```
   - 🏆 **中国博物馆和文物的最佳选择**
   - 中文搜索结果最准确、最全面
   - ⚠️ **重要**: 必须验证图片许可证
   - 访问源页面确认图片可以使用
   - 优先选择Public Domain, CC0, CC BY, CC BY-SA许可的图片

3. **如果需要国际博物馆图片，使用Bing浏览器工具作为补充**
   ```bash
   # 打开免费的Bing搜索助手（无需API密钥）
   open tools/bing-image-search-helper.html
   ```
   - 适合搜索国际博物馆
   - ⚠️ **重要**: 必须验证图片许可证

4. **验证图片URL可访问性**
   ```bash
   node tools/verify-treasure-images.js <image-url>
   ```

5. **添加到博物馆数据结构**
   ```javascript
   {
       id: 'museum-id',
       name: '博物馆名称',
       image: 'URL_FROM_SEARCH_TOOL',
       collections: [
           {
               name: '文物名称',
               imageUrl: 'URL_FROM_SEARCH_TOOL',
               description: '...'
           }
       ]
   }
   ```

6. **验证数据质量**
   ```bash
   npm run validate-data
   ```

### 图片搜索工具对比

| 特性 | Wikimedia (首选) | 百度图片 (中国博物馆) | Bing图片 (国际) | Bing API (高级) |
|------|-----------------|---------------------|----------------|----------------|
| 是否免费 | ✅ 完全免费 | ✅ 完全免费 | ✅ 完全免费 | ⚠️ 需API密钥 |
| 许可证 | ✅ 自动开源 | ❌ 需手动验证 | ❌ 需手动验证 | ❌ 需手动验证 |
| 中文内容 | ⭐⭐⭐ 有限 | ⭐⭐⭐⭐⭐ 最丰富 | ⭐⭐⭐⭐ 较丰富 | ⭐⭐⭐⭐ 较丰富 |
| 中国博物馆 | ⭐⭐⭐ 部分 | 🏆 最全面 | ⭐⭐⭐⭐ 全面 | ⭐⭐⭐⭐ 全面 |
| 图片质量 | ⭐⭐⭐⭐ 高 | ⭐⭐⭐⭐⭐ 非常高 | ⭐⭐⭐⭐⭐ 非常高 | ⭐⭐⭐⭐⭐ 非常高 |
| 使用难度 | 简单（命令行） | 非常简单（网页） | 非常简单（网页） | 中等（需API） |
| 自动化 | ✅ 命令行自动化 | ❌ 手动操作 | ❌ 手动操作 | ✅ 命令行自动化 |
| 推荐场景 | **免费许可首选** | **中国博物馆首选** | 国际博物馆 | 批量自动化处理 |

---

### validate-museum-data.js

Comprehensive museum data validation tool that checks for:
- Duplicate museum names and IDs
- Missing required fields  
- Invalid checklist structures
- Data integrity issues

**Usage:**
```bash
# From repository root
node tools/validate-museum-data.js

# Or using npm script
npm run validate-data
```

**Output:**
- ✅ Success: Exits with code 0 if data is valid
- ❌ Issues: Exits with code 1 and detailed error report if problems found

### verify-treasure-images.js

Verifies that image URLs in museum data are accessible and valid.

**Usage:**
```bash
node tools/verify-treasure-images.js <image-url>
```

## Integration with Development Workflow

### For Copilot
These tools are integrated into the Copilot instructions to ensure systematic issue detection:

1. **Pre-change validation**: Must run before any museum data changes
2. **Issue reporting**: Comprehensive problems must be reported to user
3. **Systematic fixes**: Address root causes, not individual symptoms

### For Developers
Include data validation in your workflow:

```bash
# Before making changes
npm run validate-data

# Run data quality tests
npm run test:data-quality

# Full test suite
npm test
```

## Current Data Quality Status

As of the last analysis (see `.github/copilot-instructions.md` for details):
- **302 total museums** (expected: ~300)
- **40 duplicate names** (e.g., "广东省博物馆" appears twice)  
- **24 duplicate IDs** (e.g., "guangdong-museum" used twice)
- **9 missing field errors** (3 museums with undefined names)

## Systematic Issues vs Individual Fixes

### ❌ Wrong Approach (Previous)
- Found "首都博物馆" duplicate
- Fixed only that specific case
- Ignored 40+ other duplicates  
- No comprehensive analysis

### ✅ Correct Approach (Required)
- Run comprehensive validation first
- Identify ALL systematic issues
- Report complete scope to user
- Get guidance on systematic vs individual fix
- Address root causes, not symptoms

## Tool Development

### Adding New Validations
To add new data quality checks:

1. Update `tools/validate-museum-data.js`
2. Add corresponding test in `tests/data-quality.test.js`
3. Update this README with new validation details

### Test Integration
Data quality validation is integrated with the testing framework:

```bash
# Run only data quality tests
npm run test:data-quality

# Include in CI/CD pipeline
npm test  # Includes data quality tests
```

## Error Codes and Exit Status

- **Exit 0**: All data validation passed
- **Exit 1**: Data quality issues detected (see output for details)

The tools are designed to fail fast and provide actionable feedback for systematic data quality issues.