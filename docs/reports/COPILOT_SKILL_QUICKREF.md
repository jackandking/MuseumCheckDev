# 🚀 GitHub Copilot Museum Verification Skill - 快速参考

## 📍 Skill 已激活！

✅ **文件位置**: `.github/copilot-skills/museum-verification.md`  
✅ **状态**: 已创建并就绪  
✅ **可用性**: 立即使用  

---

## 💬 在 Copilot Chat 中说这些话来激活 Skill

### 英文
```
"Verify museum against official database"
"Check if [museum name] is official"
"Museum verification workflow"
"Validate museums in script.js"
```

### 中文
```
"验证博物馆"
"检查官方博物馆"
"我要验证这个博物馆"
"帮我验证博物馆数据"
```

---

## ⚡ 最快的 3 种使用方式

### 1️⃣ 最简单 - 直接询问

```
You: "故宫博物院是官方博物馆吗？"
Copilot: ✅ 自动验证并显示结果
```

### 2️⃣ 标准方式 - 请求验证

```
You: "请验证 '上海博物馆' 是否在官方数据库中"
Copilot: ✅ 运行验证，返回详细信息
```

### 3️⃣ 完整流程 - 批量处理

```
You: "我要添加多个博物馆，帮我一起验证"
Copilot: ✅ 创建 JSON，批量验证，生成报告
```

---

## 🎯 Copilot 会自动做的事情

| 你的请求 | Copilot 的反应 |
|---------|----------------|
| "验证博物馆 X" | ✅ 调用 Letmetry API |
| "为什么失败了？" | ✅ 解释并给出修复方案 |
| "帮我修复" | ✅ 提供官方名称和完整指导 |
| "我想添加博物馆" | ✅ 指导整个流程 |
| "给我一份报告" | ✅ 生成验证报告 |

---

## 📊 验证结果速查表

| 结果 | 含义 | 可以使用吗？ |
|------|------|------------|
| ✅ 100% exact | 完全匹配 | ✅ 直接使用 |
| ⚠️ 80% partial | 部分匹配 | ⚠️ 需要用官方名称 |
| ❌ < 60% | 匹配度低 | ❌ 需要查证或重新搜索 |

---

## 🔧 底层工具（Copilot 会自动使用）

```javascript
// API 方法 - Copilot 可以直接调用
LetmetryAPI.verifyMuseumOfficial('Museum Name', strictMode)

// CLI 工具 - Copilot 可以代表你运行
node tools/verify-museum-official.js "Museum Name" --strict

// Git Hook - Copilot 可以帮你处理提交
git commit -m "Add museum"  // Pre-commit 自动验证
```

---

## 🎓 实际对话示例

### 示例 1 - 单个验证

```
You: "我要添加一个新博物馆叫'故宫博物院'，能验证吗？"

Copilot: [museum-verification skill activated]
         "我来帮你验证这个博物馆..."
         
         ✅ Results:
         故宫博物院 - 100% Match (Exact)
         - Official Name: 故宫博物院
         - Province: 北京市
         - Quality Grade: 一级
         - Collections: 1,950,828
         
         "这个博物馆已验证通过，可以安全添加到代码中。"
```

### 示例 2 - 批量验证

```
You: "一起验证这三个博物馆：故宫、上海博物馆、国家博物馆"

Copilot: [museum-verification skill activated]
         [Creates batch verification]
         
         Summary:
         ✅ 故宫博物院 - 100% (exact)
         ✅ 上海博物馆 - 100% (exact)
         ✅ 中国国家博物馆 - 100% (exact)
         
         "All verified! Ready to commit."
```

### 示例 3 - 失败修复

```
You: "验证 '博物馆' 失败了"

Copilot: [museum-verification skill activated]
         "这个名称太通用了。官方数据库中相似的名称有：
         
         1. 中国国家博物馆 (北京)
         2. 浙江省博物馆 (杭州)
         3. 陕西历史博物馆 (西安)
         
         请告诉我你想添加的具体是哪一个？"
```

---

## 🛠️ 如果 Skill 不工作

```bash
# 1. 检查文件是否存在
ls .github/copilot-skills/museum-verification.md

# 2. 确保文件格式正确
# - 开头有 YAML 前置 (---)
# - 有 name: museum-verification
# - 有 description

# 3. 刷新 Copilot
# - 重启 VS Code
# - 或点击 Copilot 图标重新加载

# 4. 用明确的关键词
# "Use the museum-verification skill"
# "Activate museum verification"
```

---

## 📋 完整的关键词列表

Copilot 会通过这些关键词识别激活 Skill：

- verify museum
- check museum data
- validate museum
- official museum
- museum verification
- 官方博物馆
- 验证博物馆
- 博物馆验证
- 官方数据库
- 博物馆官方

---

## 💡 最佳实践

✅ **DO:**
- 在 Copilot 中清楚地说出你的需求
- 提供完整的博物馆名称
- 请求详细结果时用 `--verbose`

❌ **DON'T:**
- 用太模糊的名称（如"博物馆"）
- 期望离线工作（需要网络调用 API）
- 跳过验证直接提交

---

## 🚀 现在就试试！

在 GitHub Copilot Chat 中输入：

```
"我想给项目添加一个新的博物馆。请帮我验证'故宫博物院'是否在官方数据库中。"
```

**Copilot 会自动：**
1. 激活 museum-verification skill
2. 调用 Letmetry Cloud API
3. 显示验证结果
4. 提供后续步骤建议

🎉 就这么简单！

---

**相关链接:**
- 📖 完整指南: `.github/COPILOT_SKILL_ACTIVATION.md`
- 🔧 Skill 定义: `.github/copilot-skills/museum-verification.md`
- 🛠️ CLI 工具: `tools/verify-museum-official.js`
- 📚 API 文档: `js/letmetry-cloud-api.js`
