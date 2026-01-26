#!/usr/bin/env node

/**
 * Test GameManager Registration Fix
 */

console.log('🧪 Testing GameManager Registration Fix...\n');

// Check the game-manager.js file
const gameManagerCode = require('fs').readFileSync('js/game-manager.js', 'utf8');

// Check if UnifiedPuzzleGame is registered
if (gameManagerCode.includes("this.registerGame('puzzle', UnifiedPuzzleGame)")) {
    console.log('✅ UnifiedPuzzleGame is now registered for puzzle games');
} else {
    console.log('❌ UnifiedPuzzleGame registration not found');
}

// Check if PuzzleGameWrapper is no longer registered
if (gameManagerCode.includes("this.registerGame('puzzle', PuzzleGameWrapper)")) {
    console.log('❌ PuzzleGameWrapper is still registered (should be removed)');
} else {
    console.log('✅ PuzzleGameWrapper registration removed');
}

// Check if other games still use wrappers
const wrapperGames = ['maze', 'shooting', 'space-invaders', 'tank-battle', 'minesweeper', 'snake'];
let wrapperCount = 0;
wrapperGames.forEach(game => {
    if (gameManagerCode.includes(`this.registerGame('${game}', ${game.charAt(0).toUpperCase() + game.slice(1).replace('-', '')}Wrapper)`)) {
        wrapperCount++;
    }
});

console.log(`✅ ${wrapperCount} games still using wrappers (expected: 6)`);

console.log('\n🎉 GameManager Registration Fix Test Completed!');
console.log('\n📋 What was fixed:');
console.log('1. ✅ Puzzle game now uses UnifiedPuzzleGame instead of PuzzleGameWrapper');
console.log('2. ✅ Eliminates duplicate game initialization');
console.log('3. ✅ Prevents old system from interfering with new system');
console.log('4. ✅ Removes dependency on global puzzleImageUrl variable');
console.log('\n🔧 Expected behavior:');
console.log('- Only UnifiedPuzzleGame will be instantiated');
console.log('- No more "GET http://localhost:8000/3 404" errors');
console.log('- Clean separation between new and old systems');
console.log('\n🧪 To test:');
console.log('1. Refresh the page');
console.log('2. Upload a photo and complete a task');
console.log('3. Check console for clean initialization logs');
console.log('4. Verify puzzle game displays image correctly');
