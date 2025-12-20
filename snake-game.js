/**
 * 宠物贪食蛇游戏 (Pet Snake Game)
 * Snake game that uses virtual pet as the snake character
 * Pet level affects game experience (animations, effects, rewards)
 */

// Game constants
const GAME_CONFIG = {
    GRID_SIZE: 20,
    INITIAL_SPEED: 150, // ms per frame
    SPEED_INCREMENT: 5, // Speed increases as snake grows
    MIN_SPEED: 80,
    
    // Scoring
    BASE_FOOD_SCORE: 10,
    SPECIAL_FOOD_SCORE: 30,
    
    // Colors by pet level
    COLORS: {
        SNAKE_BODY: '#4ade80',
        SNAKE_BODY_DARK: '#22c55e',
        FOOD_NORMAL: '#ef4444',
        FOOD_SPECIAL: '#fbbf24',
        GRID_LINE: 'rgba(255, 255, 255, 0.05)'
    }
};

// Game state
let canvas, ctx;
let gameState = 'waiting'; // 'waiting', 'playing', 'gameOver'
let score = 0;
let foodEaten = 0;
let gameSpeed = GAME_CONFIG.INITIAL_SPEED;
let gameLoopId = null;
let lastUpdateTime = 0;

// Snake
let snake = [];
let direction = { x: 1, y: 0 };
let nextDirection = { x: 1, y: 0 };

// Food
let food = null;
let specialFood = null; // Appears at higher pet levels

// Grid dimensions
let gridWidth = 20;
let gridHeight = 20;
let cellSize = 20;

// Pet data (loaded from localStorage)
let petData = null;
let petLevel = 1;
let petEmoji = '🐾';
let petType = null;

// Touch controls
let touchStartX = 0;
let touchStartY = 0;
const SWIPE_THRESHOLD = 30;

// Particle effects (for high level pets)
let particles = [];

/**
 * Initialize the game
 */
function initGame() {
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');
    
    // Load pet data
    loadPetData();
    
    // Setup canvas
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    // Keyboard controls
    document.addEventListener('keydown', handleKeyDown);
    
    // Touch controls
    canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
    
    // Update start screen with pet info
    updateStartScreen();
    
    // Draw initial grid
    drawGrid();
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
    const petDisplayStart = document.getElementById('petDisplayStart');
    const levelBadgeStart = document.getElementById('levelBadgeStart');
    
    petDisplayStart.textContent = petEmoji;
    
    const levelNames = ['新手', '见习', '熟练', '专家', '大师'];
    const levelName = levelNames[petLevel - 1] || '新手';
    
    let levelFeatures = '';
    switch (petLevel) {
        case 1:
        case 2:
            levelFeatures = '基础游戏体验';
            break;
        case 3:
            levelFeatures = '彩色食物 + 音效';
            break;
        case 4:
            levelFeatures = '特效 + 速度加成';
            break;
        case 5:
            levelFeatures = '彩虹轨迹 + 奖励翻倍 🎆';
            break;
    }
    
    levelBadgeStart.innerHTML = `宠物等级 ${petLevel} - ${levelName}<br><small>${levelFeatures}</small>`;
}

/**
 * Resize canvas to fit screen
 */
function resizeCanvas() {
    const container = document.getElementById('gameContainer');
    const maxWidth = Math.min(600, window.innerWidth - 40);
    const maxHeight = Math.min(600, window.innerHeight - 150);
    
    // Calculate grid dimensions
    const cellCount = 20;
    cellSize = Math.floor(Math.min(maxWidth, maxHeight) / cellCount);
    
    canvas.width = cellSize * cellCount;
    canvas.height = cellSize * cellCount;
    
    gridWidth = cellCount;
    gridHeight = cellCount;
    
    if (gameState === 'waiting') {
        drawGrid();
    }
}

/**
 * Start the game
 */
function startGame() {
    document.getElementById('startScreen').classList.add('hidden');
    
    // Initialize snake in the center
    const centerX = Math.floor(gridWidth / 2);
    const centerY = Math.floor(gridHeight / 2);
    snake = [
        { x: centerX, y: centerY },
        { x: centerX - 1, y: centerY },
        { x: centerX - 2, y: centerY }
    ];
    
    direction = { x: 1, y: 0 };
    nextDirection = { x: 1, y: 0 };
    
    score = 0;
    foodEaten = 0;
    gameSpeed = GAME_CONFIG.INITIAL_SPEED;
    particles = [];
    
    updateScore();
    
    // Spawn initial food
    spawnFood();
    
    // Start game loop
    gameState = 'playing';
    lastUpdateTime = Date.now();
    gameLoop();
}

/**
 * Main game loop
 */
function gameLoop() {
    if (gameState !== 'playing') return;
    
    const currentTime = Date.now();
    const deltaTime = currentTime - lastUpdateTime;
    
    if (deltaTime >= gameSpeed) {
        lastUpdateTime = currentTime;
        update();
    }
    
    draw();
    
    gameLoopId = requestAnimationFrame(gameLoop);
}

/**
 * Update game state
 */
function update() {
    // Update direction
    direction = { ...nextDirection };
    
    // Calculate new head position
    const head = { ...snake[0] };
    head.x += direction.x;
    head.y += direction.y;
    
    // Check wall collision
    if (head.x < 0 || head.x >= gridWidth || head.y < 0 || head.y >= gridHeight) {
        gameOver();
        return;
    }
    
    // Check self collision
    for (let i = 0; i < snake.length; i++) {
        if (head.x === snake[i].x && head.y === snake[i].y) {
            gameOver();
            return;
        }
    }
    
    // Add new head
    snake.unshift(head);
    
    // Check food collision
    let foodCollected = false;
    if (food && head.x === food.x && head.y === food.y) {
        foodCollected = true;
        score += GAME_CONFIG.BASE_FOOD_SCORE;
        foodEaten++;
        
        // Speed up slightly (pet level 4+ gets bonus)
        const speedBonus = petLevel >= 4 ? 2 : 0;
        gameSpeed = Math.max(GAME_CONFIG.MIN_SPEED, gameSpeed - GAME_CONFIG.SPEED_INCREMENT - speedBonus);
        
        spawnFood();
        updateScore();
        
        // Create particles for high level pets
        if (petLevel >= 4) {
            createParticles(head.x, head.y, 8);
        }
    } else if (specialFood && head.x === specialFood.x && head.y === specialFood.y) {
        foodCollected = true;
        score += GAME_CONFIG.SPECIAL_FOOD_SCORE;
        foodEaten++;
        
        specialFood = null;
        updateScore();
        
        // Create extra particles
        if (petLevel >= 4) {
            createParticles(head.x, head.y, 16);
        }
    } else {
        // Remove tail if no food collected
        snake.pop();
    }
    
    // Spawn special food for level 3+ pets (10% chance)
    if (petLevel >= 3 && !specialFood && Math.random() < 0.1) {
        spawnSpecialFood();
    }
    
    // Update particles
    if (petLevel >= 4) {
        updateParticles();
    }
}

/**
 * Draw everything
 */
function draw() {
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw background
    drawGrid();
    
    // Draw particles (behind snake for level 4+)
    if (petLevel >= 4) {
        drawParticles();
    }
    
    // Draw food
    if (food) {
        drawFood(food, false);
    }
    if (specialFood) {
        drawFood(specialFood, true);
    }
    
    // Draw snake
    drawSnake();
    
    // Draw rainbow trail for level 5
    if (petLevel >= 5) {
        drawRainbowTrail();
    }
}

/**
 * Draw grid background
 */
function drawGrid() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw grid lines
    ctx.strokeStyle = GAME_CONFIG.COLORS.GRID_LINE;
    ctx.lineWidth = 1;
    
    for (let x = 0; x <= gridWidth; x++) {
        ctx.beginPath();
        ctx.moveTo(x * cellSize, 0);
        ctx.lineTo(x * cellSize, canvas.height);
        ctx.stroke();
    }
    
    for (let y = 0; y <= gridHeight; y++) {
        ctx.beginPath();
        ctx.moveTo(0, y * cellSize);
        ctx.lineTo(canvas.width, y * cellSize);
        ctx.stroke();
    }
}

/**
 * Draw snake
 */
function drawSnake() {
    snake.forEach((segment, index) => {
        const x = segment.x * cellSize;
        const y = segment.y * cellSize;
        
        if (index === 0) {
            // Draw pet emoji as head
            ctx.font = `${cellSize - 4}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(petEmoji, x + cellSize / 2, y + cellSize / 2);
        } else {
            // Draw body
            const gradient = ctx.createLinearGradient(x, y, x + cellSize, y + cellSize);
            gradient.addColorStop(0, GAME_CONFIG.COLORS.SNAKE_BODY);
            gradient.addColorStop(1, GAME_CONFIG.COLORS.SNAKE_BODY_DARK);
            
            ctx.fillStyle = gradient;
            ctx.fillRect(x + 1, y + 1, cellSize - 2, cellSize - 2);
            
            // Add glow effect for level 3+
            if (petLevel >= 3) {
                ctx.shadowColor = GAME_CONFIG.COLORS.SNAKE_BODY;
                ctx.shadowBlur = 10;
                ctx.fillRect(x + 1, y + 1, cellSize - 2, cellSize - 2);
                ctx.shadowBlur = 0;
            }
        }
    });
}

/**
 * Draw rainbow trail for level 5 pets
 */
function drawRainbowTrail() {
    const colors = ['#ff0000', '#ff7f00', '#ffff00', '#00ff00', '#0000ff', '#4b0082', '#9400d3'];
    
    snake.forEach((segment, index) => {
        if (index === 0) return; // Skip head
        
        const x = segment.x * cellSize;
        const y = segment.y * cellSize;
        const colorIndex = index % colors.length;
        
        ctx.fillStyle = colors[colorIndex] + '40'; // Semi-transparent
        ctx.fillRect(x + 2, y + 2, cellSize - 4, cellSize - 4);
    });
}

/**
 * Draw food
 */
function drawFood(foodObj, isSpecial) {
    const x = foodObj.x * cellSize;
    const y = foodObj.y * cellSize;
    
    if (isSpecial) {
        // Special food (golden apple for level 3+)
        ctx.font = `${cellSize - 4}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🌟', x + cellSize / 2, y + cellSize / 2);
        
        // Add glow
        ctx.shadowColor = GAME_CONFIG.COLORS.FOOD_SPECIAL;
        ctx.shadowBlur = 15;
        ctx.fillText('🌟', x + cellSize / 2, y + cellSize / 2);
        ctx.shadowBlur = 0;
    } else {
        // Normal food
        ctx.font = `${cellSize - 4}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🍎', x + cellSize / 2, y + cellSize / 2);
    }
}

/**
 * Spawn normal food
 */
function spawnFood() {
    let newFood;
    let isValid = false;
    
    while (!isValid) {
        newFood = {
            x: Math.floor(Math.random() * gridWidth),
            y: Math.floor(Math.random() * gridHeight)
        };
        
        // Check if position is not occupied by snake or special food
        isValid = true;
        for (const segment of snake) {
            if (segment.x === newFood.x && segment.y === newFood.y) {
                isValid = false;
                break;
            }
        }
        if (specialFood && specialFood.x === newFood.x && specialFood.y === newFood.y) {
            isValid = false;
        }
    }
    
    food = newFood;
}

/**
 * Spawn special food (level 3+)
 */
function spawnSpecialFood() {
    let newFood;
    let isValid = false;
    
    while (!isValid) {
        newFood = {
            x: Math.floor(Math.random() * gridWidth),
            y: Math.floor(Math.random() * gridHeight)
        };
        
        // Check if position is not occupied
        isValid = true;
        for (const segment of snake) {
            if (segment.x === newFood.x && segment.y === newFood.y) {
                isValid = false;
                break;
            }
        }
        if (food && food.x === newFood.x && food.y === newFood.y) {
            isValid = false;
        }
    }
    
    specialFood = newFood;
}

/**
 * Create particle effects (level 4+)
 */
function createParticles(gridX, gridY, count) {
    const x = gridX * cellSize + cellSize / 2;
    const y = gridY * cellSize + cellSize / 2;
    
    for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i) / count;
        particles.push({
            x: x,
            y: y,
            vx: Math.cos(angle) * 2,
            vy: Math.sin(angle) * 2,
            life: 30,
            color: `hsl(${Math.random() * 360}, 100%, 50%)`
        });
    }
}

/**
 * Update particles
 */
function updateParticles() {
    particles = particles.filter(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.life--;
        return p.life > 0;
    });
}

/**
 * Draw particles
 */
function drawParticles() {
    particles.forEach(p => {
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.life / 30;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
        ctx.fill();
    });
    ctx.globalAlpha = 1;
}

/**
 * Update score display
 */
function updateScore() {
    document.getElementById('scoreDisplay').textContent = score;
    document.getElementById('lengthDisplay').textContent = snake.length;
}

/**
 * Handle keyboard input
 */
function handleKeyDown(e) {
    if (gameState !== 'playing') return;
    
    const key = e.key;
    
    // Prevent changing direction to opposite
    if ((key === 'ArrowUp' || key === 'w' || key === 'W') && direction.y === 0) {
        nextDirection = { x: 0, y: -1 };
        e.preventDefault();
    } else if ((key === 'ArrowDown' || key === 's' || key === 'S') && direction.y === 0) {
        nextDirection = { x: 0, y: 1 };
        e.preventDefault();
    } else if ((key === 'ArrowLeft' || key === 'a' || key === 'A') && direction.x === 0) {
        nextDirection = { x: -1, y: 0 };
        e.preventDefault();
    } else if ((key === 'ArrowRight' || key === 'd' || key === 'D') && direction.x === 0) {
        nextDirection = { x: 1, y: 0 };
        e.preventDefault();
    }
}

/**
 * Handle touch start
 */
function handleTouchStart(e) {
    e.preventDefault();
    const touch = e.touches[0];
    touchStartX = touch.clientX;
    touchStartY = touch.clientY;
}

/**
 * Handle touch move (swipe detection)
 */
function handleTouchMove(e) {
    e.preventDefault();
    
    if (gameState !== 'playing') return;
    
    const touch = e.touches[0];
    const deltaX = touch.clientX - touchStartX;
    const deltaY = touch.clientY - touchStartY;
    
    if (Math.abs(deltaX) < SWIPE_THRESHOLD && Math.abs(deltaY) < SWIPE_THRESHOLD) {
        return;
    }
    
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
        // Horizontal swipe
        if (deltaX > 0 && direction.x === 0) {
            nextDirection = { x: 1, y: 0 };
        } else if (deltaX < 0 && direction.x === 0) {
            nextDirection = { x: -1, y: 0 };
        }
    } else {
        // Vertical swipe
        if (deltaY > 0 && direction.y === 0) {
            nextDirection = { x: 0, y: 1 };
        } else if (deltaY < 0 && direction.y === 0) {
            nextDirection = { x: 0, y: -1 };
        }
    }
    
    // Reset touch start position
    touchStartX = touch.clientX;
    touchStartY = touch.clientY;
}

/**
 * Game over
 */
function gameOver() {
    gameState = 'gameOver';
    
    if (gameLoopId) {
        cancelAnimationFrame(gameLoopId);
        gameLoopId = null;
    }
    
    // Calculate XP reward (score / 10, min 10, max 30)
    // Level 5 pets get double XP
    const baseXP = Math.floor(score / 10);
    const multiplier = petLevel >= 5 ? 2 : 1;
    const xpEarned = Math.max(10, Math.min(30, baseXP)) * multiplier;
    
    // Record game completion (if pet exists)
    if (petData && petData.adopted) {
        recordGameCompletion(score, xpEarned);
    }
    
    // Update game over screen
    document.getElementById('petDisplayEnd').textContent = petEmoji;
    document.getElementById('finalScore').textContent = score;
    document.getElementById('finalLength').textContent = snake.length;
    document.getElementById('foodEaten').textContent = foodEaten;
    document.getElementById('xpReward').textContent = `+${xpEarned} XP`;
    
    document.getElementById('gameOverScreen').classList.remove('hidden');
}

/**
 * Record game completion to virtual pet system
 */
function recordGameCompletion(finalScore, xpEarned) {
    try {
        // Get current points from achievement system
        const pointsData = localStorage.getItem('achievementPoints');
        let currentPoints = pointsData ? parseInt(pointsData) : 0;
        
        // Add XP reward
        currentPoints += xpEarned;
        localStorage.setItem('achievementPoints', currentPoints.toString());
        
        // Update pet data
        if (petData.pet) {
            petData.pet.totalGamesCompleted = (petData.pet.totalGamesCompleted || 0) + 1;
            localStorage.setItem('virtualPetData', JSON.stringify(petData));
        }
        
        console.log(`Snake game completed! Score: ${finalScore}, XP: ${xpEarned}`);
    } catch (error) {
        console.error('Failed to record game completion:', error);
    }
}

/**
 * Restart game
 */
function restartGame() {
    document.getElementById('gameOverScreen').classList.add('hidden');
    startGame();
}

// Initialize game when page loads
window.addEventListener('load', initGame);
