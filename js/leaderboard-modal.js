/**
 * Leaderboard Modal Module
 * 共享的排行榜模态框功能，避免代码重复
 * 
 * Usage:
 * 1. Include this script: <script src="js/leaderboard-modal.js"></script>
 * 2. Ensure leaderboardModal HTML exists in the page
 * 3. Call LeaderboardModal.init() after DOM ready
 */
(function() {
    'use strict';

    // Leaderboard Modal Module
    window.LeaderboardModal = {
        // Initialize the leaderboard modal functionality
        init: function() {
            this.bindEvents();
            this.exposeGlobalFunction();
            console.log('[LeaderboardModal] Initialized');
        },

        // Show leaderboard modal
        show: function() {
            const modal = document.getElementById('leaderboardModal');
            if (modal) {
                modal.classList.remove('hidden');
                modal.style.display = 'flex';
                // Add animation class
                modal.classList.add('modal-enter');
                setTimeout(() => modal.classList.remove('modal-enter'), 300);
                this.loadLeaderboardData();
                this.bindTabEvents();
            } else {
                console.warn('[LeaderboardModal] Modal element not found');
            }
        },

        // Close leaderboard modal
        close: function() {
            const modal = document.getElementById('leaderboardModal');
            if (modal) {
                modal.classList.add('hidden');
                modal.style.display = 'none';
            }
        },

        // Load leaderboard data from API
        loadLeaderboardData: async function(rankingType = 'visits') {
            const leaderboardList = document.getElementById('leaderboardList');
            const leaderboardIntro = document.getElementById('leaderboardIntro');
            if (!leaderboardList) return;

            // Show loading state with animation
            leaderboardList.innerHTML = `
                <div class="leaderboard-loading">
                    <div class="loading-spinner"></div>
                    <p>正在加载排行榜...</p>
                </div>
            `;

            // Update intro text based on ranking type
            if (leaderboardIntro) {
                const introTexts = {
                    'visits': '看看谁的博物馆之旅最精彩！参观越多，排名越高！',
                    'pet': '看看谁的小宠物最厉害！精心照料，等级更高！'
                };
                const paragraph = leaderboardIntro.querySelector('p');
                if (paragraph) {
                    paragraph.textContent = introTexts[rankingType] || introTexts['visits'];
                }
            }

            try {
                // Determine API endpoint based on environment
                let leaderboardUrl;
                if (window.API_ENDPOINTS && window.API_ENDPOINTS.BASE_URL.includes('localhost')) {
                    // Local development - use mock API
                    leaderboardUrl = window.API_ENDPOINTS.BASE_URL + '/default/leaderboard';
                } else {
                    // Production - use AWS API
                    leaderboardUrl = 'https://rlyhccdr2g.execute-api.us-west-2.amazonaws.com/default/leaderboard';
                }
                
                console.log('[LeaderboardModal] Loading from:', leaderboardUrl);
                const response = await fetch(leaderboardUrl);
                if (response.ok) {
                    const data = await response.json();
                    this.renderLeaderboard(data, rankingType);
                } else {
                    throw new Error('API response not ok');
                }
            } catch (error) {
                console.error('[LeaderboardModal] Error loading leaderboard:', error);
                // Fallback to sample data
                this.renderSampleLeaderboard(rankingType);
            }
        },

        // Render leaderboard data
        renderLeaderboard: function(data, rankingType = 'visits') {
            const leaderboardList = document.getElementById('leaderboardList');
            if (!leaderboardList || !data || !data.items) return;

            let html = '';
            data.items.forEach((item, index) => {
                const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}`;
                
                if (rankingType === 'pet') {
                    // 宠物排行榜 - 显示详细宠物属性
                    const petLevel = item.petLevel || 1;
                    const petType = item.petType || '小猫';
                    const petEmoji = this.getPetEmoji(petType);
                    const attack = item.attack || 0;
                    const defense = item.defense || 0;
                    const intelligence = item.intelligence || 0;
                    const totalPoints = item.totalPoints || 0;
                    
                    html += `
                        <div class="leaderboard-item pet-leaderboard-item" style="animation: slideInUp 0.3s ease-out ${index * 0.1}s both">
                            <div class="rank-medal">${medal}</div>
                            <div class="rank-info">
                                <div class="rank-name">${item.nickname || '匿名用户'}</div>
                                <div class="rank-pet-info">
                                    <span class="pet-emoji">${petEmoji}</span>
                                    <span class="pet-name">${petType}</span>
                                    <span class="pet-level">Lv.${petLevel}</span>
                                </div>
                                <div class="rank-count">总积分: ${totalPoints}</div>
                                <div class="pet-stats">
                                    <span class="stat">⚔️${attack}</span>
                                    <span class="stat">🛡️${defense}</span>
                                    <span class="stat">🧠${intelligence}</span>
                                </div>
                            </div>
                        </div>
                    `;
                } else {
                    // 博物馆排行榜
                    const countText = `参观了 ${item.visits || 0} 个博物馆`;
                    html += `
                        <div class="leaderboard-item" style="animation: slideInUp 0.3s ease-out ${index * 0.1}s both">
                            <div class="rank-medal">${medal}</div>
                            <div class="rank-info">
                                <div class="rank-name">${item.nickname || '匿名用户'}</div>
                                <div class="rank-count">${countText}</div>
                            </div>
                        </div>
                    `;
                }
            });

            leaderboardList.innerHTML = html;
        },
        
        // 获取宠物表情符号
        getPetEmoji: function(petType) {
            const petEmojis = {
                '小猫': '🐱',
                '小狗': '🐶',
                '小兔子': '🐰',
                '小熊猫': '🐼',
                '小狐狸': '🦊',
                '小老虎': '🐯',
                '小恐龙': '🦕',
                '小龙': '🐲',
                '独角兽': '🦄',
                '凤凰': '🦅'
            };
            return petEmojis[petType] || '🐱'; // 默认小猫
        },

        // Render sample leaderboard for demo/fallback
        renderSampleLeaderboard: function(rankingType = 'visits') {
            const sampleData = rankingType === 'pet' ? {
                items: [
                    { 
                        nickname: '小淘气', 
                        petLevel: 5, 
                        petType: '小猫',
                        attack: 15,
                        defense: 12,
                        intelligence: 18,
                        totalPoints: 2500
                    },
                    { 
                        nickname: '咚咚', 
                        petLevel: 4, 
                        petType: '小狗',
                        attack: 12,
                        defense: 15,
                        intelligence: 14,
                        totalPoints: 1800
                    },
                    { 
                        nickname: '用户123', 
                        petLevel: 3, 
                        petType: '小兔子',
                        attack: 8,
                        defense: 10,
                        intelligence: 12,
                        totalPoints: 1200
                    },
                    { 
                        nickname: '小明', 
                        petLevel: 2, 
                        petType: '小熊猫',
                        attack: 5,
                        defense: 7,
                        intelligence: 8,
                        totalPoints: 600
                    },
                    { 
                        nickname: '小红', 
                        petLevel: 1, 
                        petType: '小狐狸',
                        attack: 2,
                        defense: 3,
                        intelligence: 4,
                        totalPoints: 200
                    }
                ]
            } : {
                items: [
                    { nickname: '小淘气', visits: 3 },
                    { nickname: '咚咚', visits: 2 },
                    { nickname: '用户123', visits: 2 },
                    { nickname: '小明', visits: 1 },
                    { nickname: '小红', visits: 1 }
                ]
            };
            this.renderLeaderboard(sampleData, rankingType);
        },

        // Bind event listeners
        bindEvents: function() {
            // Close button
            const closeBtn = document.querySelector('#leaderboardModal .close');
            if (closeBtn) {
                closeBtn.addEventListener('click', () => this.close());
            }

            // Click outside to close
            const modal = document.getElementById('leaderboardModal');
            if (modal) {
                modal.addEventListener('click', (e) => {
                    if (e.target === modal) {
                        this.close();
                    }
                });
            }

            // Listen for SharedMenu events
            document.addEventListener('sharedmenu:leaderboard', () => {
                this.show();
            });

            // Listen for leaderboard update events
            document.addEventListener('leaderboard:update', (e) => {
                console.log('[Leaderboard] Update event received:', e.detail);
                this.handleLeaderboardUpdate(e.detail);
            });

            // ESC key to close
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') {
                    this.close();
                }
            });
        },
        
        // 处理排行榜更新事件
        handleLeaderboardUpdate: function(detail) {
            try {
                const modal = document.getElementById('leaderboardModal');
                if (modal && !modal.classList.contains('hidden')) {
                    console.log('[Leaderboard] Refreshing due to update:', detail.type);
                    
                    // 根据更新类型决定刷新哪个标签页
                    let rankingType = 'visits'; // 默认博物馆排行榜
                    if (detail.type === 'pet_level_up') {
                        rankingType = 'pet'; // 宠物升级时切换到宠物排行榜
                    }
                    
                    // 刷新数据
                    this.loadLeaderboardData(rankingType);
                    
                    // 显示更新提示
                    this.showUpdateNotification(detail.type);
                }
            } catch (error) {
                console.error('Error handling leaderboard update:', error);
            }
        },
        
        // 显示更新通知
        showUpdateNotification: function(updateType) {
            const messages = {
                'museum_checkin': '🎉 完成博物馆打卡！排行榜已更新',
                'pet_level_up': '🎊 宠物升级！排行榜已更新'
            };
            
            const message = messages[updateType] || '📊 排行榜已更新';
            
            // 创建临时通知元素
            const notification = document.createElement('div');
            notification.className = 'leaderboard-update-notification';
            notification.textContent = message;
            notification.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 12px 20px;
                border-radius: 25px;
                font-size: 14px;
                font-weight: bold;
                z-index: 10000;
                animation: slideInRight 0.3s ease-out;
                box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
            `;
            
            document.body.appendChild(notification);
            
            // 3秒后移除通知
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.style.animation = 'slideOutRight 0.3s ease-in';
                    setTimeout(() => {
                        if (notification.parentNode) {
                            notification.parentNode.removeChild(notification);
                        }
                    }, 300);
                }
            }, 3000);
        },

        // Bind tab switching events
        bindTabEvents: function() {
            const tabs = document.querySelectorAll('.leaderboard-tab');
            tabs.forEach(tab => {
                tab.addEventListener('click', (e) => {
                    e.preventDefault();
                    const rankingType = tab.dataset.rankingType;
                    this.switchTab(rankingType);
                });
            });
        },

        // Switch ranking tab
        switchTab: function(rankingType) {
            const tabs = document.querySelectorAll('.leaderboard-tab');
            const activeTab = document.querySelector(`[data-ranking-type="${rankingType}"]`);
            
            if (!activeTab) return;

            // Update tab states with animation
            tabs.forEach(tab => {
                tab.classList.remove('active');
            });
            activeTab.classList.add('active');

            // Add haptic feedback for mobile
            if (navigator.vibrate) {
                navigator.vibrate(50);
            }

            // Reload data for new ranking type
            this.loadLeaderboardData(rankingType);
        },

        // Expose global function for SharedMenu
        exposeGlobalFunction: function() {
            window.showLeaderboardModal = () => this.show();
        }
    };

    // Auto-initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            LeaderboardModal.init();
        });
    } else {
        LeaderboardModal.init();
    }
})();
