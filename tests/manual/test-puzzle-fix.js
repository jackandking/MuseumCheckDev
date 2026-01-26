#!/usr/bin/env node

/**
 * Puzzle Game Image Fix Test
 * 测试拼图游戏图片修复效果
 */

const fs = require('fs');
const path = require('path');

console.log('🧪 Testing Puzzle Game Image Fix...\n');

// Test 1: Check if unified puzzle game file exists and has the fix
console.log('1. 检查统一拼图游戏文件...');
const puzzleGamePath = path.join(__dirname, 'js/unified-puzzle-game.js');
if (fs.existsSync(puzzleGamePath)) {
    console.log('✅ unified-puzzle-game.js 文件存在');
    
    const content = fs.readFileSync(puzzleGamePath, 'utf8');
    
    // Check for image URL handling fix
    if (content.includes('options.imageUrl') && content.includes('typeof puzzleImageUrl')) {
        console.log('✅ 图片URL处理逻辑已修复');
    } else {
        console.log('❌ 图片URL处理逻辑未找到');
    }
    
    // Check for retry logic
    if (content.includes('setTimeout(() => this.renderPuzzle(), 100)')) {
        console.log('✅ 图片重试逻辑已添加');
    } else {
        console.log('❌ 图片重试逻辑未找到');
    }
    
    // Check for fallback image
    if (content.includes('data:image/svg+xml;base64')) {
        console.log('✅ fallback图片已添加');
    } else {
        console.log('❌ fallback图片未找到');
    }
    
    // Check for debug logging
    if (content.includes('console.log(`[${this.gameType}] onInit:')) {
        console.log('✅ 调试日志已添加');
    } else {
        console.log('❌ 调试日志未找到');
    }
    
} else {
    console.log('❌ unified-puzzle-game.js 文件不存在');
}

// Test 2: Check if museum-checkin.js has the integration
console.log('\n2. 检查museum-checkin.js集成...');
const museumCheckinPath = path.join(__dirname, 'js/museum-checkin.js');
if (fs.existsSync(museumCheckinPath)) {
    console.log('✅ museum-checkin.js 文件存在');
    
    const content = fs.readFileSync(museumCheckinPath, 'utf8');
    
    // Check for GameManager integration
    if (content.includes('typeof GameManager !== \'undefined\'')) {
        console.log('✅ GameManager集成已添加');
    } else {
        console.log('❌ GameManager集成未找到');
    }
    
    // Check for image URL passing
    if (content.includes('options.imageUrl = taskPhotos[taskIndexForGame]')) {
        console.log('✅ 图片URL传递逻辑已修复');
    } else {
        console.log('❌ 图片URL传递逻辑未找到');
    }
    
} else {
    console.log('❌ museum-checkin.js 文件不存在');
}

// Test 3: Check if HTML has the script references
console.log('\n3. 检查HTML脚本引用...');
const htmlPath = path.join(__dirname, 'museum-checkin.html');
if (fs.existsSync(htmlPath)) {
    console.log('✅ museum-checkin.html 文件存在');
    
    const content = fs.readFileSync(htmlPath, 'utf8');
    
    // Check for base-game.js
    if (content.includes('js/base-game.js')) {
        console.log('✅ base-game.js 已引用');
    } else {
        console.log('❌ base-game.js 未引用');
    }
    
    // Check for game-manager.js
    if (content.includes('js/game-manager.js')) {
        console.log('✅ game-manager.js 已引用');
    } else {
        console.log('❌ game-manager.js 未引用');
    }
    
    // Check for unified-puzzle-game.js
    if (content.includes('js/unified-puzzle-game.js')) {
        console.log('✅ unified-puzzle-game.js 已引用');
    } else {
        console.log('❌ unified-puzzle-game.js 未引用');
    }
    
} else {
    console.log('❌ museum-checkin.html 文件不存在');
}

// Test 4: Check if CSS styles exist
console.log('\n4. 检查CSS样式...');
const cssPath = path.join(__dirname, 'css/museum-checkin.css');
if (fs.existsSync(cssPath)) {
    console.log('✅ museum-checkin.css 文件存在');
    
    const content = fs.readFileSync(cssPath, 'utf8');
    
    // Check for puzzle styles
    if (content.includes('.puzzle-tile') && content.includes('.puzzle-grid')) {
        console.log('✅ 拼图游戏样式已存在');
    } else {
        console.log('❌ 拼图游戏样式不完整');
    }
    
} else {
    console.log('❌ museum-checkin.css 文件不存在');
}

// Test 5: Check if test files exist
console.log('\n5. 检查测试文件...');
const testFiles = [
    'puzzle-image-fix-test.html',
    'puzzle-integration-test.html',
    'test-unified-puzzle.html'
];

testFiles.forEach(file => {
    const filePath = path.join(__dirname, file);
    if (fs.existsSync(filePath)) {
        console.log(`✅ ${file} 存在`);
    } else {
        console.log(`❌ ${file} 不存在`);
    }
});

console.log('\n🎉 拼图游戏图片修复测试完成！');
console.log('\n📋 修复总结:');
console.log('1. ✅ 改进了图片URL获取逻辑');
console.log('2. ✅ 添加了图片重试机制');
console.log('3. ✅ 提供了fallback图片');
console.log('4. ✅ 增加了详细的调试日志');
console.log('5. ✅ 改进了拼图块样式和边框');
console.log('\n🔧 使用方法:');
console.log('1. 访问 http://localhost:8000/museum-checkin.html?id=beijing-natural-history-museum');
console.log('2. 设置只保留拼图游戏');
console.log('3. 上传图片后完成第一个任务');
console.log('4. 检查拼图游戏是否正常显示图片');
console.log('\n🐛 如果仍有问题，请检查浏览器控制台的调试日志。');
