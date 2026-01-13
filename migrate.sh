#!/bin/bash

# MuseumCheck 方案 A 迁移脚本
# 用于自动迁移 CSS 和 JS 文件到指定目录
# 使用: bash migrate.sh [phase]
# phase: all, css, js, verify

set -e  # 出错时停止执行

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# 检查是否在正确的目录
if [ ! -f "package.json" ] || [ ! -d "css" ] || [ ! -d "js" ]; then
    log_error "必须在项目根目录执行此脚本"
    exit 1
fi

# 步骤 1: 迁移 CSS 文件
migrate_css() {
    log_info "开始迁移 CSS 文件..."
    
    local css_files=(
        "style.css"
        "achievement-gamification.css"
        "virtual-pet.css"
    )
    
    for file in "${css_files[@]}"; do
        if [ -f "$file" ]; then
            mv "$file" "css/$file"
            log_success "迁移了 $file"
        else
            log_warning "文件不存在：$file"
        fi
    done
    
    log_success "CSS 文件迁移完成"
}

# 步骤 2: 迁移 JS 文件
migrate_js() {
    log_info "开始迁移 JS 文件..."
    
    local js_files=(
        "script.js"
        "achievement-gamification.js"
        "admin.js"
        "admin-fireworks.js"
        "admin-leaderboard.js"
        "admin-everyone-achievements.js"
        "assessment-integration-fix.js"
        "baidu-image-search.js"
        "deepseek-api.js"
        "event-wall-service.js"
        "everyone-achievements.js"
        "firework.js"
        "image-fallback-config.js"
        "image-loader-util.js"
        "image-proxy-helper.js"
        "image-upload-util.js"
        "init-achievement-posters-table.js"
        "letmetry-cloud-api.js"
        "museum-data-loader.js"
        "museum-mcp-server.js"
    )
    
    for file in "${js_files[@]}"; do
        if [ -f "$file" ]; then
            mv "$file" "js/$file"
            log_success "迁移了 $file"
        fi
    done
    
    log_success "JS 文件迁移完成"
}

# 步骤 3: 更新 HTML 引用
update_html_references() {
    log_info "更新 HTML 文件中的引用..."
    
    # 需要更新引用的 HTML 文件
    local html_files=(
        "index.html"
        "museum-checkin.html"
        "settings.html"
        "achievements.html"
        "fireworks-wall.html"
        "fireworks.html"
        "event-wall.html"
        "treasures.html"
        "everyone-achievements.html"
        "admin.html"
        "admin-fireworks.html"
        "admin-leaderboard.html"
        "admin-treasure-reports.html"
        "admin-everyone-achievements.html"
        "museum-data-manager.html"
        "simple.html"
        "test-new-architecture.html"
    )
    
    log_info "更新 CSS 引用..."
    for file in "${html_files[@]}"; do
        if [ -f "$file" ]; then
            # 更新 CSS 引用
            sed -i 's|href="style\.css"|href="css/style.css"|g' "$file"
            sed -i "s|href='style\.css'|href='css/style.css'|g" "$file"
            sed -i 's|href="achievement-gamification\.css"|href="css/achievement-gamification.css"|g' "$file"
            sed -i "s|href='achievement-gamification\.css'|href='css/achievement-gamification.css'|g" "$file"
            sed -i 's|href="virtual-pet\.css"|href="css/virtual-pet.css"|g' "$file"
            sed -i "s|href='virtual-pet\.css'|href='css/virtual-pet.css'|g" "$file"
        fi
    done
    
    log_info "更新 JS 引用..."
    for file in "${html_files[@]}"; do
        if [ -f "$file" ]; then
            # 更新主要的 JS 引用
            sed -i 's|src="script\.js"|src="js/script.js"|g' "$file"
            sed -i "s|src='script\.js'|src='js/script.js'|g" "$file"
            
            # 更新其他常见的 JS 引用
            sed -i 's|src="achievement-gamification\.js"|src="js/achievement-gamification.js"|g' "$file"
            sed -i 's|src="admin\.js"|src="js/admin.js"|g' "$file"
            sed -i 's|src="admin-fireworks\.js"|src="js/admin-fireworks.js"|g' "$file"
            sed -i 's|src="admin-leaderboard\.js"|src="js/admin-leaderboard.js"|g' "$file"
            sed -i 's|src="admin-everyone-achievements\.js"|src="js/admin-everyone-achievements.js"|g' "$file"
            sed -i 's|src="everyone-achievements\.js"|src="js/everyone-achievements.js"|g' "$file"
            sed -i 's|src="letmetry-cloud-api\.js"|src="js/letmetry-cloud-api.js"|g' "$file"
            sed -i 's|src="museum-data-loader\.js"|src="js/museum-data-loader.js"|g' "$file"
        fi
    done
    
    log_success "HTML 引用更新完成"
}

# 步骤 4: 验证迁移结果
verify_migration() {
    log_info "验证迁移结果..."
    
    echo ""
    log_info "根目录 CSS 文件数量："
    local css_count=$(find . -maxdepth 1 -name "*.css" 2>/dev/null | wc -l)
    echo "  $css_count 个"
    if [ "$css_count" -eq 0 ]; then
        log_success "✓ 所有 CSS 文件已迁移"
    else
        log_warning "⚠ 还有 $css_count 个 CSS 文件在根目录"
    fi
    
    echo ""
    log_info "根目录 JS 文件数量："
    local js_count=$(find . -maxdepth 1 -name "*.js" ! -name "screenshot.js" 2>/dev/null | wc -l)
    echo "  $js_count 个"
    if [ "$js_count" -eq 0 ]; then
        log_success "✓ 所有 JS 文件已迁移"
    else
        log_warning "⚠ 还有 $js_count 个 JS 文件在根目录"
        echo "  剩余文件："
        find . -maxdepth 1 -name "*.js" ! -name "screenshot.js" -exec echo "    {}" \;
    fi
    
    echo ""
    log_info "css/ 目录文件数量："
    local css_dir_count=$(find css/ -name "*.css" 2>/dev/null | wc -l)
    echo "  $css_dir_count 个"
    
    echo ""
    log_info "js/ 目录文件数量："
    local js_dir_count=$(find js/ -name "*.js" 2>/dev/null | wc -l)
    echo "  $js_dir_count 个"
    
    echo ""
    log_success "验证完成"
}

# 显示帮助
show_help() {
    cat << EOF
MuseumCheck 方案 A 迁移脚本

使用方法:
  bash migrate.sh [命令]

命令:
  all      - 执行完整迁移（CSS + JS + 更新引用）
  css      - 仅迁移 CSS 文件
  js       - 仅迁移 JS 文件
  html     - 仅更新 HTML 引用
  verify   - 验证迁移结果
  help     - 显示此帮助

示例:
  bash migrate.sh all        # 完整迁移
  bash migrate.sh css        # 仅迁移 CSS
  bash migrate.sh verify     # 检查迁移状态

警告:
  ⚠️  执行前请备份重要文件
  ⚠️  建议在版本控制检查点执行此脚本
  
EOF
}

# 主程序
main() {
    local command="${1:-help}"
    
    case "$command" in
        all)
            migrate_css
            migrate_js
            update_html_references
            verify_migration
            ;;
        css)
            migrate_css
            verify_migration
            ;;
        js)
            migrate_js
            verify_migration
            ;;
        html)
            update_html_references
            ;;
        verify)
            verify_migration
            ;;
        help)
            show_help
            ;;
        *)
            log_error "未知命令: $command"
            show_help
            exit 1
            ;;
    esac
}

# 执行主程序
main "$@"
