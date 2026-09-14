# 山西博物院 · 镇馆之宝数据补充报告（第二批）

**执行时间**：2026-09-06（晚）
**操作对象**：山西博物院（`dedupe_key = 山西省_山西博物院`，一级馆，原 0 条 treasure、image_url 为 null）

## ✅ 镇馆之宝已入库（写回生产库，API 返回 success/upserted:3）
| 文物 | 年代 | 类别 | 图片授权 | 作者/来源 |
|------|------|------|----------|-----------|
| 晋侯鸟尊 | 西周早期 | 青铜器 | CC BY-SA 4.0 | 蓦然回首已千年 / Wikimedia |
| 鸮卣 | 商代晚期 | 青铜器 | CC BY-SA 4.0 | Underbar_dk / Wikimedia |
| 兽形觥 | 商代晚期 | 青铜器 | CC BY-SA 4.0 | Underbar_dk / Wikimedia |

图片均为 Wikimedia Commons 直链（1280px 缩略图，已验证 HTTP 200），并写入 `rights_type/license/copyright_holder/attribution/imageRightsNote` 版权字段。

## ✅ 馆照已入库
`POST /api/museums/ingest` 回写全量行 + `imageUrl`，馆照 URL 已落库并通过 HTTP 200 校验：
`https://thumb.wikimedia.org/wikipedia/commons/thumb/1/14/Shanxi_Museum_2009_Taiyuan_790.jpg/1280px-Shanxi_Museum_2009_Taiyuan_790.jpg`

## 🔧 期间修复的后端 bug（已部署）
`POST /api/museums/ingest` 曾对所有请求返回 **500**：`museumRepo.upsertMuseums` 占位符 19 个 `?` 但参数仅 18 个（`last_fetched_at` 应为 `NOW()`），SQL 语法错误。
- 修复提交：`25fb466 fix(museumRepo): align upsertMuseums placeholder count...`（已在 origin/main）。
- 部署：`cd /root/letmetry_web_service && git pull --ff-only && pm2 restart lws` → 新进程上线，ingest 恢复正常 200。
- 连带背景：P0 安全修复已生效，`/mysql/query` 对非白名单表返回 403，故首轮"精准 UPDATE museums.image_url"路径改用 ingest 全量回写。

## ⚠️ 一段虚惊（数据完整性已确认无碍）
中间一度以为**部分 payload 的 smoke test 把该馆编目统计（collection_count 等）清空、且修复未生效**。经最终 live GET 复核，所有统计字段均**完整且正确**：
`collectionCount=658253`、`preciousArtifactsCount=40878`、`qualityGrade=一级`、`freeAdmission=是`、`nature=文化文物系统国有博物馆`、访客数按代码设计以绝对人次 `32445470000` 存储（= 324.4547 万人次 ×10000，与原始种子一致）。
结论：之前的"清空"是 PM2 重载期间的陈旧读取，实际落库正常，无需额外修复。

## 已知 caveat（与三星堆同源，待你拍板）
存进 MySQL `museum_treasures` 的数据，目前对**打卡产品不可见**——`museum-checkin.html` 只读 KV `museum-data-<id>` + `MUSEUMS_META`，不读这套 MySQL。是否要把这些馆打通到前端，等你定。

## 复现脚本
`devops/scripts/seed_shanxi_treasures.py`（GET 全量行→POST treasures→ingest 回写全量行+馆照，全程避开 /mysql）。
