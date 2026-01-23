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
                this.loadLeaderboardData();
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
        loadLeaderboardData: async function() {
            const leaderboardList = document.getElementById('leaderboardList');
            if (!leaderboardList) return;

            // Show loading state
            leaderboardList.innerHTML = `
                <div class="leaderboard-loading">
                    <div class="loading-spinner"></div>
                    <p>正在加载排行榜...</p>
                </div>
            `;

            try {
                // Try to fetch from API first
                const response = await fetch('https://rlyhccdr2g.execute-api.us-west-2.amazonaws.com/default/leaderboard');
                if (response.ok) {
                    const data = await response.json();
                    this.renderLeaderboard(data);
                } else {
                    throw new Error('API response not ok');
                }
            } catch (error) {
                console.error('[LeaderboardModal] Error loading leaderboard:', error);
                // Fallback to sample data
                this.renderSampleLeaderboard();
            }
        },

        // Render leaderboard data
        renderLeaderboard: function(data) {
            const leaderboardList = document.getElementById('leaderboardList');
            if (!leaderboardList || !data || !data.items) return;

            let html = '';
            data.items.forEach((item, index) => {
                const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}`;
                html += `
                    <div class="leaderboard-item">
                        <div class="rank-medal">${medal}</div>
                        <div class="rank-info">
                            <div class="rank-name">${item.nickname || '匿名用户'}</div>
                            <div class="rank-count">参观了 ${item.visits || 0} 个博物馆</div>
                        </div>
                    </div>
                `;
            });

            leaderboardList.innerHTML = html;
        },

        // Render sample leaderboard for demo/fallback
        renderSampleLeaderboard: function() {
            const sampleData = {
                items: [
                    { nickname: '小淘气', visits: 3 },
                    { nickname: '咚咚', visits: 2 },
                    { nickname: '用户123', visits: 2 },
                    { nickname: '小明', visits: 1 },
                    { nickname: '小红', visits: 1 }
                ]
            };
            this.renderLeaderboard(sampleData);
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

            // ESC key to close
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') {
                    this.close();
                }
            });
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
