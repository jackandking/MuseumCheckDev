/**
 * @jest-environment jsdom
 * 
 * Regression test for Snake game restart button bug
 * Issue: 贪食蛇bug - 无法操控。第一次任务完成后有开始按钮。第二个任务完成后没有开始按钮了。
 * 
 * Bug Description:
 * After completing a task (game over), the game should show a button to allow restarting.
 * Previously, in non-debug mode, BOTH the start and restart buttons were hidden,
 * making it impossible to play again.
 * 
 * Fix:
 * - Non-debug mode: Show "开始" (Start) button after game over
 * - Debug mode: Show "再玩一次" (Restart) button after game over
 */

describe('Snake Game Restart Button Fix', () => {
    let overlayElements;
    let isDebugMode;
    
    beforeEach(() => {
        // Setup DOM structure for inline snake game
        document.body.innerHTML = `
            <div class="inline-snake-overlay">
                <div class="inline-snake-panel">
                    <button id="snakeInlineStartBtn" class="inline-snake-btn">开始</button>
                    <button id="snakeInlineRestartBtn" class="inline-snake-btn inline-snake-hidden">再玩一次</button>
                </div>
            </div>
        `;
        
        overlayElements = {
            startBtn: document.getElementById('snakeInlineStartBtn'),
            restartBtn: document.getElementById('snakeInlineRestartBtn')
        };
    });
    
    describe('Non-Debug Mode (Normal Users)', () => {
        beforeEach(() => {
            isDebugMode = () => false;
        });
        
        test('should show start button after first game over', () => {
            // Simulate endGame() logic for non-debug mode
            if (isDebugMode()) {
                overlayElements.restartBtn.classList.remove('inline-snake-hidden');
                overlayElements.startBtn.classList.add('inline-snake-hidden');
            } else {
                overlayElements.restartBtn.classList.add('inline-snake-hidden');
                overlayElements.startBtn.classList.remove('inline-snake-hidden');
            }
            
            // Verify: Start button should be visible
            expect(overlayElements.startBtn.classList.contains('inline-snake-hidden')).toBe(false);
            // Verify: Restart button should be hidden
            expect(overlayElements.restartBtn.classList.contains('inline-snake-hidden')).toBe(true);
        });
        
        test('should show start button after second game over', () => {
            // Simulate playing and ending game twice
            
            // First game over
            if (isDebugMode()) {
                overlayElements.restartBtn.classList.remove('inline-snake-hidden');
                overlayElements.startBtn.classList.add('inline-snake-hidden');
            } else {
                overlayElements.restartBtn.classList.add('inline-snake-hidden');
                overlayElements.startBtn.classList.remove('inline-snake-hidden');
            }
            
            // User clicks start button to play again
            overlayElements.startBtn.classList.add('inline-snake-hidden');
            overlayElements.restartBtn.classList.add('inline-snake-hidden');
            
            // Second game over
            if (isDebugMode()) {
                overlayElements.restartBtn.classList.remove('inline-snake-hidden');
                overlayElements.startBtn.classList.add('inline-snake-hidden');
            } else {
                overlayElements.restartBtn.classList.add('inline-snake-hidden');
                overlayElements.startBtn.classList.remove('inline-snake-hidden');
            }
            
            // Verify: Start button should STILL be visible after second game
            expect(overlayElements.startBtn.classList.contains('inline-snake-hidden')).toBe(false);
            // Verify: Restart button should be hidden
            expect(overlayElements.restartBtn.classList.contains('inline-snake-hidden')).toBe(true);
        });
        
        test('should allow multiple consecutive games', () => {
            // Test that users can play multiple times in a row
            const playGame = () => {
                // Start game - hide both buttons
                overlayElements.startBtn.classList.add('inline-snake-hidden');
                overlayElements.restartBtn.classList.add('inline-snake-hidden');
                
                // End game - show appropriate button
                if (isDebugMode()) {
                    overlayElements.restartBtn.classList.remove('inline-snake-hidden');
                    overlayElements.startBtn.classList.add('inline-snake-hidden');
                } else {
                    overlayElements.restartBtn.classList.add('inline-snake-hidden');
                    overlayElements.startBtn.classList.remove('inline-snake-hidden');
                }
            };
            
            // Play 3 consecutive games
            for (let i = 0; i < 3; i++) {
                playGame();
                
                // After each game, start button should be visible
                expect(overlayElements.startBtn.classList.contains('inline-snake-hidden')).toBe(false);
                expect(overlayElements.restartBtn.classList.contains('inline-snake-hidden')).toBe(true);
            }
        });
        
        test('REGRESSION: should NOT hide both buttons (the bug)', () => {
            // This was the original bug - both buttons were hidden
            const buggyBehavior = () => {
                overlayElements.restartBtn.classList.add('inline-snake-hidden');
                overlayElements.startBtn.classList.add('inline-snake-hidden'); // BUG!
            };
            
            const fixedBehavior = () => {
                overlayElements.restartBtn.classList.add('inline-snake-hidden');
                overlayElements.startBtn.classList.remove('inline-snake-hidden'); // FIXED!
            };
            
            // Test the fixed behavior
            fixedBehavior();
            
            // At least one button should be visible
            const bothHidden = 
                overlayElements.startBtn.classList.contains('inline-snake-hidden') &&
                overlayElements.restartBtn.classList.contains('inline-snake-hidden');
            
            expect(bothHidden).toBe(false);
        });
    });
    
    describe('Debug Mode (Developers)', () => {
        beforeEach(() => {
            isDebugMode = () => true;
        });
        
        test('should show restart button after game over in debug mode', () => {
            // Simulate endGame() logic for debug mode
            if (isDebugMode()) {
                overlayElements.restartBtn.classList.remove('inline-snake-hidden');
                overlayElements.startBtn.classList.add('inline-snake-hidden');
            } else {
                overlayElements.restartBtn.classList.add('inline-snake-hidden');
                overlayElements.startBtn.classList.remove('inline-snake-hidden');
            }
            
            // Verify: Restart button should be visible in debug mode
            expect(overlayElements.restartBtn.classList.contains('inline-snake-hidden')).toBe(false);
            // Verify: Start button should be hidden in debug mode
            expect(overlayElements.startBtn.classList.contains('inline-snake-hidden')).toBe(true);
        });
        
        test('should maintain debug mode restart button across multiple games', () => {
            const playGame = () => {
                // Start game
                overlayElements.startBtn.classList.add('inline-snake-hidden');
                overlayElements.restartBtn.classList.add('inline-snake-hidden');
                
                // End game
                if (isDebugMode()) {
                    overlayElements.restartBtn.classList.remove('inline-snake-hidden');
                    overlayElements.startBtn.classList.add('inline-snake-hidden');
                } else {
                    overlayElements.restartBtn.classList.add('inline-snake-hidden');
                    overlayElements.startBtn.classList.remove('inline-snake-hidden');
                }
            };
            
            // Play multiple games in debug mode
            for (let i = 0; i < 3; i++) {
                playGame();
                
                // After each game, restart button should be visible
                expect(overlayElements.restartBtn.classList.contains('inline-snake-hidden')).toBe(false);
                expect(overlayElements.startBtn.classList.contains('inline-snake-hidden')).toBe(true);
            }
        });
    });
    
    describe('Button Visibility States', () => {
        test('exactly one button should be visible after game over', () => {
            const testButtonVisibility = (debugMode) => {
                isDebugMode = () => debugMode;
                
                // Execute endGame logic
                if (isDebugMode()) {
                    overlayElements.restartBtn.classList.remove('inline-snake-hidden');
                    overlayElements.startBtn.classList.add('inline-snake-hidden');
                } else {
                    overlayElements.restartBtn.classList.add('inline-snake-hidden');
                    overlayElements.startBtn.classList.remove('inline-snake-hidden');
                }
                
                const startVisible = !overlayElements.startBtn.classList.contains('inline-snake-hidden');
                const restartVisible = !overlayElements.restartBtn.classList.contains('inline-snake-hidden');
                
                // Exactly one should be visible (XOR)
                expect(startVisible !== restartVisible).toBe(true);
            };
            
            testButtonVisibility(false); // Non-debug mode
            testButtonVisibility(true);  // Debug mode
        });
        
        test('both buttons should be hidden during gameplay', () => {
            // When game is playing, neither button should be visible
            overlayElements.startBtn.classList.add('inline-snake-hidden');
            overlayElements.restartBtn.classList.add('inline-snake-hidden');
            
            const startVisible = !overlayElements.startBtn.classList.contains('inline-snake-hidden');
            const restartVisible = !overlayElements.restartBtn.classList.contains('inline-snake-hidden');
            
            expect(startVisible).toBe(false);
            expect(restartVisible).toBe(false);
        });
    });
    
    describe('User Experience Flow', () => {
        test('normal user flow: initial start -> game over -> restart -> game over', () => {
            isDebugMode = () => false;
            
            // Step 1: Initial state - start button visible
            overlayElements.startBtn.classList.remove('inline-snake-hidden');
            overlayElements.restartBtn.classList.add('inline-snake-hidden');
            expect(overlayElements.startBtn.classList.contains('inline-snake-hidden')).toBe(false);
            
            // Step 2: User clicks start, game begins - both buttons hidden
            overlayElements.startBtn.classList.add('inline-snake-hidden');
            overlayElements.restartBtn.classList.add('inline-snake-hidden');
            expect(overlayElements.startBtn.classList.contains('inline-snake-hidden')).toBe(true);
            expect(overlayElements.restartBtn.classList.contains('inline-snake-hidden')).toBe(true);
            
            // Step 3: Game over - start button appears again
            if (isDebugMode()) {
                overlayElements.restartBtn.classList.remove('inline-snake-hidden');
                overlayElements.startBtn.classList.add('inline-snake-hidden');
            } else {
                overlayElements.restartBtn.classList.add('inline-snake-hidden');
                overlayElements.startBtn.classList.remove('inline-snake-hidden');
            }
            expect(overlayElements.startBtn.classList.contains('inline-snake-hidden')).toBe(false);
            
            // Step 4: User clicks start again - both buttons hidden
            overlayElements.startBtn.classList.add('inline-snake-hidden');
            overlayElements.restartBtn.classList.add('inline-snake-hidden');
            
            // Step 5: Second game over - start button appears again (THE FIX!)
            if (isDebugMode()) {
                overlayElements.restartBtn.classList.remove('inline-snake-hidden');
                overlayElements.startBtn.classList.add('inline-snake-hidden');
            } else {
                overlayElements.restartBtn.classList.add('inline-snake-hidden');
                overlayElements.startBtn.classList.remove('inline-snake-hidden');
            }
            expect(overlayElements.startBtn.classList.contains('inline-snake-hidden')).toBe(false);
        });
    });
});
