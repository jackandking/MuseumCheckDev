#!/bin/bash

echo "=== 测试排行榜 Mock API 集成 ==="
echo

# 1. 检查 mock API 服务器是否运行
echo "1. 检查 Mock API 服务器状态..."
if curl -s http://localhost:3000/health > /dev/null; then
    echo "✅ Mock API 服务器运行正常"
else
    echo "❌ Mock API 服务器未运行，请先启动: node scripts/mock-api-server.js"
    exit 1
fi

# 2. 测试排行榜端点
echo
echo "2. 测试排行榜端点..."
response=$(curl -s http://localhost:3000/default/leaderboard)

if echo "$response" | grep -q "小淘气"; then
    echo "✅ 排行榜端点返回模拟数据"
    echo "   返回数据: $(echo "$response" | jq '.items | length') 条记录"
    
    # 显示前3名
    echo "   🥇 小淘气: $(echo "$response" | jq -r '.items[0].visits') 个博物馆"
    echo "   🥈 咚咚: $(echo "$response" | jq -r '.items[1].visits') 个博物馆"
    echo "   🥉 用户123: $(echo "$response" | jq -r '.items[2].visits') 个博物馆"
else
    echo "❌ 排行榜端点未返回预期数据"
    echo "   响应: $response"
fi

# 3. 检查排行榜代码是否包含环境检测
echo
echo "3. 检查排行榜代码环境检测..."
if grep -q "API_ENDPOINTS.BASE_URL.includes.*localhost" /Users/yliu5/github/MuseumCheck/js/leaderboard-modal.js; then
    echo "✅ 排行榜代码包含本地开发环境检测"
else
    echo "❌ 排行榜代码缺少本地开发环境检测"
fi

# 4. 测试页面可访问性
echo
echo "4. 测试页面可访问性..."
if curl -s -I http://localhost:8000/index.html | grep -q "200 OK"; then
    echo "✅ 主页可正常访问"
else
    echo "❌ 主页无法访问"
fi

echo
echo "=== 测试完成 ==="
echo
echo "现在可以在浏览器中访问 http://localhost:8000/index.html"
echo "点击菜单中的 '🏅 排行榜' 查看修复效果"
echo "应该看到正确的博物馆访问数量："
