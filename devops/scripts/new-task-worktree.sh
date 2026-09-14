#!/usr/bin/env bash
# new-task-worktree.sh — 为一个新 idea 开隔离 worktree（并行多任务不污染主 checkout）
# 用法:
#   ./new-task-worktree.sh fe <slug>     # 前端 MuseumCheck (基于 dev)
#   ./new-task-worktree.sh be <slug>     # 后端 letmetry_web_service (基于 main)
# 例如:
#   ./new-task-worktree.sh fe photo-mysql-pipeline
set -euo pipefail

REPO="${1:-}"
SLUG="${2:-}"

if [[ -z "$REPO" || -z "$SLUG" ]]; then
  echo "用法: $0 <fe|be> <slug>" >&2
  exit 1
fi

if [[ "$REPO" == "fe" ]]; then
  ROOT=/Users/jak/MuseumCheck
  BASE=dev
  WT=/Users/jak/MuseumCheck-${SLUG}
elif [[ "$REPO" == "be" ]]; then
  ROOT=/Users/jak/letmetry_web_service
  BASE=main
  WT=/Users/jak/lws-${SLUG}
else
  echo "未知 repo: $REPO (用 fe 或 be)" >&2
  exit 1
fi

if [[ -e "$WT" ]]; then
  echo "目标路径已存在: $WT" >&2
  exit 1
fi

BR="idea/${SLUG}"
git -C "$ROOT" worktree add -b "$BR" "$WT" "$BASE"
echo ""
echo "✅ worktree 已开:"
echo "   路径: $WT"
echo "   分支: $BR (基于 $BASE)"
echo "   让 AI 在此目录工作，完成后: git merge $BR && git worktree remove $WT"
