/**
 * 游戏集成示例
 * 在 museum-checkin.html 中使用这段代码替换旧的游戏初始化
 */

// 1. 在 museum-checkin.html 的 <head> 中添加：
// <script src="js/game-launcher.js"></script>

// 2. 在主应用代码中初始化 GameLauncher
class MuseumGameIntegration {
    constructor() {
        this.gameLauncher = new GameLauncher({
            baseUrl: '/games/',
            onClose: () => this.onGameClose()
        });
        this.currentMuseum = null;
    }

    /**
     * 启动坦克大战游戏
     */
    startTankBattle(museumData) {
        this.currentMuseum = museumData;
        this.gameLauncher.launchGame('tank-battle', {
            museumId: museumData.id,
            museumName: museumData.name,
            location: museumData.location
        });
    }

    /**
     * 启动小蜜蜂游戏
     */
    startSpaceInvaders(museumData) {
        this.currentMuseum = museumData;
        this.gameLauncher.launchGame('space-invaders', {
            museumId: museumData.id,
            museumName: museumData.name,
            difficulty: 'normal'
        });
    }

    /**
     * 启动贪食蛇游戏
     */
    startSnake(museumData) {
        this.currentMuseum = museumData;
        this.gameLauncher.launchGame('snake', {
            museumId: museumData.id,
            museumName: museumData.name,
            theme: 'artifact-collection'
        });
    }

    /**
     * 游戏关闭回调
     */
    onGameClose() {
        console.log('游戏已关闭，返回博物馆视图');
        // 可以在这里：
        // 1. 更新用户成就
        // 2. 保存游戏成绩
        // 3. 显示复制博物馆界面
        // 4. 更新进度条
    }

    /**
     * 获取游戏按钮HTML（在博物馆详情中显示）
     */
    getGameButtonsHTML(museumData) {
        return `
            <div class="museum-games">
                <h3>🎮 探险游戏</h3>
                <div class="games-grid">
                    <button class="game-btn game-btn-tank" onclick="gameIntegration.startTankBattle(${JSON.stringify(museumData)})">
                        <span class="game-icon">🎖️</span>
                        <span class="game-name">坦克大战</span>
                        <span class="game-desc">AR文物守护</span>
                    </button>
                    <button class="game-btn game-btn-invaders" onclick="gameIntegration.startSpaceInvaders(${JSON.stringify(museumData)})">
                        <span class="game-icon">👽</span>
                        <span class="game-name">小蜜蜂</span>
                        <span class="game-desc">防卫战</span>
                    </button>
                    <button class="game-btn game-btn-snake" onclick="gameIntegration.startSnake(${JSON.stringify(museumData)})">
                        <span class="game-icon">🐍</span>
                        <span class="game-name">贪食蛇</span>
                        <span class="game-desc">文物收集</span>
                    </button>
                </div>
            </div>
        `;
    }
}

// 3. 在museum-checkin.html应用启动时：
// const gameIntegration = new MuseumGameIntegration();

// 4. 在显示博物馆详情时插入游戏按钮：
// const museumDetails = document.getElementById('museum-details');
// museumDetails.insertAdjacentHTML('beforeend', gameIntegration.getGameButtonsHTML(currentMuseum));

// ============================================
// 集成后的CSS样式（添加到museum-checkin.css）
// ============================================

const GAME_BUTTONS_CSS = `
.museum-games {
    margin-top: 24px;
    padding: 20px;
    background: rgba(0, 255, 255, 0.05);
    border: 2px solid rgba(0, 255, 255, 0.2);
    border-radius: 16px;
}

.museum-games h3 {
    font-size: 18px;
    font-weight: 600;
    margin-bottom: 16px;
    color: white;
    text-shadow: 0 0 10px rgba(0, 255, 255, 0.5);
}

.games-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
    gap: 12px;
}

.game-btn {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 16px 12px;
    border: 2px solid rgba(100, 100, 255, 0.3);
    border-radius: 12px;
    background: rgba(100, 100, 255, 0.08);
    cursor: pointer;
    transition: all 0.3s ease;
    font-family: inherit;
    position: relative;
    overflow: hidden;
}

.game-btn::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
    transition: left 0.5s ease;
}

.game-btn:hover {
    border-color: rgba(0, 255, 255, 0.6);
    background: rgba(0, 255, 255, 0.15);
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(0, 255, 255, 0.3);
}

.game-btn:active {
    transform: translateY(0);
}

.game-btn:hover::before {
    left: 100%;
}

.game-icon {
    font-size: 32px;
    line-height: 1;
}

.game-name {
    font-size: 13px;
    font-weight: 600;
    color: white;
    text-align: center;
}

.game-desc {
    font-size: 11px;
    color: rgba(0, 255, 255, 0.7);
    text-align: center;
}

/* 游戏特定的按钮主题 */
.game-btn-tank {
    border-color: rgba(0, 255, 255, 0.3);
    background: rgba(0, 255, 255, 0.08);
}

.game-btn-tank:hover {
    border-color: rgba(0, 255, 255, 0.8);
    background: rgba(0, 255, 255, 0.2);
    box-shadow: 0 0 20px rgba(0, 255, 255, 0.6);
}

.game-btn-invaders {
    border-color: rgba(200, 50, 255, 0.3);
    background: rgba(200, 50, 255, 0.08);
}

.game-btn-invaders:hover {
    border-color: rgba(200, 50, 255, 0.8);
    background: rgba(200, 50, 255, 0.2);
    box-shadow: 0 0 20px rgba(200, 50, 255, 0.6);
}

.game-btn-snake {
    border-color: rgba(50, 255, 100, 0.3);
    background: rgba(50, 255, 100, 0.08);
}

.game-btn-snake:hover {
    border-color: rgba(50, 255, 100, 0.8);
    background: rgba(50, 255, 100, 0.2);
    box-shadow: 0 0 20px rgba(50, 255, 100, 0.6);
}

/* 移动端适配 */
@media (max-width: 768px) {
    .museum-games {
        padding: 16px;
        margin-top: 20px;
    }

    .games-grid {
        grid-template-columns: repeat(2, 1fr);
        gap: 10px;
    }

    .game-btn {
        padding: 14px 10px;
    }

    .game-icon {
        font-size: 28px;
    }

    .game-name {
        font-size: 12px;
    }

    .game-desc {
        font-size: 10px;
    }
}

@media (max-width: 480px) {
    .games-grid {
        grid-template-columns: repeat(2, 1fr);
    }

    .game-btn {
        padding: 12px 8px;
    }
}
`;

// ============================================
// 从museum-checkin.html中删除的代码示例
// ============================================

const OLD_CODE_TO_REMOVE = `
// 删除这些旧的游戏初始化代码：

// 旧游戏覆盖层容器（在HTML中）
<div id="spaceInvadersOverlay" class="game-overlay" style="display: none;">
    <!-- 旧的游戏标记 -->
</div>

<div id="tank-battleGameOverlay" class="game-overlay" style="display: none;">
    <!-- 旧的游戏标记 -->
</div>

<div id="snakeGameOverlay" class="game-overlay" style="display: none;">
    <!-- 旧的游戏标记 -->
</div>

// 旧的游戏初始化脚本
const spaceInvaders = new UnifiedSpaceInvadersGame({...});
const tankBattle = new UnifiedTankBattleGame({...});
const snake = new UnifiedSnakeGame({...});

// 旧的显示游戏函数
function showGame(gameType) {
    document.getElementById(gameType + 'Overlay').style.display = 'flex';
}

// 旧的隐藏游戏函数
function hideGame(gameType) {
    document.getElementById(gameType + 'Overlay').style.display = 'none';
}
`;

// ============================================
// 使用示例
// ============================================

const USAGE_EXAMPLE = `
// 在博物馆卡片点击事件中使用：

function showMuseumDetail(museum) {
    const detailsContainer = document.getElementById('museum-details');
    
    // 显示博物馆基本信息
    detailsContainer.innerHTML = \`
        <div class="museum-header">
            <h2>\${museum.name}</h2>
            <p>\${museum.location}</p>
        </div>
        <div class="museum-description">
            \${museum.description}
        </div>
        <div class="museum-checklists">
            <div class="parent-checklist">
                <h3>家长准备</h3>
                <!-- 检查清单项 -->
            </div>
            <div class="child-checklist">
                <h3>孩子任务</h3>
                <!-- 检查清单项 -->
            </div>
        </div>
    \`;
    
    // 添加游戏按钮
    const gameButtons = gameIntegration.getGameButtonsHTML(museum);
    detailsContainer.insertAdjacentHTML('beforeend', gameButtons);
    
    // 显示详情面板
    showMuseumDetailsPanel();
}
`;

console.log('游戏集成示例已加载');
console.log('CSS样式:', GAME_BUTTONS_CSS);
console.log('删除的旧代码:', OLD_CODE_TO_REMOVE);
console.log('使用示例:', USAGE_EXAMPLE);
