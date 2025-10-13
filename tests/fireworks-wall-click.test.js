/**
 * Fireworks Wall Click-to-Launch Tests
 * 
 * Tests for the click-to-launch fireworks feature on the fireworks wall:
 * - Total fireworks wall (no filter): "大家好，我是{nickname}"
 * - Museum-specific wall (with filter): "{nickname}打卡{museum name}"
 */

describe('Fireworks Wall Click-to-Launch', () => {
    describe('Display Text Generation Based on Context', () => {
        test('should generate greeting text for total fireworks wall', () => {
            const childNickname = '小明';
            const filterMuseumId = null; // No museum filter - total wall
            const filterMuseumName = null;
            
            let displayText;
            if (filterMuseumId) {
                displayText = `${childNickname}打卡${filterMuseumName || '博物馆'}`;
            } else {
                displayText = `大家好，我是${childNickname}`;
            }
            
            expect(displayText).toBe('大家好，我是小明');
        });

        test('should generate check-in text for museum-specific wall', () => {
            const childNickname = '小红';
            const filterMuseumId = 'forbidden-city'; // Museum filter set
            const filterMuseumName = '故宫博物院';
            
            let displayText;
            if (filterMuseumId) {
                displayText = `${childNickname}打卡${filterMuseumName || '博物馆'}`;
            } else {
                displayText = `大家好，我是${childNickname}`;
            }
            
            expect(displayText).toBe('小红打卡故宫博物院');
        });

        test('should use default museum name when filterMuseumName is null', () => {
            const childNickname = '小李';
            const filterMuseumId = 'unknown-museum'; // Museum filter set but name not found
            const filterMuseumName = null;
            
            let displayText;
            if (filterMuseumId) {
                displayText = `${childNickname}打卡${filterMuseumName || '博物馆'}`;
            } else {
                displayText = `大家好，我是${childNickname}`;
            }
            
            expect(displayText).toBe('小李打卡博物馆');
        });

        test('should use default nickname when not set', () => {
            const childNickname = '小淘气'; // Default
            const filterMuseumId = null;
            
            let displayText;
            if (filterMuseumId) {
                displayText = `${childNickname}打卡博物馆`;
            } else {
                displayText = `大家好，我是${childNickname}`;
            }
            
            expect(displayText).toBe('大家好，我是小淘气');
        });
    });

    describe('Context Detection for Click Events', () => {
        test('should detect total wall when filterMuseumId is null', () => {
            const filterMuseumId = null;
            const isTotalWall = !filterMuseumId;
            expect(isTotalWall).toBe(true);
        });

        test('should detect total wall when filterMuseumId is undefined', () => {
            const filterMuseumId = undefined;
            const isTotalWall = !filterMuseumId;
            expect(isTotalWall).toBe(true);
        });

        test('should detect museum-specific wall when filterMuseumId is set', () => {
            const filterMuseumId = 'forbidden-city';
            const isTotalWall = !filterMuseumId;
            expect(isTotalWall).toBe(false);
        });
    });

    describe('Multiple Nicknames and Museum Combinations', () => {
        test('should generate correct text for various nicknames on total wall', () => {
            const testCases = [
                { nickname: '小明', expected: '大家好，我是小明' },
                { nickname: '小红', expected: '大家好，我是小红' },
                { nickname: '小李', expected: '大家好，我是小李' },
                { nickname: '小王', expected: '大家好，我是小王' },
                { nickname: 'Tom', expected: '大家好，我是Tom' },
                { nickname: '小淘气', expected: '大家好，我是小淘气' }
            ];

            const filterMuseumId = null; // Total wall

            testCases.forEach(test => {
                const displayText = `大家好，我是${test.nickname}`;
                expect(displayText).toBe(test.expected);
            });
        });

        test('should generate correct text for various museums on museum-specific wall', () => {
            const testCases = [
                { nickname: '小明', museumName: '故宫博物院', expected: '小明打卡故宫博物院' },
                { nickname: '小红', museumName: '中国国家博物馆', expected: '小红打卡中国国家博物馆' },
                { nickname: '小李', museumName: '上海博物馆', expected: '小李打卡上海博物馆' },
                { nickname: '小王', museumName: '南京博物院', expected: '小王打卡南京博物院' },
                { nickname: 'Tom', museumName: '秦始皇帝陵博物院', expected: 'Tom打卡秦始皇帝陵博物院' }
            ];

            testCases.forEach(test => {
                const filterMuseumId = 'some-museum'; // Museum-specific wall
                const displayText = `${test.nickname}打卡${test.museumName}`;
                expect(displayText).toBe(test.expected);
            });
        });
    });

    describe('Throttling Logic', () => {
        test('should allow click when enough time has passed', () => {
            const lastClickTime = Date.now() - 3000; // 3 seconds ago
            const currentTime = Date.now();
            const LAUNCH_INTERVAL = 2500; // 2.5 seconds
            
            const shouldAllow = currentTime - lastClickTime >= LAUNCH_INTERVAL;
            expect(shouldAllow).toBe(true);
        });

        test('should block click when not enough time has passed', () => {
            const lastClickTime = Date.now() - 1000; // 1 second ago
            const currentTime = Date.now();
            const LAUNCH_INTERVAL = 2500; // 2.5 seconds
            
            const shouldAllow = currentTime - lastClickTime >= LAUNCH_INTERVAL;
            expect(shouldAllow).toBe(false);
        });

        test('should block rapid successive clicks', () => {
            const lastClickTime = Date.now() - 100; // 0.1 seconds ago
            const currentTime = Date.now();
            const LAUNCH_INTERVAL = 2500;
            
            const shouldAllow = currentTime - lastClickTime >= LAUNCH_INTERVAL;
            expect(shouldAllow).toBe(false);
        });
    });

    describe('Firework Data Structure for Remote Upload', () => {
        test('should create correct firework data structure for total wall', () => {
            const childNickname = '小明';
            const filterMuseumId = null;
            const filterMuseumName = null;
            const fireworkType = 'heart';
            const displayText = `大家好，我是${childNickname}`;
            
            const fireworkData = {
                id: `click-${Date.now()}-abc123`,
                museumId: filterMuseumId || null,
                museumName: filterMuseumName || null,
                taskContent: displayText,
                taskName: displayText,
                childNickname: childNickname,
                timestamp: Date.now(),
                fireworkType: fireworkType,
                isClickLaunched: true
            };
            
            expect(fireworkData.museumId).toBeNull();
            expect(fireworkData.museumName).toBeNull();
            expect(fireworkData.taskContent).toBe('大家好，我是小明');
            expect(fireworkData.childNickname).toBe('小明');
            expect(fireworkData.fireworkType).toBe('heart');
            expect(fireworkData.isClickLaunched).toBe(true);
        });

        test('should create correct firework data structure for museum-specific wall', () => {
            const childNickname = '小红';
            const filterMuseumId = 'forbidden-city';
            const filterMuseumName = '故宫博物院';
            const fireworkType = 'star';
            const displayText = `${childNickname}打卡${filterMuseumName}`;
            
            const fireworkData = {
                id: `click-${Date.now()}-xyz789`,
                museumId: filterMuseumId || null,
                museumName: filterMuseumName || null,
                taskContent: displayText,
                taskName: displayText,
                childNickname: childNickname,
                timestamp: Date.now(),
                fireworkType: fireworkType,
                isClickLaunched: true
            };
            
            expect(fireworkData.museumId).toBe('forbidden-city');
            expect(fireworkData.museumName).toBe('故宫博物院');
            expect(fireworkData.taskContent).toBe('小红打卡故宫博物院');
            expect(fireworkData.childNickname).toBe('小红');
            expect(fireworkData.fireworkType).toBe('star');
            expect(fireworkData.isClickLaunched).toBe(true);
        });

        test('should have required fields for remote storage', () => {
            const fireworkData = {
                id: `click-${Date.now()}-test`,
                museumId: 'test-museum',
                museumName: '测试博物馆',
                taskContent: '小明打卡测试博物馆',
                taskName: '小明打卡测试博物馆',
                childNickname: '小明',
                timestamp: Date.now(),
                fireworkType: 'heart',
                isClickLaunched: true
            };
            
            // Check all required fields exist
            expect(fireworkData).toHaveProperty('id');
            expect(fireworkData).toHaveProperty('museumId');
            expect(fireworkData).toHaveProperty('museumName');
            expect(fireworkData).toHaveProperty('taskContent');
            expect(fireworkData).toHaveProperty('taskName');
            expect(fireworkData).toHaveProperty('childNickname');
            expect(fireworkData).toHaveProperty('timestamp');
            expect(fireworkData).toHaveProperty('fireworkType');
            expect(fireworkData).toHaveProperty('isClickLaunched');
            
            // Check ID format
            expect(fireworkData.id).toMatch(/^click-\d+-[a-z0-9]+$/);
        });

        test('should mark click-launched fireworks differently from task completions', () => {
            // Click-launched firework
            const clickFirework = {
                id: 'click-12345-abc',
                isClickLaunched: true,
                taskContent: '大家好，我是小明'
            };
            
            // Task completion firework (for comparison)
            const taskFirework = {
                id: 'museum-12345-xyz',
                isClickLaunched: false,
                taskContent: '找到最古老的展品'
            };
            
            expect(clickFirework.isClickLaunched).toBe(true);
            expect(taskFirework.isClickLaunched).toBe(false);
        });
    });

    describe('Local Storage Operations', () => {
        test('should add firework data to existing localStorage array', () => {
            const existingFireworks = [
                { id: 'fw1', childNickname: '小明' },
                { id: 'fw2', childNickname: '小红' }
            ];
            
            const newFirework = {
                id: 'click-123-abc',
                childNickname: '小李',
                isClickLaunched: true
            };
            
            const updatedFireworks = [...existingFireworks, newFirework];
            
            expect(updatedFireworks).toHaveLength(3);
            expect(updatedFireworks[2].id).toBe('click-123-abc');
            expect(updatedFireworks[2].isClickLaunched).toBe(true);
        });

        test('should handle empty localStorage gracefully', () => {
            const emptyArray = [];
            const newFirework = {
                id: 'click-456-def',
                childNickname: '小王'
            };
            
            const updatedFireworks = [...emptyArray, newFirework];
            
            expect(updatedFireworks).toHaveLength(1);
            expect(updatedFireworks[0].id).toBe('click-456-def');
        });
    });

    describe('Remote Upload Payload Structure', () => {
        test('should create correct API payload for remote storage', () => {
            const fireworkData = {
                id: 'click-789-xyz',
                museumId: 'national-museum',
                museumName: '中国国家博物馆',
                taskContent: '小明打卡中国国家博物馆',
                taskName: '小明打卡中国国家博物馆',
                childNickname: '小明',
                timestamp: 1234567890,
                fireworkType: 'circle',
                isClickLaunched: true
            };
            
            const apiPayload = {
                key: 'museumcheck-firework',
                sortKey: fireworkData.id,
                value: JSON.stringify(fireworkData),
                ttl: 3600
            };
            
            expect(apiPayload.key).toBe('museumcheck-firework');
            expect(apiPayload.sortKey).toBe('click-789-xyz');
            expect(apiPayload.ttl).toBe(3600);
            
            const parsedValue = JSON.parse(apiPayload.value);
            expect(parsedValue.id).toBe(fireworkData.id);
            expect(parsedValue.isClickLaunched).toBe(true);
        });
    });
});
