# 三星堆博物馆 · 镇馆之宝数据补充报告

**执行时间**：2026-09-06
**操作对象**：四川广汉三星堆博物馆（`dedupe_key = 四川省_四川广汉三星堆博物馆`，一级馆）
**为什么选它**：全站 7045 个博物馆仅 33 条 treasure 数据，已 seeded 的 10 个头部馆各 3 条；该馆此前 **0 条 treasure、image_url 为 null**，是典型"资料不足"的馆。

## 入库结果（已写回生产库并读回校验通过）

### 3 件镇馆之宝 → `museum_treasures`
| 文物 | 年代 | 类别 | 图片授权 | 作者/来源 |
|------|------|------|----------|-----------|
| 青铜大立人像 | 商代晚期 | 青铜器 | CC0 | Gary Todd / Wikimedia Commons |
| 青铜神树 | 商代晚期 | 青铜器 | CC0 | Gary Todd / Wikimedia Commons |
| 金面具 | 商代晚期 | 金器 | CC BY 2.0 | momo / Wikimedia Commons |

三张图均为 Wikimedia Commons 直链（1280px 缩略图，已验证 HTTP 200），并写入 `rights_type / license / copyright_holder / attribution / imageRightsNote` 等版权字段（owner 2026-09-06 决策：必须带版权元数据）。

### 博物馆照片 → `museums.image_url`
- 外观照片（Public domain / Jason Zou）已写入 `museums.image_url`（原 null → 已设置）。

## 用到的后端已有 API
1. **`POST /api/museums/treasures`** — 批量 upsert 三件 treasure（仅写 `museum_treasures` 表，幂等）。
2. **`POST /mysql/query`（UPDATE）** — 精准 `SET image_url=? WHERE dedupe_key`，仅改照片字段。

## ⚠️ 工程决策（批判性提示）
**没有**用 `/api/museums/ingest` 写博物馆照片：该端点的 `ON DUPLICATE KEY UPDATE` 会把未传入的字段（collection_count、precious_artifacts_count 等）置为 NULL，会**清掉已有馆藏统计**。已用精准 UPDATE 替代，并验证馆藏数 1100 / 珍贵文物 599 等原数据完好无损。

## 复现脚本
`devops/scripts/seed_sanxingdui_treasures.py`（POST treasures + 精准 UPDATE + 读回校验；未提交 git）。

## 备注 / 下一步
- 图片为 Wikimedia 第三方授权内容，本服务仅提供信息整理，**不含图片版权授权**（已在每条 `imageRightsNote` 标注）。
- 若要让 `treasures.html` 等前端真正展示，需确认前端是从本地 bundled 数据还是从此 API 拉取（代码注释写明前端走 bundled 本地数据，而非 `/api/museums/treasures`）。
- 同样的"挑缺数据馆 → 补 3 宝 + 馆照"流程可批量复用到其他 0-treasure 头部馆。
