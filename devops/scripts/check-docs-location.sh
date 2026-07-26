#!/bin/bash
# 检查根目录是否有新的大写命名的 MD 文件
# 用于 CI/CD 流程或本地开发检查

set -e

echo "🔍 检查文档位置规范..."
echo "================================"
echo ""

# 允许在根目录的文件白名单
ALLOWED_FILES=(
    "README.md"
    "CHANGELOG.md"
    "CONTRIBUTING.md"
    "LICENSE.md"
    "AGENTS.md"
)

# 获取根目录所有大写开头的 MD 文件
UPPERCASE_MD_FILES=$(ls -1 [A-Z]*.md 2>/dev/null || true)

if [ -z "$UPPERCASE_MD_FILES" ]; then
    echo "✅ 未发现违规文档"
    exit 0
fi

# 检查每个文件是否在白名单中
VIOLATIONS=()
while IFS= read -r file; do
    ALLOWED=false
    for allowed_file in "${ALLOWED_FILES[@]}"; do
        if [ "$file" == "$allowed_file" ]; then
            ALLOWED=true
            break
        fi
    done
    
    if [ "$ALLOWED" = false ]; then
        VIOLATIONS+=("$file")
    fi
done <<< "$UPPERCASE_MD_FILES"

# 报告违规
if [ ${#VIOLATIONS[@]} -gt 0 ]; then
    echo "❌ 发现 ${#VIOLATIONS[@]} 个违规文档（在根目录且大写命名）："
    echo ""
    for file in "${VIOLATIONS[@]}"; do
        echo "  ❌ $file"
    done
    echo ""
    echo "📋 建议迁移方案："
    echo ""
    for file in "${VIOLATIONS[@]}"; do
        # 基于文件名特征推荐目标目录
        if [[ "$file" =~ ARCHITECTURE|PATTERN|DESIGN ]]; then
            echo "  $file → docs/architecture/"
        elif [[ "$file" =~ FEATURE|CHECKIN|QUIZ|ACHIEVEMENT|ADMIN ]]; then
            echo "  $file → docs/features/"
        elif [[ "$file" =~ GUIDE|SETUP|QUICK_START|TESTING ]]; then
            echo "  $file → docs/guides/"
        elif [[ "$file" =~ API|DATABASE|STORAGE ]]; then
            echo "  $file → docs/api/"
        elif [[ "$file" =~ REPORT|PHASE|COMPLETION|CHANGELOG|SUMMARY ]]; then
            echo "  $file → docs/reports/"
        else
            echo "  $file → docs/reports/ (默认)"
        fi
    done
    echo ""
    echo "📖 详细规范: .github/copilot-instructions-docs.md"
    exit 1
else
    echo "✅ 所有文档位置符合规范"
    exit 0
fi
