# MCP (Model Context Protocol) 配置说明

## 概述

本项目提供了一个 MCP 服务器，使 GitHub Copilot 可以在开发时访问中国官方博物馆数据库，获取真实的博物馆信息。

## 功能特性

MCP 服务器提供以下工具：

### 1. `search_official_museums` - 搜索官方博物馆数据

搜索中国官方博物馆数据库，获取真实的博物馆信息。

**输入参数：**
- `museumName` (string, 必填): 博物馆名称或关键词，例如：故宫、国家博物馆、上海博物馆

**返回数据包括：**
- 博物馆名称
- 所在省份
- 博物馆性质（如：文化文物系统国有博物馆）
- 质量等级（一级、二级、三级、未定级）
- 是否免费开放
- 藏品数量
- 珍贵文物数量
- 年度展览次数
- 年度教育活动次数
- 年度参观人数（万人）

**示例使用：**
```javascript
// 搜索包含"故宫"的博物馆
{
  "museumName": "故宫"
}

// 返回结果示例
{
  "searchTerm": "故宫",
  "totalResults": 4,
  "museums": [
    {
      "名称": "故宫博物院",
      "省份": "北京市",
      "性质": "文化文物系统国有博物馆",
      "质量等级": "一级",
      "免费开放": "否",
      "藏品数量": "1950828",
      "珍贵文物数量": "1053272",
      "年度展览次数": "78",
      "年度教育活动次数": "1634",
      "年度参观人数_万人": "1762.4483"
    }
    // ... 更多结果
  ]
}
```

### 2. `get_museum_data` - 获取 KV Store 中的博物馆数据

从 KV Store 获取应用内的博物馆详细数据（包含清单、任务等）。

### 3. `get_survey_data` - 获取调查问卷数据

获取调查问卷的投票统计数据。

### 4. `update_survey_vote` - 更新调查投票

更新调查问卷的投票数据。

## 安装与配置

### 1. 安装依赖

```bash
npm install
```

这将安装 `@modelcontextprotocol/sdk` 及其他必要的依赖。

### 2. 配置环境变量

MCP 服务器需要以下环境变量：

```bash
export KV_STORE_ENDPOINT="https://letmetry.cloud/kv"
```

### 3. 启动 MCP 服务器

```bash
npm run mcp:start
```

或者直接运行：

```bash
node museum-mcp-server.js
```

### 4. GitHub Copilot 配置

项目已经包含了 `.copilot-mcp.json` 配置文件，GitHub Copilot 会自动识别并连接到 MCP 服务器。

配置文件内容：

```json
{
  "mcpServers": {
    "museum-search": {
      "command": "node",
      "args": [
        "museum-mcp-server.js"
      ],
      "env": {
        "KV_STORE_ENDPOINT": "https://letmetry.cloud/kv"
      },
      "description": "Museum search and data management MCP server for accessing official Chinese museum information"
    }
  }
}
```

**注意：** 配置文件使用相对路径，确保从项目根目录运行。如需使用绝对路径，请根据您的系统调整路径。

## 使用场景

### 开发时验证博物馆数据

在开发过程中，使用 Copilot 可以快速查询官方博物馆数据，验证应用中的博物馆信息是否准确：

```
# 在 Copilot 聊天中询问：
"搜索故宫博物院的官方数据"
"查找上海地区的一级博物馆"
"北京有哪些免费开放的博物馆？"
```

### 数据对比与更新

使用官方数据源对比应用内的博物馆数据，确保信息的准确性和时效性。

### 内容创作

在编写博物馆介绍、任务清单时，参考官方数据中的真实信息（如藏品数量、展览活动等）。

## API 数据源

博物馆搜索功能使用 `https://letmetry.cloud/museum/search` API，该 API 连接到中国官方博物馆数据库。

**API 文档：** https://letmetry.cloud/api-docs/#/Museum/post_museum_search

## 技术架构

- **MCP SDK**: `@modelcontextprotocol/sdk` v0.5.0+
- **通信方式**: stdio (标准输入输出)
- **数据格式**: JSON
- **外部 API**: letmetry.cloud 博物馆搜索 API

## 故障排除

### MCP 服务器无法启动

1. 确认已安装所有依赖：`npm install`
2. 检查 Node.js 版本（推荐 v18+）
3. 确认环境变量已正确设置

### Copilot 无法连接到 MCP 服务器

1. 检查 `.copilot-mcp.json` 文件路径是否正确
2. 确认文件路径使用绝对路径
3. 重启 IDE 或 GitHub Copilot 扩展

### API 请求失败

1. 检查网络连接
2. 确认 API 端点可访问：`curl https://letmetry.cloud/museum/search`
3. 查看服务器日志输出（stderr）

## 贡献

欢迎提交 Issue 和 Pull Request 来改进 MCP 服务器功能。

## 许可证

MIT License
