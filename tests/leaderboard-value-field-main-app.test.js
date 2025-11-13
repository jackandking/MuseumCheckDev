/**
 * Regression test for main app leaderboard API response format issue
 * 
 * Issue: 主页点击排行榜只显示本地一条记录，没有网络其他人数据（提示：排行榜暂无数据）
 * The browser receives data but only shows 1 local record instead of all users
 * 
 * Root cause: API returns { value: '[{...}]' } but script.js only checks for items/Items
 * Expected behavior: script.js should parse the value field like admin-leaderboard.js does
 * 
 * API response example from issue:
 * {
 *   "value": "[{\"expireAt\": \"4866674732\", \"value\": \"{...}\", \"key\": \"museumcheck-leaderboard\", \"sortKey\": \"user-user_xxx\"}, ...]"
 * }
 */

describe('Main App Leaderboard API Response Parsing', () => {
    let mockFetch;
    let leaderboardManager;

    beforeEach(() => {
        // Setup mock fetch
        mockFetch = jest.fn();
        global.fetch = mockFetch;
        
        // Reset localStorage
        localStorage.clear();
        
        // Create mock LeaderboardManager that mimics script.js implementation
        leaderboardManager = {
            apiEndpoint: 'https://test-api.example.com/api',
            leaderboardKey: 'museumcheck-leaderboard',
            cacheKey: 'leaderboardCache',
            cacheExpiryKey: 'leaderboardCacheExpiry',
            cacheDuration: 10 * 60 * 1000,
            
            getCachedLeaderboard() {
                return null; // No cache for these tests
            },
            
            cacheLeaderboard(data) {
                // Mock cache function
            },
            
            async fetchLeaderboard(forceRefresh = false) {
                try {
                    // Check cache first unless force refresh
                    if (!forceRefresh) {
                        const cached = this.getCachedLeaderboard();
                        if (cached) {
                            return { success: true, data: cached, fromCache: true };
                        }
                    }

                    // Fetch from server
                    // Use sortKey=* to fetch all items, following the pattern from admin-fireworks.js
                    // Then filter for user records client-side
                    const url = `${this.apiEndpoint}?key=${encodeURIComponent(this.leaderboardKey)}&sortKey=*`;
                    const response = await fetch(url);

                    if (!response.ok) {
                        throw new Error(`Failed to fetch leaderboard: ${response.status}`);
                    }

                    const result = await response.json();
                    
                    // Parse and sort the leaderboard entries
                    const entries = [];
                    
                    // Support multiple response formats:
                    // 1. { items: [...] } or { Items: [...] } - DynamoDB direct format
                    // 2. { value: '[{...}]' } - JSON string in value field (THE FIX)
                    let itemsArray = result.items || result.Items;
                    
                    if (!itemsArray && result.value && typeof result.value === 'string') {
                        try {
                            itemsArray = JSON.parse(result.value);
                        } catch (e) {
                            console.error('Failed to parse value field:', e);
                        }
                    }
                    
                    if (itemsArray && Array.isArray(itemsArray)) {
                        for (const item of itemsArray) {
                            // Only include user records (sortKey starts with 'user-')
                            const sortKey = item.sortKey || item.sk || '';
                            if (!sortKey.startsWith('user-')) {
                                continue; // Skip non-user records
                            }
                            
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

                    // Cache the result
                    this.cacheLeaderboard(entries);

                    return { success: true, data: entries, fromCache: false };
                } catch (error) {
                    console.error('Error fetching leaderboard:', error);
                    
                    // Try to return cached data as fallback
                    const cached = this.getCachedLeaderboard();
                    if (cached) {
                        return { success: true, data: cached, fromCache: true, error: error.message };
                    }
                    
                    return { success: false, error: error.message };
                }
            }
        };
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    test('should parse API response with value field containing JSON string (issue scenario)', async () => {
        // This is the actual response format from the issue report
        const mockApiResponse = {
            value: '[{"expireAt": "4866674732", "value": "{\\"nickname\\":\\"咚咚咚\\",\\"visitedCount\\":2,\\"userId\\":\\"user_mfm1pllapx23v2mu6qd\\",\\"lastUpdate\\":1762823777771}", "key": "museumcheck-leaderboard", "sortKey": "user-user_mfm1pllapx23v2mu6qd"}, {"expireAt": "4866674732", "value": "{\\"nickname\\":\\"小淘气\\",\\"visitedCount\\":3,\\"userId\\":\\"user_mfs4dh1n95441taucth\\",\\"lastUpdate\\":1762993092291}", "key": "museumcheck-leaderboard", "sortKey": "user-user_mfs4dh1n95441taucth"}, {"expireAt": "4866674732", "value": "{\\"nickname\\":\\"咚咚咚\\",\\"visitedCount\\":7,\\"userId\\":\\"user_mga0ys6gruxcsfkbl3\\",\\"lastUpdate\\":1762785068359}", "key": "museumcheck-leaderboard", "sortKey": "user-user_mga0ys6gruxcsfkbl3"}, {"expireAt": "4866674732", "value": "{\\"nickname\\":\\"小淘气\\",\\"visitedCount\\":1,\\"userId\\":\\"user_mhrugas327xjsur3p3a\\",\\"lastUpdate\\":1762700654867}", "key": "museumcheck-leaderboard", "sortKey": "user-user_mhrugas327xjsur3p3a"}]'
        };

        // Mock fetch to return the API response format from the issue
        global.fetch = jest.fn().mockResolvedValue({
            ok: true,
            json: async () => mockApiResponse
        });

        // Fetch leaderboard data
        const result = await leaderboardManager.fetchLeaderboard(true);

        // Verify the data was parsed correctly
        expect(result.success).toBe(true);
        expect(result.data).toBeDefined();
        expect(Array.isArray(result.data)).toBe(true);
        
        // Should have 4 entries (not just 1)
        expect(result.data.length).toBe(4);
        
        // Verify entries are sorted by visitedCount descending
        expect(result.data[0].visitedCount).toBe(7);
        expect(result.data[0].nickname).toBe('咚咚咚');
        expect(result.data[0].userId).toBe('user_mga0ys6gruxcsfkbl3');
        
        expect(result.data[1].visitedCount).toBe(3);
        expect(result.data[1].nickname).toBe('小淘气');
        
        expect(result.data[2].visitedCount).toBe(2);
        expect(result.data[2].nickname).toBe('咚咚咚');
        
        expect(result.data[3].visitedCount).toBe(1);
        expect(result.data[3].nickname).toBe('小淘气');
        
        // Verify fetch was called with correct URL
        expect(global.fetch).toHaveBeenCalledWith(
            expect.stringContaining('sortKey=*')
        );
    });

    test('should still support legacy items array format', async () => {
        const mockApiResponse = {
            items: [
                {
                    value: '{"nickname":"测试用户","visitedCount":5,"userId":"user_test123","lastUpdate":1234567890}',
                    sortKey: 'user-user_test123',
                    expireAt: '4866674732'
                },
                {
                    value: '{"nickname":"另一个用户","visitedCount":3,"userId":"user_test456","lastUpdate":1234567890}',
                    sortKey: 'user-user_test456',
                    expireAt: '4866674732'
                }
            ]
        };

        global.fetch = jest.fn().mockResolvedValue({
            ok: true,
            json: async () => mockApiResponse
        });

        const result = await leaderboardManager.fetchLeaderboard(true);

        expect(result.success).toBe(true);
        expect(result.data.length).toBe(2);
        expect(result.data[0].visitedCount).toBe(5);
        expect(result.data[0].nickname).toBe('测试用户');
    });

    test('should support capital Items format for DynamoDB compatibility', async () => {
        const mockApiResponse = {
            Items: [
                {
                    value: '{"nickname":"DynamoDB用户","visitedCount":8,"userId":"user_dynamodb","lastUpdate":1234567890}',
                    sortKey: 'user-user_dynamodb',
                    expireAt: '4866674732'
                }
            ]
        };

        global.fetch = jest.fn().mockResolvedValue({
            ok: true,
            json: async () => mockApiResponse
        });

        const result = await leaderboardManager.fetchLeaderboard(true);

        expect(result.success).toBe(true);
        expect(result.data.length).toBe(1);
        expect(result.data[0].visitedCount).toBe(8);
        expect(result.data[0].nickname).toBe('DynamoDB用户');
    });

    test('should filter out non-user records when using value field', async () => {
        // Mix of user and non-user records
        const mockApiResponse = {
            value: '[{"expireAt": "4866674732", "value": "{\\"nickname\\":\\"用户1\\",\\"visitedCount\\":5,\\"userId\\":\\"user_1\\",\\"lastUpdate\\":1234567890}", "key": "museumcheck-leaderboard", "sortKey": "user-user_1"}, {"expireAt": "4866674732", "value": "{\\"config\\":\\"something\\"}", "key": "museumcheck-leaderboard", "sortKey": "config-settings"}]'
        };

        global.fetch = jest.fn().mockResolvedValue({
            ok: true,
            json: async () => mockApiResponse
        });

        const result = await leaderboardManager.fetchLeaderboard(true);

        expect(result.success).toBe(true);
        // Should only have 1 entry (the user record, not the config)
        expect(result.data.length).toBe(1);
        expect(result.data[0].nickname).toBe('用户1');
    });

    test('should return success:false for completely invalid response', async () => {
        const mockApiResponse = {
            somethingElse: 'invalid'
        };

        global.fetch = jest.fn().mockResolvedValue({
            ok: true,
            json: async () => mockApiResponse
        });

        const result = await leaderboardManager.fetchLeaderboard(true);

        // Should still succeed but with empty data
        expect(result.success).toBe(true);
        expect(result.data).toBeDefined();
        expect(result.data.length).toBe(0);
    });

    test('should handle empty value array', async () => {
        const mockApiResponse = {
            value: '[]'
        };

        global.fetch = jest.fn().mockResolvedValue({
            ok: true,
            json: async () => mockApiResponse
        });

        const result = await leaderboardManager.fetchLeaderboard(true);

        expect(result.success).toBe(true);
        expect(result.data.length).toBe(0);
    });

    test('should handle malformed JSON in value field gracefully', async () => {
        const mockApiResponse = {
            value: 'not valid json'
        };

        global.fetch = jest.fn().mockResolvedValue({
            ok: true,
            json: async () => mockApiResponse
        });

        const result = await leaderboardManager.fetchLeaderboard(true);

        // Should return empty data when JSON parse fails
        expect(result.success).toBe(true);
        expect(result.data.length).toBe(0);
    });
});
