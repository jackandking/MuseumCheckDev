// Test with proper class definition
console.log('Testing with proper class definition...');

// Define BaseGame class directly
class BaseGame {
    constructor(gameType, config = {}) {
        this.gameType = gameType;
        this.config = { ...this.getDefaultConfig(), ...config };
        this.state = 'idle';
        this.score = 0;
        this.taskIndex = 0;
        this.startTime = null;
        this.endTime = null;
        this.sessionId = null;
        this.isDebugMode = false;
        
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
    }
    
    getDefaultConfig() {
        return {
            autoCloseDelay: 2000,
            showResetButton: false,
            enableKeyboard: true,
            escapeToClose: true
        };
    }
    
    start() {
        if (this.state !== 'idle') {
            console.warn(`Cannot start game in state: ${this.state}`);
            return false;
        }
        
        this.state = 'playing';
        this.startTime = Date.now();
        this.score = 0;
        
        console.log(`Game started: ${this.gameType}`);
        return true;
    }
    
    complete(result = {}) {
        if (this.state !== 'playing') {
            console.warn(`Cannot complete game in state: ${this.state}`);
            return false;
        }
        
        this.state = 'completed';
        this.endTime = Date.now();
        this.score = result.score || this.score;
        
        console.log(`Game completed: ${this.gameType}, Score: ${this.score}`);
        return true;
    }
    
    reset() {
        if (this.state === 'playing') {
            this.gameOver();
            return;
        }
        
        this.state = 'idle';
        this.score = 0;
        this.startTime = null;
        this.endTime = null;
        
        this.start();
        console.log(`Game reset: ${this.gameType}`);
    }
    
    close() {
        this.state = 'idle';
        console.log(`Game closed: ${this.gameType}`);
    }
    
    gameOver() {
        this.state = 'gameOver';
        this.endTime = Date.now();
        console.log(`Game over: ${this.gameType}`);
    }
    
    close() {
        this.state = 'idle';
        console.log(`Game closed: ${this.gameType}`);
    }
    
    handleKeydown(event) {
        if (this.config.escapeToClose && event.key === 'Escape') {
            this.close();
        }
    }
}

console.log('BaseGame type:', typeof BaseGame);

if (typeof BaseGame === 'function') {
    const game = new BaseGame('puzzle');
    console.log('✅ Game created successfully');
    console.log('✅ Game state:', game.state);
    console.log('✅ Game type:', game.gameType);
    console.log('✅ Game config:', game.config);
    
    // Test lifecycle
    game.start();
    console.log('✅ Game started, state:', game.state);
    
    game.complete({ moves: 5 });
    console.log('✅ Game completed, state:', game.state);
    
    game.reset();
    console.log('✅ Game reset, state:', game.state);
    
    game.close();
    console.log('✅ Game closed, state:', game.state);
    
} else {
    console.log('❌ BaseGame is not a function');
}

console.log('\n🎉 Direct class test completed!');
