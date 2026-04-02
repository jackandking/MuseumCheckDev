#!/bin/bash
# 文件目录规范检查脚本
# 确保每个新增文件都存放到合适的目录

set -e

echo "🔍 检查文件目录规范..."
echo "================================"
echo ""

# 获取所有暂存的文件（排除已删除的文件）
STAGED_FILES=$(git diff --cached --name-only --diff-filter=ACMRT)
if [ -z "$STAGED_FILES" ]; then
    echo "📝 没有暂存文件，跳过检查"
    exit 0
fi

VIOLATIONS=0
TOTAL_CHECKED=0

# 文件类型到目录的映射规则
check_file_placement() {
    local file="$1"
    local filename=$(basename "$file")
    local extension="${filename##*.}"
    local dirname=$(dirname "$file")
    
    case "$file" in
        # 特殊目录例外 - GitHub Copilot Skills必须在特定位置
        ".github/copilot-skills/"*)
            return 0
            ;;
        
        # 临时文件例外 - regression-results已在gitignore中
        "regression-results/"*)
            return 0
            ;;
        
        # 根目录允许的文件
        "README.md"|"CHANGELOG.md"|"CONTRIBUTING.md"|"LICENSE.md"|\
        "package.json"|".gitignore"|"CNAME"|"robots.txt"|\
        "index.html"|"script.js"|"style.css"|"util.js"|\
        "netlify.toml"|".copilot-mcp.json"|\
        ".nojekyll"|"404.html"|"sitemap.xml"|"logo-og.png")
            return 0
            ;;
        
        # 核心应用文件 - 允许在根目录
        *.html|*.js|*.css)
            # 只允许主要应用文件在根目录
            if [[ "$file" =~ ^(museum-checkin|achievements|treasures|settings|fireworks|event-wall|everyone-achievements|leaderboard|fireworks-wall)\.html$ ]]; then
                return 0
            fi
            # 其他HTML文件应该在子目录
            if [ "$dirname" = "." ]; then
                echo "  ❌ $file (HTML文件应在子目录或docs/)"
                return 1
            fi
            ;;
        
        # 文档文件
        *.md)
            # 检查是否在合适的文档目录
            if [ "$dirname" = "." ]; then
                echo "  ❌ $file (文档应在docs/子目录)"
                return 1
            fi
            if [[ ! "$file" =~ ^docs/ ]]; then
                echo "  ❌ $file (文档应在docs/目录下)"
                return 1
            fi
            ;;
        
        # 测试文件
        *.test.js|*.spec.js|test-*.js)
            if [[ ! "$file" =~ ^(tests/|e2e/) ]]; then
                echo "  ❌ $file (测试文件应在tests/或e2e/目录)"
                return 1
            fi
            ;;
        
        # 工具脚本
        *.sh)
            if [[ ! "$file" =~ ^(scripts/|devops/scripts/) ]]; then
                echo "  ❌ $file (Shell脚本应在scripts/目录)"
                return 1
            fi
            ;;
        
        # 配置文件
        *.config.js|*.config.ts|webpack.*|rollup.*|vite.*)
            if [[ ! "$file" =~ ^(config/|.github/|tools/) ]]; then
                echo "  ❌ $file (配置文件应在config/目录)"
                return 1
            fi
            ;;
        
        # 数据文件
        *.json|*.yaml|*.yml)
            # 特殊数据文件位置
            case "$file" in
                "package.json"|"package-lock.json"|".gitignore"|"tsconfig.json"|*.toml)
                    return 0
                    ;;
                "data/"*|"backup/"*)
                    return 0
                    ;;
                ".github/workflows/"*|".github/"*)
                    return 0
                    ;;
                *)
                    if [ "$dirname" = "." ]; then
                        echo "  ❌ $file (数据文件应在data/、config/或backup/目录)"
                        return 1
                    fi
                    ;;
            esac
            ;;
        
        # 图片资源
        *.png|*.jpg|*.jpeg|*.gif|*.svg|*.ico|*.webp)
            # 允许根目录 favicon.ico 作为浏览器默认入口
            if [ "$filename" = "favicon.ico" ] && [ "$dirname" = "." ]; then
                return 0
            fi
            if [[ ! "$file" =~ ^(assets/|archive/|docs/) ]]; then
                echo "  ❌ $file (图片应在assets/、archive/或docs/目录)"
                return 1
            fi
            ;;
        
        # 音频文件
        *.wav|*.mp3|*.ogg|*.m4a)
            if [[ ! "$file" =~ ^assets/audio/ ]]; then
                echo "  ❌ $file (音频文件应在assets/audio/目录)"
                return 1
            fi
            ;;
        
        # 工具文件
        tools/*)
            return 0
            ;;
        
        # 核心模块
        core/*)
            return 0
            ;;
        
        # 共享模块
        shared/*|shared-features/*)
            return 0
            ;;
        
        # 临时文件
        tmp/*|temp/*)
            return 0
            ;;
        
        # 构建输出
        dist/*|build/*)
            return 0
            ;;
        
        # 默认情况：根目录文件需要检查
        *)
            if [ "$dirname" = "." ]; then
                echo "  ❌ $file (根目录不应放置此类文件，请检查合适目录)"
                return 1
            fi
            ;;
    esac
    
    return 0
}

echo "📋 检查暂存文件："
echo "$STAGED_FILES" | while read -r file; do
    [ -n "$file" ] && echo "  - $file"
done
echo ""

echo "🔍 验证文件位置："
echo ""

# 检查每个暂存文件
while IFS= read -r file; do
    if [ -n "$file" ]; then
        TOTAL_CHECKED=$((TOTAL_CHECKED + 1))
        if ! check_file_placement "$file"; then
            VIOLATIONS=$((VIOLATIONS + 1))
        fi
    fi
done <<< "$STAGED_FILES"

echo ""

# 输出结果
if [ $VIOLATIONS -gt 0 ]; then
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "❌ 文件目录规范检查失败"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "发现 $VIOLATIONS 个文件位置违规 (共检查 $TOTAL_CHECKED 个文件)"
    echo ""
    echo "📁 推荐的目录结构："
    echo ""
    echo "  📄 应用页面:        根目录 (主要HTML文件)"
    echo "  📚 文档文件:        docs/ (architecture/, features/, guides/, api/, reports/)"
    echo "  🧪 测试文件:        tests/ 或 e2e/"
    echo "  ⚙️  工具脚本:       scripts/"
    echo "  🔧 配置文件:        config/"
    echo "  📊 数据文件:        data/ 或 backup/"
    echo "  🖼️  图片资源:       assets/ 或 archive/"
    echo "  🔊 音频文件:        assets/audio/"
    echo "  🛠️  工具文件:       tools/"
    echo "  🏗️  核心模块:       core/"
    echo "  🔄 共享模块:        shared/ 或 shared-features/"
    echo "  📦 临时文件:        tmp/"
    echo ""
    echo "📖 详细规范: docs/DIRECTORY_STRUCTURE.md"
    echo ""
    echo "💡 修复建议："
    echo "  1. 将文件移动到合适的目录"
    echo "  2. 使用 'git mv' 保留历史记录"
    echo "  3. 更新相关的引用路径"
    echo ""
    exit 1
else
    echo "✅ 所有文件位置符合规范 (共检查 $TOTAL_CHECKED 个文件)"
    exit 0
fi
