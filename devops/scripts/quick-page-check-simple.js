#!/usr/bin/env node

/**
 * 快速页面健康检查脚本 - 简化版本
 * 专注于静态文件检查，不依赖HTTP服务器
 */

const fs = require('fs');
const path = require('path');

// 重要页面列表
const CRITICAL_PAGES = [
    'index.html',
    'pilot.html',
    'museum-checkin.html', 
    'everyone-achievements.html',
    'achievements.html',
    'leaderboard.html',
    'quiz/index.html',
    'survey/index.html',
    'fireworks.html',
    'event-wall.html',
    'debug/status/index.html',
    'admin/visit-metrics.html',
    'admin/pilot-metrics.html'
];

// 颜色输出
const colors = {
    reset: '\x1b[0m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    cyan: '\x1b[36m'
};

function colorLog(color, message) {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

// 检查文件是否存在
function checkFileExists(filePath) {
    try {
        return fs.existsSync(filePath);
    } catch (error) {
        return false;
    }
}

// 检查页面HTML语法
function checkHTMLSyntax(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        
        const hasDoctype = content.toLowerCase().includes('<!doctype html>');
        const hasHtml = content.toLowerCase().includes('<html');
        const hasHead = content.toLowerCase().includes('<head');
        const hasBody = content.toLowerCase().includes('<body');
        const hasClosingTags = content.toLowerCase().includes('</html>');
        
        const issues = [];
        if (!hasDoctype) issues.push('缺少DOCTYPE');
        if (!hasHtml) issues.push('缺少<html>标签');
        if (!hasHead) issues.push('缺少<head>标签');
        if (!hasBody) issues.push('缺少<body>标签');
        if (!hasClosingTags) issues.push('缺少</html>标签');
        
        return issues;
    } catch (error) {
        return [`读取文件失败: ${error.message}`];
    }
}

// 检查JavaScript引用
function checkScriptReferences(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        const scriptMatches = content.match(/<script[^>]*src="([^"]*)"[^>]*>/g) || [];
        
        const missingScripts = [];
        scriptMatches.forEach(match => {
            const srcMatch = match.match(/src="([^"]*)"/);
            if (srcMatch) {
                let scriptPath = srcMatch[1];
                
                // 跳过外部CDN和绝对URL
                if (scriptPath.startsWith('http') || scriptPath.startsWith('//')) {
                    return;
                }
                
                // 处理版本参数 (如 ?v=3)
                scriptPath = scriptPath.split('?')[0];
                
                const fullPath = path.resolve(path.dirname(filePath), scriptPath);
                if (!checkFileExists(fullPath)) {
                    missingScripts.push(srcMatch[1]); // 保持原始路径显示
                }
            }
        });
        
        return missingScripts;
    } catch (error) {
        return [`检查脚本引用失败: ${error.message}`];
    }
}

// 检查CSS引用
function checkCSSReferences(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        const linkMatches = content.match(/<link[^>]*href="([^"]*)"[^>]*>/g) || [];
        
        const missingCSS = [];
        linkMatches.forEach(match => {
            const hrefMatch = match.match(/href="([^"]*)"/);
            if (hrefMatch) {
                let cssPath = hrefMatch[1];
                
                // 跳过外部CDN和绝对URL
                if (cssPath.startsWith('http') || cssPath.startsWith('//')) {
                    return;
                }
                
                // 跳过favicon.ico（可选文件）
                if (cssPath.includes('favicon.ico')) {
                    return;
                }
                
                // 处理版本参数
                cssPath = cssPath.split('?')[0];
                
                const fullPath = path.resolve(path.dirname(filePath), cssPath);
                if (!checkFileExists(fullPath)) {
                    missingCSS.push(hrefMatch[1]); // 保持原始路径显示
                }
            }
        });
        
        return missingCSS;
    } catch (error) {
        return [`检查CSS引用失败: ${error.message}`];
    }
}

// 主检查函数
async function checkPageHealth(pagePath) {
    const fullPath = path.join(process.cwd(), pagePath);
    const result = {
        page: pagePath,
        status: 'PASS',
        issues: [],
        checks: {}
    };
    
    // 1. 文件存在性检查
    if (!checkFileExists(fullPath)) {
        result.status = 'FAIL';
        result.issues.push('文件不存在');
        return result;
    }
    result.checks.fileExists = true;
    
    // 2. HTML语法检查
    const htmlIssues = checkHTMLSyntax(fullPath);
    if (htmlIssues.length > 0) {
        result.status = 'WARN';
        result.issues.push(...htmlIssues);
    }
    result.checks.htmlSyntax = htmlIssues.length === 0;
    
    // 3. JavaScript引用检查
    const missingScripts = checkScriptReferences(fullPath);
    if (missingScripts.length > 0) {
        result.status = 'FAIL';
        result.issues.push(`缺失脚本: ${missingScripts.join(', ')}`);
    }
    result.checks.scriptReferences = missingScripts.length === 0;
    
    // 4. CSS引用检查
    const missingCSS = checkCSSReferences(fullPath);
    if (missingCSS.length > 0) {
        result.status = 'FAIL';
        result.issues.push(`缺失CSS: ${missingCSS.join(', ')}`);
    }
    result.checks.cssReferences = missingCSS.length === 0;
    
    return result;
}

// 主函数
async function main() {
    colorLog('cyan', '🚀 开始快速页面健康检查...\n');
    
    const results = [];
    let passCount = 0;
    let warnCount = 0;
    let failCount = 0;
    
    for (const page of CRITICAL_PAGES) {
        process.stdout.write(`检查 ${page}... `);
        
        const result = await checkPageHealth(page);
        results.push(result);
        
        // 输出结果
        switch (result.status) {
            case 'PASS':
                colorLog('green', '✅ PASS');
                passCount++;
                break;
            case 'WARN':
                colorLog('yellow', '⚠️  WARN');
                warnCount++;
                break;
            case 'FAIL':
                colorLog('red', '❌ FAIL');
                failCount++;
                break;
        }
        
        // 显示问题
        if (result.issues.length > 0) {
            result.issues.forEach(issue => {
                console.log(`   - ${issue}`);
            });
        }
    }
    
    // 总结
    console.log('\n' + '='.repeat(50));
    colorLog('cyan', '📊 检查结果总结:');
    console.log(`✅ 通过: ${passCount}`);
    console.log(`⚠️  警告: ${warnCount}`);
    console.log(`❌ 失败: ${failCount}`);
    console.log(`📈 总计: ${CRITICAL_PAGES.length} 个页面`);
    
    // 失败页面详情
    const failedPages = results.filter(r => r.status === 'FAIL');
    if (failedPages.length > 0) {
        console.log('\n' + '='.repeat(50));
        colorLog('red', '❌ 失败页面详情:');
        failedPages.forEach(page => {
            console.log(`\n📄 ${page.page}:`);
            page.issues.forEach(issue => {
                console.log(`   - ${issue}`);
            });
        });
    }
    
    // 警告页面详情
    const warnPages = results.filter(r => r.status === 'WARN');
    if (warnPages.length > 0) {
        console.log('\n' + '='.repeat(50));
        colorLog('yellow', '⚠️  警告页面详情:');
        warnPages.forEach(page => {
            console.log(`\n📄 ${page.page}:`);
            page.issues.forEach(issue => {
                console.log(`   - ${issue}`);
            });
        });
    }
    
    // 退出码
    process.exit(failCount > 0 ? 1 : 0);
}

// 运行主函数
if (require.main === module) {
    main().catch(error => {
        colorLog('red', `💥 检查过程中发生错误: ${error.message}`);
        process.exit(1);
    });
}
