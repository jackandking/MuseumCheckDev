#!/bin/bash

echo "=== 测试 everyone-achievements.html 的 Mock API 集成 ==="
echo

# 1. 检查 mock API 服务器是否运行
echo "1. 检查 Mock API 服务器状态..."
if curl -s http://localhost:3000/health > /dev/null; then
    echo "✅ Mock API 服务器运行正常"
else
    echo "❌ Mock API 服务器未运行，请先启动: node scripts/mock-api-server.js"
    exit 1
fi

# 2. 测试 MySQL 查询端点
echo
echo "2. 测试 MySQL 查询端点..."
response=$(curl -s -X POST http://localhost:3000/mysql/query \
    -H "Content-Type: application/json" \
    -d '{"sql":"SELECT * FROM achievement_posters"}')

if echo "$response" | grep -q "小淘气"; then
    echo "✅ MySQL 查询端点返回模拟数据"
    echo "   返回数据: $(echo "$response" | jq '. | length') 条记录"
else
    echo "❌ MySQL 查询端点未返回预期数据"
    echo "   响应: $response"
fi

# 3. 检查页面是否包含 API 配置
echo
echo "3. 检查页面 API 配置..."
if curl -s http://localhost:8000/everyone-achievements.html | grep -q "api-endpoints.js"; then
    echo "✅ 页面包含 api-endpoints.js 引用"
else
    echo "❌ 页面缺少 api-endpoints.js 引用"
fi

if curl -s http://localhost:8000/everyone-achievements.html | grep -q "fallback configuration"; then
    echo "✅ 页面包含备用 API 配置"
else
    echo "❌ 页面缺少备用 API 配置"
fi

# 4. 测试页面可访问性
echo
echo "4. 测试页面可访问性..."
if curl -s -I http://localhost:8000/everyone-achievements.html | grep -q "200 OK"; then
    echo "✅ 页面可正常访问"
else
    echo "❌ 页面无法访问"
fi

echo
echo "=== 测试完成 ==="
echo
echo "现在可以在浏览器中访问 http://localhost:8000/everyone-achievements.html"
echo "应该能看到模拟的成就海报数据："
