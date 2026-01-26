#!/usr/bin/env node

/**
 * Unified Game Architecture Test Runner
 * 统一游戏架构测试运行器
 * 
 * Tests the new unified game system without requiring a browser
 */

const fs = require('fs');
const path = require('path');

// Mock DOM environment
global.document = {
    createElement: (tag) => ({
        className: '',
        style: {},
        textContent: '',
        innerHTML: '',
        dataset: {},
        addEventListener: () => {},
        removeEventListener: () => {},
        classList: {
            add: () => {},
            remove: () => {},
            contains: () => false
        }
    }),
    getElementById: (id) => null,
    querySelector: () => null,
    addEventListener: () => {}
};

global.window = {
    location: { href: 'http://localhost:8000' },
    console: console,
    BaseGame: null,
    GameManager: null,
    UnifiedPuzzleGame: null
};

// Mock console methods for testing
let testResults = [];
let currentTest = '';

function log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] [${type.toUpperCase()}] ${message}`;
    console.log(logEntry);
    testResults.push({ test: currentTest, message, type, timestamp });
}

function assert(condition, message) {
    if (condition) {
        log(`✅ ${message}`, 'success');
        return true;
    } else {
        log(`❌ ${message}`, 'error');
        return false;
    }
}

function runTest(testName, testFn) {
    currentTest = testName;
    log(`\n🧪 Running test: ${testName}`, 'info');
    
    try {
        const result = testFn();
        if (result) {
            log(`✅ Test passed: ${testName}`, 'success');
        } else {
            log(`❌ Test failed: ${testName}`, 'error');
        }
        return result;
    } catch (error) {
        log(`❌ Test error in ${testName}: ${error.message}`, 'error');
        return false;
    }
}

// Load and execute the game architecture files
function loadGameArchitecture() {
    log('Loading game architecture files...', 'info');
    
    try {
        // Load base-game.js
        const baseGameCode = fs.readFileSync(path.join(__dirname, 'js/base-game.js'), 'utf8');
        // Remove export statements for Node.js environment
        const cleanBaseGameCode = baseGameCode
            .replace(/if \(typeof module !== 'undefined'.*?\}/g, '')
            .replace(/else if \(typeof window !== 'undefined'\).*?\}/g, '');
        eval(cleanBaseGameCode);
        log('✅ BaseGame class loaded', 'success');
        
        // Load game-manager.js
        const gameManagerCode = fs.readFileSync(path.join(__dirname, 'js/game-manager.js'), 'utf8');
        const cleanGameManagerCode = gameManagerCode
            .replace(/if \(typeof module !== 'undefined'.*?\}/g, '')
            .replace(/else if \(typeof window !== 'undefined'\).*?\}/g, '');
        eval(cleanGameManagerCode);
        log('✅ GameManager class loaded', 'success');
        
        // Load unified-puzzle-game.js
        const puzzleGameCode = fs.readFileSync(path.join(__dirname, 'js/unified-puzzle-game.js'), 'utf8');
        const cleanPuzzleGameCode = puzzleGameCode
            .replace(/if \(typeof module !== 'undefined'.*?\}/g, '')
            .replace(/else if \(typeof window !== 'undefined'\).*?\}/g, '');
        eval(cleanPuzzleGameCode);
        log('✅ UnifiedPuzzleGame class loaded', 'success');
        
        // Make classes available globally
        global.BaseGame = BaseGame;
        global.GameManager = GameManager;
        global.UnifiedPuzzleGame = UnifiedPuzzleGame;
        
        return true;
    } catch (error) {
        log(`❌ Failed to load architecture: ${error.message}`, 'error');
        return false;
    }
}

// Test BaseGame class
function testBaseGame() {
    let passed = 0;
    let total = 0;
    
    // Test class existence
    total++;
    if (assert(typeof BaseGame === 'function', 'BaseGame class exists')) {
        passed++;
    }
    
    // Test instantiation
    total++;
    try {
        const game = new BaseGame('test');
        if (assert(game instanceof BaseGame, 'BaseGame can be instantiated')) {
            passed++;
        }
        
        // Test initial state
        total++;
        if (assert(game.state === 'idle', 'Initial state is idle')) {
            passed++;
        }
        
        // Test configuration
        total++;
        if (assert(game.config && typeof game.config === 'object', 'Configuration object exists')) {
            passed++;
        }
        
        // Test default config
        total++;
        if (assert(game.config.autoCloseDelay === 2000, 'Default autoCloseDelay is 2000')) {
            passed++;
        }
        
    } catch (error) {
        log(`❌ BaseGame instantiation failed: ${error.message}`, 'error');
    }
    
    return passed === total;
}

// Test GameManager class
function testGameManager() {
    let passed = 0;
    let total = 0;
    
    // Test class existence
    total++;
    if (assert(typeof GameManager === 'object', 'GameManager object exists')) {
        passed++;
    }
    
    // Test initialization
    total++;
    try {
        GameManager.init();
        if (assert(GameManager.initialized === true, 'GameManager initialized')) {
            passed++;
        }
    } catch (error) {
        log(`❌ GameManager initialization failed: ${error.message}`, 'error');
    }
    
    // Test game registration
    total++;
    if (assert(GameManager.gameClasses.size > 0, 'Games are registered')) {
        passed++;
    }
    
    // Test game availability check
    total++;
    if (assert(GameManager.isGameAvailable('puzzle') === true, 'Puzzle game is available')) {
        passed++;
    }
    
    // Test available games list
    total++;
    const availableGames = GameManager.getAvailableGames();
    if (assert(Array.isArray(availableGames) && availableGames.includes('puzzle'), 'Available games list contains puzzle')) {
        passed++;
    }
    
    return passed === total;
}

// Test UnifiedPuzzleGame class
function testUnifiedPuzzleGame() {
    let passed = 0;
    let total = 0;
    
    // Test class existence
    total++;
    if (assert(typeof UnifiedPuzzleGame === 'function', 'UnifiedPuzzleGame class exists')) {
        passed++;
    }
    
    // Test inheritance
    total++;
    try {
        const puzzleGame = new UnifiedPuzzleGame();
        if (assert(puzzleGame instanceof BaseGame, 'UnifiedPuzzleGame extends BaseGame')) {
            passed++;
        }
        
        // Test puzzle-specific properties
        total++;
        if (assert(puzzleGame.gameType === 'puzzle', 'Game type is puzzle')) {
            passed++;
        }
        
        // Test puzzle-specific config
        total++;
        if (assert(puzzleGame.config.showResetButton === true, 'Puzzle config shows reset button')) {
            passed++;
        }
        
        // Test puzzle size logic
        total++;
        if (assert(puzzleGame.puzzleSize === 2, 'Default puzzle size is 2')) {
            passed++;
        }
        
    } catch (error) {
        log(`❌ UnifiedPuzzleGame instantiation failed: ${error.message}`, 'error');
    }
    
    return passed === total;
}

// Test game lifecycle
async function testGameLifecycle() {
    let passed = 0;
    let total = 0;
    
    try {
        const game = new UnifiedPuzzleGame();
        
        // Test initialization
        total++;
        await game.init(0, { imageUrl: 'test.jpg' });
        if (assert(game.state === 'idle', 'Game initialized with idle state')) {
            passed++;
        }
        
        // Test start
        total++;
        const started = game.start();
        if (assert(started === true && game.state === 'playing', 'Game started successfully')) {
            passed++;
        }
        
        // Test completion
        total++;
        const completed = game.complete({ moves: 5 });
        if (assert(completed === true && game.state === 'completed', 'Game completed successfully')) {
            passed++;
        }
        
        // Test reset
        total++;
        game.reset();
        if (assert(game.state === 'playing', 'Game reset successfully')) {
            passed++;
        }
        
        // Test close
        total++;
        game.close();
        if (assert(game.state === 'idle', 'Game closed successfully')) {
            passed++;
        }
        
    } catch (error) {
        log(`❌ Game lifecycle test failed: ${error.message}`, 'error');
    }
    
    return passed === total;
}

// Test GameManager integration
async function testGameManagerIntegration() {
    let passed = 0;
    let total = 0;
    
    try {
        // Test starting game through GameManager
        total++;
        const game = await GameManager.startGame('puzzle', 0, { imageUrl: 'test.jpg' });
        if (assert(game && GameManager.getCurrentGame() === game, 'GameManager started game')) {
            passed++;
        }
        
        // Test game state through GameManager
        total++;
        if (assert(GameManager.isGameActive() === true, 'GameManager reports game as active')) {
            passed++;
        }
        
        // Test ending game through GameManager
        total++;
        const ended = GameManager.endGame({ moves: 3 });
        if (assert(ended === true, 'GameManager ended game')) {
            passed++;
        }
        
        // Test closing game through GameManager
        total++;
        const closed = GameManager.closeGame();
        if (assert(closed === true && GameManager.getCurrentGame() === null, 'GameManager closed game')) {
            passed++;
        }
        
    } catch (error) {
        log(`❌ GameManager integration test failed: ${error.message}`, 'error');
    }
    
    return passed === total;
}

// Main test runner
async function runAllTests() {
    log('🚀 Starting Unified Game Architecture Tests', 'info');
    log('='.repeat(50), 'info');
    
    const startTime = Date.now();
    let totalTests = 0;
    let passedTests = 0;
    
    // Load architecture
    if (!loadGameArchitecture()) {
        log('❌ Failed to load game architecture. Aborting tests.', 'error');
        return;
    }
    totalTests++;
    passedTests++;
    
    // Run tests
    const tests = [
        { name: 'BaseGame Class', fn: testBaseGame },
        { name: 'GameManager Class', fn: testGameManager },
        { name: 'UnifiedPuzzleGame Class', fn: testUnifiedPuzzleGame },
        { name: 'Game Lifecycle', fn: testGameLifecycle },
        { name: 'GameManager Integration', fn: testGameManagerIntegration }
    ];
    
    for (const test of tests) {
        totalTests++;
        if (runTest(test.name, test.fn)) {
            passedTests++;
        }
    }
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    // Print summary
    log('\n' + '='.repeat(50), 'info');
    log('📊 Test Summary', 'info');
    log(`Total Tests: ${totalTests}`, 'info');
    log(`Passed: ${passedTests}`, 'success');
    log(`Failed: ${totalTests - passedTests}`, totalTests === passedTests ? 'info' : 'error');
    log(`Duration: ${duration}ms`, 'info');
    log(`Success Rate: ${Math.round((passedTests / totalTests) * 100)}%`, 'info');
    
    if (passedTests === totalTests) {
        log('\n🎉 All tests passed! Unified game architecture is working correctly.', 'success');
    } else {
        log('\n⚠️ Some tests failed. Please review the issues above.', 'error');
    }
    
    // Save test results
    const reportPath = path.join(__dirname, 'test-results.json');
    fs.writeFileSync(reportPath, JSON.stringify({
        summary: {
            total: totalTests,
            passed: passedTests,
            failed: totalTests - passedTests,
            duration: duration,
            successRate: Math.round((passedTests / totalTests) * 100)
        },
        results: testResults,
        timestamp: new Date().toISOString()
    }, null, 2));
    
    log(`\n📄 Test report saved to: ${reportPath}`, 'info');
}

// Run tests
runAllTests().catch(error => {
    console.error('Test runner failed:', error);
    process.exit(1);
});
