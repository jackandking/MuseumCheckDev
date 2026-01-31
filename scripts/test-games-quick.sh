#!/bin/bash

# 快速游戏功能测试脚本
# 用于在提交前快速验证所有游戏的基本功能

set -e

echo "🎮 开始快速游戏测试..."
echo ""

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 测试计数
TOTAL=0
PASSED=0
FAILED=0

# 测试单个游戏
test_game() {
    local game=$1
    local test_file=$2
    
    TOTAL=$((TOTAL + 1))
    
    echo -n "测试 $game... "
    
    if npx playwright test "$test_file" --quiet 2>&1 | grep -q "1 passed"; then
        echo -e "${GREEN}✅ 通过${NC}"
        PASSED=$((PASSED + 1))
    else
        echo -e "${RED}❌ 失败${NC}"
        FAILED=$((FAILED + 1))
    fi
}

# 运行所有游戏测试
test_game "迷宫游戏" "e2e/maze-game-auto.spec.ts"

# 显示总结
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "测试总结:"
echo "  总计: $TOTAL"
echo -e "  ${GREEN}通过: $PASSED${NC}"
if [ $FAILED -gt 0 ]; then
    echo -e "  ${RED}失败: $FAILED${NC}"
fi
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ $FAILED -gt 0 ]; then
    echo ""
    echo -e "${RED}⚠️  有游戏测试失败，请修复后再提交${NC}"
    exit 1
else
    echo ""
    echo -e "${GREEN}🎉 所有游戏测试通过！${NC}"
    exit 0
fi
