#!/bin/bash

# 文档一致性检查脚本
# 检查文档与代码的一致性，防止文档过时

set -e

echo "📚 开始文档一致性检查..."
echo ""

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

ERRORS=0
WARNINGS=0

# 1. 检查虚拟按钮实现一致性
echo "🔍 检查虚拟按钮实现..."

GAMES=(maze tank-battle space-invaders snake)
for game in "${GAMES[@]}"; do
    file="games/${game}.html"
    
    if [ -f "$file" ]; then
        # 检查是否使用了正确的 KeyboardEvent 实现
        if grep -q "new KeyboardEvent" "$file"; then
            echo -e "  ${GREEN}✅${NC} $game: 使用正确的 KeyboardEvent"
        else
            echo -e "  ${RED}❌${NC} $game: 未使用 KeyboardEvent（可能使用了错误的实现）"
            ERRORS=$((ERRORS + 1))
        fi
        
        # 检查是否暴露了 gameInstance
        if grep -q "window.gameInstance" "$file"; then
            echo -e "  ${GREEN}✅${NC} $game: gameInstance 已暴露到全局"
        else
            echo -e "  ${YELLOW}⚠️${NC} $game: gameInstance 未暴露（测试可能失败）"
            WARNINGS=$((WARNINGS + 1))
        fi
    else
        echo -e "  ${YELLOW}⚠️${NC} $game: 文件不存在"
        WARNINGS=$((WARNINGS + 1))
    fi
done

echo ""

# 2. 检查测试覆盖一致性
echo "🔍 检查测试覆盖..."

for game in "${GAMES[@]}"; do
    test_file="e2e/${game}-game-auto.spec.ts"
    
    if [ -f "$test_file" ]; then
        echo -e "  ${GREEN}✅${NC} $game: 测试文件存在"
    else
        echo -e "  ${RED}❌${NC} $game: 缺少测试文件 $test_file"
        ERRORS=$((ERRORS + 1))
    fi
done

echo ""

# 3. 检查 package.json 中的测试命令
echo "🔍 检查 package.json 测试命令..."

if grep -q '"test:games"' package.json; then
    echo -e "  ${GREEN}✅${NC} test:games 命令已定义"
else
    echo -e "  ${RED}❌${NC} test:games 命令缺失"
    ERRORS=$((ERRORS + 1))
fi

echo ""

# 4. 检查关键文档是否存在
echo "🔍 检查关键文档..."

DOCS=(
    "docs/GAME_DEVELOPMENT_GUIDE.md"
    "docs/PREVENTING_GAME_BUGS.md"
    "docs/INDEX.md"
)

for doc in "${DOCS[@]}"; do
    if [ -f "$doc" ]; then
        echo -e "  ${GREEN}✅${NC} $doc 存在"
    else
        echo -e "  ${RED}❌${NC} $doc 缺失"
        ERRORS=$((ERRORS + 1))
    fi
done

echo ""

# 5. 检查文档中的链接
echo "🔍 检查文档链接..."

# 检查 INDEX.md 中引用的文档是否存在
if [ -f "docs/INDEX.md" ]; then
    # 提取 markdown 链接中的文件路径
    links=$(grep -o '\[.*\](\./[^)]*\.md)' docs/INDEX.md | sed 's/.*(\.\//docs\//g' | sed 's/)//g')
    
    for link in $links; do
        if [ -f "$link" ]; then
            echo -e "  ${GREEN}✅${NC} 链接有效: $link"
        else
            echo -e "  ${RED}❌${NC} 链接失效: $link"
            ERRORS=$((ERRORS + 1))
        fi
    done
fi

echo ""

# 显示总结
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "检查总结:"
if [ $ERRORS -gt 0 ]; then
    echo -e "  ${RED}错误: $ERRORS${NC}"
fi
if [ $WARNINGS -gt 0 ]; then
    echo -e "  ${YELLOW}警告: $WARNINGS${NC}"
fi
if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "  ${GREEN}✅ 所有检查通过！${NC}"
fi
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ $ERRORS -gt 0 ]; then
    echo ""
    echo -e "${RED}⚠️  发现不一致问题，请修复后再提交${NC}"
    echo ""
    echo "修复建议:"
    echo "1. 查看 docs/GAME_DEVELOPMENT_GUIDE.md 了解正确实现"
    echo "2. 运行 npm run test:games 验证修复"
    echo "3. 更新相关文档保持一致"
    exit 1
else
    echo ""
    echo -e "${GREEN}🎉 文档与代码保持一致！${NC}"
    exit 0
fi
