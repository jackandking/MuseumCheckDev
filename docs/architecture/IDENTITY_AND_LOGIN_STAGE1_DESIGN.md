# 身份与微信登录 · 阶段 1 设计稿

> 状态：**评审稿（Draft for review）** · 仅设计，不含实现
> 关联：阶段 0「存档码」已上线（`js/backup.js`，提交 `9ed6e74` / `7f7160b`）
> 目标读者：产品 + 后端 + 前端

---

## 0. 一句话

把当前的**设备级匿名身份**（localStorage 里的 `user_id`）升级为**可跨设备、可归属**的账号，但**不引入注册墙**——用微信静默授权换一个稳定 openid，并让老用户的本地数据"认领"过去。

---

## 1. 背景

- 现状：身份 = `localStorage.user_id`（UUID v4，设备级、匿名、无登录）。昵称由 `js/identity.js` 从 `user_id` 派生。
- 阶段 0 已解决"能不能把数据搬走"（存档码，手动导出/导入）。阶段 1 要解决的是"**换设备自动接上**"。
- 两个真实痛点驱动本阶段：
  1. **换机/清缓存丢数据**（存档码是手动兜底，阶段 1 让它自动化）；
  2. **付费权益归属**——订单必须挂到一个稳定主体上，否则换设备即丢。

---

## 2. 现状（Dive Deep）

### 2.1 前端

| 事项 | 现状 | 证据 |
|---|---|---|
| 身份来源 | `localStorage.user_id`，UUID v4，设备级 | `js/identity.js` |
| 默认昵称 | `用户` + `user_id` 末 6 位 | `js/identity.js` / `js/script.js` |
| 后端基址 | 同源 `https://museumcheck.cn` | `config/api-endpoints.js:26-40` |
| 身份是否上传 | **仅作为数据字段**塞进 KV 的 value（`{userId, childNickname, ...}`），**不是账号** | `js/event-wall-service.js:40,104` |
| 数据搬运 | 存档码（阶段 0），纯前端 | `js/backup.js` |

> 结论：**前端没有账号概念**，`user_id` 到了后端也只是事件 JSON 里的一个普通字段。

### 2.2 后端（`letmetry_web_service`）

| 事项 | 现状 |
|---|---|
| 用户体系 | **不存在**。无 user / account / login / session / token 中间件（`package.json` 无 `express-session`/`jsonwebtoken`/`passport`） |
| 已有"身份" | 快手 `openid`（小程序）；支付宝 `user_uuid`（**客户端自报**）；SkillHub 微信支付订单**完全匿名**（仅 `out_trade_no`） |
| 微信支付 | v3 已接入（`skillhubPay.js`），但**只有商户收款、无登录态** |
| 微信登录 | **不存在**（无 `jscode2session` / 网页授权）；现有的 `code2session` 是**快手**（`app.js:25`） |
| 运行 | PM2 进程名 `lws`，端口 3000；env 经 `dotenv` 从 `.env`（部署时由 GitHub secrets 注入） |

**MySQL（`letmetryai`）现有表**（供归属设计参考）：

| 表 | 关键列 | 用途 |
|---|---|---|
| `alipay_payment_orders` | `order_no, user_uuid, points, amount, status` | 支付宝积分订单 |
| `alipay_points_ledger` | `user_uuid, order_no, points, entry_type` | 积分流水 |
| `skillhub_pay_orders` | `out_trade_no, skill_id, amount_fen, payment_code, transaction_id, content_json` | SkillHub 微信支付订单（**无用户字段**） |
| `museum_photos` | `museum_id, kind, photo_url, contributor` | UGC 照片（`contributor` 是**自由文本**，非账号） |
| `kv_keys / kv_callers / kv_billing / kv_metrics` | `caller_id, kv_key, plan, ...` | KV 服务与计费 |
| `api_stats` | `stat_date, method, path_norm, skill, call_count` | 接口监控 |

**路由前缀**：`/payment/*`、`/skillhub/*`、`/mysql/*`、`/api/*`、`/image/*`、`/file/*`、`/monitor/*`、`/auth/*`、`/user/*`（平铺声明，无集中挂载）。

> 关键缺口：**加微信登录 = 从零引入用户表 + 会话/鉴权中间件**。现有的 `contributor`（文本）、`user_uuid`（自报）、快手 `openid` 都不能直接当稳定账号主键。

---

## 3. 目标 / 非目标

**目标**
- 静默拿到一个**稳定、跨设备**的身份锚点；
- 老用户首次授权时把当前设备的 `user_id` **认领**到账号下；
- 为付费权益提供归属主体；
- 为后续防刷打基础（"这个 id 是客户端自造的" 问题）。

**非目标（阶段 1 不做）**
- 手机号 / 密码 / 邮箱 / 注册表单；
- 用户资料（头像昵称之外）、消息推送；
- 多设备数据的自动合并策略（阶段 2 再谈）。

---

## 4. 方案设计

### 4.1 载体选择（关键决策）

| 方案 | 能静默？ | 适用面 | 说明 |
|---|---|---|---|
| **公众号网页授权（`snsapi_base`）** | 微信内：是 | H5 主站 | 微信内置浏览器免弹窗拿 `openid`；**推荐优先** |
| 小程序 `wx.login` | 是 | 小程序 | 需另建小程序；后续可选 |
| 微信 App 登录 | 需确认 | 原生 App | 不适用当前 H5 |

- museumcheck.cn 是 **H5**，主战场在微信内分享 → **首选公众号网页授权**。
- ⚠️ **待确认**：SkillHub 微信支付用的 `wxa50ef55e4b434648` 是**公众号还是小程序 appid**，直接决定能否复用它做网页授权（见 §8 开放问题）。

### 4.2 身份模型（新增表）

| 表 | 关键列 | 说明 |
|---|---|---|
| `identity_accounts` | `id, provider, openid, unionid, created_at, last_seen_at, status` | 账号主体。`provider` ∈ {`wechat_mp`,`wechat_mini`,...}；openid 按 appid 唯一 |
| `identity_links` | `account_id, local_user_id, linked_at` | 把设备级 `user_id` 认领到账号；一台账号可链多个设备 user_id |
| `auth_sessions` | `token_hash, account_id, issued_at, expires_at, last_ua, revoked_at` | 会话令牌（opaque，**不存明文**） |

- `localStorage.user_id` **保留**为"设备标识"，账号是上层——两者不是替代关系。
- `unionid` 只在绑定了微信开放平台后才有（跨公众号/小程序打通），阶段 1 可先不用。

### 4.3 登录 + 认领流程

```
[微信内打开 museumcheck.cn]
   │
   ├─(已是登录态)─► 直接用 token
   │
   └─(未登录)─► GET /auth/wechat/start?redirect=<page>&localUserId=<uuid>
                    │  302
                    ▼
              微信授权(snsapi_base)
                    │  回跳
                    ▼
        GET /auth/wechat/callback?code=..&state=..
                    │
             后端 code2session(appid,secret) ─► openid
                    │
             upsert identity_accounts ─► account_id
             (若带 localUserId) insert identity_links(account_id, localUserId)
             发 token ─► set httpOnly cookie / 回传前端
                    │  302
                    ▼
       回到 <page>，登录态就绪
```

- **降级**：非微信浏览器 / 用户拒绝 / 授权失败 → **保持匿名**，用户无感（不弹注册、不阻断）。
- **认领语义**：只做"关联"（link），不在阶段 1 自动合并多设备数据。

### 4.4 Token 存储（安全权衡，需拍板）

| 方案 | 优点 | 缺点 |
|---|---|---|
| **httpOnly + Secure Cookie** | 免 JS 接触、防 XSS 窃取 | 需处理 CSRF、跨子域 |
| localStorage 回传 | 实现简单、和现有前端一致 | XSS 可窃取 token |

> 建议：**httpOnly Cookie** 为主（本阶段只做同源调用，跨域压力小）；若为兼容后续跨域，再评估短期 access token 方案。

### 4.5 权益归属（付费）

- 现状：`skillhub_pay_orders` 完全匿名，只有 `out_trade_no`；支付宝有 `user_uuid` + `/payment/order/:orderNo/claim` 可参考。
- 阶段 1.5 建议：
  1. 支付**已登录** → 下单时写入 `account_id`；
  2. 支付**未登录** → 生成**一次性领取码**，登录后 `POST /payment/order/:orderNo/claim` 绑定 `account_id`（复用支付宝既有 claim 思路）。
- 这样既不强制登录，也不丢权益。

### 4.6 前端改造（小步）

- 新增 `js/auth.js`：微信内 UA 检测、发起授权、持有/刷新 token、暴露 `Auth.getToken()` / `Auth.getAccountId()`。
- `js/identity.js` 扩展 `linkToAccount()`（首登时带上当前 `user_id`）。
- 存档码可**可选**带上账号绑定状态，便于"新设备登录后自动补齐"。

---

## 5. 数据迁移路径（存量用户）

关键事实：**后端目前没有任何以 `user_id` 为主键的业务数据**（只有 KV 里事件 JSON 的字段）。因此阶段 1 的"迁移"是**认领（link）**，不是"搬库"。

1. 老用户首次微信登录 → 当前设备 `user_id` 写入 `identity_links`。
2. 同一账号在多台设备登录 → 多台设备的 `user_id` 都链到同一 `account_id`（→ 未来多设备合并的依据）。
3. 冲突（两台设备都有打卡记录）→ 阶段 1 **只 link、不合并**，UI 上仍以本设备 localStorage 为准；合并留到阶段 2。

---

## 6. 合规（PIPL + 未成年人）

- 收集 `openid` 属个人信息；**14 岁以下**需监护人同意。
- 本方案**只收静默 openid**，不收手机号/真实姓名 → 把收集面压到最小。
- 必须配套：隐私政策更新、注销通道（阶段 1 至少留"解绑/清除"入口）。
- 现有"不收集孩子信息"的卖点（`together.html` 等）**要保留措辞一致性**——登录拿的是**家长**的 openid，不涉及孩子身份。

---

## 7. 分步落地（每步可独立上线）

| 步 | 内容 | 依赖 | 可独立验证 |
|---|---|---|---|
| 1a | 后端：三张表 + `/auth/wechat/*` 端点 | 微信 appid/secret、网页授权域名 | staging 手工走通 |
| 1b | 前端：微信内静默登录 + 认领当前 `user_id`（失败静默降级） | 1a | 微信内真机 |
| 1c | 观测：登录成功率 / 降级率 | 1a/1b | 报表 |
| 1d | 权益：支付订单挂 `account_id` / claim | 1a | 订单可归属 |
| 2 | 多设备数据合并（可选） | 1b 数据 | 单独设计 |

---

## 8. 风险与开放问题

1. **appid 类型未确认**：`wxa50ef55e4b434648` 是公众号还是小程序？决定用网页授权还是 `wx.login`。
2. **微信网页授权前提**：需**已认证服务号** + 把 `museumcheck.cn` 加入**网页授权域名 / JS 接口安全域名**。
3. **unionid**：跨端打通需绑定**微信开放平台**；阶段 1 可先不做。
4. **非微信浏览器无法静默** → 只能降级为匿名（可接受，但要埋点看清比例）。
5. **token 存储方案**（§4.4）需拍板。
6. **与既有身份整合**：快手 `openid`、支付宝 `user_uuid` 是否并入同一 `identity_accounts`？建议先隔离，阶段 2 再统一。
7. **双份 `script.js` 的坑**：线上跑 `js/script.js`，但 `tests/setup.js` 加载根目录旧副本 → **接入 `auth.js` 时别只改一份**，且测试绿灯不代表线上被覆盖。
8. **后端硬编码回退密钥**：`payModule.js:12-13`、`skillhubPay.js:9-20` 存在硬编码默认 appid/密钥回退，新增微信登录时**不要沿用这种模式**。

---

## 9. 需要你拍板的 3 件事

1. **载体**：确认走"公众号网页授权"，还是先做小程序？
2. **appid**：确认 `wxa50ef55e4b434648` 的账号类型，并提供登录用的 appid/secret 来源（走 GitHub secrets）。
3. **范围**：阶段 1 是否**只做登录+认领**（权益归属放 1d 单独做）？

> 确认后，我可以先出**后端 schema + `/auth/wechat/*` 设计细节**（仍只文档），或直接进 1a 实现。

---

## 附录 A：本稿所依据的现状证据

- 后端无用户体系：`letmetry_web_service/package.json`（无 session/jwt/passport 依赖）
- 快手 code2session：`app.js:25`
- 微信支付 v3（无登录态）：`skillhubPay.js:9-20`；订单表 `scripts/skillhub_pay_schema.sql`
- 支付宝 `user_uuid` + claim：`alipayPayment.js:77-78`、`app.js:183-213`；表 `payment-schema.sql`
- 前端身份：`js/identity.js`、`js/backup.js`
- 前端上报字段：`js/event-wall-service.js:40,104`
- 前端基址：`config/api-endpoints.js:26-40`
