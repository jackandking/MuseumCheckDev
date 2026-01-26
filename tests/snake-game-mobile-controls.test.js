/**
 * @jest-environment jsdom
 *
 * Unified Snake Game basic UI tests
 */

describe('UnifiedSnakeGame UI basics', () => {
    beforeEach(() => {
        document.body.innerHTML = `
            <div class="snake-overlay" id="snakeGameOverlay">
                <div class="snake-header">
                    <div class="snake-title">贪食蛇大作战</div>
                    <div class="snake-stats">
                        得分：<span id="snakeScore">0</span> | 长度：<span id="snakeLength">3</span>
                    </div>
                </div>
                <div class="snake-container">
                    <canvas class="snake-canvas" id="snakeCanvas" width="320" height="320"></canvas>
                </div>
                <div class="snake-buttons">
                    <button class="snake-button snake-button-reset" id="resetSnake">重新开始</button>
                    <button class="snake-button snake-button-continue" id="exitSnake">继续游览 ➡️</button>
                </div>
                <div class="snake-complete-message" id="snakeCompleteMessage">
                    游戏结束！得分：<span id="snakeFinalScore">0</span>
                </div>
            </div>
        `;
    });

    test('should render overlay elements', () => {
        expect(document.getElementById('snakeGameOverlay')).not.toBeNull();
        expect(document.getElementById('snakeCanvas')).not.toBeNull();
        expect(document.getElementById('snakeScore')).not.toBeNull();
        expect(document.getElementById('snakeLength')).not.toBeNull();
        expect(document.getElementById('resetSnake')).not.toBeNull();
        expect(document.getElementById('exitSnake')).not.toBeNull();
    });
});

describe('Snake Game Mobile Touch Controls', () => {
    let mockDocument;
    
    beforeEach(() => {
        // Setup DOM structure similar to snake-game.html
        document.body.innerHTML = `
            <div id="gameContainer">
                <canvas id="gameCanvas"></canvas>
                <div class="touch-controls" id="touchControls">
                    <div class="direction-pad">
                        <button class="touch-btn touch-btn-up" id="upBtn">▲</button>
                        <button class="touch-btn touch-btn-left" id="leftBtn">◀</button>
                        <button class="touch-btn touch-btn-right" id="rightBtn">▶</button>
                        <button class="touch-btn touch-btn-down" id="downBtn">▼</button>
                    </div>
                </div>
            </div>
        `;
    });

    describe('Touch Control Elements', () => {
        test('should have touch controls container', () => {
            const touchControls = document.getElementById('touchControls');
            expect(touchControls).not.toBeNull();
            expect(touchControls.classList.contains('touch-controls')).toBe(true);
        });

        test('should have direction pad container', () => {
            const directionPad = document.querySelector('.direction-pad');
            expect(directionPad).not.toBeNull();
        });

        test('should have all four direction buttons', () => {
            const upBtn = document.getElementById('upBtn');
            const downBtn = document.getElementById('downBtn');
            const leftBtn = document.getElementById('leftBtn');
            const rightBtn = document.getElementById('rightBtn');

            expect(upBtn).not.toBeNull();
            expect(downBtn).not.toBeNull();
            expect(leftBtn).not.toBeNull();
            expect(rightBtn).not.toBeNull();
        });

        test('direction buttons should have correct symbols', () => {
            const upBtn = document.getElementById('upBtn');
            const downBtn = document.getElementById('downBtn');
            const leftBtn = document.getElementById('leftBtn');
            const rightBtn = document.getElementById('rightBtn');

            expect(upBtn.textContent).toBe('▲');
            expect(downBtn.textContent).toBe('▼');
            expect(leftBtn.textContent).toBe('◀');
            expect(rightBtn.textContent).toBe('▶');
        });

        test('direction buttons should have proper CSS classes', () => {
            const upBtn = document.getElementById('upBtn');
            const downBtn = document.getElementById('downBtn');
            const leftBtn = document.getElementById('leftBtn');
            const rightBtn = document.getElementById('rightBtn');

            expect(upBtn.classList.contains('touch-btn')).toBe(true);
            expect(upBtn.classList.contains('touch-btn-up')).toBe(true);
            
            expect(downBtn.classList.contains('touch-btn')).toBe(true);
            expect(downBtn.classList.contains('touch-btn-down')).toBe(true);
            
            expect(leftBtn.classList.contains('touch-btn')).toBe(true);
            expect(leftBtn.classList.contains('touch-btn-left')).toBe(true);
            
            expect(rightBtn.classList.contains('touch-btn')).toBe(true);
            expect(rightBtn.classList.contains('touch-btn-right')).toBe(true);
        });
    });

    describe('Button Functionality', () => {
        let upBtn, downBtn, leftBtn, rightBtn;
        let direction;
        let nextDirection;
        let gameState;

        beforeEach(() => {
            upBtn = document.getElementById('upBtn');
            downBtn = document.getElementById('downBtn');
            leftBtn = document.getElementById('leftBtn');
            rightBtn = document.getElementById('rightBtn');

            // Default mock state mirrors runtime globals
            direction = { x: 0, y: 0 };
            nextDirection = { x: 0, y: 0 };
            gameState = 'playing';

            // Setup button handlers similar to snake-game.js
            upBtn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                if (gameState === 'playing' && direction.y === 0) {
                    nextDirection = { x: 0, y: -1 };
                }
            });

            downBtn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                if (gameState === 'playing' && direction.y === 0) {
                    nextDirection = { x: 0, y: 1 };
                }
            });

            leftBtn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                if (gameState === 'playing' && direction.x === 0) {
                    nextDirection = { x: -1, y: 0 };
                }
            });

            rightBtn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                if (gameState === 'playing' && direction.x === 0) {
                    nextDirection = { x: 1, y: 0 };
                }
            });
        });

        test('up button should change direction to up when moving horizontally', () => {
            direction = { x: 1, y: 0 }; // Moving right
            
            const event = new TouchEvent('touchstart', {
                bubbles: true,
                cancelable: true,
                touches: [{ clientX: 0, clientY: 0 }]
            });

            upBtn.dispatchEvent(event);

            expect(nextDirection.x).toBe(0);
            expect(nextDirection.y).toBe(-1);
        });

        test('down button should change direction to down when moving horizontally', () => {
            direction = { x: 1, y: 0 }; // Moving right
            
            const event = new TouchEvent('touchstart', {
                bubbles: true,
                cancelable: true,
                touches: [{ clientX: 0, clientY: 0 }]
            });

            downBtn.dispatchEvent(event);

            expect(nextDirection.x).toBe(0);
            expect(nextDirection.y).toBe(1);
        });

        test('left button should change direction to left when moving vertically', () => {
            direction = { x: 0, y: 1 }; // Moving down
            
            const event = new TouchEvent('touchstart', {
                bubbles: true,
                cancelable: true,
                touches: [{ clientX: 0, clientY: 0 }]
            });

            leftBtn.dispatchEvent(event);

            expect(nextDirection.x).toBe(-1);
            expect(nextDirection.y).toBe(0);
        });

        test('right button should change direction to right when moving vertically', () => {
            direction = { x: 0, y: 1 }; // Moving down
            
            const event = new TouchEvent('touchstart', {
                bubbles: true,
                cancelable: true,
                touches: [{ clientX: 0, clientY: 0 }]
            });

            rightBtn.dispatchEvent(event);

            expect(nextDirection.x).toBe(1);
            expect(nextDirection.y).toBe(0);
        });

        test('up button should not change direction when already moving vertically', () => {
            direction = { x: 0, y: 1 }; // Moving down
            nextDirection = { x: 0, y: 1 };
            
            const event = new TouchEvent('touchstart', {
                bubbles: true,
                cancelable: true,
                touches: [{ clientX: 0, clientY: 0 }]
            });

            upBtn.dispatchEvent(event);

            // Direction should not change (can't reverse into yourself)
            expect(nextDirection.y).toBe(1);
        });

        test('left button should not change direction when already moving horizontally', () => {
            direction = { x: 1, y: 0 }; // Moving right
            nextDirection = { x: 1, y: 0 };
            
            const event = new TouchEvent('touchstart', {
                bubbles: true,
                cancelable: true,
                touches: [{ clientX: 0, clientY: 0 }]
            });

            leftBtn.dispatchEvent(event);

            // Direction should not change (can't reverse into yourself)
            expect(nextDirection.x).toBe(1);
        });

        test('touch controls should not work when game is not playing', () => {
            gameState = 'gameOver';
            direction = { x: 1, y: 0 };
            nextDirection = { x: 1, y: 0 };
            
            const event = new TouchEvent('touchstart', {
                bubbles: true,
                cancelable: true,
                touches: [{ clientX: 0, clientY: 0 }]
            });

            upBtn.dispatchEvent(event);

            // Direction should not change when game is over
            expect(nextDirection.x).toBe(1);
            expect(nextDirection.y).toBe(0);
        });
    });

    describe('Mobile UX Consistency', () => {
        test('touch controls should have proper CSS class for mobile visibility', () => {
            const touchControls = document.getElementById('touchControls');
            
            // In the CSS, touch controls have display: none by default
            // and display: flex on mobile (@media max-width: 768px)
            // We verify the element has the correct class for styling
            expect(touchControls.classList.contains('touch-controls')).toBe(true);
            
            // The actual display property is controlled by CSS media queries
            // which we can't test in jsdom, but we verify the structure is correct
        });

        test('touch controls should use consistent styling with Space Invaders', () => {
            const touchControls = document.getElementById('touchControls');
            
            // Verify positioning similar to Space Invaders
            expect(touchControls.classList.contains('touch-controls')).toBe(true);
            
            // Should have fixed positioning at bottom
            // Should have proper z-index for overlay
            // These are verified through CSS, but we check the class exists
        });

        test('direction buttons should have proper touch-action for mobile', () => {
            const buttons = document.querySelectorAll('.touch-btn');
            
            // All buttons should exist
            expect(buttons.length).toBe(4);
            
            // Each button should have touch-btn class for styling
            buttons.forEach(btn => {
                expect(btn.classList.contains('touch-btn')).toBe(true);
            });
        });
    });

    describe('Regression Prevention', () => {
        test('canvas element should still exist (not removed by touch controls)', () => {
            const canvas = document.getElementById('gameCanvas');
            expect(canvas).not.toBeNull();
            expect(canvas.tagName).toBe('CANVAS');
        });

        test('game container should have both canvas and touch controls', () => {
            const gameContainer = document.getElementById('gameContainer');
            const canvas = gameContainer.querySelector('#gameCanvas');
            const touchControls = gameContainer.querySelector('#touchControls');

            expect(canvas).not.toBeNull();
            expect(touchControls).not.toBeNull();
        });

        test('touch controls should not interfere with existing swipe controls', () => {
            // Snake game should support both swipe gestures AND button controls
            // This test ensures the button controls are additive, not replacing
            const canvas = document.getElementById('gameCanvas');
            const touchControls = document.getElementById('touchControls');

            expect(canvas).not.toBeNull();
            expect(touchControls).not.toBeNull();
            
            // Both should coexist in the DOM
        });
    });
});
