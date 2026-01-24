#!/usr/bin/env node

/**
 * 快速页面健康检查脚本
 * 用于验证重要页面是否能正常加载，没有JavaScript错误
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 重要页面列表 - 基于项目分析确定的核心页面
const CRITICAL_PAGES = [
    'index.html',              // 主页
    'museum-checkin.html',     // 博物馆打卡页面
    'everyone-achievements.html', // 大家成就页面
    'achievements.html',       // 个人成就页面
    'leaderboard.html',        // 排行榜页面
    'quiz/index.html',         // 考试页面
    'survey/index.html',       // 调查页面
    'fireworks.html',          // 烟花页面
    'event-wall.html'          // 事件墙页面
];

// 配置
const CONFIG = {
    port: 8000,
    host: 'localhost',
    timeout: 5000, // 5秒超时
    retries: 2     // 重试次数
};

// 颜色输出
const colors = {
    reset: '\x1b[0m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
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
        
        // 基本HTML结构检查
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
                const scriptPath = srcMatch[1];
                // 跳过外部CDN和绝对URL
                if (!scriptPath.startsWith('http') && !scriptPath.startsWith('//')) {
                    const fullPath = path.resolve(path.dirname(filePath), scriptPath);
                    if (!checkFileExists(fullPath)) {
                        missingScripts.push(scriptPath);
                    }
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
                const cssPath = hrefMatch[1];
                // 跳过外部CDN和绝对URL
                if (!cssPath.startsWith('http') && !cssPath.startsWith('//')) {
                    const fullPath = path.resolve(path.dirname(filePath), cssPath);
                    if (!checkFileExists(fullPath)) {
                        missingCSS.push(cssPath);
                    }
                }
            }
        });
        
        return missingCSS;
    } catch (error) {
        return [`检查CSS引用失败: ${error.message}`];
    }
}

// 启动HTTP服务器
function startServer() {
    try {
        // 检查端口是否被占用
        execSync(`lsof -ti:${CONFIG.port}`, { stdio: 'ignore' });
        colorLog('yellow', `端口 ${CONFIG.port} 已被占用，尝试终止现有进程...`);
        execSync(`lsof -ti:${CONFIG.port} | xargs kill -9`, { stdio: 'ignore' });
    } catch (error) {
        // 端口未被占用，继续
    }
    
    try {
        // 使用更可靠的方式启动服务器
        const serverProcess = execSync(`python3 -m http.server ${CONFIG.port}`, { 
            stdio: 'pipe',
            detached: true
        });
        
        colorLog('green', `HTTP服务器已启动: http://${CONFIG.host}:${CONFIG.port}`);
        
        // 等待服务器启动
        execSync('sleep 3', { stdio: 'ignore' });
        
        // 验证服务器是否真的在运行
        try {
            execSync(`curl -s http://${CONFIG.host}:${CONFIG.port}/ > /dev/null`, { stdio: 'ignore' });
            return true;
        } catch (error) {
            colorLog('red', '服务器启动验证失败');
            return false;
        }
    } catch (error) {
        colorLog('red', `启动服务器失败: ${error.message}`);
        return false;
    }
}

// 使用curl检查页面可访问性
function checkPageWithCurl(pagePath) {
    try {
        const url = `http://${CONFIG.host}:${CONFIG.port}/${pagePath}`;
        const response = execSync(`curl -s -w "%{http_code}" "${url}"`, { 
            timeout: CONFIG.timeout / 1000,
            encoding: 'utf8'
        });
        
        return response.trim().endsWith('200');
    } catch (error) {
        return false;
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

// 清理函数
function cleanup() {
    try {
        execSync(`lsof -ti:${CONFIG.port} | xargs kill -9`, { stdio: 'ignore' });
    } catch (error) {
        // 忽略清理错误
    }
}

// 主函数
async function main() {
    colorLog('cyan', '🚀 开始快速页面健康检查...\n');
    
    const serverStarted = startServer();
    if (!serverStarted) {
        colorLog('red', '❌ 无法启动HTTP服务器，跳过可访问性检查');
    }
    
    const results = [];
    let passCount = 0;
    let warnCount = 0;
    let failCount = 0;
    
    for (const page of CRITICAL_PAGES) {
        process.stdout.write(`检查 ${page}... `);
        
        const result = await checkPageHealth(page);
        
        // 如果服务器启动成功，进行可访问性检查
        if (serverStarted) {
            const isAccessible = checkPageWithCurl(page);
            result.checks.accessible = isAccessible;
            if (!isAccessible) {
                result.status = result.status === 'FAIL' ? 'FAIL' : 'WARN';
                result.issues.push('页面无法通过HTTP访问');
            }
        }
        
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
    
    // 清理服务器
    if (serverStarted) {
        cleanup();
        colorLog('blue', '\n🧹 HTTP服务器已关闭');
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

// 处理中断信号
process.on('SIGINT', () => {
    colorLog('yellow', '\n⏹️  收到中断信号，正在清理...');
    cleanup();
    process.exit(0);
});

// 运行主函数
if (require.main === module) {
    main().catch(error => {
        colorLog('red', `💥 检查过程中发生错误: ${error.message}`);
        cleanup();
        process.exit(1);
    });
}
