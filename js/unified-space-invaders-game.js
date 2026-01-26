/**
 * Unified Space Invaders Game - 统一小蜜蜂游戏
 */

class UnifiedSpaceInvadersGame extends BaseGame {
    constructor(config = {}) {
        super('space-invaders', {
            autoCloseDelay: 2500,
            showResetButton: true,
            enableKeyboard: true,
            enableTouchControls: true,
            ...config
        });

        // Rendering
        this.canvas = null;
        this.ctx = null;

        // UI references
        this.scoreDisplay = null;
        this.livesDisplay = null;
        this.finalScoreDisplay = null;
        this.exitButton = null;
        this.customResetButton = null;

        // Game state
        this.score = 0;
        this.lives = 0;
        this.gameOver = false;
        this.player = null;
        this.playerInvincibleTime = 0;
        this.enemies = [];
        this.enemyDirection = 1;
        this.enemySpeed = 0.5;
        this.enemyBullets = [];
        this.playerBullets = [];
        this.explosions = [];
        this.lastFireTime = 0;
        this.keys = { left: false, right: false };
        this.touchState = { left: false, right: false };

        // Config
        this.maxPlayerBullets = 5;
        this.enemyFireChance = 0.003;
        this.fireCooldown = 200;
        this.playerSpeed = 8;
        this.bulletSpeed = 12;

        // Bound handlers
        this.boundKeyDown = this.handleKeyDown.bind(this);
        this.boundKeyUp = this.handleKeyUp.bind(this);
    }

    findUIElements() {
        this.overlay = document.getElementById('spaceInvadersOverlay');
        this.completeMessage = document.getElementById('spaceInvadersCompleteMessage');
        this.resetButton = null; // use custom reset handler instead of BaseGame button logic
        this.customResetButton = document.getElementById('resetSpaceInvaders');

        if (!this.overlay) {
            console.error('[space-invaders] Overlay element not found: spaceInvadersOverlay');
        }
    }

    async onInit(taskIndex) {
        console.log('[space-invaders] Initializing space invaders game');

        this.canvas = document.getElementById('spaceInvadersCanvas');
        if (!this.canvas) {
            throw new Error('Space invaders canvas not found');
        }
        this.ctx = this.canvas.getContext('2d');

        this.scoreDisplay = document.getElementById('siScore');
        this.livesDisplay = document.getElementById('siLives');
        this.finalScoreDisplay = document.getElementById('siFinalScore');
        this.exitButton = document.getElementById('exitSpaceInvaders');

        this.difficulty = this.determineDifficulty(taskIndex);
        this.resetGameState();
        this.setupButtonHandlers();
        this.setupTouchControls();
        this.updateUI();
    }

    onStart() {
        console.log('[space-invaders] Starting space invaders game');
        this.addTrackedEventListener(document, 'keydown', this.boundKeyDown);
        this.addTrackedEventListener(document, 'keyup', this.boundKeyUp);
        this.gameLoop();
    }

    gameLoop() {
        if (this.gameOver) {
            this.cancelAnimationLoop();
            return;
        }

        this.update();
        this.render();
        this.animationId = requestAnimationFrame(() => this.gameLoop());
    }

    update() {
        if (this.gameOver) return;

        this.updatePlayer();
        this.updatePlayerBullets();
        this.updateEnemyBullets();
        this.updateEnemies();
        this.updateExplosions();
        this.handleCollisions();
        this.updateInvincibility();
        this.updateUI();
    }

    render() {
        if (!this.ctx) return;

        const ctx = this.ctx;
        const width = this.canvas.width;
        const height = this.canvas.height;

        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, width, height);

        // Stars background
        ctx.fillStyle = '#FFF';
        for (let i = 0; i < 30; i++) {
            const x = (i * 37) % width;
            const y = (i * 23) % height;
            ctx.fillRect(x, y, 1, 1);
        }

        // Player (blink when invincible)
        if (!this.player.invincible || Math.floor(this.player.invincibleTime / 4) % 2 === 0) {
            ctx.fillStyle = '#00FF00';
            ctx.beginPath();
            ctx.moveTo(this.player.x + this.player.width / 2, this.player.y);
            ctx.lineTo(this.player.x + this.player.width, this.player.y + this.player.height);
            ctx.lineTo(this.player.x + this.player.width * 0.7, this.player.y + this.player.height * 0.7);
            ctx.lineTo(this.player.x + this.player.width * 0.3, this.player.y + this.player.height * 0.7);
            ctx.lineTo(this.player.x, this.player.y + this.player.height);
            ctx.closePath();
            ctx.fill();

            ctx.fillStyle = '#00CCFF';
            ctx.beginPath();
            ctx.arc(
                this.player.x + this.player.width / 2,
                this.player.y + this.player.height * 0.4,
                this.player.width * 0.12,
                0,
                Math.PI * 2
            );
            ctx.fill();
        }

        // Player bullets
        ctx.fillStyle = '#FFFF00';
        ctx.shadowColor = '#FFFF00';
        ctx.shadowBlur = 8;
        this.playerBullets.forEach(b => ctx.fillRect(b.x, b.y, b.width, b.height));
        ctx.shadowBlur = 0;

        // Enemy bullets
        ctx.fillStyle = '#FF0000';
        ctx.shadowColor = '#FF0000';
        ctx.shadowBlur = 8;
        this.enemyBullets.forEach(b => ctx.fillRect(b.x, b.y, b.width, b.height));
        ctx.shadowBlur = 0;

        // Enemies
        this.enemies.forEach(enemy => this.drawEnemy(ctx, enemy));

        // Explosions
        this.explosions.forEach(p => {
            ctx.globalAlpha = p.life;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;
        });
    }

    onReset() {
        console.log('[space-invaders] Resetting space invaders game');
        this.resetGameState();
    }

    onClose() {
        this.gameOver = true;
        this.hideCompletionMessage();
        console.log('[space-invaders] Space invaders game cleanup completed');
    }

    determineDifficulty(taskIndex) {
        if (taskIndex === 0) {
            return {
                rows: 2,
                cols: 5,
                lives: 5,
                enemySpeed: 0.5,
                enemyFireChance: 0.0025
            };
        }
        return {
            rows: 3,
            cols: 6,
            lives: 3,
            enemySpeed: 0.8,
            enemyFireChance: 0.003
        };
    }

    resetGameState() {
        this.score = 0;
        this.lives = this.difficulty.lives;
        this.gameOver = false;
        this.playerBullets = [];
        this.enemyBullets = [];
        this.explosions = [];
        this.enemies = [];
        this.enemyDirection = 1;
        this.enemySpeed = this.difficulty.enemySpeed;
        this.enemyFireChance = this.difficulty.enemyFireChance;
        this.lastFireTime = 0;
        this.keys = { left: false, right: false };
        this.touchState = { left: false, right: false };

        this.player = {
            x: this.canvas.width / 2 - 25,
            y: this.canvas.height - 45,
            width: 50,
            height: 30,
            invincible: false,
            invincibleTime: 0
        };

        this.createEnemies();
        this.updateUI();
        this.hideCompletionMessage();
    }

    createEnemies() {
        const cols = this.difficulty.cols;
        const rows = this.difficulty.rows;
        const enemyWidth = 40;
        const enemyHeight = 30;
        const spacing = 8;
        const startX = (this.canvas.width - (cols * (enemyWidth + spacing))) / 2;
        const startY = 50;
        const colors = ['#FFD700', '#FF6B00', '#FF00FF', '#00FFFF'];

        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                this.enemies.push({
                    x: startX + col * (enemyWidth + spacing),
                    y: startY + row * (enemyHeight + spacing),
                    width: enemyWidth,
                    height: enemyHeight,
                    type: row % colors.length,
                    animFrame: 0,
                    animTimer: 0,
                    color: colors[row % colors.length]
                });
            }
        }
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
                };
            } else {
                this.customResetButton.style.display = 'none';
                this.customResetButton.onclick = null;
            }
        }
    }

    setupTouchControls() {
        const leftBtn = document.getElementById('siLeftBtn');
        const rightBtn = document.getElementById('siRightBtn');
        const fireBtn = document.getElementById('siFireBtn');

        if (leftBtn) {
            this.addTrackedEventListener(leftBtn, 'touchstart', (e) => { e.preventDefault(); this.touchState.left = true; });
            this.addTrackedEventListener(leftBtn, 'touchend', () => { this.touchState.left = false; });
            this.addTrackedEventListener(leftBtn, 'mousedown', () => { this.touchState.left = true; });
            this.addTrackedEventListener(leftBtn, 'mouseup', () => { this.touchState.left = false; });
            this.addTrackedEventListener(leftBtn, 'mouseleave', () => { this.touchState.left = false; });
        }

        if (rightBtn) {
            this.addTrackedEventListener(rightBtn, 'touchstart', (e) => { e.preventDefault(); this.touchState.right = true; });
            this.addTrackedEventListener(rightBtn, 'touchend', () => { this.touchState.right = false; });
            this.addTrackedEventListener(rightBtn, 'mousedown', () => { this.touchState.right = true; });
            this.addTrackedEventListener(rightBtn, 'mouseup', () => { this.touchState.right = false; });
            this.addTrackedEventListener(rightBtn, 'mouseleave', () => { this.touchState.right = false; });
        }

        if (fireBtn) {
            this.addTrackedEventListener(fireBtn, 'touchstart', (e) => { e.preventDefault(); this.firePlayerBullet(); });
            this.addTrackedEventListener(fireBtn, 'mousedown', () => { this.firePlayerBullet(); });
        }
    }

    handleKeyDown(event) {
        if (this.gameOver) return;
        if (event.code === 'ArrowLeft' || event.code === 'KeyA') {
            this.keys.left = true;
            event.preventDefault();
        }
        if (event.code === 'ArrowRight' || event.code === 'KeyD') {
            this.keys.right = true;
            event.preventDefault();
        }
        if (event.code === 'Space') {
            this.firePlayerBullet();
            event.preventDefault();
        }
    }

    handleKeyUp(event) {
        if (event.code === 'ArrowLeft' || event.code === 'KeyA') {
            this.keys.left = false;
        }
        if (event.code === 'ArrowRight' || event.code === 'KeyD') {
            this.keys.right = false;
        }
    }

    updatePlayer() {
        if (this.keys.left || this.touchState.left) {
            this.player.x -= this.playerSpeed;
        }
        if (this.keys.right || this.touchState.right) {
            this.player.x += this.playerSpeed;
        }
        this.player.x = Math.max(0, Math.min(this.canvas.width - this.player.width, this.player.x));
    }

    firePlayerBullet() {
        if (this.gameOver) return;
        const now = Date.now();
        if (now - this.lastFireTime < this.fireCooldown) return;
        if (this.playerBullets.length >= this.maxPlayerBullets) return;

        this.lastFireTime = now;
        this.playerBullets.push({
            x: this.player.x + this.player.width / 2 - 2,
            y: this.player.y,
            width: 4,
            height: 12
        });
    }

    updatePlayerBullets() {
        this.playerBullets = this.playerBullets.filter(b => {
            b.y -= this.bulletSpeed;
            return b.y + b.height > 0;
        });
    }

    updateEnemyBullets() {
        this.enemyBullets = this.enemyBullets.filter(b => {
            b.y += 4;
            return b.y < this.canvas.height;
        });
    }

    updateEnemies() {
        if (this.enemies.length === 0) {
            this.endGame(true);
            return;
        }

        let leftMost = this.canvas.width;
        let rightMost = 0;
        this.enemies.forEach(enemy => {
            leftMost = Math.min(leftMost, enemy.x);
            rightMost = Math.max(rightMost, enemy.x + enemy.width);
        });

        let shouldDrop = false;
        if (this.enemyDirection > 0 && rightMost + this.enemySpeed >= this.canvas.width) {
            this.enemyDirection = -1;
            shouldDrop = true;
        } else if (this.enemyDirection < 0 && leftMost - this.enemySpeed <= 0) {
            this.enemyDirection = 1;
            shouldDrop = true;
        }

        this.enemies.forEach(enemy => {
            enemy.x += this.enemySpeed * this.enemyDirection;
            if (shouldDrop) enemy.y += 20;
            enemy.animTimer++;
            if (enemy.animTimer > 20) {
                enemy.animFrame = (enemy.animFrame + 1) % 2;
                enemy.animTimer = 0;
            }

            if (Math.random() < this.enemyFireChance) {
                this.enemyBullets.push({
                    x: enemy.x + enemy.width / 2 - 2,
                    y: enemy.y + enemy.height,
                    width: 4,
                    height: 10
                });
            }

            if (enemy.y + enemy.height >= this.player.y) {
                this.endGame(false);
            }
        });
    }

    updateExplosions() {
        this.explosions = this.explosions.filter(p => {
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.1;
            p.life -= 0.03;
            return p.life > 0;
        });
    }

    handleCollisions() {
        // Player bullets vs enemies
        for (let i = this.playerBullets.length - 1; i >= 0; i--) {
            for (let j = this.enemies.length - 1; j >= 0; j--) {
                if (this.isColliding(this.playerBullets[i], this.enemies[j])) {
                    this.createExplosion(
                        this.enemies[j].x + this.enemies[j].width / 2,
                        this.enemies[j].y + this.enemies[j].height / 2
                    );
                    this.score += 10 * (this.enemies[j].type + 1);
                    this.playerBullets.splice(i, 1);
                    this.enemies.splice(j, 1);
                    break;
                }
            }
        }

        // Enemy bullets vs player
        if (!this.player.invincible) {
            for (let i = this.enemyBullets.length - 1; i >= 0; i--) {
                if (this.isColliding(this.enemyBullets[i], this.player)) {
                    this.enemyBullets.splice(i, 1);
                    this.handlePlayerHit();
                    break;
                }
            }
        }
    }

    isColliding(a, b) {
        return (
            a.x < b.x + b.width &&
            a.x + a.width > b.x &&
            a.y < b.y + b.height &&
            a.y + a.height > b.y
        );
    }

    handlePlayerHit() {
        this.lives--;
        this.createExplosion(
            this.player.x + this.player.width / 2,
            this.player.y + this.player.height / 2
        );

        if (this.lives <= 0) {
            this.endGame(false);
            return;
        }

        this.player.invincible = true;
        this.player.invincibleTime = 90;
    }

    updateInvincibility() {
        if (this.player.invincible) {
            this.player.invincibleTime--;
            if (this.player.invincibleTime <= 0) {
                this.player.invincible = false;
            }
        }
    }

    createExplosion(x, y) {
        const colors = ['#FFD700', '#FF6B00', '#FF00FF', '#00FFFF'];
        for (let i = 0; i < 12; i++) {
            const angle = (Math.PI * 2 * i) / 12;
            const speed = Math.random() * 3 + 2;
            this.explosions.push({
                x,
                y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 1,
                color: colors[Math.floor(Math.random() * colors.length)],
                size: Math.random() * 4 + 2
            });
        }
    }

    drawEnemy(ctx, enemy) {
        const x = enemy.x;
        const y = enemy.y;
        const w = enemy.width;
        const h = enemy.height;
        ctx.shadowColor = enemy.color;
        ctx.shadowBlur = 8;

        // Body
        ctx.fillStyle = enemy.color;
        ctx.beginPath();
        ctx.ellipse(x + w / 2, y + h / 2, w / 2.5, h / 2.5, 0, 0, Math.PI * 2);
        ctx.fill();

        // Stripes
        ctx.fillStyle = '#000';
        ctx.fillRect(x + w * 0.25, y + h * 0.35, w * 0.5, h * 0.08);
        ctx.fillRect(x + w * 0.2, y + h * 0.5, w * 0.6, h * 0.08);

        // Wings
        const wingAngle = enemy.animFrame === 0 ? 0.3 : -0.3;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.beginPath();
        ctx.ellipse(x + w * 0.15, y + h * 0.3, w * 0.2, h * 0.12, wingAngle, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(x + w * 0.85, y + h * 0.3, w * 0.2, h * 0.12, -wingAngle, 0, Math.PI * 2);
        ctx.fill();

        // Eyes
        ctx.fillStyle = '#FFF';
        ctx.beginPath();
        ctx.arc(x + w * 0.35, y + h * 0.35, w * 0.06, 0, Math.PI * 2);
        ctx.arc(x + w * 0.65, y + h * 0.35, w * 0.06, 0, Math.PI * 2);
        ctx.fill();

        ctx.shadowBlur = 0;
    }

    updateUI() {
        if (this.scoreDisplay) {
            this.scoreDisplay.textContent = this.score;
        }
        if (this.livesDisplay) {
            this.livesDisplay.textContent = this.lives;
        }
    }

    endGame(victory = false) {
        if (this.gameOver) return;
        this.gameOver = true;
        if (victory) {
            this.score += 100;
        }

        this.showCustomCompletionMessage(() => {
            this.updateCompletionField('#siFinalScore', this.score);
        });

        if (typeof GameRewardManager !== 'undefined') {
            GameRewardManager.awardCompletion('space-invaders', this.score);
        }

        console.log(`[space-invaders] Game ended. Victory: ${victory}, Score: ${this.score}`);

        setTimeout(() => this.close(), this.config.autoCloseDelay);
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = UnifiedSpaceInvadersGame;
} else if (typeof window !== 'undefined') {
    window.UnifiedSpaceInvadersGame = UnifiedSpaceInvadersGame;
    if (typeof GameManager !== 'undefined' && GameManager.tryRegisterUnifiedGames) {
        GameManager.tryRegisterUnifiedGames();
    }
}
