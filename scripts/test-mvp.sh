#!/bin/bash

# MVP 快速测试脚本
# 用于快速验证 MVP Phase 1 & 2 功能

echo "🧪 MuseumCheck MVP 测试脚本"
echo "=========================="
echo ""

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 检查是否在项目根目录
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ 错误: 请在项目根目录运行此脚本${NC}"
    exit 1
fi

echo "✅ 当前目录: $(pwd)"
echo ""

# 1. 语法检查
echo "📝 步骤 1: JavaScript 语法检查"
echo "--------------------------------"

if command -v node &> /dev/null; then
    echo "检查 js/official-museum-search.js..."
    if node -c js/official-museum-search.js 2>/dev/null; then
        echo -e "${GREEN}✓ official-museum-search.js 语法正确${NC}"
    else
        echo -e "${RED}✗ official-museum-search.js 有语法错误${NC}"
    fi

    echo "检查 js/dynamic-museum-creator.js..."
    if node -c js/dynamic-museum-creator.js 2>/dev/null; then
        echo -e "${GREEN}✓ dynamic-museum-creator.js 语法正确${NC}"
    else
        echo -e "${RED}✗ dynamic-museum-creator.js 有语法错误${NC}"
    fi

    echo "检查 script.js..."
    if node -c script.js 2>/dev/null; then
        echo -e "${GREEN}✓ script.js 语法正确${NC}"
    else
        echo -e "${RED}✗ script.js 有语法错误${NC}"
    fi
else
    echo -e "${YELLOW}⚠ Node.js 未安装，跳过语法检查${NC}"
fi

echo ""

# 2. 检查文件是否存在
echo "📂 步骤 2: 检查必需文件"
echo "--------------------------------"

files=(
    "js/official-museum-search.js"
    "js/dynamic-museum-creator.js"
    "js/letmetry-cloud-api.js"
    "index.html"
    "script.js"
)

all_files_exist=true
for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        echo -e "${GREEN}✓ $file${NC}"
    else
        echo -e "${RED}✗ $file 不存在${NC}"
        all_files_exist=false
    fi
done

echo ""

# 3. 检查 index.html 中的脚本引用
echo "🔗 步骤 3: 检查脚本加载"
echo "--------------------------------"

if grep -q "official-museum-search.js" index.html; then
    echo -e "${GREEN}✓ index.html 引用 official-museum-search.js${NC}"
else
    echo -e "${RED}✗ index.html 未引用 official-museum-search.js${NC}"
fi

if grep -q "dynamic-museum-creator.js" index.html; then
    echo -e "${GREEN}✓ index.html 引用 dynamic-museum-creator.js${NC}"
else
    echo -e "${RED}✗ index.html 未引用 dynamic-museum-creator.js${NC}"
fi

echo ""

# 4. 单元测试（如果存在）
echo "🧪 步骤 4: 运行单元测试"
echo "--------------------------------"

if [ -d "node_modules" ]; then
    if [ -f "package.json" ] && grep -q "\"test\"" package.json; then
        echo "运行测试套件..."
        npm test 2>&1 | head -20
    else
        echo -e "${YELLOW}⚠ 未配置测试脚本${NC}"
    fi
else
    echo -e "${YELLOW}⚠ 依赖未安装，运行: npm install${NC}"
fi

echo ""

# 5. 启动本地服务器提示
echo "🚀 步骤 5: 本地测试"
echo "--------------------------------"

echo "选择一种方式启动本地服务器:"
echo ""
echo "方法 1 (Python):"
echo "  python3 -m http.server 8000"
echo "  然后访问: http://localhost:8000"
echo ""
echo "方法 2 (Node.js):"
echo "  npx http-server -p 8000"
echo "  然后访问: http://localhost:8000"
echo ""
echo "方法 3 (VS Code):"
echo "  右键点击 index.html -> 'Open with Live Server'"
echo ""

# 6. 浏览器测试步骤
echo "🌐 步骤 6: 浏览器测试步骤"
echo "--------------------------------"
echo ""
echo "在浏览器中测试以下功能:"
echo ""
echo "✅ 验证模块加载:"
echo "   打开 Console，运行:"
echo "   console.log(typeof OfficialMuseumSearch);"
echo "   console.log(typeof DynamicMuseumCreator);"
echo "   (应该输出: 'function')"
echo ""
echo "✅ 测试搜索功能:"
echo "   1. 在搜索框输入 '故宫'"
echo "   2. 验证搜索结果显示"
echo "   3. 检查 Console 日志"
echo ""
echo "✅ 测试缓存:"
echo "   在 Console 运行:"
echo "   const search = new OfficialMuseumSearch();"
echo "   search.search('北京').then(r => console.log(r));"
echo ""
echo "✅ 测试动态创建:"
echo "   1. 点击任意博物馆卡片"
echo "   2. 观察 Console 日志"
echo "   3. 查看是否有 [MVP] 开头的日志"
echo ""

# 7. 总结
echo "📊 测试总结"
echo "--------------------------------"

if [ "$all_files_exist" = true ]; then
    echo -e "${GREEN}✓ 所有必需文件存在${NC}"
    echo -e "${GREEN}✓ MVP 实现已就绪${NC}"
    echo ""
    echo "下一步:"
    echo "1. 启动本地服务器（见上方说明）"
    echo "2. 在浏览器中打开应用"
    echo "3. 按照测试步骤进行手动测试"
    echo "4. 查看详细测试指南: docs/guides/mvp-testing-guide.md"
else
    echo -e "${RED}✗ 部分文件缺失，请检查${NC}"
fi

echo ""
echo "📚 更多信息:"
echo "   - 详细测试指南: docs/guides/mvp-testing-guide.md"
echo "   - PR 说明: 见 GitHub PR #[编号]"
echo "   - 问题反馈: 在 PR 中留言"
echo ""
