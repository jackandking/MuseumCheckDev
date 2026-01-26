/**
 * Unified Tank Battle Game - 统一坦克大战游戏
 * 继承自BaseGame，提供坦克大战功能
 */

class UnifiedTankBattleGame extends BaseGame {
    constructor(config = {}) {
        super('tank-battle', {
            autoCloseDelay: 3000,
            showResetButton: true,
            enableKeyboard: true,
            enableTouchControls: true,
            ...config
        });
        
        // Tank battle specific properties
        this.score = 0;
        this.lives = 3;
        this.enemiesKilled = 0;
        this.totalEnemies = 5;
        this.gameOver = false;
        
        // Canvas and rendering
        this.canvas = null;
        this.ctx = null;
        this.animationId = null;
        
        // Game entities
        this.player = null;
        this.enemies = [];
        this.bullets = [];
        this.enemyBullets = [];
        this.walls = [];
        this.explosions = [];
        
        // Input state
        this.keys = { up: false, down: false, left: false, right: false, fire: false };

        // Bound handlers for tracked listeners
        this.boundHandleKeyUp = this.handleKeyUp.bind(this);
        
        // Constants
        this.CANVAS_WIDTH = 320;
        this.CANVAS_HEIGHT = 320;
        this.TILE_SIZE = 32;
        this.TANK_SIZE = 28;
        this.BULLET_SIZE = 6;
        this.PLAYER_SPEED = 2.5;
        this.ENEMY_SPEED = 0.9;
        this.ENEMY_FIRE_COOLDOWN = 3500;
        this.ENEMY_RANDOM_FIRE_CHANCE = 0.008;
        
        // Colors
        this.COLORS = {
            player: '#4CAF50',
            playerBarrel: '#2E7D32',
            enemy: '#F44336',
            enemyBarrel: '#C62828',
            bullet: '#FFD700',
            wall: '#8D6E63',
            wallBorder: '#5D4037',
            grass: '#7CB342',
            explosion: '#FF6B35'
        };
        
        console.log(`[${this.gameType}] UnifiedTankBattleGame initialized`);
    }
    
    /**
     * Game-specific initialization
     */
    async onInit(taskIndex, options) {
        console.log(`[${this.gameType}] Initializing tank battle game with taskIndex: ${taskIndex}`);
        
        // Determine difficulty based on task index
        const difficulty = this.determineDifficulty(taskIndex);
        this.lives = difficulty.lives;
        this.totalEnemies = difficulty.enemyCount;
        this.wallCount = difficulty.wallCount;
        
        // Find tank battle specific elements
        this.canvas = document.getElementById('tankBattleCanvas');
        if (!this.canvas) {
            throw new Error('Tank battle canvas not found');
        }
        
        this.ctx = this.canvas.getContext('2d');
        
        // Initialize game state
        this.resetGameState();
        
        // Generate level
        this.generateWalls();
        this.generateEnemies();
        
        // Setup controls
        this.setupControls();
        
        // Update UI
        this.updateUI();
        
        console.log(`[${this.gameType}] Tank battle game initialized with difficulty:`, difficulty);
    }
    
    /**
     * Determine game difficulty based on task index
     */
    determineDifficulty(taskIndex) {
        if (taskIndex === 0) {
            return {
                lives: 6,
                enemyCount: 2,
                wallCount: 4
            };
        } else {
            return {
                lives: 4,
                enemyCount: 4,
                wallCount: 8
            };
        }
    }
    
    /**
     * Reset game state
     */
    resetGameState() {
        this.score = 0;
        this.enemiesKilled = 0;
        this.gameOver = false;
        this.bullets = [];
        this.enemyBullets = [];
        this.explosions = [];
        this.keys = { up: false, down: false, left: false, right: false, fire: false };
        
        console.log(`[${this.gameType}] Reset game state - Lives: ${this.lives}, Enemies: ${this.totalEnemies}`);
        
        // Initialize player tank
        this.player = {
            x: this.CANVAS_WIDTH / 2 - this.TANK_SIZE / 2,
            y: this.CANVAS_HEIGHT - this.TANK_SIZE - 10,
            width: this.TANK_SIZE,
            height: this.TANK_SIZE,
            direction: 'up',
            invincible: true, // Start with invincibility
            invincibleTime: 180 // 3 seconds at 60fps
        };
    }
    
    /**
     * Generate walls (obstacles)
     */
    generateWalls() {
        this.walls = [];
        const positions = [
            { x: 2, y: 3 }, { x: 3, y: 3 }, { x: 6, y: 3 }, { x: 7, y: 3 },
            { x: 2, y: 6 }, { x: 3, y: 6 }, { x: 6, y: 6 }, { x: 7, y: 6 },
            { x: 4, y: 4 }, { x: 5, y: 4 }, { x: 4, y: 5 }, { x: 5, y: 5 }
        ];
        
        for (let i = 0; i < Math.min(this.wallCount, positions.length); i++) {
            const pos = positions[i];
            this.walls.push({
                x: pos.x * this.TILE_SIZE,
                y: pos.y * this.TILE_SIZE,
                width: this.TILE_SIZE,
                height: this.TILE_SIZE,
                health: 2
            });
        }
    }
    
    /**
     * Generate enemy tanks
     */
    generateEnemies() {
        this.enemies = [];
        const spawnPositions = [
            { x: this.TILE_SIZE, y: this.TILE_SIZE },
            { x: this.CANVAS_WIDTH - this.TILE_SIZE - this.TANK_SIZE, y: this.TILE_SIZE },
            { x: this.CANVAS_WIDTH / 2 - this.TANK_SIZE / 2, y: this.TILE_SIZE },
            { x: this.TILE_SIZE, y: this.TILE_SIZE * 3 },
            { x: this.CANVAS_WIDTH - this.TILE_SIZE - this.TANK_SIZE, y: this.TILE_SIZE * 3 }
        ];
        
        for (let i = 0; i < this.totalEnemies; i++) {
            const pos = spawnPositions[i % spawnPositions.length];
            this.enemies.push({
                x: pos.x + (i * 5) % 20,
                y: pos.y,
                width: this.TANK_SIZE,
                height: this.TANK_SIZE,
                direction: 'down',
                lastFireTime: Date.now() + 2000 + i * 1000, // 2 seconds base delay + staggered
                moveTimer: 0,
                moveDirection: Math.random() < 0.5 ? 1 : -1
            });
        }
        
        console.log(`[${this.gameType}] Generated ${this.enemies.length} enemies for total ${this.totalEnemies}`);
    }
    
    /**
     * Setup keyboard and touch controls
     */
    setupControls() {
        // Touch controls for mobile
        this.setupTouchControls();
    }
    
    /**
     * Setup touch controls for mobile
     */
    setupTouchControls() {
        const upBtn = document.getElementById('tbUpBtn');
        const downBtn = document.getElementById('tbDownBtn');
        const leftBtn = document.getElementById('tbLeftBtn');
        const rightBtn = document.getElementById('tbRightBtn');
        const fireBtn = document.getElementById('tbFireBtn');
        
        if (upBtn) {
            upBtn.ontouchstart = (e) => { e.preventDefault(); this.keys.up = true; };
            upBtn.ontouchend = () => { this.keys.up = false; };
            upBtn.onmousedown = () => { this.keys.up = true; };
            upBtn.onmouseup = () => { this.keys.up = false; };
        }
        
        if (downBtn) {
            downBtn.ontouchstart = (e) => { e.preventDefault(); this.keys.down = true; };
            downBtn.ontouchend = () => { this.keys.down = false; };
            downBtn.onmousedown = () => { this.keys.down = true; };
            downBtn.onmouseup = () => { this.keys.down = false; };
        }
        
        if (leftBtn) {
            leftBtn.ontouchstart = (e) => { e.preventDefault(); this.keys.left = true; };
            leftBtn.ontouchend = () => { this.keys.left = false; };
            leftBtn.onmousedown = () => { this.keys.left = true; };
            leftBtn.onmouseup = () => { this.keys.left = false; };
        }
        
        if (rightBtn) {
            rightBtn.ontouchstart = (e) => { e.preventDefault(); this.keys.right = true; };
            rightBtn.ontouchend = () => { this.keys.right = false; };
            rightBtn.onmousedown = () => { this.keys.right = true; };
            rightBtn.onmouseup = () => { this.keys.right = false; };
        }
        
        if (fireBtn) {
            fireBtn.ontouchstart = (e) => { e.preventDefault(); this.fireBullet(); };
            fireBtn.onmousedown = () => { this.fireBullet(); };
        }
    }
    
    /**
     * Handle game-specific keyboard input
     */
    handleKeyboard(event) {
        if (this.gameOver) return;
        
        switch (event.code) {
            case 'ArrowUp':
            case 'KeyW':
                this.keys.up = true;
                event.preventDefault();
                break;
            case 'ArrowDown':
            case 'KeyS':
                this.keys.down = true;
                event.preventDefault();
                break;
            case 'ArrowLeft':
            case 'KeyA':
                this.keys.left = true;
                event.preventDefault();
                break;
            case 'ArrowRight':
            case 'KeyD':
                this.keys.right = true;
                event.preventDefault();
                break;
            case 'Space':
                this.fireBullet();
                event.preventDefault();
                break;
        }
    }
    
    /**
     * Handle key up events
     */
    handleKeyUp(event) {
        switch (event.code) {
            case 'ArrowUp':
            case 'KeyW':
                this.keys.up = false;
                break;
            case 'ArrowDown':
            case 'KeyS':
                this.keys.down = false;
                break;
            case 'ArrowLeft':
            case 'KeyA':
                this.keys.left = false;
                break;
            case 'ArrowRight':
            case 'KeyD':
                this.keys.right = false;
                break;
        }
    }
    
    /**
     * Fire bullet from player tank
     */
    fireBullet() {
        if (this.gameOver) return;
        
        const bullet = {
            x: this.player.x + this.player.width / 2 - this.BULLET_SIZE / 2,
            y: this.player.y,
            width: this.BULLET_SIZE,
            height: this.BULLET_SIZE,
            vx: 0,
            vy: -8
        };
        
        // Set bullet direction based on tank direction
        switch (this.player.direction) {
            case 'up':
                bullet.x = this.player.x + this.player.width / 2 - this.BULLET_SIZE / 2;
                bullet.y = this.player.y;
                bullet.vx = 0;
                bullet.vy = -8;
                break;
            case 'down':
                bullet.x = this.player.x + this.player.width / 2 - this.BULLET_SIZE / 2;
                bullet.y = this.player.y + this.player.height;
                bullet.vx = 0;
                bullet.vy = 8;
                break;
            case 'left':
                bullet.x = this.player.x;
                bullet.y = this.player.y + this.player.height / 2 - this.BULLET_SIZE / 2;
                bullet.vx = -8;
                bullet.vy = 0;
                break;
            case 'right':
                bullet.x = this.player.x + this.player.width;
                bullet.y = this.player.y + this.player.height / 2 - this.BULLET_SIZE / 2;
                bullet.vx = 8;
                bullet.vy = 0;
                break;
        }
        
        this.bullets.push(bullet);
    }
    
    /**
     * Start game loop
     */
    async onStart() {
        console.log(`[${this.gameType}] Starting tank battle game`);
        
        // Start new reward session
        if (typeof GameRewardManager !== 'undefined') {
            GameRewardManager.startNewSession();
        }
        
        // Add key up listener via tracked helper
        this.addTrackedEventListener(document, 'keyup', this.boundHandleKeyUp);

        // Start game loop
        this.gameLoop();
    }
    
    /**
     * Main game loop
     */
    gameLoop() {
        if (this.gameOver) {
            this.cancelAnimationLoop();
            return;
        }
        
        this.update();
        this.render();
        this.animationId = requestAnimationFrame(() => this.gameLoop());
    }
    
    /**
     * Update game state
     */
    update() {
        if (this.gameOver) return;
        
        // Update player
        this.updatePlayer();
        
        // Update bullets
        this.updateBullets();
        
        // Update enemies
        this.updateEnemies();
        
        // Update explosions
        this.updateExplosions();
        
        // Check collisions
        this.checkCollisions();
        
        // Check win/lose conditions
        this.checkGameConditions();
        
        // Update UI
        this.updateUI();
    }
    
    /**
     * Update player tank
     */
    updatePlayer() {
        let newX = this.player.x;
        let newY = this.player.y;
        let moved = false;
        
        // Handle movement
        if (this.keys.up) {
            newY -= this.PLAYER_SPEED;
            this.player.direction = 'up';
            moved = true;
        }
        if (this.keys.down) {
            newY += this.PLAYER_SPEED;
            this.player.direction = 'down';
            moved = true;
        }
        if (this.keys.left) {
            newX -= this.PLAYER_SPEED;
            this.player.direction = 'left';
            moved = true;
        }
        if (this.keys.right) {
            newX += this.PLAYER_SPEED;
            this.player.direction = 'right';
            moved = true;
        }
        
        // Check boundaries
        newX = Math.max(0, Math.min(this.CANVAS_WIDTH - this.player.width, newX));
        newY = Math.max(0, Math.min(this.CANVAS_HEIGHT - this.player.height, newY));
        
        // Check wall collision
        const playerRect = { x: newX, y: newY, width: this.player.width, height: this.player.height };
        let wallCollision = false;
        for (const wall of this.walls) {
            if (this.rectCollision(playerRect, wall)) {
                wallCollision = true;
                break;
            }
        }
        
        if (!wallCollision) {
            this.player.x = newX;
            this.player.y = newY;
        }
        
        // Update invincibility
        if (this.player.invincible) {
            this.player.invincibleTime--;
            if (this.player.invincibleTime <= 0) {
                this.player.invincible = false;
            }
        }
    }
    
    /**
     * Update bullets
     */
    updateBullets() {
        // Update player bullets
        this.bullets = this.bullets.filter(b => {
            b.x += b.vx;
            b.y += b.vy;
            return b.x >= 0 && b.x <= this.CANVAS_WIDTH && b.y >= 0 && b.y <= this.CANVAS_HEIGHT;
        });
        
        // Update enemy bullets
        this.enemyBullets = this.enemyBullets.filter(b => {
            b.x += b.vx;
            b.y += b.vy;
            return b.x >= 0 && b.x <= this.CANVAS_WIDTH && b.y >= 0 && b.y <= this.CANVAS_HEIGHT;
        });
    }
    
    /**
     * Update enemy tanks
     */
    updateEnemies() {
        this.enemies.forEach(enemy => {
            // Simple AI: move randomly and fire at player
            enemy.moveTimer++;
            
            // Change direction randomly
            if (enemy.moveTimer > 60 + Math.random() * 60) {
                enemy.moveDirection *= -1;
                enemy.moveTimer = 0;
            }
            
            // Move enemy
            let enX = enemy.x;
            let enY = enemy.y;
            
            if (enemy.direction === 'up') {
                enY -= this.ENEMY_SPEED;
            } else if (enemy.direction === 'down') {
                enY += this.ENEMY_SPEED;
            } else if (enemy.direction === 'left') {
                enX -= this.ENEMY_SPEED;
            } else if (enemy.direction === 'right') {
                enX += this.ENEMY_SPEED;
            }
            
            // Check boundaries
            enX = Math.max(0, Math.min(this.CANVAS_WIDTH - enemy.width, enX));
            enY = Math.max(0, Math.min(this.CANVAS_HEIGHT - enemy.height, enY));
            
            // Check wall collision
            const enemyRect = { x: enX, y: enY, width: enemy.width, height: enemy.height };
            let wallCollision = false;
            for (const wall of this.walls) {
                if (this.rectCollision(enemyRect, wall)) {
                    wallCollision = true;
                    break;
                }
            }
            
            if (!wallCollision) {
                enemy.x = enX;
                enemy.y = enY;
            } else {
                // Change direction on wall collision
                const directions = ['up', 'down', 'left', 'right'];
                enemy.direction = directions[Math.floor(Math.random() * directions.length)];
            }
            
            // Fire at player
            const now = Date.now();
            if (now - enemy.lastFireTime > this.ENEMY_FIRE_COOLDOWN || Math.random() < this.ENEMY_RANDOM_FIRE_CHANCE) {
                this.enemyFireBullet(enemy);
                enemy.lastFireTime = now;
            }
        });
    }
    
    /**
     * Enemy fire bullet
     */
    enemyFireBullet(enemy) {
        const bullet = {
            x: enemy.x + enemy.width / 2 - this.BULLET_SIZE / 2,
            y: enemy.y + enemy.height / 2 - this.BULLET_SIZE / 2,
            width: this.BULLET_SIZE,
            height: this.BULLET_SIZE,
            vx: 0,
            vy: 4
        };
        
        // Simple aiming: fire towards player general area
        const dx = this.player.x - enemy.x;
        const dy = this.player.y - enemy.y;
        const absDx = Math.abs(dx);
        const absDy = Math.abs(dy);
        const speed = 4;

        if (absDx > absDy) {
            bullet.vx = dx > 0 ? speed : -speed;
            bullet.vy = 0;
        } else {
            bullet.vx = 0;
            bullet.vy = dy > 0 ? speed : -speed;
        }
        
        this.enemyBullets.push(bullet);
    }
    
    /**
     * Update explosions
     */
    updateExplosions() {
        this.explosions = this.explosions.filter(exp => {
            exp.timer--;
            return exp.timer > 0;
        });
    }
    
    /**
     * Check collisions
     */
    checkCollisions() {
        // Player bullets vs enemies
        this.bullets.forEach((bullet, bIndex) => {
            this.enemies.forEach((enemy, eIndex) => {
                if (this.rectCollision(bullet, enemy)) {
                    // Hit enemy
                    this.createExplosion(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2);
                    this.enemies.splice(eIndex, 1);
                    this.bullets.splice(bIndex, 1);
                    this.enemiesKilled++;
                    this.score += 100;
                }
            });
            
            // Player bullets vs walls
            this.walls.forEach((wall, wIndex) => {
                if (this.rectCollision(bullet, wall)) {
                    wall.health--;
                    if (wall.health <= 0) {
                        this.walls.splice(wIndex, 1);
                        this.createExplosion(wall.x + wall.width / 2, wall.y + wall.height / 2);
                    }
                    this.bullets.splice(bIndex, 1);
                }
            });
        });
        
        // Enemy bullets vs player
        if (!this.player.invincible) {
            this.enemyBullets.forEach((bullet, bIndex) => {
                if (this.rectCollision(bullet, this.player)) {
                    // Hit player
                    this.createExplosion(this.player.x + this.player.width / 2, this.player.y + this.player.height / 2);
                    this.enemyBullets.splice(bIndex, 1);
                    this.lives--;
                    this.player.invincible = true;
                    this.player.invincibleTime = 120; // 2 seconds at 60fps
                }
            });
            
            // Enemy bullets vs walls
            this.enemyBullets.forEach((bullet, bIndex) => {
                this.walls.forEach((wall, wIndex) => {
                    if (this.rectCollision(bullet, wall)) {
                        wall.health--;
                        if (wall.health <= 0) {
                            this.walls.splice(wIndex, 1);
                            this.createExplosion(wall.x + wall.width / 2, wall.y + wall.height / 2);
                        }
                        this.enemyBullets.splice(bIndex, 1);
                    }
                });
            });
        }
    }
    
    /**
     * Check win/lose conditions
     */
    checkGameConditions() {
        if (this.lives <= 0) {
            this.endGame(false);
        } else if (this.enemies.length === 0) {
            this.endGame(true);
        }
    }
    
    /**
     * Create explosion effect
     */
    createExplosion(x, y) {
        this.explosions.push({
            x: x,
            y: y,
            timer: 20,
            maxRadius: 20
        });
    }
    
    /**
     * Rectangle collision detection
     */
    rectCollision(rect1, rect2) {
        return rect1.x < rect2.x + rect2.width &&
               rect1.x + rect1.width > rect2.x &&
               rect1.y < rect2.y + rect2.height &&
               rect1.y + rect1.height > rect2.y;
    }
    
    /**
     * Render game
     */
    render() {
        if (!this.ctx) return;
        
        // Clear canvas
        this.ctx.fillStyle = this.COLORS.grass;
        this.ctx.fillRect(0, 0, this.CANVAS_WIDTH, this.CANVAS_HEIGHT);
        
        // Draw grid lines
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        this.ctx.lineWidth = 1;
        for (let x = 0; x <= this.CANVAS_WIDTH; x += this.TILE_SIZE) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.CANVAS_HEIGHT);
            this.ctx.stroke();
        }
        for (let y = 0; y <= this.CANVAS_HEIGHT; y += this.TILE_SIZE) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.CANVAS_WIDTH, y);
            this.ctx.stroke();
        }
        
        // Draw walls
        this.walls.forEach(wall => {
            this.ctx.fillStyle = this.COLORS.wall;
            this.ctx.fillRect(wall.x, wall.y, wall.width, wall.height);
            this.ctx.fillStyle = this.COLORS.wallBorder;
            this.ctx.fillRect(wall.x + wall.width - 3, wall.y, 3, wall.height);
            this.ctx.fillRect(wall.x, wall.y + wall.height - 3, wall.width, 3);
        });
        
        // Draw player tank
        if (!this.player.invincible || Math.floor(this.player.invincibleTime / 5) % 2 === 1) {
            this.drawTank(this.player, this.COLORS.player, this.COLORS.playerBarrel);
        }
        
        // Draw enemy tanks
        this.enemies.forEach(enemy => {
            this.drawTank(enemy, this.COLORS.enemy, this.COLORS.enemyBarrel);
        });
        
        // Draw bullets
        this.ctx.fillStyle = this.COLORS.bullet;
        this.bullets.forEach(b => {
            this.ctx.beginPath();
            this.ctx.arc(b.x + b.width / 2, b.y + b.height / 2, this.BULLET_SIZE / 2, 0, Math.PI * 2);
            this.ctx.fill();
        });
        
        this.enemyBullets.forEach(b => {
            this.ctx.beginPath();
            this.ctx.arc(b.x + b.width / 2, b.y + b.height / 2, this.BULLET_SIZE / 2, 0, Math.PI * 2);
            this.ctx.fill();
        });
        
        // Draw explosions
        this.explosions.forEach(exp => {
            const alpha = exp.timer / 20;
            const radius = (1 - alpha) * exp.maxRadius;
            
            this.ctx.fillStyle = `rgba(255, 107, 53, ${alpha})`;
            this.ctx.beginPath();
            this.ctx.arc(exp.x, exp.y, radius, 0, Math.PI * 2);
            this.ctx.fill();
        });
    }
    
    /**
     * Draw tank
     */
    drawTank(tank, bodyColor, barrelColor) {
        const x = tank.x;
        const y = tank.y;
        const size = this.TANK_SIZE;
        
        // Tank body
        this.ctx.fillStyle = bodyColor;
        this.ctx.fillRect(x + 4, y + 4, size - 8, size - 8);
        
        // Tank barrel
        this.ctx.fillStyle = barrelColor;
        switch (tank.direction) {
            case 'up':
                this.ctx.fillRect(x + size/2 - 2, y, 4, size/2);
                break;
            case 'down':
                this.ctx.fillRect(x + size/2 - 2, y + size/2, 4, size/2);
                break;
            case 'left':
                this.ctx.fillRect(x, y + size/2 - 2, size/2, 4);
                break;
            case 'right':
                this.ctx.fillRect(x + size/2, y + size/2 - 2, size/2, 4);
                break;
        }
        
        // Tank tracks
        this.ctx.fillStyle = '#333';
        this.ctx.fillRect(x + 2, y + 2, size - 4, 4);
        this.ctx.fillRect(x + 2, y + size - 6, size - 4, 4);
    }
    
    /**
     * Update UI elements
     */
    updateUI() {
        const scoreEl = document.getElementById('tbScore');
        const livesEl = document.getElementById('tbLives');
        const enemiesEl = document.getElementById('tbEnemiesLeft');
        
        if (scoreEl) scoreEl.textContent = this.score;
        if (livesEl) livesEl.textContent = this.lives;
        if (enemiesEl) enemiesEl.textContent = this.totalEnemies - this.enemiesKilled;
    }
    
    /**
     * End game
     */
    endGame(victory) {
        // Only end game if not already ended
        if (this.gameOver) {
            return;
        }
        
        this.gameOver = true;
        
        if (victory) {
            this.score += 200; // Victory bonus
        }
        
        // Update completion message
        this.showCustomCompletionMessage(() => {
            this.updateCompletionField('#tbFinalScore', this.score);
        });
        
        // Award XP via unified GameRewardManager
        if (typeof GameRewardManager !== 'undefined') {
            GameRewardManager.awardCompletion('tank-battle', this.score);
        }
        
        console.log(`[${this.gameType}] Game ended. Victory: ${victory}, Score: ${this.score}`);
        
        // Auto-close after delay
        setTimeout(() => {
            this.close();
        }, 3000);
    }
    
    /**
     * Apply game-specific optimizations
     */
    applyOptimizations(viewportInfo) {
        const { maxGameSize, isMobile, isSmallMobile } = viewportInfo;
        
        if (isSmallMobile) {
            this.CANVAS_WIDTH = Math.min(maxGameSize, 280);
            this.CANVAS_HEIGHT = Math.min(maxGameSize, 280);
        } else if (isMobile) {
            this.CANVAS_WIDTH = Math.min(maxGameSize, 320);
            this.CANVAS_HEIGHT = Math.min(maxGameSize, 320);
        } else {
            this.CANVAS_WIDTH = Math.min(maxGameSize, 400);
            this.CANVAS_HEIGHT = Math.min(maxGameSize, 400);
        }
        
        // Adjust other sizes proportionally
        const scale = this.CANVAS_WIDTH / 320;
        this.TILE_SIZE = Math.floor(32 * scale);
        this.TANK_SIZE = Math.floor(28 * scale);
        this.BULLET_SIZE = Math.floor(6 * scale);
        this.PLAYER_SPEED = 2.5 * scale;
        this.ENEMY_SPEED = 1.2 * scale;
        
        console.log(`[${this.gameType}] Optimizations applied: canvas=${this.CANVAS_WIDTH}x${this.CANVAS_HEIGHT}, scale=${scale.toFixed(2)}`);
    }
    
    /**
     * Apply fallback sizing
     */
    applyFallbackSizing() {
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        const isMobile = viewportWidth <= 768;
        const isSmallMobile = viewportWidth <= 360;
        
        let maxCanvasSize = Math.min(viewportWidth - 60, viewportHeight - 200);
        
        if (isSmallMobile) {
            maxCanvasSize = Math.min(maxCanvasSize, 280);
        } else if (isMobile) {
            maxCanvasSize = Math.min(maxCanvasSize, 320);
        } else {
            maxCanvasSize = Math.min(maxCanvasSize, 400);
        }
        
        this.CANVAS_WIDTH = maxCanvasSize;
        this.CANVAS_HEIGHT = maxCanvasSize;
        
        // Update canvas element if it exists
        if (this.canvas) {
            this.canvas.width = this.CANVAS_WIDTH;
            this.canvas.height = this.CANVAS_HEIGHT;
        }
        
        console.log(`[${this.gameType}] Fallback sizing: canvas=${maxCanvasSize}px`);
    }
    
    /**
     * Game-specific cleanup
     */
    onCleanup() {
        console.log(`[${this.gameType}] Cleaning up tank battle game...`);
        
        // Set game over flag to stop game loop
        this.gameOver = true;
        
        console.log(`[${this.gameType}] Tank battle game cleanup completed`);
    }
    
    /**
     * Reset game
     */
    onReset() {
        console.log(`[${this.gameType}] Resetting tank battle game...`);
        
        // Reset game state
        this.resetGameState();
        
        // Regenerate level
        this.generateWalls();
        this.generateEnemies();
        
        // Update UI
        this.updateUI();
        
        // Hide completion message
        this.hideCompletionMessage();
        
        console.log(`[${this.gameType}] Tank battle game reset completed`);
    }
}

// Auto-register with GameManager when loaded
if (typeof GameManager !== 'undefined' && GameManager.tryRegisterUnifiedGames) {
    GameManager.tryRegisterUnifiedGames();
}
