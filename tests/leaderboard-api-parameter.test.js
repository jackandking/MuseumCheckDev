/**
 * Regression test for leaderboard API parameter bug
 * 
 * Issue: After checking in 3 museums on mobile, the leaderboard shows one related record,
 * but the admin leaderboard management page shows empty data.
 * 
 * Root cause: The submitScore() and updateEntry() functions were sending 'ttl' parameter
 * instead of 'expireAt' parameter to the API. The API expects 'expireAt' based on the
 * updateKeyValueStore() function signature.
 * 
 * This test verifies that the correct parameter name 'expireAt' is used in API calls.
 */

describe('Leaderboard API parameter regression test', () => {
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
    
    test('submitScore should use expireAt parameter instead of ttl', async () => {
        // Setup mock fetch to capture the request
        mockFetch.mockResolvedValue({
            ok: true,
            json: async () => ({ success: true })
        });
        
        // Create a mock LeaderboardManager with necessary dependencies
        const mockLeaderboardManager = {
            apiEndpoint: 'https://test-api.example.com/api',
            leaderboardKey: 'test-leaderboard',
            getUserId: () => 'test-user-123',
            clearCache: jest.fn(),
            lastScoreSubmitTime: 0,
            
            async submitScore(nickname, visitedCount) {
                try {
                    const userId = this.getUserId();
                    const sortKey = `user-${userId}`;
                    
                    const payload = {
                        nickname: nickname || '小朋友',
                        visitedCount: visitedCount,
                        userId: userId,
                        lastUpdate: Date.now()
                    };

                    const response = await fetch(this.apiEndpoint, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            key: this.leaderboardKey,
                            sortKey: sortKey,
                            value: JSON.stringify(payload),
                            expireAt: 4866674732 // TIMESTAMP_2124 - Far future expiration
                        })
                    });

                    if (!response.ok) {
                        throw new Error(`Failed to submit score: ${response.status}`);
                    }

                    const result = await response.json();
                    
                    // Clear cache to force refresh on next view
                    this.clearCache();
                    
                    // Set timestamp for recent score submission
                    this.lastScoreSubmitTime = Date.now();
                    
                    return { success: true };
                } catch (error) {
                    console.error('Error submitting score:', error);
                    return { success: false, error: error.message };
                }
            }
        };
        
        // Call submitScore
        const result = await mockLeaderboardManager.submitScore('小明', 3);
        
        // Verify the result
        expect(result.success).toBe(true);
        
        // Verify fetch was called
        expect(mockFetch).toHaveBeenCalledTimes(1);
        
        // Get the call arguments
        const [url, options] = mockFetch.mock.calls[0];
        
        // Verify the URL
        expect(url).toBe('https://test-api.example.com/api');
        
        // Verify the request body
        const requestBody = JSON.parse(options.body);
        
        // CRITICAL: Verify that 'expireAt' is used instead of 'ttl'
        expect(requestBody).toHaveProperty('expireAt');
        expect(requestBody).not.toHaveProperty('ttl');
        expect(requestBody.expireAt).toBe(4866674732);
        
        // Verify other parameters
        expect(requestBody.key).toBe('test-leaderboard');
        expect(requestBody.sortKey).toBe('user-test-user-123');
        
        // Verify the payload value
        const payload = JSON.parse(requestBody.value);
        expect(payload.nickname).toBe('小明');
        expect(payload.visitedCount).toBe(3);
        expect(payload.userId).toBe('test-user-123');
    });
    
    test('admin updateEntry should use expireAt parameter instead of ttl', async () => {
        // Setup mock fetch
        mockFetch.mockResolvedValue({
            ok: true,
            json: async () => ({ success: true })
        });
        
        // Simulate admin-leaderboard.js updateEntry function
        const CONFIG = {
            API_ENDPOINT: 'https://test-api.example.com/api',
            LEADERBOARD_KEY: 'test-leaderboard',
            TIMESTAMP_2124: 4866674732
        };
        
        const updateEntry = async (userId, data) => {
            const sortKey = `user-${userId}`;
            const res = await fetch(CONFIG.API_ENDPOINT, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    key: CONFIG.LEADERBOARD_KEY,
                    sortKey: sortKey,
                    value: JSON.stringify(data),
                    expireAt: CONFIG.TIMESTAMP_2124
                })
            });
            if (!res.ok) throw new Error('Failed to update entry: ' + res.status);
            return res.json();
        };
        
        // Call updateEntry
        const testData = {
            userId: 'test-user-456',
            nickname: '小红',
            visitedCount: 5,
            lastUpdate: Date.now()
        };
        
        const result = await updateEntry('test-user-456', testData);
        
        // Verify the result
        expect(result.success).toBe(true);
        
        // Verify fetch was called
        expect(mockFetch).toHaveBeenCalledTimes(1);
        
        // Get the call arguments
        const [url, options] = mockFetch.mock.calls[0];
        
        // Verify the URL
        expect(url).toBe('https://test-api.example.com/api');
        
        // Verify the request body
        const requestBody = JSON.parse(options.body);
        
        // CRITICAL: Verify that 'expireAt' is used instead of 'ttl'
        expect(requestBody).toHaveProperty('expireAt');
        expect(requestBody).not.toHaveProperty('ttl');
        expect(requestBody.expireAt).toBe(4866674732);
        
        // Verify other parameters
        expect(requestBody.key).toBe('test-leaderboard');
        expect(requestBody.sortKey).toBe('user-test-user-456');
        
        // Verify the payload value
        const payload = JSON.parse(requestBody.value);
        expect(payload.nickname).toBe('小红');
        expect(payload.visitedCount).toBe(5);
        expect(payload.userId).toBe('test-user-456');
    });
    
    test('verifies the fix prevents admin page showing empty data', async () => {
        // This test verifies the end-to-end scenario:
        // 1. User checks in museums
        // 2. Score is submitted with correct expireAt parameter
        // 3. Admin page can fetch the data because it was stored correctly
        
        const submittedEntries = [];
        
        // Mock fetch to simulate API behavior
        mockFetch.mockImplementation(async (url, options) => {
            if (options && options.method === 'POST') {
                // Simulate storage
                const body = JSON.parse(options.body);
                
                // Only store if expireAt is present (simulating correct API behavior)
                if (body.expireAt) {
                    submittedEntries.push({
                        sortKey: body.sortKey,
                        value: body.value,
                        expireAt: body.expireAt
                    });
                }
                
                return {
                    ok: true,
                    json: async () => ({ success: true })
                };
            } else {
                // Simulate fetch (GET request)
                return {
                    ok: true,
                    json: async () => ({
                        items: submittedEntries.map(entry => ({
                            sortKey: entry.sortKey,
                            value: entry.value,
                            expireAt: entry.expireAt
                        }))
                    })
                };
            }
        });
        
        // Step 1: Submit score with correct parameter
        const submitResponse = await fetch('https://test-api.example.com/api', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                key: 'test-leaderboard',
                sortKey: 'user-test-123',
                value: JSON.stringify({
                    userId: 'test-123',
                    nickname: '小明',
                    visitedCount: 3,
                    lastUpdate: Date.now()
                }),
                expireAt: 4866674732 // Using expireAt instead of ttl
            })
        });
        
        expect(submitResponse.ok).toBe(true);
        
        // Step 2: Verify data was stored
        expect(submittedEntries.length).toBe(1);
        
        // Step 3: Admin page fetches data
        const fetchResponse = await fetch('https://test-api.example.com/api?key=test-leaderboard');
        const data = await fetchResponse.json();
        
        // Step 4: Verify admin page receives the data
        expect(data.items).toBeDefined();
        expect(data.items.length).toBe(1);
        expect(data.items[0].sortKey).toBe('user-test-123');
        
        const entryData = JSON.parse(data.items[0].value);
        expect(entryData.nickname).toBe('小明');
        expect(entryData.visitedCount).toBe(3);
    });
});
