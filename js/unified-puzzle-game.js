/**
 * Unified Puzzle Game Implementation
 * 统一拼图游戏实现
 * 
 * Migrated from the original function-based puzzle game to the new BaseGame architecture
 * Maintains all existing functionality while providing better state management
 */

class UnifiedPuzzleGame extends BaseGame {
    constructor(gameType = 'puzzle', config = {}) {
        super(gameType, {
            autoCloseDelay: 2000,
            showResetButton: true,
            enableKeyboard: true,
            escapeToClose: true,
            ...config
        });
        
        // Puzzle-specific state
        this.puzzleSize = 2; // 2x2 for first task, 3x3 for others
        this.tiles = [];
        this.emptyPos = null;
        this.moves = 0;
        this.imageUrl = null;
        this.imageLoaded = false;
        
        // DOM elements
        this.grid = null;
        this.movesDisplay = null;
        this.referenceImg = null;
        this.referenceBtn = null;
        this.referenceVisible = false;
        
        // Touch handling
        this.touchStartX = null;
        this.touchStartY = null;
        this.touchThreshold = 30;
    }
    
    getDefaultConfig() {
        return {
            ...super.getDefaultConfig(),
            showReferenceButton: true,
            enableSwipeControls: true,
            moveSoundEnabled: true
        };
    }
    
    async onInit(taskIndex, options) {
        this.taskIndex = taskIndex;
        this.puzzleSize = taskIndex === 0 ? 2 : 3;
        
        // Get image URL from options or fallback to global variable
        this.imageUrl = options.imageUrl;
        if (!this.imageUrl && typeof puzzleImageUrl !== 'undefined') {
            this.imageUrl = puzzleImageUrl;
        }
        
        // Add comprehensive debug logging
        console.log(`[${this.gameType}] onInit called with:`, {
            taskIndex,
            puzzleSize: this.puzzleSize,
            imageUrl: this.imageUrl ? this.imageUrl.substring(0, 50) + '...' : 'undefined',
            optionsKeys: Object.keys(options),
            hasGlobalPuzzleImageUrl: typeof puzzleImageUrl !== 'undefined'
        });
        
        if (!this.imageUrl) {
            console.warn(`[${this.gameType}] No image URL provided, using fallback`);
            // Use a simple colored SVG as fallback
            this.imageUrl = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjgwIiBoZWlnaHQ9IjI4MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjgwIiBoZWlnaHQ9IjI4MCIgZmlsbD0iIzAwN2JmZiIvPjx0ZXh0IHg9IjE0MCIgeT0iMTQwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LXNpemU9IjI0IiBmaWxsPSJ3aGl0ZSI+6L+Z5piv5bqV55So5o6l5Y+jPC90ZXh0Pjwvc3ZnPg==';
            console.log(`[${this.gameType}] Using fallback image: ${this.imageUrl.substring(0, 50)}...`);
        }
        
        // Find puzzle-specific elements
        this.grid = document.getElementById('puzzleGrid');
        this.movesDisplay = document.getElementById('puzzleMoves');
        this.referenceImg = document.getElementById('puzzleReferenceImg');
        this.referenceBtn = document.getElementById('toggleReference');
        
        // Update grid CSS class for 3x3 mode
        if (this.grid) {
            this.grid.classList.remove('size-3');
            if (this.puzzleSize === 3) {
                this.grid.classList.add('size-3');
                console.log(`[${this.gameType}] Added size-3 class for 3x3 puzzle`);
            }
        }
        
        console.log(`[${this.gameType}] DOM elements found:`, {
            grid: !!this.grid,
            movesDisplay: !!this.movesDisplay,
            referenceImg: !!this.referenceImg,
            referenceBtn: !!this.referenceBtn,
            gridClasses: this.grid ? this.grid.className : 'N/A'
        });
        
        if (!this.grid || !this.movesDisplay) {
            throw new Error('Required puzzle elements not found');
        }
        
        // Load image
        await this.loadImage();
        
        // Initialize puzzle
        this.initializePuzzle();
        
        // Setup reference image
        this.setupReferenceImage();
        
        console.log(`[${this.gameType}] Initialized ${this.puzzleSize}x${this.puzzleSize} puzzle successfully`);
    }
    
    /**
     * Game-specific start logic
     */
    onStart() {
        console.log(`[${this.gameType}] Game started`);
        
        // Re-bind reset button to use new system
        const resetBtn = document.getElementById('resetPuzzle');
        if (resetBtn) {
            // Remove any existing handlers
            resetBtn.onclick = null;
            resetBtn.replaceWith(resetBtn.cloneNode(true));
            const newResetBtn = document.getElementById('resetPuzzle');
            
            // Bind to new system's reset method
            newResetBtn.onclick = () => {
                console.log(`[${this.gameType}] Reset button clicked`);
                this.reset();
            };
            
            console.log(`[${this.gameType}] Reset button rebound to new system`);
        }
        
        // Optimize UI using UnifiedGameUI
        this.optimizeUI();
        
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
                '.puzzle-container',
                '.puzzle-title',
                '.puzzle-buttons'
            );
            
            // Apply puzzle-specific optimizations
            this.applyPuzzleOptimizations(size);
            
            console.log(`[${this.gameType}] UI optimized: ${size.width}x${size.height}`);
        } else {
            console.warn(`[${this.gameType}] UnifiedGameUI not available, using fallback sizing`);
            this.applyFallbackSizing();
        }
    }
    
    /**
     * Apply puzzle-specific optimizations
     */
    applyPuzzleOptimizations(size) {
        // Update grid size based on available space
        if (this.puzzleSize === 3) {
            // 3x3 puzzle can use more space
            const optimalGridSize = Math.min(size.width, 400);
            this.grid.style.width = `${optimalGridSize}px`;
            this.grid.style.height = `${optimalGridSize}px`;
            
            // Update tile size
            const tileSize = Math.floor(optimalGridSize / 3);
            const tiles = this.grid.querySelectorAll('.puzzle-tile');
            tiles.forEach(tile => {
                tile.style.width = `${tileSize}px`;
                tile.style.height = `${tileSize}px`;
            });
            
            console.log(`[${this.gameType}] 3x3 puzzle optimized: ${optimalGridSize}px, tile: ${tileSize}px`);
        } else {
            // 2x2 puzzle
            const optimalGridSize = Math.min(size.width, 320);
            this.grid.style.width = `${optimalGridSize}px`;
            this.grid.style.height = `${optimalGridSize}px`;
            
            // Update tile size
            const tileSize = Math.floor(optimalGridSize / 2);
            const tiles = this.grid.querySelectorAll('.puzzle-tile');
            tiles.forEach(tile => {
                tile.style.width = `${tileSize}px`;
                tile.style.height = `${tileSize}px`;
            });
            
            console.log(`[${this.gameType}] 2x2 puzzle optimized: ${optimalGridSize}px, tile: ${tileSize}px`);
        }
    }
    
    /**
     * Fallback sizing when UnifiedGameUI is not available
     */
    applyFallbackSizing() {
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        const isMobile = viewportWidth <= 768;
        const isSmallMobile = viewportWidth <= 360;
        
        let maxGridSize = Math.min(viewportWidth - 60, viewportHeight - 200);
        
        if (isSmallMobile) {
            maxGridSize = Math.min(maxGridSize, 280);
        } else if (isMobile) {
            maxGridSize = Math.min(maxGridSize, 320);
        } else {
            maxGridSize = Math.min(maxGridSize, 400);
        }
        
        // Apply size to grid
        this.grid.style.width = `${maxGridSize}px`;
        this.grid.style.height = `${maxGridSize}px`;
        
        console.log(`[${this.gameType}] Fallback sizing: grid=${maxGridSize}px`);
    }
    
    /**
     * Setup viewport change listener
     */
    setupViewportListener() {
        this.viewportHandler = (event) => {
            console.log(`[${this.gameType}] Viewport changed, re-optimizing UI`);
            this.optimizeUI();
            this.renderPuzzle(); // Re-render with new size
        };
        
        window.addEventListener('gameViewportResize', this.viewportHandler);
    }
    
    /**
     * Reset the puzzle for replay
     */
    onReset() {
        console.log(`[${this.gameType}] Resetting puzzle...`);
        
        // Reset moves counter
        this.moves = 0;
        this.updateMovesDisplay();
        
        // Hide completion message if visible
        if (this.completeMessage) {
            this.completeMessage.classList.remove('show');
        }
        
        // Check if image is still loaded, reload if necessary
        if (!this.imageLoaded && this.imageUrl) {
            console.log(`[${this.gameType}] Image not loaded, reloading...`);
            this.loadImage().then(() => {
                // After image loads, completely reinitialize
                this.initializePuzzle();
                console.log(`[${this.gameType}] Puzzle reset completed (with image reload)`);
            }).catch(error => {
                console.error(`[${this.gameType}] Failed to reload image on reset:`, error);
                // Even if image fails, still try to reinitialize
                this.initializePuzzle();
            });
        } else {
            // Image is loaded, completely reinitialize
            this.initializePuzzle();
            console.log(`[${this.gameType}] Puzzle reset completed (image already loaded)`);
        }
    }
    
    /**
     * Game-specific cleanup
     */
    onCleanup() {
        console.log(`[${this.gameType}] Cleaning up puzzle game...`);
        
        // Remove viewport listener
        if (this.viewportHandler) {
            window.removeEventListener('gameViewportResize', this.viewportHandler);
        }
    }
    
    async loadImage() {
        if (!this.imageUrl) {
            console.error(`[${this.gameType}] No image URL provided for puzzle`);
            throw new Error('No image URL provided for puzzle');
        }
        
        console.log(`[${this.gameType}] Loading image: ${this.imageUrl}`);
        
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                this.imageLoaded = true;
                console.log(`[${this.gameType}] Image loaded successfully: ${img.width}x${img.height}`);
                if (this.referenceImg) {
                    this.referenceImg.src = this.imageUrl;
                }
                resolve();
            };
            img.onerror = (error) => {
                console.error(`[${this.gameType}] Failed to load puzzle image: ${this.imageUrl}`, error);
                reject(new Error(`Failed to load puzzle image: ${this.imageUrl}`));
            };
            img.src = this.imageUrl;
        });
    }
    
    initializePuzzle() {
        const totalTiles = this.puzzleSize * this.puzzleSize;
        console.log(`[${this.gameType}] Initializing puzzle: totalTiles=${totalTiles}, puzzleSize=${this.puzzleSize}`);
        
        this.tiles = [];
        
        // Create tiles (0 to n-2 are image tiles, n-1 is empty)
        for (let i = 0; i < totalTiles - 1; i++) {
            this.tiles.push(i);
        }
        this.tiles.push(totalTiles - 1); // Empty tile
        this.emptyPos = totalTiles - 1;
        
        console.log(`[${this.gameType}] Initial tiles created: [${this.tiles.join(', ')}], emptyPos=${this.emptyPos}`);
        
        // Shuffle tiles (ensure solvable)
        this.shuffleTiles();
        
        // Render puzzle
        this.renderPuzzle();
        
        // Reset moves counter
        this.moves = 0;
        this.updateMovesDisplay();
        
        console.log(`[${this.gameType}] Puzzle initialization completed`);
    }
    
    shuffleTiles() {
        // Fisher-Yates shuffle with solvability check
        do {
            for (let i = this.tiles.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [this.tiles[i], this.tiles[j]] = [this.tiles[j], this.tiles[i]];
            }
            
            // Update empty position after shuffle
            this.emptyPos = this.tiles.indexOf(this.tiles.length - 1);
            
        } while (!this.isSolvable() || this.isAlreadySolved());
        
        console.log(`[${this.gameType}] Shuffle completed: tiles=[${this.tiles.join(', ')}], emptyPos=${this.emptyPos}`);
    }
    
    isSolvable() {
        let inversions = 0;
        const tiles = this.tiles.filter(tile => tile !== this.tiles.length - 1);
        
        for (let i = 0; i < tiles.length - 1; i++) {
            for (let j = i + 1; j < tiles.length; j++) {
                if (tiles[i] > tiles[j]) {
                    inversions++;
                }
            }
        }
        
        // For even-sized grids, row of empty tile matters
        if (this.puzzleSize % 2 === 0) {
            const emptyRow = Math.floor(this.emptyPos / this.puzzleSize);
            return (inversions + emptyRow) % 2 === 1;
        }
        
        return inversions % 2 === 1;
    }
    
    isAlreadySolved() {
        for (let i = 0; i < this.tiles.length - 1; i++) {
            if (this.tiles[i] !== i) return false;
        }
        return this.tiles[this.tiles.length - 1] === this.tiles.length - 1;
    }
    
    renderPuzzle() {
        if (!this.grid) {
            console.warn(`[${this.gameType}] Puzzle grid not found`);
            return;
        }
        
        console.log(`[${this.gameType}] renderPuzzle called: imageLoaded=${this.imageLoaded}, imageUrl=${this.imageUrl ? 'set' : 'not set'}`);
        
        if (!this.imageLoaded) {
            console.warn(`[${this.gameType}] Image not loaded yet, retrying...`);
            // Retry rendering after image loads
            setTimeout(() => this.renderPuzzle(), 100);
            return;
        }
        
        console.log(`[${this.gameType}] Image loaded, proceeding with render...`);
        this.grid.innerHTML = '';
        this.grid.style.gridTemplateColumns = `repeat(${this.puzzleSize}, 1fr)`;
        this.grid.style.gridTemplateRows = `repeat(${this.puzzleSize}, 1fr)`;
        
        // Calculate tile size based on puzzle size
        const gridSize = this.puzzleSize === 3 ? 360 : 280;
        const tileSize = Math.floor(gridSize / this.puzzleSize);
        
        console.log(`[${this.gameType}] Grid setup: size=${this.puzzleSize}x${this.puzzleSize}, gridSize=${gridSize}px, tileSize=${tileSize}px`);
        
        this.tiles.forEach((tileValue, index) => {
            const tile = document.createElement('div');
            tile.className = 'puzzle-tile';
            tile.dataset.index = index;
            
            const isEmpty = tileValue === this.tiles.length - 1;
            
            if (isEmpty) {
                // Empty tile - clear all image styles
                tile.classList.add('empty');
                
                // Remove click handlers for empty tile
                tile.removeEventListener('click', this.handleTileClick);
                tile.onclick = null;
                
                console.log(`[${this.gameType}] Created empty tile: index=${index}, value=${tileValue}, emptyPos=${this.emptyPos}`);
            } else {
                // Image tile - set all image styles
                tile.classList.remove('empty');
                const row = Math.floor(tileValue / this.puzzleSize);
                const col = tileValue % this.puzzleSize;
                
                // Set background image with proper error handling
                tile.style.backgroundImage = `url(${this.imageUrl})`;
                const backgroundSize = `${this.puzzleSize * tileSize}px ${this.puzzleSize * tileSize}px`;
                tile.style.backgroundSize = backgroundSize;
                tile.style.backgroundPosition = `-${col * tileSize}px -${row * tileSize}px`;
                tile.style.backgroundRepeat = 'no-repeat';
                tile.style.backgroundOrigin = 'border-box';
                
                console.log(`[${this.gameType}] Created image tile: index=${index}, value=${tileValue}, pos=(${row},${col}), bgSize=${backgroundSize}`);
                
                // Add click handler
                tile.addEventListener('click', () => this.handleTileClick(index));
                
                // Add touch handlers for mobile
                if (this.config.enableSwipeControls) {
                    this.addTouchHandlers(tile, index);
                }
            }
            
            this.grid.appendChild(tile);
        });
        
        console.log(`[${this.gameType}] Render completed: emptyPos=${this.emptyPos}, emptyValue=${this.tiles.length - 1}`);
        console.log(`[${this.gameType}] Tile positions: [${this.tiles.map((v, i) => `${i}:${v}`).join(', ')}]`);
        
        console.log(`[${this.gameType}] Puzzle rendered with ${this.tiles.length} tiles`);
    }
    
    handleTileClick(tileIndex) {
        if (this.state !== 'playing') return;
        
        if (this.canMoveTile(tileIndex)) {
            this.moveTile(tileIndex);
            this.moves++;
            this.updateMovesDisplay();
            
            // Play move sound if enabled
            if (this.config.moveSoundEnabled && typeof playMoveSound === 'function') {
                playMoveSound();
            }
            
            // Check for completion
            if (this.isSolved()) {
                this.complete({ moves: this.moves });
            }
        }
    }
    
    canMoveTile(tileIndex) {
        const emptyRow = Math.floor(this.emptyPos / this.puzzleSize);
        const emptyCol = this.emptyPos % this.puzzleSize;
        const tileRow = Math.floor(tileIndex / this.puzzleSize);
        const tileCol = tileIndex % this.puzzleSize;
        
        // Check if adjacent (including diagonals for more interesting gameplay)
        const rowDiff = Math.abs(emptyRow - tileRow);
        const colDiff = Math.abs(emptyCol - tileCol);
        
        return (rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1);
    }
    
    moveTile(tileIndex) {
        console.log(`[${this.gameType}] Moving tile at index ${tileIndex} to empty position ${this.emptyPos}`);
        
        // Log current state before move
        console.log(`[${this.gameType}] Before move: tile[${tileIndex}] = ${this.tiles[tileIndex]}, emptyPos = ${this.emptyPos}`);
        
        // Swap tiles
        [this.tiles[tileIndex], this.tiles[this.emptyPos]] = 
         [this.tiles[this.emptyPos], this.tiles[tileIndex]];
        this.emptyPos = tileIndex;
        
        // Log state after move
        console.log(`[${this.gameType}] After move: tile[${tileIndex}] = ${this.tiles[tileIndex]}, tile[${this.tiles.length - 1}] = ${this.tiles[this.tiles.length - 1]}, new emptyPos = ${this.emptyPos}`);
        
        // Re-render
        this.renderPuzzle();
        
        console.log(`[${this.gameType}] Move completed, total moves: ${this.moves + 1}`);
    }
    
    isSolved() {
        for (let i = 0; i < this.tiles.length - 1; i++) {
            if (this.tiles[i] !== i) return false;
        }
        return this.tiles[this.tiles.length - 1] === this.tiles.length - 1;
    }
    
    updateMovesDisplay() {
        if (this.movesDisplay) {
            this.movesDisplay.textContent = this.moves;
        }
    }
    
    setupReferenceImage() {
        if (!this.referenceBtn || !this.referenceImg) return;
        
        this.referenceBtn.addEventListener('click', () => {
            this.referenceVisible = !this.referenceVisible;
            this.referenceImg.style.display = this.referenceVisible ? 'block' : 'none';
            this.referenceBtn.textContent = this.referenceVisible ? '隐藏原图 🙈' : '查看原图 👀';
        });
    }
    
    addTouchHandlers(tile, index) {
        let touchStartX, touchStartY;
        
        tile.addEventListener('touchstart', (e) => {
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
        }, { passive: true });
        
        tile.addEventListener('touchend', (e) => {
            if (!touchStartX || !touchStartY) return;
            
            const touchEndX = e.changedTouches[0].clientX;
            const touchEndY = e.changedTouches[0].clientY;
            
            const deltaX = touchEndX - touchStartX;
            const deltaY = touchEndY - touchStartY;
            
            if (Math.abs(deltaX) > this.touchThreshold || Math.abs(deltaY) > this.touchThreshold) {
                // Determine direction and try to move corresponding tile
                const emptyRow = Math.floor(this.emptyPos / this.puzzleSize);
                const emptyCol = this.emptyPos % this.puzzleSize;
                
                let targetIndex = -1;
                
                if (Math.abs(deltaX) > Math.abs(deltaY)) {
                    // Horizontal swipe
                    if (deltaX > 0 && emptyCol > 0) {
                        // Swipe right, move tile from left
                        targetIndex = emptyRow * this.puzzleSize + (emptyCol - 1);
                    } else if (deltaX < 0 && emptyCol < this.puzzleSize - 1) {
                        // Swipe left, move tile from right
                        targetIndex = emptyRow * this.puzzleSize + (emptyCol + 1);
                    }
                } else {
                    // Vertical swipe
                    if (deltaY > 0 && emptyRow > 0) {
                        // Swipe down, move tile from above
                        targetIndex = (emptyRow - 1) * this.puzzleSize + emptyCol;
                    } else if (deltaY < 0 && emptyRow < this.puzzleSize - 1) {
                        // Swipe up, move tile from below
                        targetIndex = (emptyRow + 1) * this.puzzleSize + emptyCol;
                    }
                }
                
                if (targetIndex >= 0 && targetIndex < this.tiles.length) {
                    this.handleTileClick(targetIndex);
                }
            }
            
            touchStartX = null;
            touchStartY = null;
        }, { passive: true });
    }
    
    onStart() {
        // Show the puzzle overlay
        if (this.overlay) {
            this.overlay.classList.add('show');
        }
        
        // Start pet interaction if available
        if (typeof VirtualPet !== 'undefined' && VirtualPet.showPetWithMessage) {
            VirtualPet.showPetWithMessage('🧩 开始拼图挑战吧！', 2000);
        }
    }
    
    onComplete(result, xpAwarded) {
        // Show completion message with moves
        if (this.completeMessage) {
            this.completeMessage.innerHTML = `
                🎉 恭喜完成！
                <div class="completion-stats">
                    <div>移动次数：${this.moves}</div>
                    <div>获得积分：+${xpAwarded}</div>
                </div>
            `;
        }
        
        // Update final score display
        const scoreElement = this.completeMessage?.querySelector('.final-score');
        if (scoreElement) {
            scoreElement.textContent = this.moves;
        }
    }
    
    onReset() {
        this.moves = 0;
        this.updateMovesDisplay();
        this.initializePuzzle();
    }
    
    onClose() {
        // Hide reference image
        if (this.referenceImg) {
            this.referenceImg.style.display = 'none';
        }
        if (this.referenceBtn) {
            this.referenceBtn.textContent = '查看原图 👀';
        }
        this.referenceVisible = false;
    }
    
    handleKeyboard(event) {
        if (this.state !== 'playing') return;
        
        const emptyRow = Math.floor(this.emptyPos / this.puzzleSize);
        const emptyCol = this.emptyPos % this.puzzleSize;
        let targetIndex = -1;
        
        switch (event.key) {
            case 'ArrowUp':
                if (emptyRow < this.puzzleSize - 1) {
                    targetIndex = (emptyRow + 1) * this.puzzleSize + emptyCol;
                }
                break;
            case 'ArrowDown':
                if (emptyRow > 0) {
                    targetIndex = (emptyRow - 1) * this.puzzleSize + emptyCol;
                }
                break;
            case 'ArrowLeft':
                if (emptyCol < this.puzzleSize - 1) {
                    targetIndex = emptyRow * this.puzzleSize + (emptyCol + 1);
                }
                break;
            case 'ArrowRight':
                if (emptyCol > 0) {
                    targetIndex = emptyRow * this.puzzleSize + (emptyCol - 1);
                }
                break;
        }
        
        if (targetIndex >= 0 && targetIndex < this.tiles.length) {
            event.preventDefault();
            this.handleTileClick(targetIndex);
        }
    }
    
    setupGameEvents() {
        // Add any puzzle-specific event listeners
        // This is called automatically by BaseGame.setupEventListeners()
    }
    
    cleanupGameEvents() {
        // Clean up puzzle-specific event listeners
        // This is called automatically by BaseGame.cleanupEventListeners()
    }
}

// Register the new unified puzzle game
if (typeof GameManager !== 'undefined') {
    GameManager.registerGame('puzzle', UnifiedPuzzleGame);
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UnifiedPuzzleGame;
} else if (typeof window !== 'undefined') {
    window.UnifiedPuzzleGame = UnifiedPuzzleGame;
}
