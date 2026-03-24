#!/usr/bin/env node

/**
 * 文档内容一致性检查
 * 检查文档之间是否有冲突的技术描述
 */

const fs = require('fs');
const path = require('path');

// 颜色输出
const colors = {
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    reset: '\x1b[0m'
};

// 关键技术概念和它们的规范定义
const technicalConcepts = {
    '虚拟按钮实现': {
        canonical: 'docs/GAME_DEVELOPMENT_GUIDE.md',
        correctPattern: /new KeyboardEvent\('keydown'/,
        incorrectPattern: /handleKeydownInput\(\s*\{\s*key:/,
        description: '虚拟按钮必须创建完整的KeyboardEvent对象'
    },
    'gameInstance暴露': {
        canonical: 'docs/GAME_DEVELOPMENT_GUIDE.md',
        correctPattern: /window\.gameInstance\s*=/,
        description: 'gameInstance必须暴露到window以便测试'
    },
    '页面跳转方案': {
        canonical: 'docs/PREVENTING_GAME_BUGS.md',
        keywords: ['window.location.href', 'localStorage', 'GameContextManager'],
        description: '使用页面跳转+localStorage，不使用iframe'
    },
    '微信小程序兼容': {
        canonical: 'docs/GAME_DEVELOPMENT_GUIDE.md',
        keywords: ['不支持iframe', '页面跳转', 'localStorage'],
        conflictKeywords: ['iframe', 'postMessage'],
        description: '微信小程序不支持iframe，必须使用页面跳转'
    }
};

// 需要检查的文档
const docsToCheck = [
    'docs/GAME_DEVELOPMENT_GUIDE.md',
    'docs/PREVENTING_GAME_BUGS.md',
    'docs/INDEX.md',
    'README.md'
];

let errors = 0;
let warnings = 0;

console.log('📚 开始文档内容一致性检查...\n');

// 读取所有文档内容
const docContents = {};
docsToCheck.forEach(doc => {
    const fullPath = path.join(process.cwd(), doc);
    if (fs.existsSync(fullPath)) {
        docContents[doc] = fs.readFileSync(fullPath, 'utf8');
    }
});

// 检查1: 虚拟按钮实现描述一致性
console.log('🔍 检查虚拟按钮实现描述...');
const virtualButtonDocs = Object.entries(docContents).filter(([_, content]) => 
    content.includes('虚拟按钮') || content.includes('virtual button')
);

const correctImplementation = 'new KeyboardEvent';
const incorrectImplementation = '{ key:';

virtualButtonDocs.forEach(([doc, content]) => {
    const hasCorrect = content.includes(correctImplementation);
    const hasIncorrect = content.includes(incorrectImplementation) && 
                         content.includes('错误') === false && 
                         content.includes('❌') === false;
    
    if (hasIncorrect && !content.includes('错误做法')) {
        console.log(`  ${colors.red}❌${colors.reset} ${doc}: 包含错误的虚拟按钮实现示例`);
        errors++;
    } else if (hasCorrect) {
        console.log(`  ${colors.green}✅${colors.reset} ${doc}: 虚拟按钮实现描述正确`);
    }
});

console.log('');

// 检查2: iframe vs 页面跳转的描述一致性
console.log('🔍 检查架构方案描述...');
Object.entries(docContents).forEach(([doc, content]) => {
    const mentionsIframe = content.toLowerCase().includes('iframe');
    const mentionsPageJump = content.includes('页面跳转') || content.includes('window.location');
    const mentionsMiniProgram = content.includes('小程序') || content.includes('微信');
    
    if (mentionsIframe && mentionsMiniProgram) {
        // 检查是否明确说明不支持iframe
        if (content.includes('不支持iframe') || content.includes('❌') && content.includes('iframe')) {
            console.log(`  ${colors.green}✅${colors.reset} ${doc}: 正确说明小程序不支持iframe`);
        } else {
            console.log(`  ${colors.yellow}⚠️${colors.reset} ${doc}: 提到iframe和小程序，但未明确说明不兼容`);
            warnings++;
        }
    }
});

console.log('');

// 检查3: 代码示例一致性
console.log('🔍 检查代码示例一致性...');

// 提取所有代码块
const extractCodeBlocks = (content) => {
    const codeBlockRegex = /```[\s\S]*?```/g;
    return content.match(codeBlockRegex) || [];
};

// 检查是否有冲突的代码示例
const allCodeBlocks = {};
Object.entries(docContents).forEach(([doc, content]) => {
    allCodeBlocks[doc] = extractCodeBlocks(content);
});

// 查找虚拟按钮相关的代码块
Object.entries(allCodeBlocks).forEach(([doc, blocks]) => {
    blocks.forEach((block, index) => {
        if (block.includes('addEventListener') && block.includes('click')) {
            const hasCorrectImpl = block.includes('new KeyboardEvent');
            const hasIncorrectImpl = block.includes('handleKeydownInput({ key:');
            
            // 检查代码块前后的上下文是否标记为错误
            const content = docContents[doc];
            const blockIndex = content.indexOf(block);
            const contextBefore = blockIndex > 0 ? content.substring(Math.max(0, blockIndex - 200), blockIndex) : '';
            const isMarkedAsWrong = contextBefore.includes('❌') || contextBefore.includes('错误做法') || block.includes('不工作');
            
            if (hasIncorrectImpl && !isMarkedAsWrong) {
                console.log(`  ${colors.red}❌${colors.reset} ${doc}: 包含未标记为错误的不正确实现`);
                errors++;
            } else if (hasCorrectImpl) {
                console.log(`  ${colors.green}✅${colors.reset} ${doc}: 代码示例使用正确实现`);
            } else if (hasIncorrectImpl && isMarkedAsWrong) {
                console.log(`  ${colors.green}✅${colors.reset} ${doc}: 错误示例已正确标记`);
            }
        }
    });
});

console.log('');

// 检查4: 关键术语使用一致性
console.log('🔍 检查术语使用一致性...');

const termVariations = {
    '游戏实例': ['gameInstance', 'game instance', '游戏实例'],
    '虚拟按钮': ['虚拟按钮', '虚拟方向键', 'virtual button', '触摸控制按钮'],
    '自动化测试': ['自动化测试', '自动测试', 'automated test', 'e2e test']
};

// 检查每个文档使用的术语
const termUsage = {};
Object.entries(docContents).forEach(([doc, content]) => {
    Object.entries(termVariations).forEach(([concept, variations]) => {
        const used = variations.filter(term => content.includes(term));
        if (used.length > 0) {
            if (!termUsage[concept]) termUsage[concept] = {};
            termUsage[concept][doc] = used;
        }
    });
});

// 报告术语使用情况
Object.entries(termUsage).forEach(([concept, usage]) => {
    const allTerms = new Set();
    Object.values(usage).forEach(terms => terms.forEach(t => allTerms.add(t)));
    
    if (allTerms.size > 2) {
        console.log(`  ${colors.yellow}⚠️${colors.reset} "${concept}" 有多个变体: ${Array.from(allTerms).join(', ')}`);
        warnings++;
    } else {
        console.log(`  ${colors.green}✅${colors.reset} "${concept}" 术语使用一致`);
    }
});

console.log('');

// 检查5: 交叉引用验证
console.log('🔍 检查文档交叉引用...');

Object.entries(docContents).forEach(([doc, content]) => {
    // 提取所有文档引用
    const references = content.match(/\[.*?\]\((\.\/.*?\.md.*?)\)/g) || [];
    
    references.forEach(ref => {
        const match = ref.match(/\((\.\/.*?\.md)/);
        if (match) {
            const refPath = match[1].replace('./', 'docs/');
            if (!docContents[refPath] && !fs.existsSync(path.join(process.cwd(), refPath))) {
                console.log(`  ${colors.red}❌${colors.reset} ${doc}: 引用了不存在的文档 ${refPath}`);
                errors++;
            }
        }
    });
});

console.log('');

// 检查6: 时间敏感信息
console.log('🔍 检查时间敏感信息...');

const timePatterns = [
    /最后更新.*?202[0-9]/,
    /版本.*?[0-9]+\.[0-9]+/,
    /状态.*?最新/
];

Object.entries(docContents).forEach(([doc, content]) => {
    timePatterns.forEach(pattern => {
        if (pattern.test(content)) {
            console.log(`  ${colors.yellow}⚠️${colors.reset} ${doc}: 包含时间敏感信息，需要定期更新`);
            warnings++;
        }
    });
});

console.log('');

// 总结
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('检查总结:');
if (errors > 0) {
    console.log(`  ${colors.red}错误: ${errors}${colors.reset}`);
}
if (warnings > 0) {
    console.log(`  ${colors.yellow}警告: ${warnings}${colors.reset}`);
}
if (errors === 0 && warnings === 0) {
    console.log(`  ${colors.green}✅ 所有内容检查通过！${colors.reset}`);
}
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

if (errors > 0) {
    console.log('');
    console.log(`${colors.red}⚠️  发现内容冲突，请修复：${colors.reset}`);
    console.log('1. 检查规范文档 docs/GAME_DEVELOPMENT_GUIDE.md');
    console.log('2. 确保所有文档使用相同的技术描述');
    console.log('3. 移除或标记错误的代码示例');
    process.exit(1);
} else if (warnings > 0) {
    console.log('');
    console.log(`${colors.yellow}⚠️  发现 ${warnings} 个警告，建议改进${colors.reset}`);
    process.exit(0);
} else {
    console.log('');
    console.log(`${colors.green}🎉 文档内容保持一致！${colors.reset}`);
    process.exit(0);
}
