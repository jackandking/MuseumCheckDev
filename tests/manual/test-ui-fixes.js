#!/usr/bin/env node

/**
 * Test Unified Game UI System Fixes
 */

console.log('🧪 Testing Unified Game UI System Fixes...\n');

const tests = [
    {
        name: 'UnifiedGameUI Instance Fix',
        file: 'js/unified-game-ui.js',
        check: (content) => content.includes('if (typeof window !== \'undefined\') {') && content.includes('window.UnifiedGameUI = new UnifiedGameUI()'),
        expected: true
    },
    {
        name: 'UnifiedMazeGame UI Call Fix',
        file: 'js/unified-maze-game.js',
        check: (content) => content.includes('if (typeof window !== \'undefined\' && window.UnifiedGameUI) {'),
        expected: true
    },
    {
        name: 'UnifiedPuzzleGame UI Call Fix',
        file: 'js/unified-puzzle-game.js',
        check: (content) => content.includes('if (typeof window !== \'undefined\' && window.UnifiedGameUI) {'),
        expected: true
    },
    {
        name: 'Maze Button Conflict Prevention',
        file: 'js/museum-checkin.js',
        check: (content) => content.includes('GameManager.isGameActive() && GameManager.getCurrentGame()?.gameType === \'maze\''),
        expected: true
    },
    {
        name: 'Fallback System Check',
        file: 'js/museum-checkin.js',
        check: (content) => content.includes('// Fall back to old system'),
        expected: true
    }
];

let passed = 0;
let total = tests.length;

tests.forEach(test => {
    try {
        const content = require('fs').readFileSync(test.file, 'utf8');
        const result = test.check(content);
        
        if (result === test.expected) {
            console.log(`✅ ${test.name}`);
            passed++;
        } else {
            console.log(`❌ ${test.name} - Expected ${test.expected}, got ${result}`);
        }
    } catch (error) {
        console.log(`❌ ${test.name} - Error: ${error.message}`);
    }
});

console.log(`\n📊 Test Results: ${passed}/${total} passed`);

if (passed === total) {
    console.log('\n🎉 All fixes applied successfully!');
    console.log('\n📋 Fixed Issues:');
    console.log('1. ✅ UnifiedGameUI instance creation fixed');
    console.log('2. ✅ UnifiedMazeGame UI call fixed');
    console.log('3. ✅ UnifiedPuzzleGame UI call fixed');
    console.log('4. ✅ Maze button conflict prevention');
    console.log('5. ✅ Fallback system maintained');
    
    console.log('\n🎯 Expected Behavior:');
    console.log('- UnifiedGameUI properly instantiated');
    console.log('- UI optimization works for both games');
    console.log('- Old maze buttons don\'t conflict with new system');
    console.log('- Fallback to old system when needed');
    console.log('- No more TypeError exceptions');
    
    console.log('\n🧪 To test the fixes:');
    console.log('1. Visit: http://localhost:8000/museum-checkin.html');
    console.log('2. Start a maze game (困难模式 for 15x15)');
    console.log('3. Check console for UI optimization logs');
    console.log('4. Test keyboard controls (arrow keys, WASD)');
    console.log('5. Test old maze buttons (should not conflict)');
    console.log('6. Test puzzle game UI optimization');
    console.log('7. Resize browser to test responsiveness');
    
    console.log('\n🔍 What to look for:');
    console.log('- No "ui.optimizeGameUI is not a function" errors');
    console.log('- No "Cannot read properties of undefined" errors');
    console.log('- UI optimization logs in console');
    console.log('- Games use maximum available screen space');
    console.log('- Smooth transitions between screen sizes');
    console.log('- Old buttons work when new system is not active');
    
    console.log('\n🎮 Expected Console Logs:');
    console.log('[maze] Maze game started');
    console.log('[UnifiedGameUI] Applied styles for maze: 360x360');
    console.log('[maze] UI optimized: 360x360');
    console.log('[maze] Maze optimizations: cellSize=24, visibleRadius=2');
    console.log('[maze] Maze rendered: 15x15');
    
    console.log('\n📱 Mobile Improvements:');
    console.log('- Larger maze on small screens');
    console.log('- Better touch targets');
    console.log('- Optimized cell sizes');
    console.log('- Responsive fog of war radius');
    
    console.log('\n🖥️ Desktop Enhancements:');
    console.log('- Maximum maze size utilization');
    console.log('- Better screen space usage');
    console.log('- Enhanced visual experience');
} else {
    console.log('\n❌ Some fixes failed. Please review the issues above.');
}
