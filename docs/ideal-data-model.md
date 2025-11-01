# 理想数据模型（提案）

本文件用于沉淀 checklist 与 workflow 统一后的理想数据结构，便于后续演进与团队协作。

## 设计目标

- 统一“任务/清单”的底层抽象，消除 checklist 与 workflow 双轨问题。
- 使参观指南页与打卡页天然互通完成状态。
- 年龄与角色成为一等公民，驱动可见性与编排。
- 提供可选“路线（Route）”层作为编排，不绑定底层数据。
- 易于扩展（证据、题目、TTS、i18n、推荐）。

## 核心枚举

- Stage: `prep | enroute | visit | share | post`
- Role: `parent | child | group`
- Type: `confirm | photo | tts | link | note | quiz`

## 实体定义

### Museum

```json
{
  "id": "forbidden-city",
  "name": "故宫博物院",
  "location": "北京",
  "tags": ["历史","建筑"],
  "image": "...",
  "reservationRequired": true,
  "reservationUrl": "..."
}
```

说明：Museum 不再内嵌原始 checklist，改由 Activity 关联。

### Activity（原子任务，统一替代 checklist/task）

```json
{
  "id": "act:forbidden-city:find-dragon",
  "museumId": "forbidden-city",
  "stage": "visit",
  "role": "child",
  "type": "confirm",
  "title": { "zh-CN": "寻找神兽" },
  "subtitle": { "zh-CN": "在屋檐上找到一只龙或凤凰" },
  "content": { },
  "action": { },
  "ages": ["3-6","7-12"],
  "tags": ["观察","建筑"],
  "evidence": [],
  "priority": 50,
  "visibility": null,
  "source": { "from": "authoring" }
}
```

字段说明：
- content：富文本或结构化数据（如 TTS 文本、quiz 题干）。
- action：交互参数（如 `url`、`capture='environment'`）。
- evidence：需要保存的证据类型（`["photo","text","choice"]`）。
- visibility：条件表达式（如仅祖辈/周末等，后续扩展）。
- title/subtitle 建议用 i18n 对象，运行时按语言回退。

### Route（可选编排层，原 workflow）

```json
{
  "id": "route:forbidden-city:family-lite",
  "museumId": "forbidden-city",
  "name": { "zh-CN": "亲子轻松游" },
  "description": { "zh-CN": "轻量路线，拍照+观察" },
  "audience": { "ages": ["3-6","7-12"], "roles": ["parent"] },
  "stages": {
    "enroute": ["act:forbidden-city:parent-tts-roof-animals"],
    "visit": [
      "act:forbidden-city:gate-photo",
      "act:forbidden-city:find-dragon",
      "act:forbidden-city:victory-photo"
    ],
    "share": []
  },
  "rules": null
}
```

说明：若无 Route，UI 可按 Activity 的 `stage` + `priority` 自然分组排序。

### Preferences（本地偏好）

```json
{
  "ageGroup": "7-12",
  "caregiverRole": "parent",
  "childNickname": "小淘气",
  "activeRouteId": "route:forbidden-city:family-lite",
  "schemaVersion": 2
}
```

### Progress（统一完成度与证据）

LocalStorage 键：`progress:v2`

```json
{
  "forbidden-city": {
    "activities": {
      "act:forbidden-city:find-dragon": {
        "done": true,
        "ts": 1710000000000,
        "evidence": { "photos": [], "text": "我找到了龙", "choice": [] }
      }
    },
    "activeRouteId": "route:forbidden-city:family-lite"
  }
}
```

说明：
- 所有页面读写同一 `activities`，参观指南与打卡页天然互通。
- 证据根据 `Activity.evidence` 类型按需保存。

## 文件组织建议

- `data/museums.json`：Museum 元数据
- `data/activities.json`：Activity 库（可按 museumId 分块懒加载）
- `data/routes.json`：可选 Route
- 运行时代码：
  - `src/preferences.ts`：读写偏好
  - `src/progress.ts`：统一进度读写（get/set/toggle/addEvidence）
  - `src/selectors.ts`：按 museum/age/role 过滤 Activity 与 Route
  - UI 组件：ActivityCard、StageSection、RoutePicker

## 渲染与行为要点

- 参观指南页/打卡页：
  - 过滤条件：`museumId` + `ageGroup` + `caregiverRole`（可见性/受众）。
  - 分区：按 `stage` 渲染；排序优先 `priority`。
  - 勾选/完成：写 `progress.v2[museumId].activities[activityId]`。
- 路线：
  - 若 `activeRouteId` 存在，按 `Route.stages` 顺序渲染；否则使用自然分组。

## 迁移策略（从现有最小改造到理想模型）

1. 后台/工具把现有 `checklists` 批量转换为 `Activity`，保留 `source: {from: 'imported', checklistId}`。
2. 将典型馆和路线输出为 `Route`（可先覆盖 20% 热门馆）。
3. 在代码侧增加 `progress:v2` 读写，保留一段时间双写旧键（必要时）。
4. 页面改用 Activity 渲染；Route 作为可选推荐层。
5. 逐步启用 i18n、quiz、note、可见性表达式等高级能力。

## 命名与 ID 约定

- Activity ID：`act:<museumId>:<slug>`
- Route ID：`route:<museumId>:<slug>`
- 稳定性：ID 必须稳定，不随文案改动而变化；slug 由生成脚本统一规范化。

## 兼容与扩展

- i18n：`title/subtitle/description/name` 建议对象写法，运行时按语言选择。
- 可见性：`visibility` 预留 JSON 表达式（如 `role==parent && ageGroup in [...]`）。
- 推荐：未来可基于 Progress/Preferences/标签统计给出个性化 Route 推荐。

---

如需对接实现细节（schema 校验、生成脚本、选择器/适配器接口），可继续在本文件追加附录。
