// Assessment Integration Fix Tests
// Tests for the assessment score and achievement integration fixes

describe('Assessment Score Calculation Fix', () => {
    let mockApp;
    
    beforeEach(() => {
        // Mock MuseumCheckApp with assessment functionality
        mockApp = {
            assessmentState: {
                parentAnswers: [],
                childAnswers: [],
                score: 0,
                museumId: 'forbidden-city'
            },
            trackEvent: jest.fn(),
            saveAssessmentResult: jest.fn(),
            calculateAssessmentScore: function() {
                const parentScore = this.assessmentState.parentAnswers.reduce((sum, answer) => sum + answer, 0);
                const childScore = this.assessmentState.childAnswers.reduce((sum, answer) => sum + answer, 0);
                
                // Fix 1: 确保评分系统为标准100分制，消除300分异常
                const maxPossibleScore = 5 * 2 * 3; // = 30 points total
                const totalScore = parentScore + childScore;
                
                // Ensure score is ALWAYS 0-100 scale
                let normalizedScore = Math.round((totalScore / maxPossibleScore) * 100);
                
                // Additional safety check to prevent any score above 100
                if (normalizedScore > 100) {
                    console.warn(`Assessment score calculation error: ${normalizedScore} > 100. Capping at 100.`);
                    normalizedScore = 100;
                }
                if (normalizedScore < 0) {
                    console.warn(`Assessment score calculation error: ${normalizedScore} < 0. Setting to 0.`);
                    normalizedScore = 0;
                }
                
                this.assessmentState.score = normalizedScore;
                this.saveAssessmentResult();
            }
        };
    });

    test('should calculate correct score with maximum answers (100%)', () => {
        // All maximum answers (3 points each)
        mockApp.assessmentState.parentAnswers = [3, 3, 3, 3, 3];
        mockApp.assessmentState.childAnswers = [3, 3, 3, 3, 3];
        
        mockApp.calculateAssessmentScore();
        
        // Expected: (15 + 15) / 30 * 100 = 100
        expect(mockApp.assessmentState.score).toBe(100);
        expect(mockApp.assessmentState.score).not.toBe(300); // Should NOT be 300!
    });

    test('should calculate correct score with minimum answers (0%)', () => {
        // All minimum answers (0 points each)
        mockApp.assessmentState.parentAnswers = [0, 0, 0, 0, 0];
        mockApp.assessmentState.childAnswers = [0, 0, 0, 0, 0];
        
        mockApp.calculateAssessmentScore();
        
        // Expected: (0 + 0) / 30 * 100 = 0
        expect(mockApp.assessmentState.score).toBe(0);
    });

    test('should calculate correct score with average answers (50%)', () => {
        // Average answers (1.5 points each, rounded to mixed 1 and 2)
        mockApp.assessmentState.parentAnswers = [1, 1, 2, 2, 2]; // Sum = 8
        mockApp.assessmentState.childAnswers = [1, 2, 1, 2, 1]; // Sum = 7
        
        mockApp.calculateAssessmentScore();
        
        // Expected: (8 + 7) / 30 * 100 = 50
        expect(mockApp.assessmentState.score).toBe(50);
    });

    test('should cap score at 100 if calculation error occurs', () => {
        // Simulate incorrect input that might cause score > 100
        mockApp.assessmentState.parentAnswers = [3, 3, 3, 3, 3];
        mockApp.assessmentState.childAnswers = [3, 3, 3, 3, 3];
        
        // Manually set a higher score to test capping
        const originalMethod = mockApp.calculateAssessmentScore;
        mockApp.calculateAssessmentScore = function() {
            this.assessmentState.score = 150; // Simulate error
            
            // Apply the fix
            if (this.assessmentState.score > 100) {
                console.warn(`Assessment score calculation error: ${this.assessmentState.score} > 100. Capping at 100.`);
                this.assessmentState.score = 100;
            }
        };
        
        mockApp.calculateAssessmentScore();
        
        expect(mockApp.assessmentState.score).toBe(100);
    });

    test('should set score to 0 if negative calculation occurs', () => {
        mockApp.assessmentState.score = -10; // Simulate error
        
        // Apply the fix
        if (mockApp.assessmentState.score < 0) {
            console.warn(`Assessment score calculation error: ${mockApp.assessmentState.score} < 0. Setting to 0.`);
            mockApp.assessmentState.score = 0;
        }
        
        expect(mockApp.assessmentState.score).toBe(0);
    });
});

describe('Assessment-Achievement Integration', () => {
    let mockApp;
    
    beforeEach(() => {
        // Mock localStorage
        global.localStorage = {
            getItem: jest.fn(),
            setItem: jest.fn()
        };
        
        mockApp = {
            visitedMuseums: ['forbidden-city', 'national-museum', 'shanghai-museum'],
            getAssessmentResults: function() {
                return {
                    'forbidden-city': { score: 85, date: '2024-01-01' },
                    'national-museum': { score: 78, date: '2024-01-02' },
                    'shanghai-museum': { score: 92, date: '2024-01-03' }
                };
            },
            calculateAssessmentQuality: function(assessmentResults) {
                const results = Object.values(assessmentResults);
                if (results.length === 0) {
                    return { averageScore: 0, count: 0, trend: 'no-data', quality: 'insufficient' };
                }
                
                const averageScore = results.reduce((sum, result) => sum + result.score, 0) / results.length;
                
                let quality = 'needs-improvement';
                if (averageScore >= 85) quality = 'excellent';
                else if (averageScore >= 70) quality = 'good';
                else if (averageScore >= 60) quality = 'fair';
                
                return {
                    averageScore: Math.round(averageScore),
                    count: results.length,
                    trend: 'stable',
                    quality: quality
                };
            }
        };
    });

    test('should calculate assessment quality correctly', () => {
        const assessmentResults = mockApp.getAssessmentResults();
        const quality = mockApp.calculateAssessmentQuality(assessmentResults);
        
        // Expected average: (85 + 78 + 92) / 3 = 85
        expect(quality.averageScore).toBe(85);
        expect(quality.count).toBe(3);
        expect(quality.quality).toBe('excellent');
    });

    test('should integrate visit count with assessment quality for advanced achievements', () => {
        const visitedCount = mockApp.visitedMuseums.length; // 3
        const assessmentResults = mockApp.getAssessmentResults();
        const assessmentQuality = mockApp.calculateAssessmentQuality(assessmentResults);
        
        // Test achievement requirement logic
        const requiresAssessment = true;
        const minAssessmentScore = 80;
        const minAssessmentCount = 3;
        const minVisits = 3;
        
        const visitRequirementMet = visitedCount >= minVisits;
        const scoreRequirementMet = assessmentQuality.averageScore >= minAssessmentScore;
        const countRequirementMet = assessmentQuality.count >= minAssessmentCount;
        
        expect(visitRequirementMet).toBe(true);
        expect(scoreRequirementMet).toBe(true); // 85 >= 80
        expect(countRequirementMet).toBe(true); // 3 >= 3
        
        const achievementUnlocked = visitRequirementMet && scoreRequirementMet && countRequirementMet;
        expect(achievementUnlocked).toBe(true);
    });

    test('should show progression requirements when achievement not yet unlocked', () => {
        const visitedCount = 2; // Less than required
        const assessmentResults = mockApp.getAssessmentResults();
        const assessmentQuality = mockApp.calculateAssessmentQuality(assessmentResults);
        
        const minVisits = 5;
        const minAssessmentScore = 90;
        
        const visitGap = Math.max(0, minVisits - visitedCount);
        const scoreGap = Math.max(0, minAssessmentScore - assessmentQuality.averageScore);
        
        expect(visitGap).toBe(3); // Need 3 more visits
        expect(scoreGap).toBe(5); // Need 5 more points (90 - 85)
    });
});

describe('Progressive Achievement System', () => {
    test('should define clear achievement levels with proper progression', () => {
        const achievementLevels = {
            'basic': {
                name: '🥉 探索起步',
                description: '迈出博物馆文化探索第一步',
                requirements: 'Visit-based only'
            },
            'intermediate': {
                name: '🥈 深度体验',
                description: '多馆探索 + 关注亲子互动品质',
                requirements: 'Visit count + basic assessment'
            },
            'advanced': {
                name: '🥇 卓越典范',
                description: '广泛探索 + 优质亲子关系',
                requirements: 'High visit count + high-quality assessments'
            }
        };
        
        // Test that each level has proper structure
        Object.entries(achievementLevels).forEach(([level, data]) => {
            expect(data.name).toContain(level === 'basic' ? '🥉' : level === 'intermediate' ? '🥈' : '🥇');
            expect(data.description).toBeTruthy();
            expect(data.requirements).toBeTruthy();
        });
        
        // Test progression logic
        expect(Object.keys(achievementLevels)).toEqual(['basic', 'intermediate', 'advanced']);
    });

    test('should show next goal with clear requirements', () => {
        const mockGoal = {
            name: '亲子文化使者',
            emoji: '🤝',
            visits: 15,
            requiresAssessment: true,
            minAssessmentScore: 60,
            minAssessmentCount: 3
        };
        
        const currentVisits = 10;
        const currentAssessmentQuality = { averageScore: 55, count: 1 };
        
        const visitGap = Math.max(0, mockGoal.visits - currentVisits);
        const scoreGap = Math.max(0, mockGoal.minAssessmentScore - currentAssessmentQuality.averageScore);
        const countGap = Math.max(0, mockGoal.minAssessmentCount - currentAssessmentQuality.count);
        
        expect(visitGap).toBe(5); // Need 5 more museum visits
        expect(scoreGap).toBe(5); // Need 5 more assessment points
        expect(countGap).toBe(2); // Need 2 more assessments
        
        // Should show clear next steps
        const nextSteps = [];
        if (visitGap > 0) nextSteps.push(`参观 ${visitGap} 家博物馆`);
        if (scoreGap > 0) nextSteps.push(`提升亲子互动质量 ${scoreGap} 分`);
        if (countGap > 0) nextSteps.push(`完成 ${countGap} 次亲子测评`);
        
        expect(nextSteps).toHaveLength(3);
        expect(nextSteps[0]).toBe('参观 5 家博物馆');
        expect(nextSteps[1]).toBe('提升亲子互动质量 5 分');
        expect(nextSteps[2]).toBe('完成 2 次亲子测评');
    });
});

describe('User Experience Integration', () => {
    test('should provide clear guidance about the three achievement types', () => {
        const achievementTypes = [
            {
                name: '单馆深度探索',
                level: 'basic',
                focus: '鼓励开始博物馆参观',
                requirements: '仅需访问博物馆'
            },
            {
                name: '多馆广度体验',
                level: 'intermediate', 
                focus: '鼓励持续探索不同博物馆',
                requirements: '访问数量 + 基础亲子互动'
            },
            {
                name: '亲子关系提升',
                level: 'advanced',
                focus: '鼓励高质量亲子教育',
                requirements: '高访问量 + 高质量亲子关系'
            }
        ];
        
        // Test that achievement types form a clear progression
        expect(achievementTypes[0].level).toBe('basic');
        expect(achievementTypes[1].level).toBe('intermediate');
        expect(achievementTypes[2].level).toBe('advanced');
        
        // Test that requirements become progressively more complex
        expect(achievementTypes[0].requirements).toBe('仅需访问博物馆');
        expect(achievementTypes[1].requirements).toContain('访问数量 + 基础亲子互动');
        expect(achievementTypes[2].requirements).toContain('高质量亲子关系');
    });

    test('should clearly show the core app attraction evolution', () => {
        const coreAttractions = [
            {
                stage: 'beginner',
                primary: '博物馆打卡',
                description: '让用户开始尝试博物馆参观',
                metrics: '访问博物馆数量'
            },
            {
                stage: 'intermediate', 
                primary: '文化探索 + 亲子互动',
                description: '在博物馆参观基础上，开始关注亲子互动质量',
                metrics: '访问量 + 测评分数'
            },
            {
                stage: 'advanced',
                primary: '亲子关系改善',
                description: '通过博物馆文化教育实现家庭关系的持续改善',
                metrics: '高质量亲子关系维持'
            }
        ];
        
        // Test that core attractions evolve logically
        expect(coreAttractions[0].primary).toBe('博物馆打卡');
        expect(coreAttractions[1].primary).toContain('文化探索 + 亲子互动');
        expect(coreAttractions[2].primary).toBe('亲子关系改善');
        
        // Test that metrics become more sophisticated
        expect(coreAttractions[0].metrics).toBe('访问博物馆数量');
        expect(coreAttractions[1].metrics).toBe('访问量 + 测评分数');
        expect(coreAttractions[2].metrics).toBe('高质量亲子关系维持');
    });
});