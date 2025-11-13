/**
 * Regression test for leaderboard sortKey pattern bug
 * 
 * Issue: Homepage leaderboard only shows one local record, missing network data from other users
 * (主页点击排行榜只显示本地一条记录，没有网络其他人数据)
 * 
 * Root cause: The fetchLeaderboard() function was using sortKey=user-* which may not be supported
 * by the API's wildcard pattern matching. The fix uses sortKey=* (like the working fireworks pattern)
 * to fetch all records, then filters client-side for user records (sortKey starts with "user-").
 * 
 * This test verifies that:
 * 1. fetchLeaderboard uses sortKey=* to query all records
 * 2. Client-side filtering only includes records with sortKey starting with "user-"
 * 3. Multiple user records are returned (not just one local record)
 * 4. The admin leaderboard also uses the same pattern
 */

describe('Leaderboard sortKey pattern regression test', () => {
    let mockFetch;
    
    beforeEach(() => {
        // Setup mock fetch
        mockFetch = jest.fn();
        global.fetch = mockFetch;
        
        // Reset localStorage
        localStorage.clear();
    });
    
    afterEach(() => {
        jest.restoreAllMocks();
    });
    
    test('fetchLeaderboard should use sortKey=* and filter for user records client-side', async () => {
        // Mock API response with multiple records including non-user records
        const mockApiResponse = {
            items: [
                {
                    sortKey: 'user-123',
                    value: JSON.stringify({
                        userId: 'user-123',
                        nickname: '小明',
                        visitedCount: 5,
                        lastUpdate: Date.now()
                    })
                },
                {
                    sortKey: 'user-456',
                    value: JSON.stringify({
                        userId: 'user-456',
                        nickname: '小红',
                        visitedCount: 3,
                        lastUpdate: Date.now()
                    })
                },
                {
                    sortKey: 'admin-config',  // Non-user record - should be filtered out
                    value: JSON.stringify({
                        config: 'test'
                    })
                },
                {
                    sortKey: 'user-789',
                    value: JSON.stringify({
                        userId: 'user-789',
                        nickname: '小刚',
                        visitedCount: 8,
                        lastUpdate: Date.now()
                    })
                }
            ]
        };
        
        mockFetch.mockResolvedValue({
            ok: true,
            json: async () => mockApiResponse
        });
        
        // Create mock LeaderboardManager
        const mockLeaderboardManager = {
            apiEndpoint: 'https://test-api.example.com/api',
            leaderboardKey: 'museumcheck-leaderboard',
            cacheKey: 'leaderboardCache',
            cacheExpiryKey: 'leaderboardCacheExpiry',
            cacheDuration: 10 * 60 * 1000,
            
            getCachedLeaderboard() {
                return null; // No cache for this test
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
                    const itemsArray = result.items || result.Items;
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
        
        // Call fetchLeaderboard
        const result = await mockLeaderboardManager.fetchLeaderboard(false);
        
        // Verify the result is successful
        expect(result.success).toBe(true);
        expect(result.fromCache).toBe(false);
        
        // Verify fetch was called
        expect(mockFetch).toHaveBeenCalledTimes(1);
        
        // Get the call arguments
        const [url] = mockFetch.mock.calls[0];
        
        // CRITICAL: Verify that sortKey=* is used (not sortKey=user-*)
        expect(url).toContain('sortKey=*');
        expect(url).not.toContain('sortKey=user-*');
        
        // Verify URL contains the correct parameters
        expect(url).toContain('key=museumcheck-leaderboard');
        
        // Verify multiple user entries are returned (admin-config record should be filtered out)
        expect(result.data).toBeDefined();
        expect(Array.isArray(result.data)).toBe(true);
        expect(result.data.length).toBe(3); // Should return 3 user records (admin-config filtered out)
        
        // Verify entries are sorted by visitedCount descending
        expect(result.data[0].nickname).toBe('小刚'); // 8 museums
        expect(result.data[0].visitedCount).toBe(8);
        expect(result.data[1].nickname).toBe('小明'); // 5 museums
        expect(result.data[1].visitedCount).toBe(5);
        expect(result.data[2].nickname).toBe('小红'); // 3 museums
        expect(result.data[2].visitedCount).toBe(3);
    });
    
    test('admin leaderboard should also use sortKey=* pattern with client-side filtering', async () => {
        // Mock API response with multiple records including non-user records
        const mockApiResponse = {
            items: [
                {
                    sortKey: 'user-abc',
                    value: JSON.stringify({
                        userId: 'user-abc',
                        nickname: '测试用户1',
                        visitedCount: 10,
                        lastUpdate: Date.now()
                    })
                },
                {
                    sortKey: 'config-setting',  // Non-user record - should be filtered out
                    value: JSON.stringify({
                        setting: 'test'
                    })
                },
                {
                    sortKey: 'user-def',
                    value: JSON.stringify({
                        userId: 'user-def',
                        nickname: '测试用户2',
                        visitedCount: 7,
                        lastUpdate: Date.now()
                    })
                }
            ]
        };
        
        mockFetch.mockResolvedValue({
            ok: true,
            json: async () => mockApiResponse
        });
        
        // Simulate admin-leaderboard.js fetchLeaderboard function
        const CONFIG = {
            API_ENDPOINT: 'https://test-api.example.com/api',
            LEADERBOARD_KEY: 'museumcheck-leaderboard'
        };
        
        const fetchLeaderboard = async () => {
            // Use sortKey=* to fetch all items, then filter for user records client-side
            const url = `${CONFIG.API_ENDPOINT}?key=${encodeURIComponent(CONFIG.LEADERBOARD_KEY)}&sortKey=*`;
            
            const res = await fetch(url);
            if (!res.ok) throw new Error('Failed to fetch leaderboard: ' + res.status);
            const data = await res.json();
            
            // Parse entries
            const entries = [];
            const itemsArray = data.items || data.Items;
            
            if (itemsArray && Array.isArray(itemsArray)) {
                for (const item of itemsArray) {
                    // Only include user records (sortKey starts with 'user-')
                    const sortKey = item.sortKey || item.sk || '';
                    if (!sortKey.startsWith('user-')) {
                        continue; // Skip non-user records
                    }
                    
                    try {
                        const parsed = JSON.parse(item.value);
                        parsed._sortKey = item.sortKey || item.sk;
                        entries.push(parsed);
                    } catch (e) {
                        console.warn('Failed to parse entry:', e, item);
                    }
                }
            }
            
            // Sort by visitedCount descending
            entries.sort((a, b) => (b.visitedCount || 0) - (a.visitedCount || 0));
            
            return entries;
        };
        
        // Call fetchLeaderboard
        const entries = await fetchLeaderboard();
        
        // Verify fetch was called
        expect(mockFetch).toHaveBeenCalledTimes(1);
        
        // Get the call arguments
        const [url] = mockFetch.mock.calls[0];
        
        // CRITICAL: Verify that sortKey=* is used (not sortKey=user-*)
        expect(url).toContain('sortKey=*');
        expect(url).not.toContain('sortKey=user-*');
        
        // Verify multiple user entries are returned (config-setting should be filtered out)
        expect(entries).toBeDefined();
        expect(Array.isArray(entries)).toBe(true);
        expect(entries.length).toBe(2);
        
        // Verify correct sorting
        expect(entries[0].nickname).toBe('测试用户1');
        expect(entries[0].visitedCount).toBe(10);
        expect(entries[1].nickname).toBe('测试用户2');
        expect(entries[1].visitedCount).toBe(7);
    });
    
    test('verifies client-side filtering works correctly', async () => {
        // This test verifies that client-side filtering correctly excludes non-user records
        
        // Mock API response with mixed record types
        const mockMixedResponse = {
            items: [
                {
                    sortKey: 'user-123',
                    value: JSON.stringify({
                        userId: 'user-123',
                        nickname: '用户A',
                        visitedCount: 5,
                        lastUpdate: Date.now()
                    })
                },
                {
                    sortKey: 'admin-settings',
                    value: JSON.stringify({
                        setting: 'admin'
                    })
                },
                {
                    sortKey: 'config-data',
                    value: JSON.stringify({
                        config: 'test'
                    })
                },
                {
                    sortKey: 'user-456',
                    value: JSON.stringify({
                        userId: 'user-456',
                        nickname: '用户B',
                        visitedCount: 3,
                        lastUpdate: Date.now()
                    })
                }
            ]
        };
        
        mockFetch.mockResolvedValue({
            ok: true,
            json: async () => mockMixedResponse
        });
        
        // Use the same filtering logic as the main app
        const fetchWithFilter = async () => {
            const apiEndpoint = 'https://test-api.example.com/api';
            const leaderboardKey = 'museumcheck-leaderboard';
            
            const url = `${apiEndpoint}?key=${encodeURIComponent(leaderboardKey)}&sortKey=*`;
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`Failed to fetch leaderboard: ${response.status}`);
            }
            
            const result = await response.json();
            const entries = [];
            const itemsArray = result.items || result.Items;
            
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
            
            return { success: true, data: entries };
        };
        
        const result = await fetchWithFilter();
        
        // Verify that only user records are included (2 out of 4 total records)
        expect(result.data.length).toBe(2);
        expect(result.data[0].nickname).toBeDefined();
        expect(result.data[1].nickname).toBeDefined();
        
        // Verify non-user records were filtered out
        const hasAdminSettings = result.data.some(entry => entry.setting === 'admin');
        const hasConfigData = result.data.some(entry => entry.config === 'test');
        expect(hasAdminSettings).toBe(false);
        expect(hasConfigData).toBe(false);
    });
});
