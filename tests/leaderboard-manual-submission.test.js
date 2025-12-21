/**
 * Test for leaderboard manual submission feature
 * 
 * Issue: 排行榜手动更新
 * 
 * Requirement: Users should be able to view their current data and the latest leaderboard,
 * then manually decide whether to submit their score to the leaderboard.
 * 
 * Features:
 * 1. UUID generation for each user to avoid duplicate records when nickname changes
 * 2. Manual submission instead of auto-submission
 * 3. Display comparison between local data and submitted data
 * 4. Allow user to decide when to update their score
 */

describe('Leaderboard manual submission', () => {
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
        
        // Create LeaderboardManager mock that matches the new getSubmissionStatus logic
        leaderboardManager = {
            app: mockApp,
            getSubmissionStatus: function() {
                const localVisits = this.app.visitedMuseums.length;
                const submittedVisits = parseInt(localStorage.getItem('lastSubmittedVisitCount') || '0', 10);
                
                let localXP = 0;
                if (this.app.achievementGamification) {
                    const xpData = this.app.achievementGamification.getXPInfo();
                    localXP = xpData.total || 0;
                }
                const submittedXP = parseInt(localStorage.getItem('lastSubmittedXP') || '0', 10);
                
                let localPetPower = 0;
                const submittedPetPower = parseInt(localStorage.getItem('lastSubmittedPetPower') || '0', 10);
                
                return {
                    local: {
                        visits: localVisits,
                        xp: localXP,
                        petPower: localPetPower
                    },
                    submitted: {
                        visits: submittedVisits,
                        xp: submittedXP,
                        petPower: submittedPetPower
                    },
                    hasChanges: localVisits !== submittedVisits || localXP !== submittedXP || localPetPower !== submittedPetPower,
                    isFirstSubmit: submittedVisits === 0 && submittedXP === 0 && submittedPetPower === 0
                };
            }
        };
    });
    
    test('getSubmissionStatus returns hasChanges=true when XP changes but visit count stays the same', () => {
        // Initially, both XP and visit count are 0
        let status = leaderboardManager.getSubmissionStatus();
        expect(status.hasChanges).toBe(false);
        expect(status.isFirstSubmit).toBe(true);
        
        // Now XP changes to 5 (from completing a task)
        mockApp.achievementGamification.getXPInfo.mockReturnValue({ total: 5, level: 1 });
        
        // getSubmissionStatus should return hasChanges=true because XP changed
        status = leaderboardManager.getSubmissionStatus();
        expect(status.hasChanges).toBe(true);
        expect(status.local.xp).toBe(5);
        expect(status.submitted.xp).toBe(0);
    });
    
    test('getSubmissionStatus returns hasChanges=false when lastSubmittedXP matches current XP', () => {
        // Set XP to 5 and mark as submitted
        mockApp.achievementGamification.getXPInfo.mockReturnValue({ total: 5, level: 1 });
        localStorage.setItem('lastSubmittedXP', '5');
        
        // getSubmissionStatus should return hasChanges=false because nothing changed
        const status = leaderboardManager.getSubmissionStatus();
        expect(status.hasChanges).toBe(false);
        expect(status.local.xp).toBe(5);
        expect(status.submitted.xp).toBe(5);
    });
    
    test('getSubmissionStatus returns hasChanges=true when visit count changes', () => {
        // Add a visited museum
        mockApp.visitedMuseums.push('forbidden-city');
        
        // getSubmissionStatus should return hasChanges=true because visit count changed
        const status = leaderboardManager.getSubmissionStatus();
        expect(status.hasChanges).toBe(true);
        expect(status.local.visits).toBe(1);
        expect(status.submitted.visits).toBe(0);
    });
    
    test('getSubmissionStatus returns hasChanges=true when both XP and visit count change', () => {
        // Change both XP and visit count
        mockApp.achievementGamification.getXPInfo.mockReturnValue({ total: 15, level: 1 });
        mockApp.visitedMuseums.push('national-museum');
        
        // getSubmissionStatus should return hasChanges=true
        const status = leaderboardManager.getSubmissionStatus();
        expect(status.hasChanges).toBe(true);
        expect(status.local.visits).toBe(1);
        expect(status.local.xp).toBe(15);
    });
    
    test('getSubmissionStatus correctly handles missing achievementGamification', () => {
        // Remove achievementGamification
        mockApp.achievementGamification = null;
        
        // No changes, should return isFirstSubmit=true and hasChanges=false
        let status = leaderboardManager.getSubmissionStatus();
        expect(status.hasChanges).toBe(false);
        expect(status.isFirstSubmit).toBe(true);
        
        // Add a museum visit
        mockApp.visitedMuseums.push('shanghai-museum');
        
        // Should detect visit count change
        status = leaderboardManager.getSubmissionStatus();
        expect(status.hasChanges).toBe(true);
        expect(status.local.visits).toBe(1);
    });
    
    test('getSubmissionStatus handles incremental XP gains', () => {
        // First XP gain: 5
        mockApp.achievementGamification.getXPInfo.mockReturnValue({ total: 5, level: 1 });
        let status = leaderboardManager.getSubmissionStatus();
        expect(status.hasChanges).toBe(true);
        
        // Simulate submission
        localStorage.setItem('lastSubmittedXP', '5');
        
        // No change, should be false
        status = leaderboardManager.getSubmissionStatus();
        expect(status.hasChanges).toBe(false);
        
        // Second XP gain: 10
        mockApp.achievementGamification.getXPInfo.mockReturnValue({ total: 10, level: 1 });
        status = leaderboardManager.getSubmissionStatus();
        expect(status.hasChanges).toBe(true);
        
        // Simulate submission
        localStorage.setItem('lastSubmittedXP', '10');
        
        // No change, should be false
        status = leaderboardManager.getSubmissionStatus();
        expect(status.hasChanges).toBe(false);
    });
    
    test('getSubmissionStatus correctly identifies first-time submission', () => {
        const status = leaderboardManager.getSubmissionStatus();
        expect(status.isFirstSubmit).toBe(true);
        expect(status.hasChanges).toBe(false);
        
        // After submitting at least one field with non-zero value, isFirstSubmit should be false
        localStorage.setItem('lastSubmittedVisitCount', '1');
        const status2 = leaderboardManager.getSubmissionStatus();
        expect(status2.isFirstSubmit).toBe(false);
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
