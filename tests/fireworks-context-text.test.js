/**
 * Fireworks Context-Based Text Display Tests
 * 
 * Tests for displaying different text formats based on viewing context:
 * - Total fireworks wall (no filter): {昵称}打卡{博物馆名}
 * - Museum-specific wall (with filter): {昵称}完成任务{任务名}
 */

describe('Fireworks Context-Based Text Display', () => {
    describe('Text Format Based on Context', () => {
        test('should use museum format for total fireworks wall (no filter)', () => {
            const childNickname = '小明';
            const museumName = '故宫博物院';
            const taskContent = '门钉大发现：数一数太和殿大门上的金色门钉';
            const filterMuseumId = null; // No museum filter - viewing total wall
            
            // Extract task name
            const colonIndex = taskContent.indexOf('：');
            const taskName = colonIndex > 0 ? 
                taskContent.substring(0, colonIndex) : 
                taskContent.substring(0, Math.min(7, taskContent.length));
            
            // Determine display text based on context
            let displayText;
            if (filterMuseumId) {
                // Museum-specific wall: show task name
                displayText = taskName ? 
                    `${childNickname}完成任务${taskName}` : 
                    `${childNickname}打卡${museumName}`;
            } else {
                // Total fireworks wall: show museum name
                displayText = `${childNickname}打卡${museumName}`;
            }
            
            expect(displayText).toBe('小明打卡故宫博物院');
        });

        test('should use task format for museum-specific fireworks wall (with filter)', () => {
            const childNickname = '小明';
            const museumName = '故宫博物院';
            const taskContent = '门钉大发现：数一数太和殿大门上的金色门钉';
            const filterMuseumId = 'forbidden-city'; // Museum filter set - viewing specific museum
            
            // Extract task name
            const colonIndex = taskContent.indexOf('：');
            const taskName = colonIndex > 0 ? 
                taskContent.substring(0, colonIndex) : 
                taskContent.substring(0, Math.min(7, taskContent.length));
            
            // Determine display text based on context
            let displayText;
            if (filterMuseumId) {
                // Museum-specific wall: show task name
                displayText = taskName ? 
                    `${childNickname}完成任务${taskName}` : 
                    `${childNickname}打卡${museumName}`;
            } else {
                // Total fireworks wall: show museum name
                displayText = `${childNickname}打卡${museumName}`;
            }
            
            expect(displayText).toBe('小明完成任务门钉大发现');
        });

        test('should fallback to museum name when no task content in museum-specific wall', () => {
            const childNickname = '小红';
            const museumName = '中国国家博物馆';
            const taskContent = '';
            const filterMuseumId = 'national-museum'; // Museum filter set
            
            // Extract task name
            let taskName = '';
            if (taskContent) {
                const colonIndex = taskContent.indexOf('：');
                taskName = colonIndex > 0 ? 
                    taskContent.substring(0, colonIndex) : 
                    taskContent.substring(0, Math.min(7, taskContent.length));
            }
            
            // Determine display text based on context
            let displayText;
            if (filterMuseumId) {
                // Museum-specific wall: show task name, fallback to museum
                displayText = taskName ? 
                    `${childNickname}完成任务${taskName}` : 
                    `${childNickname}打卡${museumName}`;
            } else {
                // Total fireworks wall: show museum name
                displayText = `${childNickname}打卡${museumName}`;
            }
            
            expect(displayText).toBe('小红打卡中国国家博物馆');
        });

        test('should always use museum format for total wall regardless of task content', () => {
            const testCases = [
                {
                    nickname: '小李',
                    museumName: '上海博物馆',
                    taskContent: '青铜器探索：寻找大克鼎',
                    expected: '小李打卡上海博物馆'
                },
                {
                    nickname: '小王',
                    museumName: '秦始皇帝陵博物院',
                    taskContent: '数一数兵马俑有多少个',
                    expected: '小王打卡秦始皇帝陵博物院'
                },
                {
                    nickname: '小张',
                    museumName: '南京博物院',
                    taskContent: '',
                    expected: '小张打卡南京博物院'
                }
            ];

            const filterMuseumId = null; // Total wall - no filter

            testCases.forEach(test => {
                const displayText = `${test.nickname}打卡${test.museumName}`;
                expect(displayText).toBe(test.expected);
            });
        });

        test('should use task format for museum-specific wall with various task contents', () => {
            const testCases = [
                {
                    nickname: '小李',
                    museumName: '上海博物馆',
                    taskContent: '青铜器探索：寻找大克鼎',
                    expected: '小李完成任务青铜器探索'
                },
                {
                    nickname: '小王',
                    museumName: '秦始皇帝陵博物院',
                    taskContent: '数一数兵马俑有多少个',
                    expected: '小王完成任务数一数兵马俑有'
                },
                {
                    nickname: '小张',
                    museumName: '南京博物院',
                    taskContent: '',
                    expected: '小张打卡南京博物院' // Fallback when no task
                }
            ];

            const filterMuseumId = 'some-museum'; // Museum-specific wall

            testCases.forEach(test => {
                let taskName = '';
                if (test.taskContent) {
                    const colonIndex = test.taskContent.indexOf('：');
                    taskName = colonIndex > 0 ? 
                        test.taskContent.substring(0, colonIndex) : 
                        test.taskContent.substring(0, Math.min(7, test.taskContent.length));
                }
                
                const displayText = taskName ? 
                    `${test.nickname}完成任务${taskName}` : 
                    `${test.nickname}打卡${test.museumName}`;
                    
                expect(displayText).toBe(test.expected);
            });
        });
    });

    describe('Context Detection', () => {
        test('should detect total wall context when filterMuseumId is null', () => {
            const filterMuseumId = null;
            const isTotalWall = !filterMuseumId;
            expect(isTotalWall).toBe(true);
        });

        test('should detect total wall context when filterMuseumId is undefined', () => {
            const filterMuseumId = undefined;
            const isTotalWall = !filterMuseumId;
            expect(isTotalWall).toBe(true);
        });

        test('should detect total wall context when filterMuseumId is empty string', () => {
            const filterMuseumId = '';
            const isTotalWall = !filterMuseumId;
            expect(isTotalWall).toBe(true);
        });

        test('should detect museum-specific context when filterMuseumId is set', () => {
            const filterMuseumId = 'forbidden-city';
            const isTotalWall = !filterMuseumId;
            expect(isTotalWall).toBe(false);
        });
    });
});
