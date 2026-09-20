# 新任务提示词：museumcheck.cn 图片版权署名落地 + 安全扩充图源

> 复制下面全部内容作为新任务的起始 prompt 即可。本文件自包含，无需依赖上一轮对话。

---

## 任务目标
museumcheck.cn 的亲子博物馆打卡页提供「馆照 + 3 件镇馆之宝」图片，目前图全部来自 Wikimedia Commons（CC0/CC BY/CC BY-SA），已自托管到 `museumcheck.cn/images/`。现在要完成三件事：
1. **把已有的版权/来源信息真正显示给终端用户**（当前数据齐全但前端从不渲染）；
2. **安全扩充图源**到 CC0 通用图库（Unsplash / Pexels），用于馆照；
3. **建立可审计 + 可下架的能力**（加 `sourceType` 字段 + 护栏 + 网站免责声明）。

## 已与用户敲定的政策（不要再争论，直接执行）
1. **图源与授权白名单**
   - 允许：① Wikimedia Commons（CC0 / CC BY / CC BY-SA，已在用）；② CC0 通用图库 **Unsplash / Pexels**（仅用于**馆照**，前端标注「示意图 / 非官方建筑照」）；③ 官网图仅限 a. 官网有明确「可转载 / 免费使用」声明，或 b. 标注来源 + 下架就绪 + 编辑性/参考性使用。
   - **一律排除**：**CC BY-NC（非商业，禁止任何商用）**、**无任何许可声明的官网图**。
2. **风险姿态（用户原话定性，写进免责声明）**：网站当前**不收费**；Skill 收的是信息检索与整理的**服务费**，**不包含任何图片版权授权**；图片版权声明**原样 passthrough 给客户**；使用图片的终端用户**自决如何使用**；出问题**随时下架就绪**。
3. **passthrough 的前提**：只有当图本身带有效许可时才能 passthrough；无许可的官网图没有东西可搬，「用户自决」条款**不能凭空生成授权** —— 这正是不碰无许可官网图的原因。

## 具体要做（3 项）
### ① 前端渲染署名块（最急，当前缺失）
- **现状**：`license` / `copyrightHolder` / `attribution` / `sourceUrl` 在 `data/museums-meta.json`、`js/museums-meta.js`（由 `devops/tools/generate-museums-meta-js.js` 生成）、KV `museum-data-<id>`、MySQL `museum_treasures` 里**都齐全**，但 `js/museum-checkin.js` 和 `treasures`/`pilot` 等页面**只用了 `collection.imageUrl` 和 `name`，从不渲染署名**。
- **要求**：在每张藏品图 / 馆照下方渲染轻量署名块 = `attribution`（如「CC BY-SA 4.0, via Wikimedia Commons」）+ 可点击的 `sourceUrl`。覆盖 museum-checkin.html、treasures.html、pilot.html 等用到 collections / 馆照的页面。
- **为什么重要**：CC BY / CC BY-SA 许可的法定义务就是保留署名与许可，这是 passthrough 的法律核心，也是用户承诺「原样搬给客户」的落地点。

### ② 加 `sourceType` 字段 + 入库护栏（防错用）
- 在藏品/馆照数据模型（meta.json 的 `collections` 项、KV、MySQL `museum_treasures`）加 `sourceType`，取值：`commons-cc` / `unsplash` / `pexels` / `official-takedown-ready`。
- 补图脚本（`devops/scripts/supplement_*.py`，模板在 `skills/museum-selfhost-supplement/supplement_museum_template.py`）落库时写入该字段。
- **护栏**：只有 `sourceType` ∈ {commons-cc, unsplash, pexels} 或 official 带明确许可的才允许入库；CC BY-NC / 无许可直接拒绝写入。

### ③ 网站补免责声明（对齐 Skill 现有文案）
- 在打卡页 / 关于页加一句，与 `museum-treasures` skill 免责声明对齐：「本服务收取的是信息检索与整理服务费，不包含任何图片版权授权。图片版权归原作者所有，按其原始许可声明使用；使用图片产生的任何后果由使用者自行承担。」
- 在页脚或图片署名块旁提供**下架联系入口**（邮箱 / 表单），落实「随时下架」。

## 关键约束（来自 `museum-selfhost-supplement` skill，动手前必读）
- **数据四端**：`data/museums-meta.json` → `js/museums-meta.js`（generate 脚本生成）→ KV `museum-data-<id>`（AWS keyValueStore，`sortKey=museum`）→ MySQL `museums` 行 + `museum_treasures`（POST `/api/museums/ingest`、`/api/museums/treasures`，读带 `Origin: museumcheck.cn`）。
- **CDN 铁律**：`js/museums-meta.js` 被 CDN `immutable, max-age=2592000` 缓存。改了 meta 后必须给 8 个 HTML 消费者（index / museum-checkin / pilot / treasures / together + quiz/{session,wrong-questions,index}.html）的 `js/museums-meta.js` 引用 bump `?v=<日期>`（together 用 `?v=together-<日期>`），且**拆两次提交**：① 先推数据+js 并 `git push origin dev:prod`；② 轮询源站 `curl -sk -H "Host: museumcheck.cn" "https://43.143.241.181/js/museums-meta.js" | wc -c` 稳定后，再单独 bump ?v= 提交推送。最后 `curl` 验证 CDN 新键字节数 = 本地。当前线上 `?v=20260919-1`，meta.js 77703 字节 / 122 馆。
- **署名映射坑**：藏品 dict 键是 `holder` / `attr`，落库映射成 `copyrightHolder` / `attribution`（别抄反，2026-09-19 曾错写成 "CC"）。
- **图片自托管**：`POST https://museumcheck.cn/image/upload`（multipart `file`），409 幂等，上传前 `maybe_resize` 循环缩到 ≤900KB。
- **查四端再动手**：动任一块前先跑四端核查，别凭印象（曾误以为河南博物院没补，实则只漏 MySQL 馆照）。

## 验证清单
- 前端：实际打开 museum-checkin.html，确认每张图下方出现署名块且 sourceUrl 可点。
- 数据：抽查 3~5 馆，确认 `sourceType` 字段已落 KV / MySQL / meta。
- CDN：新 ?v= 键字节数 = 本地；grep 确认新字段进文件。
- 免责声明：页面可见，下架入口可达。

## 不要做
- 不要抓取 CC BY-NC 或无许可声明的官网图。
- 不要把署名「仅存不显」——本任务核心就是显示出来。
- 不要合并「数据提交」与「?v= bump」为一次提交（会 CDN race）。
- 不要动已有 Commons 馆的署名数据（除非发现又是 "CC" 占位错误，按 `（省份_馆名）` 反查脚本回填）。
