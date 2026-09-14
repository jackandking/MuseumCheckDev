# 仓库长效治理 Playbook（多任务并行版）

> 背景：idea 一来就让 AI 开干。若所有 AI 都直接改动 `dev`/`main` 主检出版本，
> 不同会话的 WIP 会互相堆叠、无法并行、且随时可能被误推上线。
> 本 playbook 用 **git worktree 隔离 + 每日巡检 watchdog** 解决。

## 1. 核心原则
- **主检出版本（dev / main）永远保持干净可部署。** 任何 AI 任务都不直接在它上面留 WIP。
- **每个 idea = 一个独立 worktree + 一个 feature 分支。** 多任务天然并行、互不碰撞。
- **收尾即合并即清理。** 任务完成 → 合并回 dev → 删除 worktree，不留孤儿。

## 2. 启动一个新任务（并行隔离）
在新 idea 来时，先开 worktree（不要直接在 MuseumCheck/ 里改）：

```bash
# 前端
git -C /Users/jak/MuseumCheck worktree add -b idea/<slug> /Users/jak/MuseumCheck-<slug> dev
# 后端
git -C /Users/jak/letmetry_web_service worktree add -b idea/<slug> /Users/jak/lws-<slug> main
```

然后让 AI 在 `/Users/jak/MuseumCheck-<slug>`（或 `lws-<slug>`）里干活。
`<slug>` 用简短英文，例如 `photo-mysql-pipeline`、`shaanxi-seed`。

收尾：
```bash
git -C /Users/jak/MuseumCheck checkout dev && git merge idea/<slug>   # 经 review
git -C /Users/jak/MuseumCheck worktree remove /Users/jak/MuseumCheck-<slug>
```

> 辅助脚本：`devops/scripts/new-task-worktree.sh <repo:fe|be> <slug>` 一键开 worktree。

## 3. 每日巡检 Watchdog（长效治理循环）
已配置**每日 08:00 本地递归自动化** `Repo cleanliness watchdog`，只读扫描：
- 两个仓库的 `git status --short` / `status -sb`（未提交、未跟踪、领先/落后远程）
- `git worktree list`（列出所有并行任务，标记 >7 天未动的孤儿 worktree 待清理）
- `check-ignore .workbuddy/`（若返回空，警告 agent 记忆有泄露风险）

只读、不改任何东西。每日晨间给你一份"干净 / 脏"清单 + 建议动作。

## 4. 收尾 / 分流规则（针对已堆积的 WIP）
发现脏文件时按性质分流，**绝不把异构 WIP  lump 成一个大提交**：
- **运行时产物**（`data/museums-meta.json`、`js/museums-meta.js`）：先确认是否由脚本重生，再决定是否随功能提交（它们改的是线上博物馆清单）。
- **devops 工具 / 脚本 / 报告**（`devops/scripts/*`、`devops/tools/*`）：纯工程资产，可自由提交，不触线上。
- **测试配置**（`playwright.config.js`）：测试专用，提交安全。
- **设计文档**（`docs/guides/*`）：自由提交。
- **`.workbuddy/` / `__pycache__/`**：已在 `.gitignore` 排除，永远不提交。

推送前提醒：前端推 `dev` 会经 GitHub Actions 自动部署到 prod，务必先 review 是否会改线上行为。

## 5. .gitignore 底线
必须排除（已加）：`.workbuddy/`（agent 本地笔记/业务上下文，含敏感信息）、`__pycache__/`、`*.pyc`。
若日后要跟踪 project-level skill，用 `!.workbuddy/skills/<name>/` 例外放行，不要整体放开。
