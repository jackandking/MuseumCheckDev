/**
 * Unified Snake Game - 统一贪食蛇游戏
 */

class UnifiedSnakeGame extends BaseGame {
    constructor(config = {}) {
        super('snake', {
            autoCloseDelay: 2500,
            showResetButton: true,
            enableKeyboard: true,
            enableTouchControls: true,
            ...config
        });

        // Rendering
        this.canvas = null;
        this.ctx = null;

        // UI
        this.scoreDisplay = null;
        this.lengthDisplay = null;
        this.finalScoreDisplay = null;
        this.exitButton = null;
        this.customResetButton = null;

        // Game state
        this.gridSize = 16;
        this.cellSize = 20;
        this.snake = [];
        this.direction = { x: 1, y: 0 };
        this.nextDirection = { x: 1, y: 0 };
        this.food = null;
        this.score = 0;
        this.gameOver = false;
        this.moveInterval = null;
        this.speed = 150;
        this.taskDifficulty = null;
        this.pendingGrowth = 0;

        // Controls
        this.touchState = { left: false, right: false, up: false, down: false };
        this.swipeStart = null;

        // Bound handlers
        this.boundKeyDown = this.handleKeyDown.bind(this);
        this.boundTouchStart = this.handleTouchStart.bind(this);
        this.boundTouchEnd = this.handleTouchEnd.bind(this);
    }

    findUIElements() {
        this.overlay = document.getElementById('snakeGameOverlay');
        this.completeMessage = document.getElementById('snakeCompleteMessage');
        this.resetButton = null; // use custom button instead
        this.customResetButton = document.getElementById('resetSnake');
        this.exitButton = document.getElementById('exitSnake');
    }

    async onInit(taskIndex) {
        this.canvas = document.getElementById('snakeCanvas');
        if (!this.canvas) {
            throw new Error('Snake canvas not found');
        }
        this.ctx = this.canvas.getContext('2d');

        this.scoreDisplay = document.getElementById('snakeScore');
        this.lengthDisplay = document.getElementById('snakeLength');
        this.finalScoreDisplay = document.getElementById('snakeFinalScore');

        this.taskDifficulty = this.determineDifficulty(taskIndex);
        this.gridSize = this.taskDifficulty.gridSize;
        this.speed = this.taskDifficulty.speed;
        this.cellSize = Math.floor(this.canvas.width / this.gridSize);

        this.resetGameState();
        this.setupButtonHandlers();
        this.setupTouchControls();
        this.updateUI();
    }

    onStart() {
        this.addTrackedEventListener(document, 'keydown', this.boundKeyDown);
        this.addTrackedEventListener(this.canvas, 'touchstart', this.boundTouchStart, { passive: false });
        this.addTrackedEventListener(this.canvas, 'touchmove', this.boundTouchStart, { passive: false });
        this.addTrackedEventListener(this.canvas, 'touchend', this.boundTouchEnd);

        this.moveInterval = setInterval(() => this.gameLoop(), this.speed);
    }

    onClose() {
        this.gameOver = true;
        if (this.moveInterval) {
            clearInterval(this.moveInterval);
            this.moveInterval = null;
        }
        this.hideCompletionMessage();
    }

    onReset() {
        this.resetGameState();
    }

    determineDifficulty(taskIndex) {
        if (taskIndex === 0) {
            return {
                gridSize: 14,
                speed: 200,
                growthPerFood: 1
            };
        }
        return {
            gridSize: 16,
            speed: 150,
            growthPerFood: 2
        };
    }

    resetGameState() {
        this.score = 0;
        this.gameOver = false;
        this.direction = { x: 1, y: 0 };
        this.nextDirection = { x: 1, y: 0 };
        this.pendingGrowth = 0;

        const startX = Math.floor(this.gridSize / 2);
        const startY = Math.floor(this.gridSize / 2);
        this.snake = [
            { x: startX, y: startY },
            { x: startX - 1, y: startY },
            { x: startX - 2, y: startY }
        ];

        this.placeFood();
        this.updateUI();
        this.hideCompletionMessage();
    }

    setupButtonHandlers() {
        if (this.exitButton) {
            this.exitButton.onclick = () => this.close();
        }

        if (this.customResetButton) {
            if (this.isDebugMode) {
                this.customResetButton.style.display = '';
                this.customResetButton.onclick = () => {
                    this.resetGameState();
                    this.gameOver = false;
                    if (!this.moveInterval) {
                        this.moveInterval = setInterval(() => this.gameLoop(), this.speed);
                    }
                };
            } else {
                this.customResetButton.style.display = 'none';
                this.customResetButton.onclick = null;
            }
        }
    }

    setupTouchControls() {
        const upBtn = document.getElementById('snakeUpBtn');
        const downBtn = document.getElementById('snakeDownBtn');
        const leftBtn = document.getElementById('snakeLeftBtn');
        const rightBtn = document.getElementById('snakeRightBtn');

        const bind = (el, dir) => {
            if (!el) return;
            this.addTrackedEventListener(el, 'touchstart', (e) => {
                e.preventDefault();
                this.setDirection(dir);
            });
            this.addTrackedEventListener(el, 'mousedown', () => this.setDirection(dir));
        };

        bind(upBtn, { x: 0, y: -1 });
        bind(downBtn, { x: 0, y: 1 });
        bind(leftBtn, { x: -1, y: 0 });
        bind(rightBtn, { x: 1, y: 0 });
    }

    handleKeyDown(event) {
        switch (event.code) {
            case 'ArrowUp':
            case 'KeyW':
                this.setDirection({ x: 0, y: -1 });
                event.preventDefault();
                break;
            case 'ArrowDown':
            case 'KeyS':
                this.setDirection({ x: 0, y: 1 });
                event.preventDefault();
                break;
            case 'ArrowLeft':
            case 'KeyA':
                this.setDirection({ x: -1, y: 0 });
                event.preventDefault();
                break;
            case 'ArrowRight':
            case 'KeyD':
                this.setDirection({ x: 1, y: 0 });
                event.preventDefault();
                break;
        }
    }

    handleTouchStart(event) {
        if (event.touches.length === 1) {
            this.swipeStart = {
                x: event.touches[0].clientX,
                y: event.touches[0].clientY
            };
        }
    }

    handleTouchEnd(event) {
        if (!this.swipeStart) return;

        const touch = event.changedTouches[0];
        const dx = touch.clientX - this.swipeStart.x;
        const dy = touch.clientY - this.swipeStart.y;

        if (Math.abs(dx) > Math.abs(dy)) {
            if (dx > 20) this.setDirection({ x: 1, y: 0 });
            else if (dx < -20) this.setDirection({ x: -1, y: 0 });
        } else {
            if (dy > 20) this.setDirection({ x: 0, y: 1 });
            else if (dy < -20) this.setDirection({ x: 0, y: -1 });
        }

        this.swipeStart = null;
    }

    setDirection(dir) {
        if (this.gameOver) return;
        if (dir.x === -this.direction.x && dir.y === -this.direction.y) return;
        this.nextDirection = dir;
    }

    placeFood() {
        let valid = false;
        while (!valid) {
            const x = Math.floor(Math.random() * this.gridSize);
            const y = Math.floor(Math.random() * this.gridSize);
            if (!this.snake.some(seg => seg.x === x && seg.y === y)) {
                this.food = { x, y };
                valid = true;
            }
        }
    }

    gameLoop() {
        if (this.gameOver) return;

        this.direction = this.nextDirection;

        const head = {
            x: this.snake[0].x + this.direction.x,
            y: this.snake[0].y + this.direction.y
        };

        // Boundary collision
        if (head.x < 0 || head.x >= this.gridSize || head.y < 0 || head.y >= this.gridSize) {
            this.endGame(false);
            return;
        }

        // Self collision
        if (this.snake.some(seg => seg.x === head.x && seg.y === head.y)) {
            this.endGame(false);
            return;
        }

        this.snake.unshift(head);

        if (this.food && head.x === this.food.x && head.y === this.food.y) {
            this.score += 10;
            this.pendingGrowth += this.taskDifficulty.growthPerFood;
            this.placeFood();
        }

        if (this.pendingGrowth > 0) {
            this.pendingGrowth--;
        } else {
            this.snake.pop();
        }

        if (this.snake.length >= this.taskDifficulty.targetLength) {
            this.endGame(true);
        }

        this.updateUI();
        this.render();
    }

    updateUI() {
        if (this.scoreDisplay) {
            this.scoreDisplay.textContent = this.score;
        }
        if (this.lengthDisplay) {
            this.lengthDisplay.textContent = this.snake.length;
        }
    }

    render() {
        if (!this.ctx) return;
        const ctx = this.ctx;
        const size = this.cellSize;
        const width = this.gridSize * size;
        const height = this.gridSize * size;

        ctx.fillStyle = '#111';
        ctx.fillRect(0, 0, width, height);

        // Grid background
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.lineWidth = 1;
        for (let x = 0; x <= this.gridSize; x++) {
            ctx.beginPath();
            ctx.moveTo(x * size, 0);
            ctx.lineTo(x * size, height);
            ctx.stroke();
        }
        for (let y = 0; y <= this.gridSize; y++) {
            ctx.beginPath();
            ctx.moveTo(0, y * size);
            ctx.lineTo(width, y * size);
            ctx.stroke();
        }

        // Food
        if (this.food) {
            ctx.fillStyle = '#FF5722';
            ctx.beginPath();
            ctx.arc(
                this.food.x * size + size / 2,
                this.food.y * size + size / 2,
                size * 0.4,
                0,
                Math.PI * 2
            );
            ctx.fill();
        }

        // Snake body
        this.snake.forEach((seg, index) => {
            const gradient = ctx.createLinearGradient(
                seg.x * size,
                seg.y * size,
                (seg.x + 1) * size,
                (seg.y + 1) * size
            );
            gradient.addColorStop(0, index === 0 ? '#8BC34A' : '#4CAF50');
            gradient.addColorStop(1, '#2E7D32');
            ctx.fillStyle = gradient;

            ctx.fillRect(seg.x * size + 1, seg.y * size + 1, size - 2, size - 2);
        });
    }

    endGame(victory = false) {
        if (this.gameOver) return;
        this.gameOver = true;

        if (this.moveInterval) {
            clearInterval(this.moveInterval);
            this.moveInterval = null;
        }

        if (victory) {
            this.score += 50;
        }

        this.showCustomCompletionMessage(() => {
            this.updateCompletionField('#snakeFinalScore', this.score);
        });

        if (typeof GameRewardManager !== 'undefined') {
            GameRewardManager.awardCompletion('snake', this.score);
        }

        setTimeout(() => this.close(), this.config.autoCloseDelay);
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = UnifiedSnakeGame;
} else if (typeof window !== 'undefined') {
    window.UnifiedSnakeGame = UnifiedSnakeGame;
    if (typeof GameManager !== 'undefined' && GameManager.tryRegisterUnifiedGames) {
        GameManager.tryRegisterUnifiedGames();
    }
}
