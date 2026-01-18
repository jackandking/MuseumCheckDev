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

describe('Quiz Image Recognition Questions', () => {
    beforeEach(() => {
        localStorage.clear();
        localStorage.setItem('visitedMuseums', JSON.stringify(['museum1', 'museum2', 'museum3', 'museum4']));
        QuizData.resetForTests();
    });

    test('generateImageQuestions creates image-choice question when museum has image', async () => {
        const museums = [
            { id: 'museum1', name: '故宫博物院', location: '北京', image: 'https://example.com/1.jpg' },
            { id: 'museum2', name: '上海博物馆', location: '上海', image: 'https://example.com/2.jpg' },
            { id: 'museum3', name: '南京博物院', location: '南京', image: 'https://example.com/3.jpg' },
            { id: 'museum4', name: '陕西历史博物馆', location: '西安', image: 'https://example.com/4.jpg' }
        ];

        const mockAdapter = {
            init: async () => museums,
            preloadMuseums: async () => {},
            getMuseums: () => museums
        };

        await QuizData.init(mockAdapter);

        const allQuestions = QuizData.getAllAvailableQuestions('7-12');
        const imageQuestions = allQuestions.filter(q => q.type === 'image-choice');

        expect(imageQuestions.length).toBeGreaterThan(0);
        
        const q = imageQuestions[0];
        expect(q.type).toBe('image-choice');
        expect(q.question).toBe('看图猜一猜，这是哪个博物馆？');
        expect(q.image).toBeDefined();
        expect(q.options).toHaveLength(4);
        expect(q.correctAnswer).toBe(0);
        expect(q.points).toBe(15);
    });

    test('generateImageQuestions does not create question when museum has no image', async () => {
        const museums = [
            { id: 'museum1', name: '无图博物馆', location: '北京' },
            { id: 'museum2', name: '博物馆2', location: '上海', image: 'https://example.com/2.jpg' },
            { id: 'museum3', name: '博物馆3', location: '南京', image: 'https://example.com/3.jpg' },
            { id: 'museum4', name: '博物馆4', location: '西安', image: 'https://example.com/4.jpg' }
        ];

        const mockAdapter = {
            init: async () => museums,
            preloadMuseums: async () => {},
            getMuseums: () => museums
        };

        await QuizData.init(mockAdapter);

        const questions = QuizData.generateQuestionsForMuseum('museum1', '7-12');
        const imageQuestions = questions.filter(q => q.type === 'image-choice');

        expect(imageQuestions.length).toBe(0);
    });
});

describe('Quiz Anti-Grinding - Questions Exhausted', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    test('checkQuestionsExhausted returns exhausted when all answered and no wrong questions', () => {
        // Record 5 questions as answered
        for (let i = 0; i < 5; i++) {
            QuizLimit.recordAnsweredQuestion(`q${i}`, '7-12');
        }

        const status = QuizLimit.checkQuestionsExhausted('7-12', 5, 0);
        
        expect(status.exhausted).toBe(true);
        expect(status.reason).toBe('all_done');
        expect(status.answeredCount).toBe(5);
    });

    test('checkQuestionsExhausted returns not exhausted when has wrong questions', () => {
        // Record 5 questions as answered
        for (let i = 0; i < 5; i++) {
            QuizLimit.recordAnsweredQuestion(`q${i}`, '7-12');
        }

        // Has 2 wrong questions to review
        const status = QuizLimit.checkQuestionsExhausted('7-12', 5, 2);
        
        expect(status.exhausted).toBe(false);
        expect(status.reason).toBe('has_wrong_questions');
    });

    test('checkQuestionsExhausted returns not exhausted when has unanswered questions', () => {
        // Only answered 3 out of 5
        for (let i = 0; i < 3; i++) {
            QuizLimit.recordAnsweredQuestion(`q${i}`, '7-12');
        }

        const status = QuizLimit.checkQuestionsExhausted('7-12', 5, 0);
        
        expect(status.exhausted).toBe(false);
        expect(status.reason).toBe('has_new_questions');
    });

    test('getWarning returns questions_exhausted warning when appropriate', () => {
        // Record all questions as answered
        for (let i = 0; i < 10; i++) {
            QuizLimit.recordAnsweredQuestion(`q${i}`, '7-12');
        }

        const warning = QuizLimit.getWarning('7-12', 10, 0);
        
        expect(warning).not.toBeNull();
        expect(warning.type).toBe('questions_exhausted');
        expect(warning.showContinueOption).toBe(false);
    });

    test('getWarning returns null when still has questions to answer', () => {
        // Only answered 3 questions
        for (let i = 0; i < 3; i++) {
            QuizLimit.recordAnsweredQuestion(`q${i}`, '7-12');
        }

        const warning = QuizLimit.getWarning('7-12', 10, 0);
        
        // Should be null because still has new questions
        expect(warning).toBeNull();
    });

    test('getWarning allows wrong questions mode even when exhausted', () => {
        // Record all questions as answered
        for (let i = 0; i < 5; i++) {
            QuizLimit.recordAnsweredQuestion(`q${i}`, '7-12');
        }

        // Has wrong questions to review - should not be exhausted
        const warning = QuizLimit.getWarning('7-12', 5, 2);
        
        // Should be null because has wrong questions to review
        expect(warning).toBeNull();
    });
});
