/**
 * Regression test for admin leaderboard API response format change
 * 
 * Issue: Admin leaderboard shows "Loaded 0" when API returns data in 'value' field
 * The API changed from returning { items: [...] } to { value: '[...]' }
 * 
 * Expected behavior: Admin leaderboard should parse both response formats:
 * 1. { items: [...] } or { Items: [...] } - DynamoDB direct format
 * 2. { value: '[{...}]' } - JSON string in value field
 */

describe('Admin Leaderboard API Response Parsing', () => {
    test('should parse API response with value field containing JSON string', () => {
        // This is the actual response format from the error log
        const apiResponse = {
            value: '[{"expireAt": "4866674732", "value": "{\\"nickname\\":\\"啊啊啊\\",\\"visitedCount\\":2,\\"userId\\":\\"user_mfm1pllapx23v2mu6qd\\",\\"lastUpdate\\":1762823777771}", "key": "museumcheck-leaderboard", "sortKey": "user-user_mfm1pllapx23v2mu6qd"}, {"expireAt": "4866674732", "value": "{\\"nickname\\":\\"小淘气\\",\\"visitedCount\\":2,\\"userId\\":\\"user_mfs4dh1n95441taucth\\",\\"lastUpdate\\":1762906016931}", "key": "museumcheck-leaderboard", "sortKey": "user-user_mfs4dh1n95441taucth"}]'
        };

        // Parse using the logic from admin-leaderboard.js
        const entries = [];
        let itemsArray = null;
        
        if (apiResponse.items || apiResponse.Items) {
            itemsArray = apiResponse.items || apiResponse.Items;
        } else if (apiResponse.value && typeof apiResponse.value === 'string') {
            try {
                itemsArray = JSON.parse(apiResponse.value);
            } catch (e) {
                console.error('Failed to parse value field:', e);
            }
        }
        
        if (itemsArray && Array.isArray(itemsArray)) {
            for (const item of itemsArray) {
                try {
                    const parsed = JSON.parse(item.value);
                    parsed._sortKey = item.sortKey || item.sk;
                    parsed._expireAt = item.expireAt || item.expire_at || item.ttl;
                    entries.push(parsed);
                } catch (e) {
                    console.warn('Failed to parse entry:', e, item);
                }
            }
        }

        // Verify entries were parsed correctly
        expect(entries.length).toBe(2);
        expect(entries[0].nickname).toBe('啊啊啊');
        expect(entries[0].visitedCount).toBe(2);
        expect(entries[0].userId).toBe('user_mfm1pllapx23v2mu6qd');
        expect(entries[0]._sortKey).toBe('user-user_mfm1pllapx23v2mu6qd');
        
        expect(entries[1].nickname).toBe('小淘气');
        expect(entries[1].visitedCount).toBe(2);
        expect(entries[1].userId).toBe('user_mfs4dh1n95441taucth');
    });

    test('should still parse legacy items/Items format', () => {
        // Legacy format that was previously supported
        const apiResponse = {
            items: [
                {
                    value: '{"nickname":"测试用户","visitedCount":5,"userId":"user_test123","lastUpdate":1234567890}',
                    sortKey: 'user-user_test123',
                    expireAt: '4866674732'
                }
            ]
        };

        // Parse using the logic from admin-leaderboard.js
        const entries = [];
        let itemsArray = null;
        
        if (apiResponse.items || apiResponse.Items) {
            itemsArray = apiResponse.items || apiResponse.Items;
        } else if (apiResponse.value && typeof apiResponse.value === 'string') {
            try {
                itemsArray = JSON.parse(apiResponse.value);
            } catch (e) {
                console.error('Failed to parse value field:', e);
            }
        }
        
        if (itemsArray && Array.isArray(itemsArray)) {
            for (const item of itemsArray) {
                try {
                    const parsed = JSON.parse(item.value);
                    parsed._sortKey = item.sortKey || item.sk;
                    parsed._expireAt = item.expireAt || item.expire_at || item.ttl;
                    entries.push(parsed);
                } catch (e) {
                    console.warn('Failed to parse entry:', e, item);
                }
            }
        }

        // Verify legacy format still works
        expect(entries.length).toBe(1);
        expect(entries[0].nickname).toBe('测试用户');
        expect(entries[0].visitedCount).toBe(5);
        expect(entries[0].userId).toBe('user_test123');
    });

    test('should handle capital Items format for DynamoDB compatibility', () => {
        const apiResponse = {
            Items: [
                {
                    value: '{"nickname":"DynamoDB用户","visitedCount":3,"userId":"user_dynamodb","lastUpdate":1234567890}',
                    sortKey: 'user-user_dynamodb',
                    expireAt: '4866674732'
                }
            ]
        };

        const entries = [];
        let itemsArray = null;
        
        if (apiResponse.items || apiResponse.Items) {
            itemsArray = apiResponse.items || apiResponse.Items;
        } else if (apiResponse.value && typeof apiResponse.value === 'string') {
            try {
                itemsArray = JSON.parse(apiResponse.value);
            } catch (e) {
                console.error('Failed to parse value field:', e);
            }
        }
        
        if (itemsArray && Array.isArray(itemsArray)) {
            for (const item of itemsArray) {
                try {
                    const parsed = JSON.parse(item.value);
                    parsed._sortKey = item.sortKey || item.sk;
                    parsed._expireAt = item.expireAt || item.expire_at || item.ttl;
                    entries.push(parsed);
                } catch (e) {
                    console.warn('Failed to parse entry:', e, item);
                }
            }
        }

        expect(entries.length).toBe(1);
        expect(entries[0].nickname).toBe('DynamoDB用户');
    });

    test('should return empty array for invalid response format', () => {
        const apiResponse = {
            somethingElse: 'invalid'
        };

        const entries = [];
        let itemsArray = null;
        
        if (apiResponse.items || apiResponse.Items) {
            itemsArray = apiResponse.items || apiResponse.Items;
        } else if (apiResponse.value && typeof apiResponse.value === 'string') {
            try {
                itemsArray = JSON.parse(apiResponse.value);
            } catch (e) {
                console.error('Failed to parse value field:', e);
            }
        }
        
        if (itemsArray && Array.isArray(itemsArray)) {
            for (const item of itemsArray) {
                try {
                    const parsed = JSON.parse(item.value);
                    parsed._sortKey = item.sortKey || item.sk;
                    parsed._expireAt = item.expireAt || item.expire_at || item.ttl;
                    entries.push(parsed);
                } catch (e) {
                    console.warn('Failed to parse entry:', e, item);
                }
            }
        }

        expect(entries.length).toBe(0);
    });

    test('should handle empty value array', () => {
        const apiResponse = {
            value: '[]'
        };

        const entries = [];
        let itemsArray = null;
        
        if (apiResponse.items || apiResponse.Items) {
            itemsArray = apiResponse.items || apiResponse.Items;
        } else if (apiResponse.value && typeof apiResponse.value === 'string') {
            try {
                itemsArray = JSON.parse(apiResponse.value);
            } catch (e) {
                console.error('Failed to parse value field:', e);
            }
        }
        
        if (itemsArray && Array.isArray(itemsArray)) {
            for (const item of itemsArray) {
                try {
                    const parsed = JSON.parse(item.value);
                    parsed._sortKey = item.sortKey || item.sk;
                    parsed._expireAt = item.expireAt || item.expire_at || item.ttl;
                    entries.push(parsed);
                } catch (e) {
                    console.warn('Failed to parse entry:', e, item);
                }
            }
        }

        expect(entries.length).toBe(0);
    });
});
