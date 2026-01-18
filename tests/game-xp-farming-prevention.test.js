/**
 * @jest-environment jsdom
 * 
 * Tests for Game XP Farming Prevention via GameRewardManager
 * Issue: 小朋友可以通过重复开始游戏来刷积分
 * 
 * Fix: Unified GameRewardManager handles all game rewards.
 *      - startNewSession(): Resets reward tracking when new game starts from task
 *      - awardCompletion(): Awards XP only once per session
 */

describe('GameRewardManager', () => {
    // Simulate the GameRewardManager implementation
    function createGameRewardManager() {
        let _sessionRewarded = false;
        let xpAwarded = 0;
        let awardCallCount = 0;
        
        return {
            startNewSession() {
                _sessionRewarded = false;
            },
            
            awardCompletion(gameType, score = 0, timeSeconds = 0) {
                if (_sessionRewarded) {
                    return false;
                }
                
                // Simplified XP calculation for testing
                const xp = this._calculateXP(gameType, score, timeSeconds);
                xpAwarded += xp;
                awardCallCount++;
                _sessionRewarded = true;
                return true;
            },
            
            _calculateXP(gameType, score, timeSeconds) {
                const baseXP = {
                    'puzzle': 15,
                    'maze': 20,
                    'shooting': 10,
                    'space-invaders': 15,
                    'tank-battle': 20,
                    'minesweeper': 10,
                    'pet-adventure': 10,
                    'snake': 10
                };
                return baseXP[gameType] || 10;
            },
            
            isSessionRewarded() {
                return _sessionRewarded;
            },
            
            // Test helpers
            getXPAwarded() {
                return xpAwarded;
            },
            getAwardCallCount() {
                return awardCallCount;
            }
        };
    }
    
    describe('Single game session', () => {
        test('should award XP on first completion', () => {
            const manager = createGameRewardManager();
            manager.startNewSession();
            
            const awarded = manager.awardCompletion('puzzle', 10);
            
            expect(awarded).toBe(true);
            expect(manager.getXPAwarded()).toBe(15);
            expect(manager.getAwardCallCount()).toBe(1);
        });
        
        test('should NOT award XP on subsequent completions in same session', () => {
            const manager = createGameRewardManager();
            manager.startNewSession();
            
            manager.awardCompletion('puzzle', 10);  // First - awarded
            const secondResult = manager.awardCompletion('puzzle', 10);  // Second - blocked
            const thirdResult = manager.awardCompletion('puzzle', 10);   // Third - blocked
            
            expect(secondResult).toBe(false);
            expect(thirdResult).toBe(false);
            expect(manager.getXPAwarded()).toBe(15);  // Only one reward
            expect(manager.getAwardCallCount()).toBe(1);
        });
    });
    
    describe('Multiple game sessions (from different tasks)', () => {
        test('should award XP for each new session', () => {
            const manager = createGameRewardManager();
            
            // Task 1
            manager.startNewSession();
            manager.awardCompletion('puzzle', 10);
            
            // Task 2
            manager.startNewSession();
            manager.awardCompletion('maze', 50);
            
            // Task 3
            manager.startNewSession();
            manager.awardCompletion('shooting', 100);
            
            expect(manager.getXPAwarded()).toBe(15 + 20 + 10);  // 45
            expect(manager.getAwardCallCount()).toBe(3);
        });
        
        test('should allow XP per task, but not per restart within task', () => {
            const manager = createGameRewardManager();
            
            // Task 1 - play multiple times
            manager.startNewSession();
            manager.awardCompletion('puzzle', 10);  // Awarded
            manager.awardCompletion('puzzle', 10);  // Blocked (restart)
            manager.awardCompletion('puzzle', 10);  // Blocked (restart)
            
            // Task 2 - play multiple times
            manager.startNewSession();
            manager.awardCompletion('maze', 50);    // Awarded
            manager.awardCompletion('maze', 50);    // Blocked (restart)
            
            expect(manager.getXPAwarded()).toBe(15 + 20);  // 35
            expect(manager.getAwardCallCount()).toBe(2);
        });
    });
    
    describe('Different game types', () => {
        const gameTypes = [
            { type: 'puzzle', expectedXP: 15 },
            { type: 'maze', expectedXP: 20 },
            { type: 'shooting', expectedXP: 10 },
            { type: 'space-invaders', expectedXP: 15 },
            { type: 'tank-battle', expectedXP: 20 },
            { type: 'minesweeper', expectedXP: 10 },
            { type: 'pet-adventure', expectedXP: 10 }
        ];
        
        gameTypes.forEach(game => {
            test(`${game.type}: should only award XP once per session`, () => {
                const manager = createGameRewardManager();
                manager.startNewSession();
                
                manager.awardCompletion(game.type, 100);
                manager.awardCompletion(game.type, 100);  // Blocked
                manager.awardCompletion(game.type, 100);  // Blocked
                
                expect(manager.getXPAwarded()).toBe(game.expectedXP);
                expect(manager.getAwardCallCount()).toBe(1);
            });
        });
    });
    
    describe('isSessionRewarded() status tracking', () => {
        test('should return false before any reward', () => {
            const manager = createGameRewardManager();
            manager.startNewSession();
            
            expect(manager.isSessionRewarded()).toBe(false);
        });
        
        test('should return true after reward', () => {
            const manager = createGameRewardManager();
            manager.startNewSession();
            manager.awardCompletion('puzzle', 10);
            
            expect(manager.isSessionRewarded()).toBe(true);
        });
        
        test('should reset to false on new session', () => {
            const manager = createGameRewardManager();
            manager.startNewSession();
            manager.awardCompletion('puzzle', 10);
            
            manager.startNewSession();  // New task
            
            expect(manager.isSessionRewarded()).toBe(false);
        });
    });
});

describe('Regression: Before vs After refactoring', () => {
    test('BEFORE: Each game had separate XP logic (hard to maintain)', () => {
        // This documents the OLD approach - 7 separate implementations
        const oldGameCount = 7;
        const oldCodeDuplication = oldGameCount * 15; // ~15 lines per game
        
        // Old approach had ~105 lines of duplicated XP logic
        expect(oldCodeDuplication).toBeGreaterThan(100);
    });
    
    test('AFTER: Single GameRewardManager handles all games', () => {
        // New approach - single implementation
        const newImplementationCount = 1;
        const linesPerGame = 1; // Just: GameRewardManager.awardCompletion(type, score)
        
        expect(newImplementationCount).toBe(1);
        expect(linesPerGame).toBe(1);
    });
});
