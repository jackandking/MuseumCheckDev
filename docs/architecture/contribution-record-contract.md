# 家庭贡献记录契约

MuseumCheck 把家庭在真实参观中补充的资料保存为 `ContributionRecord`。它覆盖个人新馆、门口照片、展品候选与任务照片，避免这些入口各自形成不可审核的存储方式。

## 隐私与可见性

- 默认是 `private`：创建个人新馆和完成任务不会自动上传或公开。
- 只有用户明确勾选，记录才可进入同行活动（`event`）或审核队列（`review_queue`）。
- `review_queue` 不是公开页；只有 `review.status = approved` 的记录可作为公开图集候选。
- 记录不保存孩子姓名、家庭昵称、联系方式或精确到人的参观轨迹。活动内照片同样不显示昵称。
- 用户选择的公开授权以 `consent` 保存，`revocable: true` 表示后续审核工具必须支持撤回/下架。

## 记录形状

```json
{
  "schemaVersion": 1,
  "id": "contrib-…",
  "kind": "museum | entrance_photo | treasure_candidate | task_photo",
  "museum": { "id": "…", "name": "…", "city": "…" },
  "target": { "taskIndex": 1, "taskTitle": "…", "treasureName": "…" },
  "content": { "imageUrl": "https://…", "text": "…" },
  "provenance": { "source": "task_photo", "capturedAt": 0 },
  "consent": { "eventScope": "private | event", "publicScope": "none | review", "eventId": "…", "revocable": true },
  "review": { "status": "pending | approved | rejected", "updatedAt": 0 },
  "visibility": "private | event | review_queue | public",
  "createdAt": 0
}
```

`js/contribution-records.js` is the canonical client adapter and stores records under `museumcheck-contribution-records`. Existing photo keys remain read-only compatibility fallbacks; no historical data is rewritten.

## Review boundary

This static client deliberately has no public “approve” action. An unauthenticated approval page would let any link-holder approve a family photo. A future protected reviewer workflow may change `review.status` and then surface only approved records in public exhibit/task galleries.
