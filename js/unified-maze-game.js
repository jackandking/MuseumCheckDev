/**
 * Unified Maze Game - 统一迷宫游戏
 * 继承自BaseGame，提供迷宫冒险功能
 */

class UnifiedMazeGame extends BaseGame {
    constructor(config = {}) {
        super('maze', {
            autoCloseDelay: 3000,
            showResetButton: true,
            enableKeyboard: true,
            enableTouchControls: true,
            ...config
        });
        
        // Maze-specific properties
        this.mazeSize = 9;
        this.cellSize = 30;
        this.mazeGrid = [];
        this.playerPos = { x: 1, y: 1 };
        this.exitPos = { x: 7, y: 7 };
        this.steps = 0;
        this.fogOfWarEnabled = false;
        this.visibleRadius = 2;
        
        // Canvas and rendering
        this.canvas = null;
        this.ctx = null;
        
        // Constants
        this.WALL = 1;
        this.PATH = 0;
        this.PLAYER = 2;
        this.EXIT = 3;
        
        // Maze size configurations
        this.EASY_MAZE_SIZE = 9;
        this.HARD_MAZE_SIZE = 15;
        
        console.log(`[${this.gameType}] UnifiedMazeGame initialized`);
    }
    
    /**
     * Game-specific initialization
     */
    async onInit(taskIndex, options) {
        console.log(`[${this.gameType}] Initializing maze game with taskIndex: ${taskIndex}`);
        
        // Determine maze difficulty based on task index
        const difficulty = this.determineMazeSize(taskIndex);
        this.mazeSize = difficulty.size;
        this.cellSize = difficulty.cellSize;
        this.fogOfWarEnabled = difficulty.fogEnabled;
        this.visibleRadius = difficulty.fogRadius;
        
        // Set exit position based on maze size
        this.exitPos = { 
            x: this.mazeSize - 2, 
            y: this.mazeSize - 2 
        };
        
        console.log(`[${this.gameType}] Maze config: size=${this.mazeSize}x${this.mazeSize}, cellSize=${this.cellSize}, fog=${this.fogOfWarEnabled}`);
        
        // Find maze-specific elements
        this.canvas = document.getElementById('mazeCanvas');
        this.stepsDisplay = document.getElementById('mazeSteps');
        this.completeMessage = document.getElementById('mazeCompleteMessage');
        
        // Update title with pet data
        this.updateTitle();
        
        console.log(`[${this.gameType}] DOM elements found:`, {
            canvas: !!this.canvas,
            stepsDisplay: !!this.stepsDisplay,
            completeMessage: !!this.completeMessage
        });
        
        // Initialize maze
        this.initializeMaze();
    }
    
    /**
     * Game-specific start logic
     */
    onStart() {
        console.log(`[${this.gameType}] Maze game started`);
        
        // Reset steps
        this.steps = 0;
        this.updateStepsDisplay();
        
        // Setup controls
        this.setupControls();
        
        // Optimize UI using UnifiedGameUI
        this.optimizeUI();
        
        // Render initial maze
        this.renderMaze();
        
        // Listen for viewport changes
        this.setupViewportListener();
    }
    
    /**
     * Optimize game UI using UnifiedGameUI
     */
    optimizeUI() {
        if (typeof window !== 'undefined' && window.UnifiedGameUI) {
            const ui = window.UnifiedGameUI;
            
            // Optimize game container
            const size = ui.optimizeGameUI(
                this.gameType,
                '.maze-container',
                '.maze-title',
                '.maze-buttons'
            );
            
            // Apply maze-specific optimizations
            this.applyMazeOptimizations(size);
            
            console.log(`[${this.gameType}] UI optimized: ${size.width}x${size.height}`);
        } else {
            console.warn(`[${this.gameType}] UnifiedGameUI not available, using fallback sizing`);
            this.applyFallbackSizing();
        }
    }
    
    /**
     * Apply maze-specific optimizations
     */
    applyMazeOptimizations(size) {
        // Update maze size based on available space
        const optimalMazeSize = Math.floor(size.width / 15); // 15x15 maze max
        if (optimalMazeSize >= 18 && this.mazeSize === 15) {
            this.cellSize = Math.min(optimalMazeSize, 24);
        } else if (optimalMazeSize >= 30 && this.mazeSize === 9) {
            this.cellSize = Math.min(optimalMazeSize, 40);
        }
        
        // Update visible radius for fog of war
        if (this.fogOfWarEnabled) {
            this.visibleRadius = Math.max(2, Math.floor(this.cellSize / 10));
        }
        
        console.log(`[${this.gameType}] Maze optimizations: cellSize=${this.cellSize}, visibleRadius=${this.visibleRadius}`);
    }
    
    /**
     * Fallback sizing when UnifiedGameUI is not available
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
            maxCanvasSize = Math.min(maxCanvasSize, 400);
        } else {
            maxCanvasSize = Math.min(maxCanvasSize, 500);
        }
        
        // Update cell size based on available space
        if (this.mazeSize === 15) {
            this.cellSize = Math.floor(maxCanvasSize / 15);
        } else {
            this.cellSize = Math.floor(maxCanvasSize / 9);
        }
        
        console.log(`[${this.gameType}] Fallback sizing: canvas=${maxCanvasSize}px, cellSize=${this.cellSize}px`);
    }
    
    /**
     * Setup viewport change listener
     */
    setupViewportListener() {
        this.viewportHandler = () => {
            console.log(`[${this.gameType}] Viewport changed, re-optimizing UI`);
            this.optimizeUI();
            this.renderMaze(); // Re-render with new size
        };
        
        this.addTrackedEventListener(window, 'gameViewportResize', this.viewportHandler);
    }
    
    /**
     * Game-specific reset logic
     */
    onReset() {
        console.log(`[${this.gameType}] Resetting maze game...`);
        
        // Reset steps
        this.steps = 0;
        this.updateStepsDisplay();
        
        // Hide completion message
        this.hideCompletionMessage();
        
        // Regenerate maze
        this.initializeMaze();
        
        console.log(`[${this.gameType}] Maze reset completed`);
    }
    
    /**
     * Game-specific cleanup
     */
    onCleanup() {
        console.log(`[${this.gameType}] Cleaning up maze game...`);
        
        // Remove viewport listener
        if (this.viewportHandler) {
            window.removeEventListener('gameViewportResize', this.viewportHandler);
        }
        
        // Remove touch controls
        this.removeTouchControls();
    }
    
    /**
     * Determine maze size and difficulty based on task index
     */
    determineMazeSize(taskIndex) {
        if (taskIndex === 0) {
            return { 
                size: this.EASY_MAZE_SIZE, 
                cellSize: 30, 
                fogEnabled: false, 
                fogRadius: 3 
            };
        } else {
            return { 
                size: this.HARD_MAZE_SIZE, 
                cellSize: 18, 
                fogEnabled: true, 
                fogRadius: 2 
            };
        }
    }
    
    /**
     * Initialize maze with new generation
     */
    initializeMaze() {
        console.log(`[${this.gameType}] Initializing ${this.mazeSize}x${this.mazeSize} maze`);
        
        // Reset player position
        this.playerPos = { x: 1, y: 1 };
        
        // Generate new maze
        this.generateMaze();
        
        console.log(`[${this.gameType}] Maze initialized: player at (${this.playerPos.x}, ${this.playerPos.y}), exit at (${this.exitPos.x}, ${this.exitPos.y})`);
    }
    
    /**
     * Generate a maze using recursive backtracking algorithm
     */
    generateMaze() {
        // Initialize maze with walls
        this.mazeGrid = Array(this.mazeSize).fill(null).map(() => Array(this.mazeSize).fill(this.WALL));
        
        // Start from position (1, 1)
        const stack = [];
        const startX = 1;
        const startY = 1;
        
        this.mazeGrid[startY][startX] = this.PATH;
        stack.push({ x: startX, y: startY });
        
        while (stack.length > 0) {
            const current = stack[stack.length - 1];
            const neighbors = this.getUnvisitedNeighbors(current.x, current.y);
            
            if (neighbors.length > 0) {
                const next = neighbors[Math.floor(Math.random() * neighbors.length)];
                this.removeWall(current, next);
                this.mazeGrid[next.y][next.x] = this.PATH;
                stack.push(next);
            } else {
                stack.pop();
            }
        }
        
        // Ensure exit is accessible
        this.mazeGrid[this.exitPos.y][this.exitPos.x] = this.PATH;
        
        console.log(`[${this.gameType}] Maze generation completed`);
    }
    
    /**
     * Get unvisited neighbors for maze generation
     */
    getUnvisitedNeighbors(x, y) {
        const neighbors = [];
        const directions = [
            { dx: 0, dy: -2 }, // Up
            { dx: 2, dy: 0 },  // Right
            { dx: 0, dy: 2 },  // Down
            { dx: -2, dy: 0 }  // Left
        ];
        
        for (const dir of directions) {
            const nx = x + dir.dx;
            const ny = y + dir.dy;
            
            if (nx > 0 && nx < this.mazeSize - 1 && 
                ny > 0 && ny < this.mazeSize - 1 && 
                this.mazeGrid[ny][nx] === this.WALL) {
                neighbors.push({ x: nx, y: ny });
            }
        }
        
        return neighbors;
    }
    
    /**
     * Remove wall between two cells
     */
    removeWall(current, next) {
        const wallX = current.x + (next.x - current.x) / 2;
        const wallY = current.y + (next.y - current.y) / 2;
        this.mazeGrid[wallY][wallX] = this.PATH;
    }
    
    /**
     * Render the maze on canvas
     */
    renderMaze() {
        if (!this.canvas) {
            console.warn(`[${this.gameType}] Canvas not found for rendering`);
            return;
        }
        
        this.ctx = this.canvas.getContext('2d');
        const canvasSize = this.mazeSize * this.cellSize;
        
        this.canvas.width = canvasSize;
        this.canvas.height = canvasSize;
        
        // Clear canvas
        this.ctx.fillStyle = '#2c3e50';
        this.ctx.fillRect(0, 0, canvasSize, canvasSize);
        
        // Render maze cells
        for (let y = 0; y < this.mazeSize; y++) {
            for (let x = 0; x < this.mazeSize; x++) {
                this.renderCell(x, y);
            }
        }
        
        console.log(`[${this.gameType}] Maze rendered: ${this.mazeSize}x${this.mazeSize}`);
    }
    
    /**
     * Render a single cell
     */
    renderCell(x, y) {
        const cellX = x * this.cellSize;
        const cellY = y * this.cellSize;
        
        // Check if cell is visible (fog of war)
        if (this.fogOfWarEnabled && !this.isCellVisible(x, y)) {
            this.ctx.fillStyle = '#34495e';
            this.ctx.fillRect(cellX, cellY, this.cellSize, this.cellSize);
            return;
        }
        
        const cellType = this.mazeGrid[y][x];
        
        if (cellType === this.WALL) {
            // Wall
            this.ctx.fillStyle = '#34495e';
            this.ctx.fillRect(cellX, cellY, this.cellSize, this.cellSize);
        } else if (cellType === this.PATH) {
            // Path
            this.ctx.fillStyle = '#ecf0f1';
            this.ctx.fillRect(cellX, cellY, this.cellSize, this.cellSize);
        }
        
        // Draw player
        if (x === this.playerPos.x && y === this.playerPos.y) {
            this.ctx.fillStyle = '#3498db';
            this.ctx.beginPath();
            this.ctx.arc(
                cellX + this.cellSize / 2,
                cellY + this.cellSize / 2,
                this.cellSize / 3,
                0,
                Math.PI * 2
            );
            this.ctx.fill();
        }
        
        // Draw exit
        if (x === this.exitPos.x && y === this.exitPos.y) {
            this.ctx.fillStyle = '#27ae60';
            this.ctx.fillRect(
                cellX + this.cellSize / 4,
                cellY + this.cellSize / 4,
                this.cellSize / 2,
                this.cellSize / 2
            );
        }
    }
    
    /**
     * Check if cell is visible (fog of war)
     */
    isCellVisible(x, y) {
        const distance = Math.abs(x - this.playerPos.x) + Math.abs(y - this.playerPos.y);
        return distance <= this.visibleRadius;
    }
    
    /**
     * Setup touch controls for mobile (keyboard handled by base game)
     */
    setupControls() {
        // Touch controls for mobile
        this.setupTouchControls();
    }
    
    /**
     * Handle keyboard input
     */
    handleKeydownInput(e) {
        if (this.state !== 'playing' || !this.overlay || !this.overlay.classList.contains('show')) {
            return;
        }
        
        let moved = false;
        const newPos = { ...this.playerPos };
        
        switch (e.key) {
            case 'ArrowUp':
            case 'w':
            case 'W':
                newPos.y--;
                moved = true;
                break;
            case 'ArrowDown':
            case 's':
            case 'S':
                newPos.y++;
                moved = true;
                break;
            case 'ArrowLeft':
            case 'a':
            case 'A':
                newPos.x--;
                moved = true;
                break;
            case 'ArrowRight':
            case 'd':
            case 'D':
                newPos.x++;
                moved = true;
                break;
        }
        
        if (moved && this.canMoveTo(newPos.x, newPos.y)) {
            e.preventDefault();
            this.movePlayer(newPos.x, newPos.y);
        }
    }
    
    /**
     * Handle game-specific keyboard input (called by BaseGame)
     * @param {KeyboardEvent} event - Keyboard event
     */
    handleKeyboard(event) {
        this.handleKeydownInput(event);
    }
    
    /**
     * Setup touch controls for mobile
     */
    setupTouchControls() {
        if (!this.canvas) return;
        
        let touchStartX = 0;
        let touchStartY = 0;
        
        this.canvas.addEventListener('touchstart', (e) => {
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
        });
        
        this.canvas.addEventListener('touchend', (e) => {
            const touchEndX = e.changedTouches[0].clientX;
            const touchEndY = e.changedTouches[0].clientY;
            
            const dx = touchEndX - touchStartX;
            const dy = touchEndY - touchStartY;
            
            const newPos = { ...this.playerPos };
            
            if (Math.abs(dx) > Math.abs(dy)) {
                // Horizontal movement
                if (dx > 30) {
                    newPos.x++; // Right
                } else if (dx < -30) {
                    newPos.x--; // Left
                }
            } else {
                // Vertical movement
                if (dy > 30) {
                    newPos.y++; // Down
                } else if (dy < -30) {
                    newPos.y--; // Up
                }
            }
            
            if (this.canMoveTo(newPos.x, newPos.y)) {
                this.movePlayer(newPos.x, newPos.y);
            }
        });
    }
    
    /**
     * Remove touch controls
     */
    removeTouchControls() {
        if (this.canvas) {
            // Clone and replace canvas to remove all event listeners
            const newCanvas = this.canvas.cloneNode(true);
            this.canvas.parentNode.replaceChild(newCanvas, this.canvas);
            this.canvas = newCanvas;
        }
    }
    
    /**
     * Check if player can move to position
     */
    canMoveTo(x, y) {
        return x >= 0 && x < this.mazeSize && 
               y >= 0 && y < this.mazeSize && 
               this.mazeGrid[y][x] !== this.WALL;
    }
    
    /**
     * Move player to new position
     */
    movePlayer(x, y) {
        this.playerPos = { x, y };
        this.steps++;
        this.updateStepsDisplay();
        
        // Re-render maze
        this.renderMaze();
        
        // Check if reached exit
        if (x === this.exitPos.x && y === this.exitPos.y) {
            this.completeMaze();
        }
        
        console.log(`[${this.gameType}] Player moved to (${x}, ${y}), steps: ${this.steps}`);
    }
    
    /**
     * Update steps display
     */
    updateStepsDisplay() {
        if (this.stepsDisplay) {
            this.stepsDisplay.textContent = this.steps.toString();
        }
    }
    
    /**
     * Update maze title with pet data
     */
    updateTitle() {
        try {
            const saved = localStorage.getItem('virtualPetData');
            if (saved) {
                const petData = JSON.parse(saved);
                if (petData.adopted && petData.pet) {
                    const titleEl = document.querySelector('.maze-title');
                    if (titleEl) {
                        const baseTitle = this.fogOfWarEnabled ? '迷宫冒险（迷雾模式）' : '迷宫冒险（简单）';
                        titleEl.textContent = `${petData.pet.emoji} 🏃 ${baseTitle}`;
                    }
                }
            }
        } catch (error) {
            console.warn(`[${this.gameType}] Failed to load pet data for title:`, error);
        }
    }
    
    /**
     * Complete the maze game
     */
    completeMaze() {
        console.log(`[${this.gameType}] Maze completed in ${this.steps} steps`);
        
        // Show completion message
        this.showCustomCompletionMessage();
        
        // Complete the game with result
        this.complete({
            steps: this.steps,
            mazeSize: this.mazeSize,
            fogOfWar: this.fogOfWarEnabled
        });
    }
    
    /**
     * Game-specific completion logic
     */
    onComplete(result, xpAwarded) {
        console.log(`[${this.gameType}] Maze completed with ${result.steps} steps, awarded ${xpAwarded} XP`);
        
        // Show pet with completion message
        try {
            if (typeof VirtualPet !== 'undefined' && VirtualPet.showPetWithMessage) {
                VirtualPet.showPetWithMessage(`太棒了！用了${result.steps}步完成迷宫！获得${xpAwarded}XP！`, 3000);
            } else {
                console.log(`[${this.gameType}] VirtualPet not available, skipping pet message`);
            }
        } catch (error) {
            console.warn(`[${this.gameType}] Failed to show pet message:`, error);
        }
        
        // Play completion sound
        try {
            if (typeof playFireworkSound === 'function') {
                playFireworkSound();
            }
        } catch (error) {
            console.warn(`[${this.gameType}] Failed to play completion sound:`, error);
        }
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UnifiedMazeGame;
} else if (typeof window !== 'undefined') {
    window.UnifiedMazeGame = UnifiedMazeGame;
}
