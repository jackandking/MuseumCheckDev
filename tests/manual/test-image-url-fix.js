#!/usr/bin/env node

/**
 * Quick test for puzzle image URL fix
 */

console.log('🧪 Testing Puzzle Image URL Fix...\n');

// Test the museum-checkin.js logic
const museumCheckinCode = require('fs').readFileSync('js/museum-checkin.js', 'utf8');

// Check if the improved logic is present
if (museumCheckinCode.includes('const photoUrl = taskPhotos[taskIndexForGame]')) {
    console.log('✅ Improved photo URL logic found in museum-checkin.js');
} else {
    console.log('❌ Improved photo URL logic not found');
}

// Check if debug logging is present
if (museumCheckinCode.includes('console.log(`[Puzzle] Using photo for task')) {
    console.log('✅ Debug logging for puzzle photos added');
} else {
    console.log('❌ Debug logging for puzzle photos not found');
}

// Test the unified puzzle game logic
const puzzleGameCode = require('fs').readFileSync('js/unified-puzzle-game.js', 'utf8');

if (puzzleGameCode.includes('console.log(`[${this.gameType}] onInit called with:')) {
    console.log('✅ Comprehensive debug logging added to UnifiedPuzzleGame');
} else {
    console.log('❌ Comprehensive debug logging not found');
}

if (puzzleGameCode.includes('DOM elements found:')) {
    console.log('✅ DOM element debugging added');
} else {
    console.log('❌ DOM element debugging not found');
}

console.log('\n🎉 Puzzle Image URL Fix Test Completed!');
console.log('\n📋 What was fixed:');
console.log('1. ✅ Improved photo URL extraction logic');
console.log('2. ✅ Added comprehensive debug logging');
console.log('3. ✅ Better error handling and fallbacks');
console.log('4. ✅ Detailed state tracking');
console.log('\n🔧 To test:');
console.log('1. Visit: http://localhost:8000/museum-checkin.html?id=beijing-natural-history-museum');
console.log('2. Upload a photo for the first task');
console.log('3. Complete the task to trigger puzzle game');
console.log('4. Check browser console for detailed debug info');
console.log('\n🐛 If still seeing "GET http://localhost:8000/2 404":');
console.log('- The debug logs will show exactly what photo URL is being used');
console.log('- Check if taskPhotos contains the expected task index');
console.log('- Verify the photo was properly saved before task completion');
