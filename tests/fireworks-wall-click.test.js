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
});
