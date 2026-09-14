# 博物馆馆图纠错 · 审核发布流水线 — 技术方案

> 状态：设计稿（未实现）。用户决策：先出方案、待审批；候选照**必须上传**（仅走 `/image/upload`，**不接受用户粘贴 URL**），存上传返回的 URL，不存 base64。
> 关联需求：用户发现博物馆照片不对，想提供更好的替代；**提交照片需审核通过才能发布**。

---

## 1. 背景与现状（已勘察，非假设）

仓库里这条流水线**已经"半建成"，只是没接通**。关键事实（均来自代码）：

| 能力 | 位置 | 现状 |
|---|---|---|
| 馆图来源 | `currentMuseum.image` ← `js/museum-data-loader.js` 读 KV `museum-data-<id>`（Tier2，`:136`/`:277`），回落 `museums-meta.js.image` | 活。改 KV 即全站生效 |
| 举报错误 | `js/museum-checkin.js:2284` `reportImageError()` 累加 `reportCount`/`reporters` | 活，但只计数 |
| 上传替代照（死字段） | `js/museum-checkin.js:2370` `uploadReplacementImage()` 推 `{imageUrl, uploadedBy, uploadedAt, approved:false}` 入 `replacementImages[]`，**存 base64** | 活写、**`approved` 永不被翻转/读取 → 孤儿死数据** |
| 审核状态机 | `js/contribution-records.js:16` `REVIEW_STATES=['pending','approved','rejected']`；`:39-40` `visibility` 仅 `approved` 才 `public` | 真·审核模型，但只用于亲子任务照，**无 admin 翻转 pending→approved** |
| 门口打卡"无图贡献"入口（死胡同） | `js/museum-checkin.js:4571-4605` `handleMuseumPhotoSubmit` → `saveContributedMuseumPhoto` 只写 `localStorage` `contributedMuseumPhotos`，`:4473` 读回，纯客户端 | 活但**永不发布**（无 KV、无审核） |
| 举报解锁上传的门槛 | `js/museum-checkin.js:2187` `IMAGE_ERROR_THRESHOLD=3`，`:6706` 达阈值解锁替换上传 UI | 可复用为反垃圾闸 |
| 发布扳机（改馆图） | `admin/museum-data-manager.html:1570` `loader.saveToKVStore(data.id, data)` 把含 `image` 的馆对象写回 `museum-data-<id>` KV | 现有"上线"唯一入口 |
| 图片上传 | `js/image-upload-util.js:110-216` `ImageUploader.uploadImage` POST `FormData` 到 `/image/upload`，返回 URL | 活，family-photo-sharing 在用 |
| KV 前端写入 | `fetch(API_ENDPOINTS.KV_STORE, {method:'POST', body:{key,sortKey,value}})`（多处于 `js/museum-checkin.js:2322/2401`、`contribution-records.js:73`） | **无鉴权**（与现有 admin 页同等级） |
| 后端 KV 管理接口 | 记忆：后端已有 `/api/kv/admin/*` + `KV_ADMIN_KEY` 鉴权（MySQL `kv_metrics` 同机制） | 可复用为"发布"服务端鉴权 |

**结论**：不需要从零造。要做的是——把"用户举报+上传"落到一个**待审 KV 队列**，新建一个**轻量 admin 审核页**翻转状态，审核通过时**走后端 `KV_ADMIN_KEY` 写回 `museum-data-<id>.image`**。

---

## 2. 目标流水线

```
① 用户发现馆图不对 → ② 举报错误 + 上传替代照(必须上传) → ③ 待审队列 KV(状态=pending)
   → ④ 管理员审核(admin 页) → 通过: ⑤ 写回 museum-data-<id>.image 上线
                            → 驳回: status=rejected, 通知用户, 可重投
```

---

## 3. 数据模型

### 3.1 新建 KV key（推荐）
- **key**：`museumcheck-photo-candidates`
- **列举方式**：KV 是 key-value，无原生 list。采用与现有 `museumcheck-visit-signals` 等一致的模式——`?key=museumcheck-photo-candidates&sortKey=*` 前缀范围读；每条候选用独立 `sortKey`（如 `<museumId>:<candidateId>` 或纯 uuid），value 为候选对象。
- **value（单条候选）**：

```json
{
  "id": "uuid-v4",
  "museumId": "forbidden-city",
  "submitterId": "<localStorage uid 或 anonymous>",
  "submittedAt": "2026-09-12T09:00:00Z",
  "originalImageUrl": "<举报时刻 museum-data-<id>.image 的快照，便于追溯>",
  "candidateImageUrl": "<经 /image/upload 上传后由后端返回的 URL>",
  "source": "upload",
  "reason": "<文本：馆图哪里不对>",
  "status": "pending" | "approved" | "rejected",
  "reviewedBy": "<admin id>",
  "reviewedAt": "ISO",
  "reviewedNote": "<驳回/通过备注，可选>",
  "publishedImageUrl": "<= approved 时置为 candidateImageUrl>"
}
```

### 3.2 与 `contribution-records` 同构
直接复用其 `REVIEW_STATES` 与 `visibility` 门控语义（`status==='approved'` 才可视/可发布），保证全站审核语义一致。

### 3.3 存储形态（用户决策）
- 候选照**必须经由 `/image/upload` 上传**，不接受用户粘贴任意 URL（堵住外链/恶意 URL 注入面）。
- 存上传后后端返回的 **URL**（文件本体落盘在后端，URL 由我们自己的存储域产生，可控）。
- **不存 base64**（纠正现状 `replacementImages` 的 base64 反模式，避免撑大 KV）。

---

## 4. 前端改动

### 4.1 举报 / 上传入口
- 在**打卡页**与**馆详情页**（门口打卡无图时已有贡献入口，见 `:3361`、`:4571`）新增「馆图不对？举报并上传更好的」按钮 → 打开 modal：
  - 选/填原因（文本）
  - 上传替代照（**必须上传**，复用 `image-upload-util.js` `ImageUploader` POST 到 `/image/upload`）
  - 提交
- 复用现有 `IMAGE_ERROR_THRESHOLD=3` 作为反垃圾闸（可选，推荐保留）：达阈值才解锁上传替换 UI；低于阈值仍可"纯举报"。

### 4.2 提交逻辑
- 新增 `submitPhotoCandidate(museumId, {candidateImageUrl, source, reason})`：
  - 写 KV `museumcheck-photo-candidates`（新记录 `status:'pending'`，同时存 `originalImageUrl` 快照）。
  - **不**直接改 `currentMuseum.image`（待审，未发布）。
- 本地即时预览：保留 `handleMuseumPhotoSubmit` 的"无图馆先本地预览"体验，但**同时提交进待审队列**——打通原本的 localStorage 死胡同，使贡献最终可被审核发布。

### 4.3 废弃 / 迁移
- `image-error-report.replacementImages[]` 的 `approved` 死字段：新流程不再依赖它；旧数据可保留或迁移至新 key。建议 M4 清理。

---

## 5. 后端 / 接口

### 5.1 上传（已有，无需新接口）
- `POST /image/upload`（`image-upload-util.js` 在用）→ 返回图片 URL。

### 5.2 发布（关键，必须服务端鉴权）⚠️
- **审核通过 → 写回 `museum-data-<id>.image` 必须走后端，带 `KV_ADMIN_KEY`，不能前端直写。**
- 新增轻接口（或复用现有 `/api/kv/admin/*`）：例如 `POST /api/kv/admin/photo-candidate/publish`
  - 校验 `KV_ADMIN_KEY`（服务端，不暴露给浏览器）
  - 读 `museum-data-<id>` → 改 `image = candidateImageUrl` → 写回 KV（读-改-写）
  - 把候选记录 `status='approved'`、`publishedImageUrl=candidateImageUrl`、`reviewedBy/reviewedAt` 落库
- **原因**：当前前端 KV 写入无鉴权，若发布也走前端，任何人拿 admin 页即可篡改任意馆图。服务端 `KV_ADMIN_KEY` 把"能审核的人"与"能改线上图的人"绑定。

### 5.3 驳回
- `POST /api/kv/admin/photo-candidate/reject`：校验密钥 → 置 `status='rejected'` + `reviewedNote`。

### 5.4 列表
- `GET /api/kv/admin/photo-candidates?status=pending`（或复用 KV `sortKey=*` 范围读 + 服务端过滤），供 admin 页拉取 pending。

### 5.5 图片安全（上传与发布前）
- 候选照**强制走 `/image/upload`**，文件落盘在我们自己的存储域，URL 由后端产生 → 不存在"用户粘贴外链/恶意 URL"注入面（这是要求必须上传的核心安全收益之一）。
- 仍建议后端在上传时做一次**类型/大小校验**（仅放行 `image/*`、限合理体积），并可选对发布前的候选做一次 `HEAD` 复核；审核人肉眼核验为最后兜底。

---

## 6. Admin 审核页

- **新建 `admin/museum-photo-review.html`**（沿用 `admin/museum-data-manager.html` 风格）：
  - 列出 pending 候选（调 5.4）
  - 每条：原图 vs 候选照并排预览、museumId、提交人、原因、时间
  - **通过** → 调 5.2 发布接口（写回 `museum-data-<id>.image`）
  - **驳回** → 调 5.3
  - 已处理列表（approved/rejected）只读回顾
- **admin 页访问鉴权**（开放问题，推荐）：发布动作已服务端 `KV_ADMIN_KEY` 兜底；admin 页本身至少加一个访问口令（或限内网/复用现有 admin 机制），避免公开可点。

---

## 7. 发布后生效

- 写回 `museum-data-<id>.image` 后，`museum-data-loader.js` 读 Tier2 KV → **所有用户下次加载即见新馆图**。
- **无 CDN 缓存问题**：馆图走 KV API 读取（非 `js/*.js?v=` 静态资源），不存在 immutable 30 天缓存；发布即时生效，无需 bump 版本号 / purge。

---

## 8. 安全与风险

| 风险 | 处置 |
|---|---|
| 前端 KV 写入无鉴权 | 候选**提交**可匿名（反正待审）；但**发布写回**强制服务端 `KV_ADMIN_KEY` |
| 用户上传恶意图片 | 上传即走我们的 `/image/upload`（类型/体积校验 + 落盘域可控）；审核人肉眼核验为最后兜底 |
| 反垃圾 | 保留 `IMAGE_ERROR_THRESHOLD=3`；建议要求登录后提交 |
| 审计 | 通过/驳回记录 `reviewedBy`/`reviewedAt`/`reviewedNote` |
| 旧图丢失 | 发布前存 `originalImageUrl` 快照；可选保留历史备份 |

---

## 9. 测试

- **e2e**（`e2e/`）：举报→上传(必须走 `/image/upload`)→pending→(admin 通过)→馆图更新 happy path；驳回 path；无图馆贡献入口；发布后刷新即见新图。
- **jest 单测**（`tests/`）：`submitPhotoCandidate` 写出结构正确；`status` 机 pending→approved/rejected 迁移；发布接口（mock 后端）正确写回 `museum-data-<id>.image`。
- 注意：审核页属 admin，e2e 可走一个带 admin 凭证的桩，不必真连生产 KV 密钥。

---

## 10. 实施里程碑

- **M1 提交侧**：数据模型 + 前端举报/上传入口 + 落 KV 待审（`status=pending`）。不动发布，无线上影响。
- **M2 审核侧**：后端发布/驳回接口（`KV_ADMIN_KEY` 鉴权）+ `admin/museum-photo-review.html`。
- **M3 接通**：发布写回 `museum-data-<id>.image` + e2e + 部署 + 验证。
- **M4 收尾**：废弃/迁移 localStorage 死胡同与 `replacementImages` 死字段；加反垃圾与图片 URL 校验；admin 页访问鉴权。

---

## 11. 开放问题（待你拍板）

1. **admin 页访问鉴权强度**：访问口令 / 限内网 / 复用现有 admin 机制？（发布动作已服务端密钥兜底）
2. **原图快照**：是否存 `originalImageUrl` 以便追溯与一键回滚？（推荐存）
3. **同馆多候选**：是否去重/合并（同一馆 pending 多条时）？
4. **旧图处理**：发布后旧图是否保留备份？
5. **举报门槛**：保留 `IMAGE_ERROR_THRESHOLD=3`，还是允许任意登录用户随时提交替代？

---

## 附：关键代码锚点速查

- 馆图读取：`js/museum-data-loader.js:136,277`
- 举报计数：`js/museum-checkin.js:2284` `reportImageError`
- 替代照死字段：`js/museum-checkin.js:2370` `uploadReplacementImage`；`:2187` 阈值；`:6706` 解锁
- 无图贡献死胡同：`js/museum-checkin.js:4473,4571-4605` `getContributedMuseumPhoto`/`handleMuseumPhotoSubmit`
- 审核状态机模板：`js/contribution-records.js:16,39-40`
- 上传工具：`js/image-upload-util.js:110-216`
- 发布扳机：`admin/museum-data-manager.html:1570` `saveToKVStore`
- 现有 admin 重置（无审核）：`admin/admin-treasure-reports.html:383` `resetReport`
