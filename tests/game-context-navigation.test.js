/**
 * @jest-environment jsdom
 *
 * Regression test for game navigation bug
 * Tests that all game HTML files properly include GameContextManager
 * to ensure correct museum navigation after game completion
 * 
 * Bug: Games were returning to Forbidden City instead of current museum
 * Root cause: Missing game-context-manager.js script in some game files
 */

const fs = require('fs');
const path = require('path');

describe('Game Navigation Context Manager', () => {
    const gamesDir = path.join(__dirname, '..', 'games');
    const gameFiles = ['maze.html', 'snake.html', 'space-invaders.html', 'tank-battle.html'];
    
    describe('GameContextManager script inclusion', () => {
        gameFiles.forEach(gameFile => {
            test(`${gameFile} should include game-context-manager.js script`, () => {
                const filePath = path.join(gamesDir, gameFile);
                const content = fs.readFileSync(filePath, 'utf8');
                
                // Check that the game includes the GameContextManager script
                expect(content).toContain('game-context-manager.js');
                
                // Verify it's loaded as a script tag
                expect(content).toMatch(/<script[^>]*src=["'][^"']*game-context-manager\.js["'][^>]*>/);
            });
            
            test(`${gameFile} should load GameContextManager before using it`, () => {
                const filePath = path.join(gamesDir, gameFile);
                const content = fs.readFileSync(filePath, 'utf8');
                
                // Find positions of script tag and usage
                const scriptTagMatch = content.match(/<script[^>]*src=["'][^"']*game-context-manager\.js["'][^>]*>/);
                const usageMatch = content.match(/window\.GameContextManager/);
                
                if (scriptTagMatch && usageMatch) {
                    const scriptPosition = scriptTagMatch.index;
                    const usagePosition = usageMatch.index;
                    
                    // Script should be loaded before it's used
                    expect(scriptPosition).toBeLessThan(usagePosition);
                }
            });
        });
    });
    
    describe('Continue button museum navigation', () => {
        gameFiles.forEach(gameFile => {
            test(`${gameFile} Continue button should use GameContextManager for museum ID`, () => {
                const filePath = path.join(gamesDir, gameFile);
                const content = fs.readFileSync(filePath, 'utf8');
                
                // Check that the code tries to get context from GameContextManager
                expect(content).toMatch(/GameContextManager.*getContext/);
                
                // Check that it falls back to forbidden-city if context is not available
                expect(content).toMatch(/museumId.*forbidden-city/);
                
                // Check that it navigates to museum-checkin.html with museum ID
                expect(content).toMatch(/museum-checkin\.html\?id=/);
            });
        });
    });
    
    describe('GameContextManager context retrieval pattern', () => {
        gameFiles.forEach(gameFile => {
            test(`${gameFile} should use proper context retrieval pattern`, () => {
                const filePath = path.join(gamesDir, gameFile);
                const content = fs.readFileSync(filePath, 'utf8');
                
                // This pattern ensures safe access even if GameContextManager is undefined
                const hasProperPattern = 
                    content.includes('window.GameContextManager') &&
                    content.includes('getContext()') &&
                    (content.includes("|| 'forbidden-city'") || content.includes('|| "forbidden-city"'));
                
                expect(hasProperPattern).toBe(true);
            });
        });
    });
});

describe('GameContextManager Integration', () => {
    let GameContextManager;
    
    beforeEach(() => {
        // Mock localStorage
        global.localStorage = {
            getItem: jest.fn(),
            setItem: jest.fn(),
            removeItem: jest.fn(),
            clear: jest.fn()
        };
        
        // Load GameContextManager
        const contextManagerPath = path.join(__dirname, '..', 'js', 'game-context-manager.js');
        const contextManagerCode = fs.readFileSync(contextManagerPath, 'utf8');
        
        // Execute in current context
        eval(contextManagerCode);
        GameContextManager = global.GameContextManager;
    });
    
    test('should save and retrieve museum context', () => {
        const manager = new GameContextManager();
        const testContext = {
            museumId: 'test-museum',
            museumName: '测试博物馆',
            taskIndex: 5
        };
        
        // Mock localStorage.getItem to return our saved context
        const savedContext = {
            ...testContext,
            timestamp: Date.now()
        };
        
        global.localStorage.getItem.mockReturnValue(JSON.stringify(savedContext));
        
        const retrieved = manager.getContext();
        
        expect(retrieved).toBeTruthy();
        expect(retrieved.museumId).toBe('test-museum');
        expect(retrieved.museumName).toBe('测试博物馆');
    });
    
    test('should return null for missing context', () => {
        const manager = new GameContextManager();
        global.localStorage.getItem.mockReturnValue(null);
        
        const retrieved = manager.getContext();
        expect(retrieved).toBeNull();
    });
    
    test('should return null for expired context', () => {
        const manager = new GameContextManager();
        
        // Create context that's older than 1 hour
        const oldContext = {
            museumId: 'test-museum',
            timestamp: Date.now() - (61 * 60 * 1000) // 61 minutes ago
        };
        
        global.localStorage.getItem.mockReturnValue(JSON.stringify(oldContext));
        
        const retrieved = manager.getContext();
        expect(retrieved).toBeNull();
    });
});
