#!/usr/bin/env node

/**
 * Simple test for game architecture
 */

const fs = require('fs');
const path = require('path');

// Simple mock environment
global.window = {
    BaseGame: null,
    GameManager: null,
    UnifiedPuzzleGame: null
};

global.document = {
    createElement: () => ({
        className: '',
        style: {},
        textContent: '',
        innerHTML: '',
        dataset: {},
        addEventListener: () => {},
        removeEventListener: () => {},
        classList: { add: () => {}, remove: () => {}, contains: () => false }
    }),
    getElementById: () => null,
    querySelector: () => null,
    addEventListener: () => {}
};

console.log('🧪 Testing Game Architecture Loading...\n');

try {
    // Test BaseGame loading
    console.log('Loading BaseGame...');
    const baseGameCode = fs.readFileSync(path.join(__dirname, 'js/base-game.js'), 'utf8');
    
    // Execute in global context
    eval(baseGameCode);
    
    if (typeof BaseGame !== 'undefined') {
        console.log('✅ BaseGame class loaded successfully');
        
        // Test instantiation
        const game = new BaseGame('test');
        console.log('✅ BaseGame can be instantiated');
        console.log(`✅ Initial state: ${game.state}`);
        console.log(`✅ Game type: ${game.gameType}`);
        
    } else {
        console.log('❌ BaseGame class not found');
    }
    
} catch (error) {
    console.error('❌ BaseGame loading failed:', error.message);
}

try {
    // Test GameManager loading
    console.log('\nLoading GameManager...');
    const gameManagerCode = fs.readFileSync(path.join(__dirname, 'js/game-manager.js'), 'utf8');
    eval(gameManagerCode);
    
    if (typeof GameManager !== 'undefined') {
        console.log('✅ GameManager class loaded successfully');
        console.log(`✅ Initialized: ${GameManager.initialized}`);
        console.log(`✅ Available games: ${GameManager.getAvailableGames().join(', ')}`);
    } else {
        console.log('❌ GameManager class not found');
    }
    
} catch (error) {
    console.error('❌ GameManager loading failed:', error.message);
}

try {
    // Test UnifiedPuzzleGame loading
    console.log('\nLoading UnifiedPuzzleGame...');
    const puzzleGameCode = fs.readFileSync(path.join(__dirname, 'js/unified-puzzle-game.js'), 'utf8');
    eval(puzzleGameCode);
    
    if (typeof UnifiedPuzzleGame !== 'undefined') {
        console.log('✅ UnifiedPuzzleGame class loaded successfully');
        
        // Test inheritance
        const puzzleGame = new UnifiedPuzzleGame();
        console.log(`✅ Extends BaseGame: ${puzzleGame instanceof BaseGame}`);
        console.log(`✅ Game type: ${puzzleGame.gameType}`);
        console.log(`✅ Default puzzle size: ${puzzleGame.puzzleSize}`);
        
    } else {
        console.log('❌ UnifiedPuzzleGame class not found');
    }
    
} catch (error) {
    console.error('❌ UnifiedPuzzleGame loading failed:', error.message);
}

console.log('\n🎉 Architecture loading test completed!');
