/**
 * Unified Game UI Components
 * 统一游戏UI组件系统，解决屏幕空间利用率和一致性问题
 */

class UnifiedGameUI {
    constructor() {
        this.viewportInfo = this.getViewportInfo();
        this.setupResponsiveListeners();
    }

    /**
     * 获取视口信息
     */
    getViewportInfo() {
        const width = window.innerWidth;
        const height = window.innerHeight;
        const isMobile = width <= 768;
        const isSmallMobile = width <= 360;
        
        return {
            width,
            height,
            isMobile,
            isSmallMobile,
            availableWidth: isMobile ? width - 40 : Math.min(width - 100, 600),
            availableHeight: isMobile ? height - 200 : Math.min(height - 200, 600),
            maxGameSize: Math.min(isMobile ? width - 40 : 600, isMobile ? height - 200 : 600)
        };
    }

    /**
     * 设置响应式监听器
     */
    setupResponsiveListeners() {
        window.addEventListener('resize', () => {
            this.viewportInfo = this.getViewportInfo();
            this.notifyGameResize();
        });

        window.addEventListener('orientationchange', () => {
            setTimeout(() => {
                this.viewportInfo = this.getViewportInfo();
                this.notifyGameResize();
            }, 100);
        });
    }

    /**
     * 通知游戏尺寸变化
     */
    notifyGameResize() {
        const event = new CustomEvent('gameViewportResize', {
            detail: this.viewportInfo
        });
        window.dispatchEvent(event);
    }

    /**
     * 计算游戏最佳尺寸
     */
    calculateOptimalGameSize(gameType, config = {}) {
        const { maxGameSize, isMobile, isSmallMobile } = this.viewportInfo;
        
        // 基础尺寸配置
        const baseSizes = {
            maze: { min: 280, max: 500, aspectRatio: 1 },
            'space-invaders': { min: 300, max: 600, aspectRatio: 4/3 },
            'tank-battle': { min: 300, max: 600, aspectRatio: 4/3 },
            snake: { min: 300, max: 500, aspectRatio: 1 }
        };

        const gameConfig = baseSizes[gameType] || baseSizes.maze;
        
        // 计算最佳尺寸
        let optimalSize = Math.min(maxGameSize, gameConfig.max);
        optimalSize = Math.max(optimalSize, gameConfig.min);

        // 移动端优化
        if (isMobile) {
            optimalSize = Math.min(optimalSize, this.viewportInfo.availableWidth);
            optimalSize = Math.min(optimalSize, this.viewportInfo.availableHeight);
        }

        // 小屏幕进一步优化
        if (isSmallMobile) {
            optimalSize = Math.min(optimalSize, 280);
        }

        return {
            width: optimalSize,
            height: optimalSize * gameConfig.aspectRatio,
            isMobile,
            isSmallMobile,
            scaleFactor: optimalSize / gameConfig.min
        };
    }

    /**
     * 应用游戏样式
     */
    applyGameStyles(gameElement, gameType, size) {
        if (!gameElement) return;

        // 清除现有样式
        gameElement.style.width = '';
        gameElement.style.height = '';
        gameElement.style.maxWidth = '';
        gameElement.style.maxHeight = '';

        // 应用新样式
        gameElement.style.width = `${size.width}px`;
        gameElement.style.height = `${size.height}px`;
        gameElement.style.maxWidth = '100%';
        gameElement.style.maxHeight = `${size.height}px`;

        // 添加响应式类
        gameElement.classList.remove('game-desktop', 'game-mobile', 'game-small-mobile');
        if (size.isSmallMobile) {
            gameElement.classList.add('game-small-mobile');
        } else if (size.isMobile) {
            gameElement.classList.add('game-mobile');
        } else {
            gameElement.classList.add('game-desktop');
        }

        console.log(`[UnifiedGameUI] Applied styles for ${gameType}: ${size.width}x${size.height}`);
    }

    /**
     * 优化游戏容器
     */
    optimizeGameContainer(containerElement, gameType) {
        if (!containerElement) return;

        const size = this.calculateOptimalGameSize(gameType);
        
        // 优化容器
        containerElement.style.width = '100%';
        containerElement.style.maxWidth = `${size.width + 40}px`; // 加padding
        containerElement.style.margin = '0 auto';
        
        // 优化内部游戏元素
        const gameElement = containerElement.querySelector('[data-game-element]') || 
                           containerElement.querySelector('canvas') ||
                           containerElement.querySelector('.game-canvas') ||
                           containerElement.querySelector('.maze-canvas');

        if (gameElement) {
            this.applyGameStyles(gameElement, gameType, size);
        }

        return size;
    }

    /**
     * 创建响应式游戏标题
     */
    createResponsiveTitle(titleElement, gameType) {
        if (!titleElement) return;

        const { isMobile, isSmallMobile } = this.viewportInfo;
        
        // 移除现有尺寸类
        titleElement.classList.remove('title-desktop', 'title-mobile', 'title-small-mobile');
        
        // 添加新尺寸类
        if (isSmallMobile) {
            titleElement.classList.add('title-small-mobile');
            titleElement.style.fontSize = '20px';
        } else if (isMobile) {
            titleElement.classList.add('title-mobile');
            titleElement.style.fontSize = '24px';
        } else {
            titleElement.classList.add('title-desktop');
            titleElement.style.fontSize = '28px';
        }
    }

    /**
     * 优化按钮布局
     */
    optimizeButtonLayout(buttonContainer) {
        if (!buttonContainer) return;

        const { isMobile, isSmallMobile } = this.viewportInfo;
        
        // 移除现有布局类
        buttonContainer.classList.remove('buttons-desktop', 'buttons-mobile', 'buttons-small-mobile');
        
        // 添加新布局类
        if (isSmallMobile) {
            buttonContainer.classList.add('buttons-small-mobile');
            buttonContainer.style.flexDirection = 'column';
            buttonContainer.style.gap = '10px';
        } else if (isMobile) {
            buttonContainer.classList.add('buttons-mobile');
            buttonContainer.style.flexDirection = 'row';
            buttonContainer.style.gap = '15px';
        } else {
            buttonContainer.classList.add('buttons-desktop');
            buttonContainer.style.flexDirection = 'row';
            buttonContainer.style.gap = '20px';
        }
    }

    /**
     * 获取游戏特定的CSS变量
     */
    getGameCSSVariables(gameType, size) {
        const variables = {
            '--game-width': `${size.width}px`,
            '--game-height': `${size.height}px`,
            '--game-scale': size.scaleFactor,
            '--is-mobile': size.isMobile ? '1' : '0',
            '--is-small-mobile': size.isSmallMobile ? '1' : '0'
        };

        // 游戏特定变量
        if (gameType === 'maze') {
            variables['--maze-canvas-size'] = size.width + 'px';
            variables['--maze-cell-size'] = Math.floor(size.width / 9) + 'px';
        }

        return variables;
    }

    /**
     * 应用CSS变量到元素
     */
    applyCSSVariables(element, variables) {
        if (!element) return;

        Object.entries(variables).forEach(([property, value]) => {
            element.style.setProperty(property, value);
        });
    }

    /**
     * 完整的游戏UI优化
     */
    optimizeGameUI(gameType, containerSelector, titleSelector, buttonSelector) {
        const container = document.querySelector(containerSelector);
        const title = document.querySelector(titleSelector);
        const buttons = document.querySelector(buttonSelector);

        // 优化游戏容器
        const size = this.optimizeGameContainer(container, gameType);
        
        // 优化标题
        this.createResponsiveTitle(title, gameType);
        
        // 优化按钮
        this.optimizeButtonLayout(buttons);

        // 应用CSS变量
        if (container) {
            const variables = this.getGameCSSVariables(gameType, size);
            this.applyCSSVariables(container, variables);
        }

        console.log(`[UnifiedGameUI] Optimized UI for ${gameType}:`, size);
        
        return size;
    }
}

// 全局实例
if (typeof window !== 'undefined') {
    window.UnifiedGameUI = new UnifiedGameUI();
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UnifiedGameUI;
}
