# MuseumCheck · AI 能力

本目录存放 MuseumCheck 产品所有对外发布的 AI 能力。

> 对内开发用的 AI 工具（给 Copilot/Cursor 用的 MCP 服务等）不放这里，用行业惯例位置（`.mcp/`、`.copilot/` 等）。

## 架构总览

全局产品地图详见 [letmetry_agents README](https://github.com/jackandking/letmetry_agents)。

## 目录结构

```
ai/
├── README.md              # 本文件
├── skills/                # 对外发布的 Skill
│   ├── core/              # 母版：通用描述、定位
│   │   └── description.md
│   ├── offline/           # 离线版（内置 JSON 数据，不依赖后端）
│   │   ├── SKILL.md
│   │   ├── scripts/museum_tools.py
│   │   └── assets/museums.json
│   ├── xiaping/           # 虾评版（MCP 免费版）
│   │   └── SKILL.md
│   ├── skillhub/          # SkillHub 各版本（5个 Skill）
│   ├── coze/              # 扣子版（MCP Plugin / Skill）
│   └── ...
├── agents/                # Bot/Agent 配置（系统提示词、工具清单）
└── shared/                # 共用素材
```

## 发布清单

| 平台 | 产品名 | 目录 | 状态 |
|---|---|---|---|
| 虾评 | 博物馆打卡助手（MCP免费版） | skills/xiaping/ | ✅ 已发布 v0.1.0 trial |
| 扣子 | 博物馆打卡助手（MCP Plugin） | skills/coze/ | ✅ 已创建（空间7530271143622967337） |
| SkillHub | 博物馆级别查询 | skills/skillhub/museum-level-lookup/ | ✅ 已发布 v1.0.0 |
| SkillHub | 博物馆镇馆之宝查询（免费） | skills/skillhub/museum-treasures-free/ | ✅ 已发布 v1.0.0 |
| SkillHub | museum-treasures | skills/skillhub/museum-treasures/ | ✅ 已发布 v1.0.0 |
| SkillHub | museum-treasures（pay-pro） | skills/skillhub/museum-treasures-pay-pro/ | ✅ 已发布 v1.0.0 |
| SkillHub | 博物馆打卡 | skills/skillhub/museumcheck/ | ✅ 已发布 v1.0.0 |
| 本地离线 | museum-checkin（内置数据版） | skills/offline/ | ✅ 可用 |
| 豆包 | — | — | ⚪ 规划中 |

## 后端接口

所有 Skill 最终调用 letmetry_web_service 的后端接口：
- `/skillhub/museum-level` — 博物馆等级查询
- `/skillhub/museum-treasures` — 镇馆之宝（付费）
- `/skillhub/museum-treasures-free` — 镇馆之宝（免费文本）
- `/skillhub/museum-checkin` — 打卡攻略生成

MCP endpoint: `https://museumcheck.cn/mcp`

## 维护原则

1. `skills/core/` 是通用描述母版，各平台版从这里派生
2. 新增平台版时，在 `skills/` 下建子目录
3. 改产品定位时先改 `core/`，再同步各平台版
4. 对内开发工具不放 `ai/`，避免混淆
