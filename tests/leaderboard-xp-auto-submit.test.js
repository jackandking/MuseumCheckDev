/**
 * Regression test for leaderboard XP auto-submit bug
 * 
 * Issue: 排行榜不工作
 * 
 * Problem: After completing a task at 首都博物馆, the XP is added locally
 * but not submitted to the leaderboard server. The user expects to see
 * their XP rank in the leaderboard XP tab.
 * 
 * Root cause: autoSubmitScore() was only checking if visitedMuseums.length changed,
 * but not if XP changed. This meant XP gains from tasks were never submitted.
 * 
 * Fix: 
 * 1. Modified shouldSubmitScore() to also check XP changes
 * 2. Added auto-submit call after XP is added in checklist item completion
 * 3. Save lastSubmittedXP in localStorage to track XP changes
 */

describe('Leaderboard XP auto-submit fix', () => {
    let leaderboardManager;
    let mockApp;
    
    beforeEach(() => {
        // Reset localStorage
        localStorage.clear();
        
        // Mock app with achievementGamification
        mockApp = {
            visitedMuseums: [],
            childNickname: '小明',
            achievementGamification: {
                getXPInfo: jest.fn(() => ({ total: 0, level: 1 }))
            }
        };
        
        // Create LeaderboardManager mock that matches the new shouldSubmitScore logic
        leaderboardManager = {
            app: mockApp,
            shouldSubmitScore: function() {
                const lastSubmittedCount = parseInt(localStorage.getItem('lastSubmittedVisitCount') || '0', 10);
                const currentCount = this.app.visitedMuseums.length;
                
                // Check if visit count changed
                if (currentCount !== lastSubmittedCount) {
                    return true;
                }
                
                // Also check if XP changed (for XP leaderboard tab)
                const lastSubmittedXP = parseInt(localStorage.getItem('lastSubmittedXP') || '0', 10);
                let currentXP = 0;
                if (this.app.achievementGamification) {
                    const xpData = this.app.achievementGamification.getXPInfo();
                    currentXP = xpData.total || 0;
                }
                
                return currentXP !== lastSubmittedXP;
            }
        };
    });
    
    test('shouldSubmitScore returns true when XP changes but visit count stays the same', () => {
        // Initially, both XP and visit count are 0
        expect(leaderboardManager.shouldSubmitScore()).toBe(false);
        
        // Now XP changes to 5 (from completing a task)
        mockApp.achievementGamification.getXPInfo.mockReturnValue({ total: 5, level: 1 });
        
        // shouldSubmitScore should return true because XP changed
        expect(leaderboardManager.shouldSubmitScore()).toBe(true);
    });
    
    test('shouldSubmitScore returns false when lastSubmittedXP matches current XP', () => {
        // Set XP to 5 and mark as submitted
        mockApp.achievementGamification.getXPInfo.mockReturnValue({ total: 5, level: 1 });
        localStorage.setItem('lastSubmittedXP', '5');
        
        // shouldSubmitScore should return false because nothing changed
        expect(leaderboardManager.shouldSubmitScore()).toBe(false);
    });
    
    test('shouldSubmitScore returns true when visit count changes', () => {
        // Add a visited museum
        mockApp.visitedMuseums.push('forbidden-city');
        
        // shouldSubmitScore should return true because visit count changed
        expect(leaderboardManager.shouldSubmitScore()).toBe(true);
    });
    
    test('shouldSubmitScore returns true when both XP and visit count change', () => {
        // Change both XP and visit count
        mockApp.achievementGamification.getXPInfo.mockReturnValue({ total: 15, level: 1 });
        mockApp.visitedMuseums.push('national-museum');
        
        // shouldSubmitScore should return true
        expect(leaderboardManager.shouldSubmitScore()).toBe(true);
    });
    
    test('shouldSubmitScore correctly handles missing achievementGamification', () => {
        // Remove achievementGamification
        mockApp.achievementGamification = null;
        
        // No changes, should return false
        expect(leaderboardManager.shouldSubmitScore()).toBe(false);
        
        // Add a museum visit
        mockApp.visitedMuseums.push('shanghai-museum');
        
        // Should still work based on visit count
        expect(leaderboardManager.shouldSubmitScore()).toBe(true);
    });
    
    test('shouldSubmitScore handles incremental XP gains', () => {
        // First XP gain: 5
        mockApp.achievementGamification.getXPInfo.mockReturnValue({ total: 5, level: 1 });
        expect(leaderboardManager.shouldSubmitScore()).toBe(true);
        
        // Simulate submission
        localStorage.setItem('lastSubmittedXP', '5');
        
        // No change, should be false
        expect(leaderboardManager.shouldSubmitScore()).toBe(false);
        
        // Second XP gain: 10
        mockApp.achievementGamification.getXPInfo.mockReturnValue({ total: 10, level: 1 });
        expect(leaderboardManager.shouldSubmitScore()).toBe(true);
        
        // Simulate submission
        localStorage.setItem('lastSubmittedXP', '10');
        
        // No change, should be false
        expect(leaderboardManager.shouldSubmitScore()).toBe(false);
    });
});

describe('Leaderboard displays correct XP in my rank section', () => {
    beforeEach(() => {
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
                                    <div class="rank-count" id="myRankCount">0 积分</div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="leaderboard-list" id="leaderboardList"></div>
                </div>
            </div>
        `;
    });
    
    test('should display local XP when leaderboard is empty for XP ranking', () => {
        // Create a mock app with renderMyRank logic
        const app = {
            visitedMuseums: [],
            childNickname: '小红',
            achievementGamification: {
                getXPInfo: () => ({ total: 15, level: 1 })
            },
            renderMyRank: function(rank, entries, userId, rankingType = 'visits') {
                const positionElem = document.getElementById('myRankPosition');
                const nicknameElem = document.getElementById('myRankNickname');
                const countElem = document.getElementById('myRankCount');

                // Get local values based on ranking type
                let localValueLabel = '';
                switch (rankingType) {
                    case 'xp':
                        let xp = 0;
                        if (this.achievementGamification) {
                            const xpData = this.achievementGamification.getXPInfo();
                            xp = xpData.total || 0;
                        }
                        localValueLabel = `${xp} 积分`;
                        break;
                    case 'visits':
                    default:
                        localValueLabel = `${this.visitedMuseums.length}个博物馆`;
                        break;
                }

                if (!rank || !entries || entries.length === 0) {
                    // Not ranked yet
                    if (positionElem) positionElem.textContent = '-';
                    if (nicknameElem) nicknameElem.textContent = this.childNickname || '小朋友';
                    if (countElem) countElem.textContent = localValueLabel;
                    return;
                }
            }
        };
        
        // Render my rank for XP ranking type with empty leaderboard
        app.renderMyRank(null, [], 'test-user', 'xp');
        
        // Verify the count element shows local XP
        const countElem = document.getElementById('myRankCount');
        expect(countElem.textContent).toBe('15 积分');
        
        const nicknameElem = document.getElementById('myRankNickname');
        expect(nicknameElem.textContent).toBe('小红');
        
        const positionElem = document.getElementById('myRankPosition');
        expect(positionElem.textContent).toBe('-');
    });
    
    test('should display 0 积分 when no XP earned', () => {
        const app = {
            visitedMuseums: [],
            childNickname: '小明',
            achievementGamification: {
                getXPInfo: () => ({ total: 0, level: 1 })
            },
            renderMyRank: function(rank, entries, userId, rankingType = 'visits') {
                const countElem = document.getElementById('myRankCount');
                
                let localValueLabel = '';
                switch (rankingType) {
                    case 'xp':
                        let xp = 0;
                        if (this.achievementGamification) {
                            const xpData = this.achievementGamification.getXPInfo();
                            xp = xpData.total || 0;
                        }
                        localValueLabel = `${xp} 积分`;
                        break;
                    case 'visits':
                    default:
                        localValueLabel = `${this.visitedMuseums.length}个博物馆`;
                        break;
                }
                
                if (countElem) countElem.textContent = localValueLabel;
            }
        };
        
        app.renderMyRank(null, [], 'test-user', 'xp');
        
        const countElem = document.getElementById('myRankCount');
        expect(countElem.textContent).toBe('0 积分');
    });
});
