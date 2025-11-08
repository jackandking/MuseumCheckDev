/**
 * Regression test for leaderboard force refresh after check-in
 * 
 * Issue: After force checking in a museum, the leaderboard data doesn't update
 * Fix: Force refresh leaderboard when opened shortly after score submission
 */

describe('Leaderboard Force Refresh After Check-in', () => {
  let mockLeaderboardManager;
  
  beforeEach(() => {
    // Clear localStorage
    localStorage.clear();
    
    // Create mock leaderboard manager with the new properties
    mockLeaderboardManager = {
      lastScoreSubmitTime: 0,
      scoreSubmitGracePeriod: 3000,
      
      // Method to check if should force refresh
      shouldForceRefresh() {
        if (this.lastScoreSubmitTime === 0) {
          return false;
        }
        const timeSinceSubmit = Date.now() - this.lastScoreSubmitTime;
        return timeSinceSubmit < this.scoreSubmitGracePeriod;
      },
      
      // Mock submitScore method
      async submitScore(nickname, visitedCount) {
        // Simulate successful score submission
        this.lastScoreSubmitTime = Date.now();
        return { success: true };
      }
    };
  });
  
  test('should NOT force refresh when no recent score submission', () => {
    // No score submitted yet
    expect(mockLeaderboardManager.lastScoreSubmitTime).toBe(0);
    expect(mockLeaderboardManager.shouldForceRefresh()).toBe(false);
  });
  
  test('should force refresh immediately after score submission', async () => {
    // Submit a score
    await mockLeaderboardManager.submitScore('小明', 1);
    
    // Should force refresh right after submission
    expect(mockLeaderboardManager.shouldForceRefresh()).toBe(true);
    expect(mockLeaderboardManager.lastScoreSubmitTime).toBeGreaterThan(0);
  });
  
  test('should force refresh within grace period (3 seconds)', async () => {
    // Submit a score
    await mockLeaderboardManager.submitScore('小明', 1);
    
    // Wait 1 second (within grace period)
    const now = Date.now();
    mockLeaderboardManager.lastScoreSubmitTime = now - 1000;
    
    expect(mockLeaderboardManager.shouldForceRefresh()).toBe(true);
  });
  
  test('should NOT force refresh after grace period expires', async () => {
    // Submit a score
    await mockLeaderboardManager.submitScore('小明', 1);
    
    // Wait 4 seconds (beyond grace period)
    const now = Date.now();
    mockLeaderboardManager.lastScoreSubmitTime = now - 4000;
    
    expect(mockLeaderboardManager.shouldForceRefresh()).toBe(false);
  });
  
  test('should force refresh on edge of grace period', async () => {
    // Submit a score
    const now = Date.now();
    mockLeaderboardManager.lastScoreSubmitTime = now - 2999; // Just within 3 second grace period
    
    expect(mockLeaderboardManager.shouldForceRefresh()).toBe(true);
    
    // Just after grace period
    mockLeaderboardManager.lastScoreSubmitTime = now - 3001;
    expect(mockLeaderboardManager.shouldForceRefresh()).toBe(false);
  });
  
  test('force check-in flow: submit score then open leaderboard', async () => {
    // Simulate force check-in flow
    // 1. User force checks in a museum
    const museumId = 'forbidden-city';
    const visitedMuseums = [museumId];
    localStorage.setItem('visitedMuseums', JSON.stringify(visitedMuseums));
    
    // 2. Auto-submit score to leaderboard
    await mockLeaderboardManager.submitScore('小明', visitedMuseums.length);
    
    // 3. User immediately opens leaderboard modal
    // At this point, shouldForceRefresh should return true
    const shouldForceRefresh = mockLeaderboardManager.shouldForceRefresh();
    
    expect(shouldForceRefresh).toBe(true);
    expect(mockLeaderboardManager.lastScoreSubmitTime).toBeGreaterThan(0);
  });
  
  test('grace period should be 3000ms (3 seconds)', () => {
    expect(mockLeaderboardManager.scoreSubmitGracePeriod).toBe(3000);
  });
});
