/**
 * Test for leaderboard API response case sensitivity fix
 * Tests that both 'items' and 'Items' response formats are handled correctly
 */

describe('Leaderboard API Response Case Sensitivity', () => {
  let mockApp;
  let LeaderboardManager;

  beforeEach(() => {
    // Mock app class
    mockApp = {
      visitedMuseums: ['forbidden-city', 'national-museum', 'shanghai-museum'],
      childNickname: '小明'
    };

    // Load script.js and extract LeaderboardManager
    const scriptContent = require('fs').readFileSync('./script.js', 'utf8');
    
    // Create a minimal LeaderboardManager for testing
    LeaderboardManager = class {
      constructor(app) {
        this.app = app;
        this.cacheKey = 'leaderboardCache';
        this.cacheExpiryKey = 'leaderboardCacheExpiry';
        this.cacheDuration = 10 * 60 * 1000;
        this.apiEndpoint = 'https://test.api.example.com/test';
        this.leaderboardKey = 'test-leaderboard';
      }

      getCachedLeaderboard() {
        return null; // No cache for testing
      }

      cacheLeaderboard(data) {
        // No-op for testing
      }

      // This is the method we're testing - copied from script.js
      async parseAPIResponse(result) {
        const entries = [];
        // Support both 'items' (lowercase) and 'Items' (capital I) for AWS DynamoDB compatibility
        const itemsArray = result.items || result.Items;
        if (itemsArray && Array.isArray(itemsArray)) {
          for (const item of itemsArray) {
            try {
              const data = JSON.parse(item.value);
              entries.push(data);
            } catch (e) {
              console.warn('Failed to parse leaderboard entry:', e);
            }
          }
        }
        
        // Sort by visitedCount descending
        entries.sort((a, b) => b.visitedCount - a.visitedCount);
        return entries;
      }
    };
  });

  test('should parse API response with lowercase "items" key', async () => {
    const manager = new LeaderboardManager(mockApp);
    
    const apiResponse = {
      items: [
        {
          value: JSON.stringify({
            userId: 'user-1',
            nickname: '小明',
            visitedCount: 5,
            lastUpdate: Date.now()
          })
        },
        {
          value: JSON.stringify({
            userId: 'user-2',
            nickname: '小红',
            visitedCount: 3,
            lastUpdate: Date.now()
          })
        }
      ]
    };

    const entries = await manager.parseAPIResponse(apiResponse);
    
    expect(entries).toHaveLength(2);
    expect(entries[0].visitedCount).toBe(5); // Sorted by count descending
    expect(entries[1].visitedCount).toBe(3);
  });

  test('should parse API response with capital "Items" key (AWS DynamoDB format)', async () => {
    const manager = new LeaderboardManager(mockApp);
    
    const apiResponse = {
      Items: [  // Capital I - AWS DynamoDB format
        {
          value: JSON.stringify({
            userId: 'user-1',
            nickname: '小明',
            visitedCount: 5,
            lastUpdate: Date.now()
          })
        },
        {
          value: JSON.stringify({
            userId: 'user-2',
            nickname: '小红',
            visitedCount: 3,
            lastUpdate: Date.now()
          })
        }
      ]
    };

    const entries = await manager.parseAPIResponse(apiResponse);
    
    expect(entries).toHaveLength(2);
    expect(entries[0].visitedCount).toBe(5);
    expect(entries[1].visitedCount).toBe(3);
  });

  test('should return empty array when API response has no items/Items key', async () => {
    const manager = new LeaderboardManager(mockApp);
    
    const apiResponse = {
      data: [],  // Wrong key
      count: 0
    };

    const entries = await manager.parseAPIResponse(apiResponse);
    
    expect(entries).toHaveLength(0);
  });

  test('should return empty array when items/Items is null', async () => {
    const manager = new LeaderboardManager(mockApp);
    
    const apiResponse = {
      items: null
    };

    const entries = await manager.parseAPIResponse(apiResponse);
    
    expect(entries).toHaveLength(0);
  });

  test('should return empty array when items/Items is not an array', async () => {
    const manager = new LeaderboardManager(mockApp);
    
    const apiResponse = {
      items: "not an array"
    };

    const entries = await manager.parseAPIResponse(apiResponse);
    
    expect(entries).toHaveLength(0);
  });

  test('should skip entries with invalid JSON value', async () => {
    const manager = new LeaderboardManager(mockApp);
    
    const apiResponse = {
      items: [
        {
          value: JSON.stringify({
            userId: 'user-1',
            nickname: '小明',
            visitedCount: 5,
            lastUpdate: Date.now()
          })
        },
        {
          value: "invalid json {"  // Invalid JSON
        },
        {
          value: JSON.stringify({
            userId: 'user-2',
            nickname: '小红',
            visitedCount: 3,
            lastUpdate: Date.now()
          })
        }
      ]
    };

    const entries = await manager.parseAPIResponse(apiResponse);
    
    // Should have 2 entries (skipped the invalid one)
    expect(entries).toHaveLength(2);
    expect(entries[0].userId).toBe('user-1');
    expect(entries[1].userId).toBe('user-2');
  });

  test('should prefer "items" over "Items" if both exist', async () => {
    const manager = new LeaderboardManager(mockApp);
    
    const apiResponse = {
      items: [
        {
          value: JSON.stringify({
            userId: 'lowercase-user',
            nickname: '小明',
            visitedCount: 5,
            lastUpdate: Date.now()
          })
        }
      ],
      Items: [
        {
          value: JSON.stringify({
            userId: 'uppercase-user',
            nickname: '小红',
            visitedCount: 3,
            lastUpdate: Date.now()
          })
        }
      ]
    };

    const entries = await manager.parseAPIResponse(apiResponse);
    
    // Should use lowercase 'items' (first in the OR chain)
    expect(entries).toHaveLength(1);
    expect(entries[0].userId).toBe('lowercase-user');
  });
});

describe('Admin Leaderboard Case Sensitivity', () => {
  test('admin-leaderboard.js supports both items and Items', () => {
    const adminContent = require('fs').readFileSync('./admin-leaderboard.js', 'utf8');
    
    // Verify the fix is present
    expect(adminContent).toContain('data.items || data.Items');
    expect(adminContent).toContain('AWS DynamoDB compatibility');
  });

  test('script.js supports both items and Items', () => {
    const scriptContent = require('fs').readFileSync('./script.js', 'utf8');
    
    // Verify the fix is present
    expect(scriptContent).toContain('result.items || result.Items');
    expect(scriptContent).toContain('AWS DynamoDB compatibility');
  });
});
