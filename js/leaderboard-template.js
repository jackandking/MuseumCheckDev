/**
 * Leaderboard HTML Template Generator
 * 排行榜HTML模板生成器
 * 
 * 统一生成排行榜模态框HTML，避免重复代码
 */

window.LeaderboardTemplate = {
    /**
     * 生成完整的排行榜模态框HTML
     * @returns {string} 排行榜模态框HTML字符串
     */
    generateModal: function() {
        return `
            <div id="leaderboardModal" class="modal leaderboard-modal hidden">
                <div class="modal-content leaderboard-content">
                    <span class="close">&times;</span>
                    <h2>🏅 全网排行榜</h2>
                    
                    <!-- Ranking Type Tabs -->
                    <div class="leaderboard-tabs">
                        <button class="leaderboard-tab active" data-ranking-type="visits">
                            <span class="tab-icon">🏛️</span>
                            <span class="tab-text">博物馆</span>
                        </button>
                        <button class="leaderboard-tab" data-ranking-type="pet">
                            <span class="tab-icon">🐾</span>
                            <span class="tab-text">宠物</span>
                        </button>
                    </div>
                    
                    <div class="leaderboard-intro" id="leaderboardIntro">
                        <p>看看谁的博物馆之旅最精彩！参观越多，排名越高！</p>
                    </div>
                    
                    <!-- Submission Status Section -->
                    <div class="leaderboard-submission-status" id="leaderboardSubmissionStatus">
                        <div class="status-card">
                            <div class="status-header">
                                <span class="status-icon">📊</span>
                                <span class="status-title">我的数据状态</span>
                            </div>
                            <div class="status-body">
                                <div class="status-row">
                                    <span class="status-label">当前本地数据：</span>
                                    <span class="status-value" id="statusLocalData">-</span>
                                </div>
                                <div class="status-row">
                                    <span class="status-label">已提交数据：</span>
                                    <span class="status-value" id="statusSubmittedData">-</span>
                                </div>
                            </div>
                            <div class="status-actions">
                                <button id="submitToLeaderboard" class="btn-primary submit-btn" disabled>
                                    <span class="btn-icon">🚀</span>
                                    <span class="btn-text">更新到排行榜</span>
                                </button>
                                <p class="status-hint" id="statusHint">数据无变化</p>
                            </div>
                        </div>
                    </div>
                    
                    <div class="leaderboard-my-rank" id="leaderboardMyRank">
                        <div class="my-rank-card">
                            <div class="rank-badge">我的排名</div>
                            <div class="rank-info">
                                <div class="rank-number">-</div>
                                <div class="rank-details">
                                    <div class="rank-name">-</div>
                                    <div class="rank-count">0个博物馆</div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="leaderboard-list" id="leaderboardList">
                        <div class="leaderboard-loading">
                            <div class="loading-spinner"></div>
                            <p>正在加载排行榜...</p>
                        </div>
                    </div>
                    <div class="leaderboard-footer">
                        <button id="refreshLeaderboard" class="btn-secondary">🔄 刷新排行榜</button>
                        <div class="leaderboard-update-time">
                            更新时间: <span id="leaderboardUpdateTime">-</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    /**
     * 将排行榜模态框插入到页面中
     * @param {string} targetId - 目标容器ID，默认为body
     */
    injectModal: function(targetId = 'body') {
        const target = document.querySelector(targetId);
        if (target) {
            // 检查是否已经存在排行榜模态框
            if (!document.getElementById('leaderboardModal')) {
                target.insertAdjacentHTML('beforeend', this.generateModal());
                console.log('[LeaderboardTemplate] Modal injected into', targetId);
            } else {
                console.log('[LeaderboardTemplate] Modal already exists');
            }
        } else {
            console.error('[LeaderboardTemplate] Target container not found:', targetId);
        }
    },

    /**
     * 初始化排行榜模板
     * 自动在页面加载完成后插入模态框
     */
    init: function() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.injectModal();
            });
        } else {
            this.injectModal();
        }
    }
};

// 自动初始化
LeaderboardTemplate.init();
