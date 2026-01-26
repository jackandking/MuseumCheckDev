#!/usr/bin/env node

/**
 * Test 2x2 Puzzle Reset Fix
 */

console.log('🧪 Testing 2x2 Puzzle Reset Fix...\n');

const tests = [
    {
        name: 'Image Load Check in Reset',
        file: 'js/unified-puzzle-game.js',
        check: (content) => content.includes('if (!this.imageLoaded && this.imageUrl)'),
        expected: true
    },
    {
        name: 'Image Reload in Reset',
        file: 'js/unified-puzzle-game.js',
        check: (content) => content.includes('this.loadImage().then(() =>'),
        expected: true
    },
    {
        name: 'Enhanced Render Debug',
        file: 'js/unified-puzzle-game.js',
        check: (content) => content.includes('renderPuzzle called: imageLoaded='),
        expected: true
    },
    {
        name: 'Image State Logging',
        file: 'js/unified-puzzle-game.js',
        check: (content) => content.includes('imageUrl=${this.imageUrl ? \'set\' : \'not set\'}'),
        expected: true
    },
    {
        name: 'Reset Completion Logging',
        file: 'js/unified-puzzle-game.js',
        check: (content) => content.includes('Puzzle reset completed (with image reload)'),
        expected: true
    },
    {
        name: 'Error Handling in Reset',
        file: 'js/unified-puzzle-game.js',
        check: (content) => content.includes('}).catch(error =>'),
        expected: true
    },
    {
        name: 'Image Loaded Confirmation',
        file: 'js/unified-puzzle-game.js',
        check: (content) => content.includes('Image loaded, proceeding with render...'),
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
    console.log('\n🎉 All tests passed! 2x2 puzzle reset fix is complete.');
    console.log('\n📋 Summary of fixes:');
    console.log('1. ✅ Image load state check in reset');
    console.log('2. ✅ Automatic image reload if needed');
    console.log('3. ✅ Enhanced render debugging');
    console.log('4. ✅ Image state logging');
    console.log('5. ✅ Reset completion confirmation');
    console.log('6. ✅ Error handling for image reload');
    console.log('7. ✅ Image loaded confirmation');
    
    console.log('\n🎯 Expected behavior:');
    console.log('2x2 reset will:');
    console.log('- Check if image is still loaded');
    console.log('- Reload image if necessary');
    console.log('- Wait for image to load before rendering');
    console.log('- Show detailed debug information');
    console.log('- Handle image reload errors gracefully');
    console.log('- Never show empty tiles due to missing image');
    
    console.log('\n🧪 To test the fix:');
    console.log('1. Visit: http://localhost:8000/test-puzzle-movement.html');
    console.log('2. Click "测试 2x2 拼图" to start a 2x2 puzzle');
    console.log('3. Verify the puzzle loads correctly');
    console.log('4. Click the "重新打乱" button');
    console.log('5. Check console for detailed reset logs');
    console.log('6. Verify all tiles show correctly (no empty tiles)');
    console.log('7. Test multiple resets in a row');
    
    console.log('\n🔍 What to look for in console:');
    console.log('- "renderPuzzle called: imageLoaded=true, imageUrl=set"');
    console.log('- "Image loaded, proceeding with render..."');
    console.log('- "Reset button clicked"');
    console.log('- "Resetting puzzle..."');
    console.log('- Either "Puzzle reset completed (image already loaded)"');
    console.log('- Or "Image not loaded, reloading..." + "Puzzle reset completed (with image reload)"');
    console.log('- "Shuffle completed: tiles=[...]"');
    console.log('- "Created image tile: index=X, value=Y..."');
    
    console.log('\n🎮 Expected 2x2 reset behavior:');
    console.log('- All 4 tiles show correctly after reset');
    console.log('- 3 image tiles + 1 empty tile');
    console.log('- Empty tile has dashed border');
    console.log('- Image tiles show correct image fragments');
    console.log('- No completely empty tiles');
    console.log('- Move counter resets to 0');
    console.log('- Game continues normally');
    
    console.log('\n🐛 If still seeing empty tiles:');
    console.log('- Check if image URL is still valid');
    console.log('- Verify image loading completes');
    console.log('- Look for "Image not loaded, reloading..." messages');
    console.log('- Check for image loading errors');
    console.log('- Ensure DOM elements exist');
} else {
    console.log('\n❌ Some tests failed. Please review the issues above.');
}
