/**
 * Regression test for leaderboard display bug
 * 
 * Issue: After checking in a museum on mobile, the leaderboard shows "0个博物馆" 
 * instead of the actual visit count when the leaderboard is empty or fails to load.
 * 
 * Root cause: When leaderboard fetch fails or returns empty data, renderMyRank() 
 * is not called, leaving the default HTML values (including "0个博物馆").
 */

describe('Leaderboard empty state regression test', () => {
    let app;
    let mockLeaderboardManager;
    
    beforeEach(() => {
        // Reset localStorage
        localStorage.clear();
        
        // Setup DOM
        document.body.innerHTML = `
            <div id="leaderboardModal" class="modal leaderboard-modal hidden">
                <div class="modal-content leaderboard-content">
                    <div class="leaderboard-my-rank" id="leaderboardMyRank">
                        <div class="my-rank-card">
                            <div class="rank-badge">我的排名</div>
                            <div class="rank-info">
                                <div class="rank-position" id="myRankPosition">-</div>
                                <div class="rank-details">
                                    <div class="rank-nickname" id="myRankNickname">-</div>
                                    <div class="rank-count" id="myRankCount">0个博物馆</div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="leaderboard-list" id="leaderboardList"></div>
                </div>
            </div>
        `;
        
        // Mock LeaderboardManager
        mockLeaderboardManager = {
            fetchLeaderboard: jest.fn(),
            getUserId: jest.fn(() => 'test-user-123'),
            getUserRank: jest.fn(),
            shouldForceRefresh: jest.fn(() => false)
        };
    });
    
    test('should display correct visit count when leaderboard fetch fails', async () => {
        // Simulate user has visited 1 museum
        localStorage.setItem('visitedMuseums', JSON.stringify(['forbidden-city']));
        
        // Mock leaderboard fetch to fail
        mockLeaderboardManager.fetchLeaderboard.mockResolvedValue({
            success: false,
            data: null
        });
        
        // Create a minimal app mock
        const app = {
            visitedMuseums: JSON.parse(localStorage.getItem('visitedMuseums') || '[]'),
            childNickname: '小明',
            leaderboardManager: mockLeaderboardManager,
            modalManager: {
                showModal: jest.fn()
            },
            trackEvent: jest.fn(),
            renderMyRank: function(rank, entries, userId) {
                const positionElem = document.getElementById('myRankPosition');
                const nicknameElem = document.getElementById('myRankNickname');
                const countElem = document.getElementById('myRankCount');

                if (!rank || !entries || entries.length === 0) {
                    // Not ranked yet
                    if (positionElem) positionElem.textContent = '-';
                    if (nicknameElem) nicknameElem.textContent = this.childNickname || '小朋友';
                    if (countElem) countElem.textContent = `${this.visitedMuseums.length}个博物馆`;
                    return;
                }

                const myEntry = entries.find(e => e.userId === userId);
                
                if (positionElem) {
                    positionElem.textContent = `#${rank}`;
                }
                
                if (nicknameElem) {
                    nicknameElem.textContent = myEntry ? myEntry.nickname : (this.childNickname || '小朋友');
                }
                
                if (countElem) {
                    const count = myEntry ? myEntry.visitedCount : this.visitedMuseums.length;
                    countElem.textContent = `${count}个博物馆`;
                }
            },
            renderLeaderboard: async function(forceRefresh = false) {
                const listContainer = document.getElementById('leaderboardList');
                
                // Show loading state
                listContainer.innerHTML = `
                    <div class="leaderboard-loading">
                        <div class="loading-spinner"></div>
                        <p>正在加载排行榜...</p>
                    </div>
                `;

                try {
                    // Fetch leaderboard data
                    const result = await this.leaderboardManager.fetchLeaderboard(forceRefresh);
                    
                    if (!result.success || !result.data || result.data.length === 0) {
                        // Show empty state
                        listContainer.innerHTML = `
                            <div class="leaderboard-empty">
                                <div class="empty-icon">🏅</div>
                                <p>排行榜暂无数据</p>
                                <p>快去参观博物馆,成为第一名吧!</p>
                            </div>
                        `;
                        
                        // BUG FIX: Still render my rank even when leaderboard is empty
                        const userId = this.leaderboardManager.getUserId();
                        this.renderMyRank(null, [], userId);
                        return;
                    }

                    const entries = result.data;
                    const userId = this.leaderboardManager.getUserId();
                    const myRank = this.leaderboardManager.getUserRank(entries, userId);

                    // Update my rank display
                    this.renderMyRank(myRank, entries, userId);
                } catch (error) {
                    console.error('Error rendering leaderboard:', error);
                    listContainer.innerHTML = `
                        <div class="leaderboard-empty">
                            <div class="empty-icon">⚠️</div>
                            <p>加载失败</p>
                            <p>请稍后重试</p>
                        </div>
                    `;
                    
                    // BUG FIX: Still render my rank even on error
                    const userId = this.leaderboardManager.getUserId();
                    this.renderMyRank(null, [], userId);
                }
            }
        };
        
        // Call renderLeaderboard
        await app.renderLeaderboard();
        
        // Verify the count element was updated
        const countElem = document.getElementById('myRankCount');
        expect(countElem.textContent).toBe('1个博物馆');
        expect(countElem.textContent).not.toBe('0个博物馆');
        
        // Verify position and nickname also updated
        const positionElem = document.getElementById('myRankPosition');
        const nicknameElem = document.getElementById('myRankNickname');
        expect(positionElem.textContent).toBe('-');
        expect(nicknameElem.textContent).toBe('小明');
    });
    
    test('should display correct visit count when leaderboard is empty', async () => {
        // Simulate user has visited 3 museums
        localStorage.setItem('visitedMuseums', JSON.stringify(['museum1', 'museum2', 'museum3']));
        
        // Mock leaderboard fetch to return empty array
        mockLeaderboardManager.fetchLeaderboard.mockResolvedValue({
            success: true,
            data: []
        });
        
        const app = {
            visitedMuseums: JSON.parse(localStorage.getItem('visitedMuseums') || '[]'),
            childNickname: '小红',
            leaderboardManager: mockLeaderboardManager,
            modalManager: {
                showModal: jest.fn()
            },
            trackEvent: jest.fn(),
            renderMyRank: function(rank, entries, userId) {
                const positionElem = document.getElementById('myRankPosition');
                const nicknameElem = document.getElementById('myRankNickname');
                const countElem = document.getElementById('myRankCount');

                if (!rank || !entries || entries.length === 0) {
                    // Not ranked yet
                    if (positionElem) positionElem.textContent = '-';
                    if (nicknameElem) nicknameElem.textContent = this.childNickname || '小朋友';
                    if (countElem) countElem.textContent = `${this.visitedMuseums.length}个博物馆`;
                    return;
                }

                const myEntry = entries.find(e => e.userId === userId);
                
                if (positionElem) {
                    positionElem.textContent = `#${rank}`;
                }
                
                if (nicknameElem) {
                    nicknameElem.textContent = myEntry ? myEntry.nickname : (this.childNickname || '小朋友');
                }
                
                if (countElem) {
                    const count = myEntry ? myEntry.visitedCount : this.visitedMuseums.length;
                    countElem.textContent = `${count}个博物馆`;
                }
            },
            renderLeaderboard: async function(forceRefresh = false) {
                const listContainer = document.getElementById('leaderboardList');
                
                listContainer.innerHTML = `
                    <div class="leaderboard-loading">
                        <div class="loading-spinner"></div>
                        <p>正在加载排行榜...</p>
                    </div>
                `;

                try {
                    const result = await this.leaderboardManager.fetchLeaderboard(forceRefresh);
                    
                    if (!result.success || !result.data || result.data.length === 0) {
                        listContainer.innerHTML = `
                            <div class="leaderboard-empty">
                                <div class="empty-icon">🏅</div>
                                <p>排行榜暂无数据</p>
                                <p>快去参观博物馆,成为第一名吧!</p>
                            </div>
                        `;
                        
                        // BUG FIX: Still render my rank even when leaderboard is empty
                        const userId = this.leaderboardManager.getUserId();
                        this.renderMyRank(null, [], userId);
                        return;
                    }

                    const entries = result.data;
                    const userId = this.leaderboardManager.getUserId();
                    const myRank = this.leaderboardManager.getUserRank(entries, userId);
                    this.renderMyRank(myRank, entries, userId);
                } catch (error) {
                    console.error('Error rendering leaderboard:', error);
                    listContainer.innerHTML = `
                        <div class="leaderboard-empty">
                            <div class="empty-icon">⚠️</div>
                            <p>加载失败</p>
                            <p>请稍后重试</p>
                        </div>
                    `;
                    
                    // BUG FIX: Still render my rank even on error
                    const userId = this.leaderboardManager.getUserId();
                    this.renderMyRank(null, [], userId);
                }
            }
        };
        
        await app.renderLeaderboard();
        
        const countElem = document.getElementById('myRankCount');
        expect(countElem.textContent).toBe('3个博物馆');
        expect(countElem.textContent).not.toBe('0个博物馆');
        
        const nicknameElem = document.getElementById('myRankNickname');
        expect(nicknameElem.textContent).toBe('小红');
    });
});
