/**
 * 经典小蜜蜂射击游戏 (Space Invaders Style)
 * Classic Space Invaders style shooting game for MuseumCheck
 */

// Game constants
const GAME_CONFIG = {
    // Player settings
    PLAYER_WIDTH: 50,
    PLAYER_HEIGHT: 30,
    PLAYER_SPEED: 8,
    PLAYER_LIVES: 3,
    
    // Bullet settings
    BULLET_WIDTH: 4,
    BULLET_HEIGHT: 15,
    BULLET_SPEED: 12,
    MAX_BULLETS: 3,
    
    // Enemy settings
    ENEMY_WIDTH: 40,
    ENEMY_HEIGHT: 30,
    ENEMY_PADDING: 15,
    ENEMY_ROWS: 4,
    ENEMY_COLS: 8,
    ENEMY_SPEED_INITIAL: 1,
    ENEMY_SPEED_INCREMENT: 0.3,
    ENEMY_DROP_DISTANCE: 30,
    ENEMY_BULLET_SPEED: 5,
    ENEMY_FIRE_CHANCE: 0.0008,
    
    // Score settings
    ENEMY_SCORE: 10,
    LEVEL_BONUS: 100,
    
    // Colors
    COLORS: {
        PLAYER: '#00FF00',
        PLAYER_GLOW: 'rgba(0, 255, 0, 0.3)',
        BULLET: '#FFFF00',
        ENEMY_BULLET: '#FF0000',
        ENEMY_TYPE1: '#FFD700', // Gold - bee color
        ENEMY_TYPE2: '#FF6B00', // Orange
        ENEMY_TYPE3: '#FF00FF', // Magenta
        ENEMY_TYPE4: '#00FFFF', // Cyan
        STAR: '#FFFFFF',
        EXPLOSION: ['#FFFF00', '#FFA500', '#FF0000', '#FF4500']
    }
};

// Game state
let canvas, ctx;
let gameState = 'start'; // 'start', 'playing', 'paused', 'levelComplete', 'gameOver'
let score = 0;
let lives = GAME_CONFIG.PLAYER_LIVES;
let level = 1;
let enemiesKilled = 0;
let maxLevel = 1;

// Game objects
let player = null;
let bullets = [];
let enemies = [];
let enemyBullets = [];
let explosions = [];
let stars = [];

// Enemy movement
let enemyDirection = 1;
let enemySpeed = GAME_CONFIG.ENEMY_SPEED_INITIAL;

// Input state
let keys = {
    left: false,
    right: false,
    fire: false
};
let lastFireTime = 0;
const FIRE_COOLDOWN = 250; // ms between shots

// Touch controls
let touchLeft = false;
let touchRight = false;
let touchFire = false;

// Animation frame ID
let animationId = null;

// Pet data (loaded from localStorage)
let petData = null;
let petLevel = 1;
let petEmoji = '🐾';
let petType = null;

/**
 * Initialize the game
 */
function initGame() {
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');
    
    // Load pet data
    loadPetData();
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    // Keyboard events
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    
    // Touch controls
    setupTouchControls();
    
    // Initialize stars background
    initStars();
    
    // Update start screen with pet info
    updateStartScreen();
    
    // Start render loop (for start screen)
    renderLoop();
}

/**
 * Load pet data from localStorage
 */
function loadPetData() {
    try {
        const saved = localStorage.getItem('virtualPetData');
        if (saved) {
            petData = JSON.parse(saved);
            if (petData.adopted && petData.pet) {
                const pet = petData.pet;
                petType = pet.type;
                petEmoji = pet.emoji;
                
                // Calculate pet level based on XP spent
                const xpSpent = pet.totalXPSpent || 0;
                if (xpSpent >= 500) petLevel = 5;
                else if (xpSpent >= 300) petLevel = 4;
                else if (xpSpent >= 150) petLevel = 3;
                else if (xpSpent >= 50) petLevel = 2;
                else petLevel = 1;
            }
        }
    } catch (error) {
        console.error('Failed to load pet data:', error);
    }
}

/**
 * Update start screen with pet information
 */
function updateStartScreen() {
    const startScreen = document.getElementById('startScreen');
    if (!startScreen) return;
    
    const levelNames = ['新手', '见习', '熟练', '专家', '大师'];
    const levelName = levelNames[petLevel - 1] || '新手';
    
    let levelFeatures = '';
    switch (petLevel) {
        case 1:
        case 2:
            levelFeatures = '基础游戏体验';
            break;
        case 3:
            levelFeatures = '子弹增强 + 音效';
            break;
        case 4:
            levelFeatures = '移速加成 + 更多生命';
            break;
        case 5:
            levelFeatures = '无敌时间延长 + 奖励翻倍 🎆';
            break;
    }
    
    // Add pet info to start screen if not already present
    let petInfo = startScreen.querySelector('.pet-info');
    if (!petInfo) {
        petInfo = document.createElement('div');
        petInfo.className = 'pet-info';
        petInfo.style.cssText = 'margin: 20px 0; text-align: center;';
        
        const petDisplay = document.createElement('div');
        petDisplay.style.cssText = 'font-size: 64px; margin-bottom: 10px;';
        petDisplay.textContent = petEmoji;
        
        const levelBadge = document.createElement('div');
        levelBadge.style.cssText = 'background: linear-gradient(135deg, #FFD700, #FFA500); color: #000; padding: 8px 20px; border-radius: 20px; font-size: 16px; font-weight: bold; display: inline-block; box-shadow: 0 4px 12px rgba(255, 215, 0, 0.4);';
        levelBadge.innerHTML = `宠物等级 ${petLevel} - ${levelName}<br><small style="font-size: 12px;">${levelFeatures}</small>`;
        
        petInfo.appendChild(petDisplay);
        petInfo.appendChild(levelBadge);
        
        // Insert before the start button
        const startBtn = startScreen.querySelector('.start-btn');
        startScreen.insertBefore(petInfo, startBtn);
    } else {
        // Update existing pet info
        petInfo.querySelector('div:first-child').textContent = petEmoji;
        petInfo.querySelector('div:last-child').innerHTML = `宠物等级 ${petLevel} - ${levelName}<br><small style="font-size: 12px;">${levelFeatures}</small>`;
    }
}

/**
 * Resize canvas to fit screen
 */
function resizeCanvas() {
    const container = document.getElementById('gameContainer');
    const maxWidth = Math.min(800, window.innerWidth - 20);
    const maxHeight = Math.min(600, window.innerHeight - 100);
    
    // Maintain aspect ratio
    const aspectRatio = 4 / 3;
    let width = maxWidth;
    let height = width / aspectRatio;
    
    if (height > maxHeight) {
        height = maxHeight;
        width = height * aspectRatio;
    }
    
    canvas.width = width;
    canvas.height = height;
    
    // Reinitialize player position if exists
    if (player) {
        player.x = Math.min(player.x, canvas.width - GAME_CONFIG.PLAYER_WIDTH);
        player.y = canvas.height - GAME_CONFIG.PLAYER_HEIGHT - 20;
    }
    
    // Reinitialize stars
    initStars();
}

/**
 * Initialize star background
 */
function initStars() {
    stars = [];
    const numStars = 50;
    for (let i = 0; i < numStars; i++) {
        stars.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            size: Math.random() * 2 + 0.5,
            speed: Math.random() * 0.5 + 0.1,
            brightness: Math.random()
        });
    }
}

/**
 * Setup touch controls for mobile
 */
function setupTouchControls() {
    const leftBtn = document.getElementById('leftBtn');
    const rightBtn = document.getElementById('rightBtn');
    const fireBtn = document.getElementById('fireBtn');
    
    // Left button
    leftBtn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        touchLeft = true;
    });
    leftBtn.addEventListener('touchend', () => {
        touchLeft = false;
    });
    
    // Right button
    rightBtn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        touchRight = true;
    });
    rightBtn.addEventListener('touchend', () => {
        touchRight = false;
    });
    
    // Fire button
    fireBtn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        touchFire = true;
        fireBullet();
    });
    fireBtn.addEventListener('touchend', () => {
        touchFire = false;
    });
    
    // Prevent default touch behavior on canvas
    canvas.addEventListener('touchstart', (e) => e.preventDefault());
    canvas.addEventListener('touchmove', (e) => e.preventDefault());
}

/**
 * Handle keyboard key down
 */
function handleKeyDown(e) {
    if (gameState !== 'playing') return;
    
    switch(e.code) {
        case 'ArrowLeft':
        case 'KeyA':
            keys.left = true;
            e.preventDefault();
            break;
        case 'ArrowRight':
        case 'KeyD':
            keys.right = true;
            e.preventDefault();
            break;
        case 'Space':
            keys.fire = true;
            fireBullet();
            e.preventDefault();
            break;
    }
}

/**
 * Handle keyboard key up
 */
function handleKeyUp(e) {
    switch(e.code) {
        case 'ArrowLeft':
        case 'KeyA':
            keys.left = false;
            break;
        case 'ArrowRight':
        case 'KeyD':
            keys.right = false;
            break;
        case 'Space':
            keys.fire = false;
            break;
    }
}

/**
 * Start the game
 */
function startGame() {
    document.getElementById('startScreen').classList.add('hidden');
    document.getElementById('gameOverScreen').classList.add('hidden');
    document.getElementById('levelCompleteScreen').classList.add('hidden');
    
    // Reset game state
    score = 0;
    // Pet level bonus: extra life at level 4+
    lives = GAME_CONFIG.PLAYER_LIVES + (petLevel >= 4 ? 1 : 0);
    level = 1;
    enemiesKilled = 0;
    maxLevel = 1;
    bullets = [];
    enemyBullets = [];
    explosions = [];
    
    // Initialize player with pet bonuses
    const speedBonus = petLevel >= 3 ? 2 : 0;
    player = {
        x: canvas.width / 2 - GAME_CONFIG.PLAYER_WIDTH / 2,
        y: canvas.height - GAME_CONFIG.PLAYER_HEIGHT - 20,
        width: GAME_CONFIG.PLAYER_WIDTH,
        height: GAME_CONFIG.PLAYER_HEIGHT,
        speed: GAME_CONFIG.PLAYER_SPEED + speedBonus,
        invincible: false,
        invincibleTime: 0
    };
    
    // Initialize enemies
    initEnemies();
    
    // Update UI
    updateUI();
    
    // Start game
    gameState = 'playing';
}

/**
 * Restart the game
 */
function restartGame() {
    startGame();
}

/**
 * Initialize enemies for current level
 */
function initEnemies() {
    enemies = [];
    enemyDirection = 1;
    enemySpeed = GAME_CONFIG.ENEMY_SPEED_INITIAL + (level - 1) * GAME_CONFIG.ENEMY_SPEED_INCREMENT;
    
    const rows = Math.min(GAME_CONFIG.ENEMY_ROWS + Math.floor((level - 1) / 2), 6);
    const cols = Math.min(GAME_CONFIG.ENEMY_COLS + Math.floor((level - 1) / 3), 10);
    
    const startX = (canvas.width - (cols * (GAME_CONFIG.ENEMY_WIDTH + GAME_CONFIG.ENEMY_PADDING))) / 2;
    const startY = 60;
    
    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            const type = row % 4; // Different enemy types based on row
            enemies.push({
                x: startX + col * (GAME_CONFIG.ENEMY_WIDTH + GAME_CONFIG.ENEMY_PADDING),
                y: startY + row * (GAME_CONFIG.ENEMY_HEIGHT + GAME_CONFIG.ENEMY_PADDING),
                width: GAME_CONFIG.ENEMY_WIDTH,
                height: GAME_CONFIG.ENEMY_HEIGHT,
                type: type,
                animFrame: 0,
                animTimer: 0
            });
        }
    }
}

/**
 * Fire a bullet from the player
 */
function fireBullet() {
    if (gameState !== 'playing') return;
    
    const now = Date.now();
    if (now - lastFireTime < FIRE_COOLDOWN) return;
    if (bullets.length >= GAME_CONFIG.MAX_BULLETS) return;
    
    lastFireTime = now;
    
    bullets.push({
        x: player.x + player.width / 2 - GAME_CONFIG.BULLET_WIDTH / 2,
        y: player.y,
        width: GAME_CONFIG.BULLET_WIDTH,
        height: GAME_CONFIG.BULLET_HEIGHT
    });
    
    // TODO: Add sound effects in future update
}

/**
 * Enemy fires a bullet
 */
function enemyFire(enemy) {
    enemyBullets.push({
        x: enemy.x + enemy.width / 2 - GAME_CONFIG.BULLET_WIDTH / 2,
        y: enemy.y + enemy.height,
        width: GAME_CONFIG.BULLET_WIDTH,
        height: GAME_CONFIG.BULLET_HEIGHT
    });
}

/**
 * Create explosion effect
 */
function createExplosion(x, y, size = 1) {
    const numParticles = 15 * size;
    for (let i = 0; i < numParticles; i++) {
        const angle = (Math.PI * 2 * i) / numParticles;
        const speed = (Math.random() * 3 + 2) * size;
        explosions.push({
            x: x,
            y: y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            life: 1,
            color: GAME_CONFIG.COLORS.EXPLOSION[Math.floor(Math.random() * GAME_CONFIG.COLORS.EXPLOSION.length)],
            size: Math.random() * 4 + 2
        });
    }
}

/**
 * Update game state
 */
function update() {
    if (gameState !== 'playing') return;
    
    // Update player position
    updatePlayer();
    
    // Update bullets
    updateBullets();
    
    // Update enemies
    updateEnemies();
    
    // Update enemy bullets
    updateEnemyBullets();
    
    // Update explosions
    updateExplosions();
    
    // Update stars
    updateStars();
    
    // Check collisions
    checkCollisions();
    
    // Check level complete
    checkLevelComplete();
    
    // Update player invincibility
    if (player.invincible) {
        player.invincibleTime--;
        if (player.invincibleTime <= 0) {
            player.invincible = false;
        }
    }
}

/**
 * Update player position
 */
function updatePlayer() {
    // Get player speed (includes pet bonus)
    const speed = player.speed || GAME_CONFIG.PLAYER_SPEED;
    
    if (keys.left || touchLeft) {
        player.x -= speed;
    }
    if (keys.right || touchRight) {
        player.x += speed;
    }
    
    // Keep player in bounds
    player.x = Math.max(0, Math.min(canvas.width - player.width, player.x));
}

/**
 * Update player bullets
 */
function updateBullets() {
    bullets = bullets.filter(bullet => {
        bullet.y -= GAME_CONFIG.BULLET_SPEED;
        return bullet.y + bullet.height > 0;
    });
}

/**
 * Update enemies
 */
function updateEnemies() {
    if (enemies.length === 0) return;
    
    // Find boundaries
    let leftMost = canvas.width;
    let rightMost = 0;
    enemies.forEach(enemy => {
        leftMost = Math.min(leftMost, enemy.x);
        rightMost = Math.max(rightMost, enemy.x + enemy.width);
    });
    
    // Check if need to change direction
    let shouldDrop = false;
    if (enemyDirection > 0 && rightMost + enemySpeed >= canvas.width) {
        enemyDirection = -1;
        shouldDrop = true;
    } else if (enemyDirection < 0 && leftMost - enemySpeed <= 0) {
        enemyDirection = 1;
        shouldDrop = true;
    }
    
    // Move enemies
    enemies.forEach(enemy => {
        enemy.x += enemySpeed * enemyDirection;
        if (shouldDrop) {
            enemy.y += GAME_CONFIG.ENEMY_DROP_DISTANCE;
        }
        
        // Animation
        enemy.animTimer++;
        if (enemy.animTimer > 30) {
            enemy.animFrame = (enemy.animFrame + 1) % 2;
            enemy.animTimer = 0;
        }
        
        // Random fire
        if (Math.random() < GAME_CONFIG.ENEMY_FIRE_CHANCE * (1 + level * 0.1)) {
            enemyFire(enemy);
        }
        
        // Check if enemy reached bottom (game over)
        if (enemy.y + enemy.height >= player.y) {
            gameOver();
        }
    });
}

/**
 * Update enemy bullets
 */
function updateEnemyBullets() {
    enemyBullets = enemyBullets.filter(bullet => {
        bullet.y += GAME_CONFIG.ENEMY_BULLET_SPEED;
        return bullet.y < canvas.height;
    });
}

/**
 * Update explosions
 */
function updateExplosions() {
    explosions = explosions.filter(particle => {
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.vy += 0.1; // gravity
        particle.life -= 0.02;
        return particle.life > 0;
    });
}

/**
 * Update star positions
 */
function updateStars() {
    stars.forEach(star => {
        star.y += star.speed;
        if (star.y > canvas.height) {
            star.y = 0;
            star.x = Math.random() * canvas.width;
        }
        star.brightness = Math.sin(Date.now() * 0.001 + star.x) * 0.3 + 0.7;
    });
}

/**
 * Check collisions
 */
function checkCollisions() {
    // Bullet vs Enemy - iterate backwards to safely remove items
    const bulletsToRemove = [];
    const enemiesToRemove = [];
    
    for (let i = bullets.length - 1; i >= 0; i--) {
        const bullet = bullets[i];
        for (let j = enemies.length - 1; j >= 0; j--) {
            const enemy = enemies[j];
            if (isColliding(bullet, enemy)) {
                bulletsToRemove.push(i);
                enemiesToRemove.push(j);
                // Create explosion
                createExplosion(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2);
                // Update score
                score += GAME_CONFIG.ENEMY_SCORE * (enemy.type + 1);
                enemiesKilled++;
                updateUI();
                break; // Each bullet can only hit one enemy
            }
        }
    }
    
    // Remove marked bullets and enemies (in reverse order to maintain indices)
    bulletsToRemove.forEach(index => bullets.splice(index, 1));
    enemiesToRemove.sort((a, b) => b - a).forEach(index => enemies.splice(index, 1));
    
    // Enemy bullet vs Player - iterate backwards to safely remove items
    if (!player.invincible) {
        for (let i = enemyBullets.length - 1; i >= 0; i--) {
            if (isColliding(enemyBullets[i], player)) {
                enemyBullets.splice(i, 1);
                playerHit();
                break; // Only one hit per frame
            }
        }
    }
}

/**
 * Check if two objects are colliding
 */
function isColliding(a, b) {
    return a.x < b.x + b.width &&
           a.x + a.width > b.x &&
           a.y < b.y + b.height &&
           a.y + a.height > b.y;
}

/**
 * Handle player being hit
 */
function playerHit() {
    lives--;
    createExplosion(player.x + player.width / 2, player.y + player.height / 2, 2);
    updateUI();
    
    if (lives <= 0) {
        gameOver();
    } else {
        // Make player invincible for a short time
        // Pet level 5 gets extended invincibility
        const baseInvincibleTime = 120; // frames
        const bonusTime = petLevel >= 5 ? 60 : 0;
        player.invincible = true;
        player.invincibleTime = baseInvincibleTime + bonusTime;
    }
}

/**
 * Check if level is complete
 */
function checkLevelComplete() {
    if (enemies.length === 0) {
        levelComplete();
    }
}

/**
 * Level complete handler
 */
function levelComplete() {
    gameState = 'levelComplete';
    score += GAME_CONFIG.LEVEL_BONUS * level;
    
    document.getElementById('completedLevel').textContent = level;
    document.getElementById('levelCompleteScreen').classList.remove('hidden');
    
    // Move to next level after delay
    setTimeout(() => {
        level++;
        maxLevel = Math.max(maxLevel, level);
        document.getElementById('levelCompleteScreen').classList.add('hidden');
        
        // Reset for next level
        bullets = [];
        enemyBullets = [];
        initEnemies();
        updateUI();
        
        gameState = 'playing';
    }, 2000);
}

/**
 * Game over handler
 */
function gameOver() {
    gameState = 'gameOver';
    
    // Update final stats
    document.getElementById('finalScore').textContent = score;
    document.getElementById('enemiesKilled').textContent = enemiesKilled;
    document.getElementById('maxLevel').textContent = maxLevel;
    
    document.getElementById('gameOverScreen').classList.remove('hidden');
}

/**
 * Update UI elements
 */
function updateUI() {
    document.getElementById('scoreDisplay').textContent = score;
    document.getElementById('livesDisplay').textContent = lives;
    document.getElementById('levelDisplay').textContent = level;
}

/**
 * Render the game
 */
function render() {
    // Clear canvas
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw stars
    drawStars();
    
    if (gameState === 'playing' || gameState === 'levelComplete') {
        // Draw player
        drawPlayer();
        
        // Draw bullets
        drawBullets();
        
        // Draw enemies
        drawEnemies();
        
        // Draw enemy bullets
        drawEnemyBullets();
        
        // Draw explosions
        drawExplosions();
    }
}

/**
 * Draw star background
 */
function drawStars() {
    stars.forEach(star => {
        ctx.fillStyle = `rgba(255, 255, 255, ${star.brightness})`;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
    });
}

/**
 * Draw the player spaceship (now using pet emoji)
 */
function drawPlayer() {
    if (!player) return;
    
    // Blink when invincible
    if (player.invincible && Math.floor(player.invincibleTime / 5) % 2 === 0) {
        return;
    }
    
    ctx.save();
    
    // Glow effect based on pet level
    const glowColors = ['rgba(0, 255, 0, 0.3)', 'rgba(100, 255, 100, 0.4)', 
                        'rgba(255, 215, 0, 0.5)', 'rgba(255, 100, 255, 0.6)', 
                        'rgba(255, 0, 255, 0.8)'];
    ctx.shadowColor = glowColors[Math.min(petLevel - 1, 4)];
    ctx.shadowBlur = 20 + (petLevel * 5);
    
    const x = player.x;
    const y = player.y;
    const w = player.width;
    const h = player.height;
    
    // Draw pet emoji as the player character
    ctx.font = `${Math.floor(h * 1.2)}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(petEmoji, x + w / 2, y + h / 2);
    
    // Add level indicator for high-level pets
    if (petLevel >= 4) {
        ctx.shadowBlur = 0;
        ctx.font = '12px Arial';
        ctx.fillStyle = '#FFD700';
        ctx.fillText(`Lv.${petLevel}`, x + w / 2, y + h + 10);
    }
    
    ctx.restore();
}

/**
 * Draw bullets
 */
function drawBullets() {
    ctx.fillStyle = GAME_CONFIG.COLORS.BULLET;
    ctx.shadowColor = GAME_CONFIG.COLORS.BULLET;
    ctx.shadowBlur = 10;
    
    bullets.forEach(bullet => {
        ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
    });
    
    ctx.shadowBlur = 0;
}

/**
 * Draw enemy bullets
 */
function drawEnemyBullets() {
    ctx.fillStyle = GAME_CONFIG.COLORS.ENEMY_BULLET;
    ctx.shadowColor = GAME_CONFIG.COLORS.ENEMY_BULLET;
    ctx.shadowBlur = 10;
    
    enemyBullets.forEach(bullet => {
        ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
    });
    
    ctx.shadowBlur = 0;
}

/**
 * Draw enemies (bee-like creatures)
 */
function drawEnemies() {
    enemies.forEach(enemy => {
        drawBee(enemy);
    });
}

/**
 * Draw a single bee enemy
 */
function drawBee(enemy) {
    const x = enemy.x;
    const y = enemy.y;
    const w = enemy.width;
    const h = enemy.height;
    const frame = enemy.animFrame;
    
    // Get color based on type
    const colors = [
        GAME_CONFIG.COLORS.ENEMY_TYPE1,
        GAME_CONFIG.COLORS.ENEMY_TYPE2,
        GAME_CONFIG.COLORS.ENEMY_TYPE3,
        GAME_CONFIG.COLORS.ENEMY_TYPE4
    ];
    const color = colors[enemy.type];
    
    ctx.save();
    ctx.shadowColor = color;
    ctx.shadowBlur = 10;
    
    // Body (oval)
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.ellipse(x + w / 2, y + h / 2, w / 2.5, h / 2.5, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Stripes
    ctx.fillStyle = '#000';
    ctx.fillRect(x + w * 0.25, y + h * 0.35, w * 0.5, h * 0.08);
    ctx.fillRect(x + w * 0.2, y + h * 0.5, w * 0.6, h * 0.08);
    
    // Wings (animated)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    const wingAngle = frame === 0 ? 0.3 : -0.3;
    
    // Left wing
    ctx.beginPath();
    ctx.ellipse(x + w * 0.15, y + h * 0.3, w * 0.25, h * 0.15, wingAngle, 0, Math.PI * 2);
    ctx.fill();
    
    // Right wing
    ctx.beginPath();
    ctx.ellipse(x + w * 0.85, y + h * 0.3, w * 0.25, h * 0.15, -wingAngle, 0, Math.PI * 2);
    ctx.fill();
    
    // Eyes
    ctx.fillStyle = '#FFF';
    ctx.beginPath();
    ctx.arc(x + w * 0.35, y + h * 0.35, w * 0.08, 0, Math.PI * 2);
    ctx.arc(x + w * 0.65, y + h * 0.35, w * 0.08, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(x + w * 0.35, y + h * 0.35, w * 0.04, 0, Math.PI * 2);
    ctx.arc(x + w * 0.65, y + h * 0.35, w * 0.04, 0, Math.PI * 2);
    ctx.fill();
    
    // Stinger
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x + w * 0.4, y + h * 0.8);
    ctx.lineTo(x + w / 2, y + h);
    ctx.lineTo(x + w * 0.6, y + h * 0.8);
    ctx.closePath();
    ctx.fill();
    
    ctx.restore();
}

/**
 * Draw explosions
 */
function drawExplosions() {
    explosions.forEach(particle => {
        ctx.globalAlpha = particle.life;
        ctx.fillStyle = particle.color;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size * particle.life, 0, Math.PI * 2);
        ctx.fill();
    });
    ctx.globalAlpha = 1;
}

/**
 * Main render loop
 */
function renderLoop() {
    update();
    render();
    animationId = requestAnimationFrame(renderLoop);
}

// Initialize game when page loads
document.addEventListener('DOMContentLoaded', initGame);
