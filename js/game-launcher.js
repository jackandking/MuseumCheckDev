/**
 * 游戏启动管理器
 * 用于从 museum-checkin.html 中管理独立游戏HTML的加载
 * 
 * 使用方式：
 * const launcher = new GameLauncher();
 * launcher.launchGame('tank-battle', { museumId: 'forbidden-city' });
 */

class GameLauncher {
    constructor(options = {}) {
        this.baseUrl = options.baseUrl || '/games/';
        this.games = {
            'tank-battle': 'tank-battle.html',
            'space-invaders': 'space-invaders.html',
            'snake': 'snake.html'
        };
        this.currentFrame = null;
        this.onClose = options.onClose || (() => {});
    }

    /**
     * 启动游戏
     * @param {string} gameType - 游戏类型 ('tank-battle', 'space-invaders', 'snake')
     * @param {Object} options - 游戏选项
     */
    launchGame(gameType, options = {}) {
        if (!this.games[gameType]) {
            console.error(`Unknown game type: ${gameType}`);
            return;
        }

        const gameUrl = `${this.baseUrl}${this.games[gameType]}`;
        
        // 创建 iframe 容器
        const container = this.createContainer();
        
        // 创建 iframe
        const iframe = document.createElement('iframe');
        iframe.src = gameUrl;
        iframe.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            border: none;
            z-index: 10000;
        `;
        
        // 处理游戏关闭消息
        const messageHandler = (event) => {
            if (event.data.type === 'game-close') {
                this.closeGame();
            }
        };
        
        window.addEventListener('message', messageHandler);
        
        iframe.addEventListener('load', () => {
            console.log(`Game loaded: ${gameType}`);
            
            // 发送启动消息给 iframe
            iframe.contentWindow.postMessage({
                type: 'start-game',
                gameType,
                ...options
            }, '*');
        });
        
        container.appendChild(iframe);
        this.currentFrame = iframe;
        this.currentHandler = messageHandler;
    }

    /**
     * 创建游戏容器
     */
    createContainer() {
        let container = document.getElementById('game-launcher-container');
        
        if (!container) {
            container = document.createElement('div');
            container.id = 'game-launcher-container';
            container.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                z-index: 10000;
            `;
            document.body.appendChild(container);
        }
        
        // 清空容器
        container.innerHTML = '';
        
        return container;
    }

    /**
     * 关闭当前游戏
     */
    closeGame() {
        const container = document.getElementById('game-launcher-container');
        if (container) {
            container.remove();
        }
        
        this.currentFrame = null;
        this.onClose();
    }

    /**
     * 获取所有可用游戏
     */
    getAvailableGames() {
        return Object.keys(this.games);
    }
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GameLauncher;
}
