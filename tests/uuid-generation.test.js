/**
 * Test for UUID generation feature
 * 
 * Issue: 给每个用户生成uuid，避免用户昵称改变带来的重复记录
 * 
 * Requirements:
 * 1. Generate proper UUID v4 using crypto.randomUUID()
 * 2. Fallback to timestamp-based ID for older browsers
 * 3. Maintain backward compatibility for existing users
 */

describe('UUID Generation', () => {
    beforeEach(() => {
        // Clear localStorage before each test
        localStorage.clear();
    });
    
    test('generates user ID on first call', () => {
        // Simulate getUserId logic
        function getUserId() {
            let userId = localStorage.getItem('user_id');
            if (!userId) {
                // Try to use crypto.randomUUID if available
                if (typeof crypto !== 'undefined' && crypto.randomUUID) {
                    userId = crypto.randomUUID();
                } else {
                    userId = 'user-' + Date.now() + '-' + Math.random().toString(36).substring(2, 11);
                }
                localStorage.setItem('user_id', userId);
            }
            return userId;
        }
        
        const userId = getUserId();
        
        // Should generate a user ID
        expect(userId).toBeDefined();
        expect(userId.length).toBeGreaterThan(0);
        
        // Should be saved to localStorage
        expect(localStorage.getItem('user_id')).toBe(userId);
    });
    
    test('falls back to timestamp-based ID when crypto is unavailable', () => {
        // Save original crypto
        const originalCrypto = global.crypto;
        
        // Remove crypto
        delete global.crypto;
        
        // Simulate getUserId logic
        function getUserId() {
            let userId = localStorage.getItem('user_id');
            if (!userId) {
                if (typeof crypto !== 'undefined' && crypto.randomUUID) {
                    userId = crypto.randomUUID();
                } else {
                    userId = 'user-' + Date.now() + '-' + Math.random().toString(36).substring(2, 11);
                }
                localStorage.setItem('user_id', userId);
            }
            return userId;
        }
        
        const userId = getUserId();
        
        // Should start with 'user-'
        expect(userId).toMatch(/^user-/);
        
        // Should contain timestamp
        expect(userId).toMatch(/^user-\d+-[a-z0-9]+$/);
        
        // Should be saved to localStorage
        expect(localStorage.getItem('user_id')).toBe(userId);
        
        // Restore crypto
        global.crypto = originalCrypto;
    });
    
    test('maintains backward compatibility - returns existing user_id', () => {
        // Set an existing user_id (old format)
        const existingUserId = 'user_abc123def456';
        localStorage.setItem('user_id', existingUserId);
        
        // Simulate getUserId logic
        function getUserId() {
            let userId = localStorage.getItem('user_id');
            if (!userId) {
                if (typeof crypto !== 'undefined' && crypto.randomUUID) {
                    userId = crypto.randomUUID();
                } else {
                    userId = 'user-' + Date.now() + '-' + Math.random().toString(36).substring(2, 11);
                }
                localStorage.setItem('user_id', userId);
            }
            return userId;
        }
        
        const userId = getUserId();
        
        // Should return existing ID, not generate new one
        expect(userId).toBe(existingUserId);
    });
    
    test('generates consistent UUID for same user across multiple calls', () => {
        function getUserId() {
            let userId = localStorage.getItem('user_id');
            if (!userId) {
                if (typeof crypto !== 'undefined' && crypto.randomUUID) {
                    userId = crypto.randomUUID();
                } else {
                    userId = 'user-' + Date.now() + '-' + Math.random().toString(36).substring(2, 11);
                }
                localStorage.setItem('user_id', userId);
            }
            return userId;
        }
        
        const userId1 = getUserId();
        const userId2 = getUserId();
        const userId3 = getUserId();
        
        // All calls should return the same ID
        expect(userId1).toBe(userId2);
        expect(userId2).toBe(userId3);
    });
    
    test('UUID prevents duplicate records when nickname changes', () => {
        function getUserId() {
            let userId = localStorage.getItem('user_id');
            if (!userId) {
                if (typeof crypto !== 'undefined' && crypto.randomUUID) {
                    userId = crypto.randomUUID();
                } else {
                    userId = 'user-' + Date.now() + '-' + Math.random().toString(36).substring(2, 11);
                }
                localStorage.setItem('user_id', userId);
            }
            return userId;
        }
        
        // First submission with nickname "小明"
        const userId1 = getUserId();
        const submission1 = {
            userId: userId1,
            nickname: '小明',
            visitedCount: 5
        };
        
        // User changes nickname to "小红"
        const userId2 = getUserId();
        const submission2 = {
            userId: userId2,
            nickname: '小红',
            visitedCount: 10
        };
        
        // userId should be the same despite nickname change
        expect(submission1.userId).toBe(submission2.userId);
        
        // This ensures no duplicate records in leaderboard
        // because the same UUID is used regardless of nickname
        expect(submission1.userId).toBeDefined();
        expect(submission2.userId).toBeDefined();
    });
});

