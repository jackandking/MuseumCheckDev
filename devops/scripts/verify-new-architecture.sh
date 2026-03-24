#!/bin/bash

# MuseumCheck 新架构快速验证脚本
# 使用方法: chmod +x scripts/verify-new-architecture.sh && ./scripts/verify-new-architecture.sh

set -e  # 遇到错误立即退出

echo "🏛️  MuseumCheck 新架构验证脚本"
echo "================================"
echo ""

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 检查函数
check_file() {
    if [ -f "$1" ]; then
        echo -e "${GREEN}✓${NC} 文件存在: $1"
        return 0
    else
        echo -e "${RED}✗${NC} 文件缺失: $1"
        return 1
    fi
}

check_content() {
    if grep -q "$2" "$1" 2>/dev/null; then
        echo -e "${GREEN}✓${NC} 内容验证: $1 包含 '$2'"
        return 0
    else
        echo -e "${RED}✗${NC} 内容验证失败: $1 不包含 '$2'"
        return 1
    fi
}

# 1. 检查核心文件
echo "📁 检查核心文件..."
check_file "museum-data-loader.js"
check_file "museums-meta.js"
check_file "index.html"
check_file "script.js"
echo ""

# 2. 验证架构更新
echo "🔍 验证架构更新..."
check_content "museum-data-loader.js" "KV Store + Browser Cache"
check_content "museum-data-loader.js" "getCachedFromStorage"
check_content "museum-data-loader.js" "setCachedToStorage"
check_content "README.md" "单源 + 缓存"
echo ""

# 3. 检查静态文件是否已删除
echo "🗑️  验证静态文件清理..."
if [ -d "museums" ]; then
    json_count=$(find museums -name "*.json" 2>/dev/null | wc -l)
    if [ $json_count -eq 0 ]; then
        echo -e "${GREEN}✓${NC} 静态 JSON 文件已全部删除"
    else
        echo -e "${YELLOW}⚠${NC}  警告: 发现 $json_count 个静态 JSON 文件"
        find museums -name "*.json"
    fi
else
    echo -e "${GREEN}✓${NC} museums 目录不存在（正常）"
fi
echo ""

# 4. 检查新文档
echo "📚 检查新文档..."
check_file "docs/SIMPLIFIED_ARCHITECTURE.md"
check_file "ARCHITECTURE_SIMPLIFICATION_REPORT.md"
check_file "test-new-architecture.html"
echo ""

# 5. 测试服务器启动
echo "🚀 测试服务器启动..."
if command -v python3 &> /dev/null; then
    echo "启动 HTTP 服务器..."
    python3 -m http.server 8000 > /tmp/museum-server.log 2>&1 &
    SERVER_PID=$!
    
    sleep 2
    
    # 测试主页
    if curl -s http://localhost:8000/ | grep -q "MuseumCheck"; then
        echo -e "${GREEN}✓${NC} 主页正常加载"
    else
        echo -e "${RED}✗${NC} 主页加载失败"
    fi
    
    # 测试数据加载器
    if curl -s http://localhost:8000/museum-data-loader.js | grep -q "KV Store"; then
        echo -e "${GREEN}✓${NC} museum-data-loader.js 正常加载"
    else
        echo -e "${RED}✗${NC} museum-data-loader.js 加载失败"
    fi
    
    # 测试元数据
    if curl -s http://localhost:8000/museums-meta.js | grep -q "MUSEUMS_META"; then
        echo -e "${GREEN}✓${NC} museums-meta.js 正常加载"
    else
        echo -e "${RED}✗${NC} museums-meta.js 加载失败"
    fi
    
    # 停止服务器
    kill $SERVER_PID 2>/dev/null || true
    
    echo ""
    echo -e "${GREEN}✓${NC} HTTP 服务器测试完成"
else
    echo -e "${YELLOW}⚠${NC}  Python3 未安装，跳过服务器测试"
fi
echo ""

# 6. 检查 Node.js 测试环境
echo "🧪 检查测试环境..."
if command -v npm &> /dev/null; then
    if [ -f "package.json" ]; then
        echo -e "${GREEN}✓${NC} package.json 存在"
        
        # 检查是否安装了依赖
        if [ -d "node_modules" ]; then
            echo -e "${GREEN}✓${NC} node_modules 已安装"
        else
            echo -e "${YELLOW}⚠${NC}  node_modules 未安装，运行: npm install"
        fi
    fi
else
    echo -e "${YELLOW}⚠${NC}  npm 未安装，无法运行单元测试"
fi
echo ""

# 7. 总结
echo "================================"
echo "📊 验证总结"
echo "================================"
echo ""
echo "新架构特性:"
echo "  • 单一数据源 (KV Store)"
echo "  • 7天 localStorage 缓存"
echo "  • 已移除静态 JSON 回退"
echo "  • 成本友好（AWS 免费额度内）"
echo ""
echo "快速测试:"
echo "  1. 启动服务器: python3 -m http.server 8000"
echo "  2. 访问测试页: http://localhost:8000/test-new-architecture.html"
echo "  3. 访问主应用: http://localhost:8000/"
echo ""
echo "详细文档:"
echo "  • docs/SIMPLIFIED_ARCHITECTURE.md"
echo "  • ARCHITECTURE_SIMPLIFICATION_REPORT.md"
echo ""
echo -e "${GREEN}✅ 验证完成！${NC}"
