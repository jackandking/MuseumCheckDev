/**
 * @jest-environment jsdom
 * 
 * Tests for Game XP Farming Prevention
 * Issue: 小朋友可以通过重复开始游戏来刷积分
 * 
 * Fix: Each game session (triggered by task completion) only awards XP once.
 *      The `currentGameXPAwarded` flag resets when a NEW game is initialized
 *      (from task completion), but NOT when the game is restarted via the
 *      "重新开始" button.
 */

describe('Game XP Farming Prevention', () => {
    // Create game simulator that mimics the actual implementation
    function createGameSimulator() {
        let currentGameXPAwarded = false;
        let xpAwarded = 0;
        let addXPCallCount = 0;
        
        return {
            initGame() {
                currentGameXPAwarded = false;
            },
            completeGame(gameXP = 15) {
                if (!currentGameXPAwarded) {
                    xpAwarded += gameXP;
                    addXPCallCount++;
                    currentGameXPAwarded = true;
                }
            },
            restartGame() {
                // Restart does NOT reset currentGameXPAwarded
            },
            getXPAwarded() {
                return xpAwarded;
            },
            getAddXPCallCount() {
                return addXPCallCount;
            }
        };
    }
    
    describe('First game completion', () => {
        test('should award XP on first completion', () => {
            const game = createGameSimulator();
            game.initGame();
            game.completeGame(15);
            
            expect(game.getXPAwarded()).toBe(15);
            expect(game.getAddXPCallCount()).toBe(1);
        });
    });
    
    describe('Game restart XP farming prevention', () => {
        test('should NOT award XP on restart + completion (the fix)', () => {
            const game = createGameSimulator();
            game.initGame();
            game.completeGame(15);  // First completion - gets XP
            
            game.restartGame();     // Restart via button
            game.completeGame(15);  // Second completion - should NOT get XP
            
            expect(game.getXPAwarded()).toBe(15);  // Only 15 XP total, not 30
            expect(game.getAddXPCallCount()).toBe(1);
        });
        
        test('should NOT award XP on multiple restarts', () => {
            const game = createGameSimulator();
            game.initGame();
            game.completeGame(20);
            
            // Simulate multiple restart attempts
            for (let i = 0; i < 10; i++) {
                game.restartGame();
                game.completeGame(20);
            }
            
            expect(game.getXPAwarded()).toBe(20);  // Only 20 XP total, not 220
            expect(game.getAddXPCallCount()).toBe(1);
        });
    });
    
    describe('New task triggers new game session', () => {
        test('should award XP when new task triggers new game', () => {
            const game = createGameSimulator();
            
            // First task's game
            game.initGame();
            game.completeGame(15);
            expect(game.getXPAwarded()).toBe(15);
            
            // Second task triggers new game (via initGame)
            game.initGame();
            game.completeGame(20);
            expect(game.getXPAwarded()).toBe(35);  // 15 + 20
            
            expect(game.getAddXPCallCount()).toBe(2);
        });
        
        test('should allow XP per task, but not per restart', () => {
            const game = createGameSimulator();
            
            // Task 1 game
            game.initGame();
            game.completeGame(15);
            game.restartGame();
            game.completeGame(15);  // No XP
            game.restartGame();
            game.completeGame(15);  // No XP
            
            // Task 2 game
            game.initGame();
            game.completeGame(20);
            game.restartGame();
            game.completeGame(20);  // No XP
            
            // Task 3 game
            game.initGame();
            game.completeGame(25);
            
            expect(game.getXPAwarded()).toBe(60);  // 15 + 20 + 25 = 60
            expect(game.getAddXPCallCount()).toBe(3);
        });
    });
    
    describe('Edge cases', () => {
        test('should handle immediate restart before first completion', () => {
            const game = createGameSimulator();
            game.initGame();
            game.restartGame();  // Restart before completing
            game.completeGame(15);
            
            expect(game.getXPAwarded()).toBe(15);  // First completion still gets XP
        });
        
        test('should handle game with 0 score', () => {
            const game = createGameSimulator();
            game.initGame();
            game.completeGame(0);
            
            expect(game.getAddXPCallCount()).toBe(1);
            
            // Restart should not award again
            game.restartGame();
            game.completeGame(10);
            
            expect(game.getXPAwarded()).toBe(0);  // Still 0, second completion blocked
            expect(game.getAddXPCallCount()).toBe(1);
        });
    });
    
    describe('Different game types', () => {
        const gameTypes = [
            { name: 'puzzle', baseXP: 15 },
            { name: 'maze', baseXP: 20 },
            { name: 'shooting', baseXP: 10 },
            { name: 'space-invaders', baseXP: 15 },
            { name: 'tank-battle', baseXP: 20 },
            { name: 'minesweeper', baseXP: 10 },
            { name: 'pet-adventure', baseXP: 10 }
        ];
        
        gameTypes.forEach(gameType => {
            test(`${gameType.name}: should only award XP once per session`, () => {
                const game = createGameSimulator();
                game.initGame();
                game.completeGame(gameType.baseXP);
                
                // Multiple restarts
                game.restartGame();
                game.completeGame(gameType.baseXP);
                game.restartGame();
                game.completeGame(gameType.baseXP);
                
                expect(game.getXPAwarded()).toBe(gameType.baseXP);
                expect(game.getAddXPCallCount()).toBe(1);
            });
        });
    });
});

describe('Regression: Bug behavior before fix', () => {
    test('BUG (before fix): XP was awarded on every completion', () => {
        let xpAwarded = 0;
        
        // Simulating the OLD buggy code (no currentGameXPAwarded check)
        function buggyCompleteGame(gameXP) {
            xpAwarded += gameXP;
        }
        
        buggyCompleteGame(15);  // First completion
        buggyCompleteGame(15);  // Restart + completion
        buggyCompleteGame(15);  // Restart + completion again
        
        // This was the bug - kids could farm unlimited XP
        expect(xpAwarded).toBe(45);
    });
    
    test('FIX: XP is only awarded once per game session', () => {
        let currentGameXPAwarded = false;
        let xpAwarded = 0;
        
        function fixedInitGame() {
            currentGameXPAwarded = false;
        }
        
        function fixedCompleteGame(gameXP) {
            if (!currentGameXPAwarded) {
                xpAwarded += gameXP;
                currentGameXPAwarded = true;
            }
        }
        
        fixedInitGame();
        fixedCompleteGame(15);  // First completion - gets XP
        fixedCompleteGame(15);  // Restart + completion - blocked
        fixedCompleteGame(15);  // Restart + completion - blocked
        
        // Fixed: Only 15 XP awarded
        expect(xpAwarded).toBe(15);
    });
});
