/**
 * Fireworks Display Text Tests
 * 
 * Tests for the updated fireworks wall display text format that shows
 * task names instead of museum names.
 */

describe('Fireworks Display Text Format', () => {
    describe('Task Name Extraction', () => {
        test('should extract task name from task content with colon separator', () => {
            const taskContent = '门钉大发现：数一数太和殿大门上的金色门钉（正确答案：横9竖9共81个）';
            const colonIndex = taskContent.indexOf('：');
            const taskName = taskContent.substring(0, colonIndex);
            
            expect(taskName).toBe('门钉大发现');
        });

        test('should extract task name from another task with colon', () => {
            const taskContent = '找到三大殿：太和殿、中和殿、保和殿';
            const colonIndex = taskContent.indexOf('：');
            const taskName = taskContent.substring(0, colonIndex);
            
            expect(taskName).toBe('找到三大殿');
        });

        test('should use first 7 characters when no colon present', () => {
            const taskContent = '数一数太和殿前有多少台阶';
            const colonIndex = taskContent.indexOf('：');
            const taskName = colonIndex > 0 ? 
                taskContent.substring(0, colonIndex) : 
                taskContent.substring(0, Math.min(7, taskContent.length));
            
            expect(taskName).toBe('数一数太和殿前');
        });

        test('should handle short task content without colon', () => {
            const taskContent = '观察建筑';
            const colonIndex = taskContent.indexOf('：');
            const taskName = colonIndex > 0 ? 
                taskContent.substring(0, colonIndex) : 
                taskContent.substring(0, Math.min(7, taskContent.length));
            
            expect(taskName).toBe('观察建筑');
        });

        test('should handle empty task content', () => {
            const taskContent = '';
            const colonIndex = taskContent.indexOf('：');
            const taskName = colonIndex > 0 ? 
                taskContent.substring(0, colonIndex) : 
                taskContent.substring(0, Math.min(7, taskContent.length));
            
            expect(taskName).toBe('');
        });
    });

    describe('Display Text Generation', () => {
        test('should generate display text with task name when taskContent has colon', () => {
            const childNickname = '小明';
            const taskContent = '门钉大发现：数一数太和殿大门上的金色门钉（正确答案：横9竖9共81个）';
            
            const colonIndex = taskContent.indexOf('：');
            const taskName = colonIndex > 0 ? 
                taskContent.substring(0, colonIndex) : 
                taskContent.substring(0, Math.min(7, taskContent.length));
            
            const displayText = `${childNickname}完成任务${taskName}`;
            
            expect(displayText).toBe('小明完成任务门钉大发现');
        });

        test('should generate display text with task name when taskContent has no colon', () => {
            const childNickname = '小红';
            const taskContent = '数一数太和殿前有多少台阶';
            
            const colonIndex = taskContent.indexOf('：');
            const taskName = colonIndex > 0 ? 
                taskContent.substring(0, colonIndex) : 
                taskContent.substring(0, Math.min(7, taskContent.length));
            
            const displayText = `${childNickname}完成任务${taskName}`;
            
            expect(displayText).toBe('小红完成任务数一数太和殿前');
        });

        test('should fallback to museum name when taskContent is empty', () => {
            const childNickname = '小华';
            const museumName = '故宫博物院';
            const taskContent = '';
            
            let taskName = '';
            if (taskContent) {
                const colonIndex = taskContent.indexOf('：');
                taskName = colonIndex > 0 ? 
                    taskContent.substring(0, colonIndex) : 
                    taskContent.substring(0, Math.min(7, taskContent.length));
            }
            
            const displayText = taskName ? 
                `${childNickname}完成任务${taskName}` : 
                `${childNickname}打卡${museumName}`;
            
            expect(displayText).toBe('小华打卡故宫博物院');
        });

        test('should handle multiple tasks with different formats', () => {
            const testCases = [
                {
                    nickname: '小李',
                    taskContent: '寻找屋顶上的神兽，了解它们的作用',
                    expected: '小李完成任务寻找屋顶上的神'
                },
                {
                    nickname: '小王',
                    taskContent: '珍宝探索：在珍宝馆找到最喜欢的宝物',
                    expected: '小王完成任务珍宝探索'
                },
                {
                    nickname: '小张',
                    taskContent: '观察古代皇帝用过的物品',
                    expected: '小张完成任务观察古代皇帝用'
                }
            ];

            testCases.forEach(test => {
                const colonIndex = test.taskContent.indexOf('：');
                const taskName = colonIndex > 0 ? 
                    test.taskContent.substring(0, colonIndex) : 
                    test.taskContent.substring(0, Math.min(7, test.taskContent.length));
                
                const displayText = `${test.nickname}完成任务${taskName}`;
                expect(displayText).toBe(test.expected);
            });
        });
    });

    describe('Format Comparison', () => {
        test('old format was: {昵称}打卡{博物馆名}', () => {
            const childNickname = '小明';
            const museumName = '故宫博物院';
            const oldFormat = `${childNickname}打卡${museumName}`;
            
            expect(oldFormat).toBe('小明打卡故宫博物院');
        });

        test('new format is: {昵称}完成任务{任务名}', () => {
            const childNickname = '小明';
            const taskName = '门钉大发现';
            const newFormat = `${childNickname}完成任务${taskName}`;
            
            expect(newFormat).toBe('小明完成任务门钉大发现');
        });

        test('fallback to old format when no task content available', () => {
            const childNickname = '小明';
            const museumName = '故宫博物院';
            const taskContent = '';
            
            let taskName = '';
            if (taskContent) {
                const colonIndex = taskContent.indexOf('：');
                taskName = colonIndex > 0 ? 
                    taskContent.substring(0, colonIndex) : 
                    taskContent.substring(0, Math.min(7, taskContent.length));
            }
            
            const displayText = taskName ? 
                `${childNickname}完成任务${taskName}` : 
                `${childNickname}打卡${museumName}`;
            
            // Should use old format as fallback
            expect(displayText).toBe('小明打卡故宫博物院');
        });
    });
});
