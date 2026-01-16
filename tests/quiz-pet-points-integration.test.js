/**
 * Integration test: Quiz points can be used for pet upgrades
 * 集成测试：考一考积分可以用于宠物升级
 */

const PointsManager = require('../quiz/js/points-manager.js');

describe('Quiz Points → Pet Integration', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    test('Quiz积分可以被宠物系统读取并使用', () => {
        // 1. 初始状态
        expect(PointsManager.getPoints()).toBe(0);

        // 2. 模拟Quiz完成，获得50积分
        PointsManager.addPoints(50, 'quiz', {
            mode: 'normal',
            correctCount: 5,
            totalQuestions: 5
        });

        // 3. 验证积分存储在正确的key
        const stored = JSON.parse(localStorage.getItem('museumcheck_xp_data'));
        expect(stored).not.toBeNull();
        expect(stored.totalXP).toBe(50);

        // 4. 模拟宠物系统读取积分（使用相同的方式）
        const petReadPoints = () => {
            const data = localStorage.getItem('museumcheck_xp_data');
            if (data) {
                return JSON.parse(data).totalXP || 0;
            }
            return 0;
        };

        expect(petReadPoints()).toBe(50);

        // 5. 模拟喂养宠物扣除积分
        const FEED_COST = 5;
        const current = JSON.parse(localStorage.getItem('museumcheck_xp_data'));
        current.totalXP -= FEED_COST;
        localStorage.setItem('museumcheck_xp_data', JSON.stringify(current));

        // 6. 验证扣除后的积分
        expect(petReadPoints()).toBe(45);
        expect(PointsManager.getPoints()).toBe(45);
    });

    test('积分来源被正确追踪', () => {
        PointsManager.addPoints(30, 'quiz', { mode: 'daily' });
        
        const history = PointsManager.getHistory('quiz');
        expect(history.length).toBe(1);
        expect(history[0].source).toBe('quiz');
        expect(history[0].amount).toBe(30);
    });
});
