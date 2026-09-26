# MuseumCheck · AI 能力

本目录存放 MuseumCheck 产品所有对外发布的 AI 能力。

> 对内开发用的 AI 工具（给 Copilot/Cursor 用的 MCP 服务等）不放这里，用行业惯例位置（`.mcp/`、`.copilot/` 等）。
>
> 全局产品地图详见 [letmetry_agents README](https://github.com/jackandking/letmetry_agents)。

## 目录结构

```
ai/
├── README.md                    # 本文件
├── skills/                      # 对外发布的 Skill
│   ├── core/                    # 母版：通用描述、产品定位
│   │   └── description.md
│   ├── xiaping/                 # 虾评版（MCP 免费版）
│   │   └── SKILL.md
│   ├── skillhub/                # SkillHub 各版本
│   │   ├── museum-level-lookup/      # 博物馆级别查询
│   │   ├── museum-treasures-free/    # 镇馆之宝免费版
│   │   ├── museum-treasures/         # 镇馆之宝付费完整版
│   │   ├── museum-treasures-pay-pro/ # 镇馆之宝专业付费版
│   │   └── museumcheck/              # 博物馆打卡（综合版）
│   ├── coze/                    # 扣子版
│   │   └── mcp-plugin/          # MCP Plugin
│   └── offline/                 # 离线版（内置 JSON 数据，不依赖后端）
│       ├── SKILL.md
│       ├── scripts/museum_tools.py
│       ├── assets/museums.json
│       └── references/museum_data_format.md
├── agents/                      # Bot/Agent 配置
│   └── README.md
└── shared/                      # 共用素材
    └── README.md
```

## 发布清单

| 平台 | 产品名 | slug | 目录 | 版本 | 状态 |
|---|---|---|---|---|---|
| 虾评 | 博物馆打卡助手 | museumcheck | skills/xiaping/ | v0.1.0 trial | ✅ 已发布 |
| 扣子 | 博物馆打卡助手 | —（MCP Plugin） | skills/coze/mcp-plugin/ | — | ✅ 已创建 |
| SkillHub | 博物馆级别查询 | museum-level-lookup | skills/skillhub/museum-level-lookup/ | v1.0.0 | ✅ 已发布 |
| SkillHub | 博物馆镇馆之宝查询（免费） | museum-treasures-free | skills/skillhub/museum-treasures-free/ | v1.0.0 | ✅ 已发布 |
| SkillHub | museum-treasures | museum-treasures | skills/skillhub/museum-treasures/ | v1.0.0 | ✅ 已发布 |
| SkillHub | museum-treasures | museum-treasures-pay-pro | skills/skillhub/museum-treasures-pay-pro/ | v1.0.0 | ✅ 已发布 |
| SkillHub | 博物馆打卡 | museumcheck | skills/skillhub/museumcheck/ | v1.0.0 | ✅ 已发布 |
| 本地离线 | museum-checkin | — | skills/offline/ | — | ✅ 可用 |
| 豆包 | — | — | — | — | ⚪ 规划中 |

## 后端接口

所有在线版 Skill 最终调用 letmetry_web_service 的后端接口：

| 接口 | 说明 | 付费 |
|---|---|---|
| `POST /skillhub/museum-level` | 博物馆等级查询 | 免费 |
| `POST /skillhub/museum-treasures-free` | 镇馆之宝（免费文本） | 免费 |
| `POST /skillhub/museum-treasures` | 镇馆之宝（图文完整版） | ¥0.01/次 |
| `POST /skillhub/museum-checkin` | 打卡攻略生成 | ¥0.01/次 |

MCP endpoint: `https://museumcheck.cn/mcp`

## 维护原则

1. `skills/core/` 是通用描述母版，各平台版从这里派生
2. 新增平台版时，在 `skills/` 下建子目录
3. 改产品定位时先改 `core/`，再同步各平台版
4. 对内开发工具不放 `ai/`，避免混淆
5. 发布新版本时更新本 README 的发布清单
