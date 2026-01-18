/**
 * Quiz Deduplication Tests
 * 测试同一天不重复出题功能
 */

const QuizLimit = require('../quiz/js/quiz-limit.js');
const QuizData = require('../quiz/js/quiz-data.js');

// Make QuizLimit available globally for QuizData
global.QuizLimit = QuizLimit;

describe('Quiz Deduplication - QuizLimit', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    test('getTodayAnsweredQuestionIds returns empty array initially', () => {
        const ids = QuizLimit.getTodayAnsweredQuestionIds('7-12');
        expect(ids).toEqual([]);
    });

    test('recordAnsweredQuestion adds question ID', () => {
        QuizLimit.recordAnsweredQuestion('test_q1', '7-12');
        const ids = QuizLimit.getTodayAnsweredQuestionIds('7-12');
        expect(ids).toContain('test_q1');
    });

    test('recordAnsweredQuestion does not duplicate IDs', () => {
        QuizLimit.recordAnsweredQuestion('test_q1', '7-12');
        QuizLimit.recordAnsweredQuestion('test_q1', '7-12');
        const ids = QuizLimit.getTodayAnsweredQuestionIds('7-12');
        expect(ids.filter(id => id === 'test_q1').length).toBe(1);
    });

    test('recordAnsweredQuestion tracks multiple questions', () => {
        QuizLimit.recordAnsweredQuestion('test_q1', '7-12');
        QuizLimit.recordAnsweredQuestion('test_q2', '7-12');
        QuizLimit.recordAnsweredQuestion('test_q3', '7-12');
        const ids = QuizLimit.getTodayAnsweredQuestionIds('7-12');
        expect(ids).toHaveLength(3);
        expect(ids).toContain('test_q1');
        expect(ids).toContain('test_q2');
        expect(ids).toContain('test_q3');
    });

    test('different age groups have separate tracking', () => {
        QuizLimit.recordAnsweredQuestion('test_q1', '7-12');
        QuizLimit.recordAnsweredQuestion('test_q2', '3-6');
        
        const ids712 = QuizLimit.getTodayAnsweredQuestionIds('7-12');
        const ids36 = QuizLimit.getTodayAnsweredQuestionIds('3-6');
        
        expect(ids712).toContain('test_q1');
        expect(ids712).not.toContain('test_q2');
        expect(ids36).toContain('test_q2');
        expect(ids36).not.toContain('test_q1');
    });
});

describe('Quiz Deduplication - QuizData.getRandomQuestions', () => {
    beforeEach(() => {
        localStorage.clear();
        // Mock visited museums
        localStorage.setItem('visitedMuseums', JSON.stringify(['museum1']));
        
        // Reset QuizData state
        QuizData.resetForTests();
    });

    test('getRandomQuestions excludes already answered questions', async () => {
        // Setup mock adapter
        const mockAdapter = {
            init: async () => [{
                id: 'museum1',
                name: '测试博物馆',
                location: '北京',
                description: '这是一个测试博物馆',
                tags: ['历史'],
                collections: [
                    { name: '文物A', description: '这是文物A的描述信息' },
                    { name: '文物B', description: '这是文物B的描述信息' }
                ]
            }],
            preloadMuseums: async () => {},
            getMuseums: () => [{
                id: 'museum1',
                name: '测试博物馆',
                location: '北京',
                description: '这是一个测试博物馆',
                tags: ['历史'],
                collections: [
                    { name: '文物A', description: '这是文物A的描述信息' },
                    { name: '文物B', description: '这是文物B的描述信息' }
                ]
            }]
        };

        await QuizData.init(mockAdapter);

        // Get all questions first
        const allQuestions = QuizData.getAllAvailableQuestions('7-12');
        expect(allQuestions.length).toBeGreaterThan(0);

        // Record some as answered
        const answeredIds = allQuestions.slice(0, 2).map(q => q.id);
        answeredIds.forEach(id => {
            QuizLimit.recordAnsweredQuestion(id, '7-12');
        });

        // Get random questions - request fewer than available fresh questions
        // Total: 5, Answered: 2, Fresh: 3, so request 2 to avoid fallback
        const freshCount = allQuestions.length - answeredIds.length;
        const requestCount = Math.min(2, freshCount);
        const randomQuestions = QuizData.getRandomQuestions(requestCount, '7-12');
        
        // Verify none of the answered questions are in the result
        const randomIds = randomQuestions.map(q => q.id);
        answeredIds.forEach(answeredId => {
            expect(randomIds).not.toContain(answeredId);
        });
    });

    test('getRandomQuestions falls back to all questions when not enough fresh ones', async () => {
        const mockAdapter = {
            init: async () => [{
                id: 'museum1',
                name: '小博物馆',
                location: '上海',
                tags: ['艺术']
            }],
            preloadMuseums: async () => {},
            getMuseums: () => [{
                id: 'museum1',
                name: '小博物馆',
                location: '上海',
                tags: ['艺术']
            }]
        };

        await QuizData.init(mockAdapter);

        const allQuestions = QuizData.getAllAvailableQuestions('7-12');
        
        // Mark all questions as answered
        allQuestions.forEach(q => {
            QuizLimit.recordAnsweredQuestion(q.id, '7-12');
        });

        // Should still return questions (fallback to all)
        const randomQuestions = QuizData.getRandomQuestions(5, '7-12');
        expect(randomQuestions.length).toBeGreaterThan(0);
    });
});
