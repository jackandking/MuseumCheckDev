/**
 * Unified Game Architecture - Base Game Class
 * 统一游戏架构 - 基础游戏类
 * 
 * Provides common functionality for all mini-games:
 * - State management
 * - Lifecycle control
 * - Reward integration
 * - UI interaction handling
 */

class BaseGame {
    constructor(gameType, config = {}) {
        this.gameType = gameType;
        this.config = { ...this.getDefaultConfig(), ...config };
        this.state = 'idle'; // idle, initializing, playing, completed, gameOver
        this.score = 0;
        this.taskIndex = 0;
        this.startTime = null;
        this.endTime = null;
        this.sessionId = null;
        this.isDebugMode = typeof isDebugMode === 'function' && isDebugMode();
        this.animationId = null;
        
        // UI elements
        this.overlay = null;
        this.completeMessage = null;
        this.resetButton = null;
        
        // Event handlers bound to this instance
        this.boundHandlers = {
            close: this.close.bind(this),
            reset: this.reset.bind(this),
            keydown: this.handleKeydown.bind(this)
        };

        // Tracked event listeners for automatic cleanup
        this.trackedEventListeners = [];
    }
    
    /**
     * Get default configuration for this game type
     * 子类可以重写此方法提供特定配置
     */
    getDefaultConfig() {
        return {
            autoCloseDelay: 2000,
            showResetButton: false,
            enableKeyboard: true,
            escapeToClose: true
        };
    }
    
    /**
     * Initialize the game
     * @param {number} taskIndex - Task index for difficulty determination
     * @param {Object} options - Additional options
     */
    async init(taskIndex = 0, options = {}) {
        this.state = 'initializing';
        this.taskIndex = taskIndex;
        
        // Start new reward session
        if (typeof GameRewardManager !== 'undefined') {
            GameRewardManager.startNewSession();
            this.sessionId = GameRewardManager._sessionId;
        }
        
        // Find UI elements
        this.findUIElements();
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Game-specific initialization
        await this.onInit(taskIndex, options);
        
        this.state = 'idle';
        console.log(`[${this.gameType}] Game initialized`);
    }
    
    /**
     * Start the game
     */
    start() {
        if (this.state !== 'idle') {
            console.warn(`[${this.gameType}] Cannot start game in state: ${this.state}`);
            return false;
        }
        
        this.state = 'playing';
        this.startTime = Date.now();
        this.score = 0;
        
        // Hide completion message and show overlay
        this.hideCompletionMessage();
        this.showOverlay();
        
        // Update reset button visibility
        this.updateResetButton();
        
        // Game-specific start logic
        this.onStart();
        
        console.log(`[${this.gameType}] Game started`);
        return true;
    }
    
    /**
     * End the game with completion
     * @param {Object} result - Game result {score, time, customData}
     */
    complete(result = {}) {
        if (this.state !== 'playing') {
            console.warn(`[${this.gameType}] Cannot complete game in state: ${this.state}`);
            return false;
        }
        
        this.state = 'completed';
        this.endTime = Date.now();
        this.score = result.score || this.score;
        
        const timeSeconds = Math.floor((this.endTime - this.startTime) / 1000);
        
        // Award XP through unified system
        let xpAwarded = 0;
        if (typeof GameRewardManager !== 'undefined') {
            xpAwarded = GameRewardManager.awardCompletion(this.gameType, this.score, timeSeconds);
        }
        
        // Show completion message
        this.showCompletion(result, xpAwarded);
        
        // Update reset button for post-game state
        this.updateResetButton();
        
        // Game-specific completion logic
        this.onComplete(result, xpAwarded);
        
        // Auto-close after delay
        if (this.config.autoCloseDelay > 0) {
            setTimeout(() => this.close(), this.config.autoCloseDelay);
        }
        
        console.log(`[${this.gameType}] Game completed - Score: ${this.score}, XP: ${xpAwarded}`);
        return true;
    }
    
    /**
     * Reset the game for replay
     */
    reset() {
        if (this.state === 'playing') {
            // If playing, treat as game over
            this.gameOver();
            return;
        }
        
        this.state = 'idle';
        this.score = 0;
        this.startTime = null;
        this.endTime = null;
        
        // Hide completion message
        this.hideCompletionMessage();
        
        // Game-specific reset logic
        this.onReset();
        
        // Start new game
        this.start();
        
        console.log(`[${this.gameType}] Game reset and restarted`);
    }
    
    /**
     * Close the game and return to main interface
     */
    close() {
        this.state = 'idle';
        
        // Hide overlay
        this.hideOverlay();

        // Stop any running animation loop
        this.cancelAnimationLoop();
        
        // Cleanup event listeners
        this.cleanupEventListeners();
        
        // Game-specific cleanup
        this.onClose();
        
        console.log(`[${this.gameType}] Game closed`);
    }
    
    /**
     * Handle game over (different from completion)
     */
    gameOver() {
        this.state = 'gameOver';
        this.endTime = Date.now();
        
        // Update reset button to show restart option
        this.updateResetButton();
        
        // Game-specific game over logic
        this.onGameOver();
        
        console.log(`[${this.gameType}] Game over`);
    }
    
    /**
     * Find and cache UI elements
     */
    findUIElements() {
        const overlayId = `${this.gameType}GameOverlay`;
        const messageId = `${this.gameType}CompleteMessage`;
        const resetBtnId = `reset${this.gameType.charAt(0).toUpperCase() + this.gameType.slice(1)}`;
        
        this.overlay = document.getElementById(overlayId);
        this.completeMessage = document.getElementById(messageId);
        this.resetButton = document.getElementById(resetBtnId);
        
        if (!this.overlay) {
            console.error(`[${this.gameType}] Overlay element not found: ${overlayId}`);
        }
    }
    
    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Reset button
        if (this.resetButton) {
            this.resetButton.addEventListener('click', this.boundHandlers.reset);
        }
        
        // Keyboard controls
        if (this.config.enableKeyboard) {
            document.addEventListener('keydown', this.boundHandlers.keydown);
        }
        
        // Game-specific event setup
        this.setupGameEvents();
    }
    
    /**
     * Cleanup event listeners
     */
    cleanupEventListeners() {
        // Reset button
        if (this.resetButton) {
            this.resetButton.removeEventListener('click', this.boundHandlers.reset);
        }
        
        // Keyboard controls
        if (this.config.enableKeyboard) {
            document.removeEventListener('keydown', this.boundHandlers.keydown);
        }
        
        // Game-specific cleanup
        this.cleanupGameEvents();

        // Remove tracked listeners
        this.removeTrackedEventListeners();
    }
    
    /**
     * Handle keyboard events
     */
    handleKeydown(event) {
        if (this.config.escapeToClose && event.key === 'Escape') {
            this.close();
            return;
        }
        
        // Game-specific keyboard handling
        this.handleKeyboard(event);
    }
    
    /**
     * Update reset button visibility and behavior
     */
    updateResetButton() {
        if (!this.resetButton) return;
        
        const isCompleted = this.state === 'completed' || this.state === 'gameOver';
        
        if (isCompleted) {
            if (this.isDebugMode) {
                // Debug mode: show reset button
                this.resetButton.style.display = '';
                this.resetButton.textContent = '再玩一次';
                this.resetButton.onclick = this.boundHandlers.reset;
            } else {
                // Normal mode: show close button
                this.resetButton.style.display = '';
                this.resetButton.textContent = '关闭游戏';
                this.resetButton.onclick = this.boundHandlers.close;
            }
        } else {
            // During game: hide reset button unless configured otherwise
            this.resetButton.style.display = this.config.showResetButton ? '' : 'none';
        }
    }
    
    /**
     * Show completion message
     */
    showCompletion(result, xpAwarded) {
        if (!this.completeMessage) return;
        
        // Update score display if available
        const scoreElement = this.completeMessage.querySelector('.final-score');
        if (scoreElement) {
            scoreElement.textContent = this.score;
        }
        
        // Show the completion message
        this.completeMessage.classList.add('show');
        
        // Play completion sound
        if (typeof playFireworkSound === 'function') {
            playFireworkSound();
        }
    }

    /**
     * Show the overlay element
     */
    showOverlay() {
        if (this.overlay) {
            this.overlay.classList.add('show');
        }
    }

    /**
     * Hide the overlay element
     */
    hideOverlay() {
        if (this.overlay) {
            this.overlay.classList.remove('show');
        }
    }

    /**
     * Hide completion message if visible
     */
    hideCompletionMessage() {
        if (this.completeMessage) {
            this.completeMessage.classList.remove('show');
        }
    }

    /**
     * Show completion message with custom updater
     * @param {Function} updater - Receives completion element for custom updates
     */
    showCustomCompletionMessage(updater) {
        if (!this.completeMessage) return;
        if (typeof updater === 'function') {
            updater(this.completeMessage);
        }
        this.completeMessage.classList.add('show');
    }

    /**
     * Update a field within completion message
     * @param {string} selector
     * @param {string|number} value
     */
    updateCompletionField(selector, value) {
        if (!this.completeMessage || !selector) return;
        const element = this.completeMessage.querySelector(selector);
        if (element) {
            element.textContent = value;
        }
    }

    /**
     * Track event listeners for cleanup
     */
    addTrackedEventListener(target, eventName, handler, options) {
        if (!target || !eventName || typeof handler !== 'function') return;
        target.addEventListener(eventName, handler, options);
        this.trackedEventListeners.push({ target, eventName, handler, options });
    }

    /**
     * Remove all tracked listeners
     */
    removeTrackedEventListeners() {
        this.trackedEventListeners.forEach(({ target, eventName, handler, options }) => {
            target.removeEventListener(eventName, handler, options);
        });
        this.trackedEventListeners = [];
    }

    /**
     * Cancel animation loop if active
     */
    cancelAnimationLoop() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }
    
    // ===== Abstract Methods - To be implemented by subclasses =====
    
    /**
     * Game-specific initialization
     * @param {number} taskIndex - Task index
     * @param {Object} options - Additional options
     */
    async onInit(taskIndex, options) {
        // Override in subclasses
    }
    
    /**
     * Game-specific start logic
     */
    onStart() {
        // Override in subclasses
    }
    
    /**
     * Game-specific completion logic
     * @param {Object} result - Completion result
     * @param {number} xpAwarded - XP awarded
     */
    onComplete(result, xpAwarded) {
        // Override in subclasses
    }
    
    /**
     * Game-specific reset logic
     */
    onReset() {
        // Override in subclasses
    }
    
    /**
     * Game-specific cleanup
     */
    onClose() {
        // Override in subclasses
    }
    
    /**
     * Game-specific game over logic
     */
    onGameOver() {
        // Override in subclasses
    }
    
    /**
     * Setup game-specific events
     */
    setupGameEvents() {
        // Override in subclasses
    }
    
    /**
     * Cleanup game-specific events
     */
    cleanupGameEvents() {
        // Override in subclasses
    }
    
    /**
     * Handle game-specific keyboard input
     * @param {KeyboardEvent} event - Keyboard event
     */
    handleKeyboard(event) {
        // Override in subclasses
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BaseGame;
} else if (typeof window !== 'undefined') {
    window.BaseGame = BaseGame;
}
