/**
 * Tests to verify that assessment history displays user-friendly content
 * instead of technical format (addresses GitHub issue about "not user-friendly" display)
 */

describe('Assessment History Display Fix', () => {
    let museumCheck;
    
    beforeEach(() => {
        // Setup DOM
        document.body.innerHTML = `
            <div id="assessmentHistoryModal" class="modal">
                <div class="modal-content">
                    <div id="assessmentHistoryContent">
                        <div id="historyList"></div>
                    </div>
                </div>
            </div>
        `;

        // Mock MuseumCheck class
        if (typeof MuseumCheckApp !== 'undefined') {
            museumCheck = new MuseumCheckApp();
        } else {
            // Create mock with the methods we need to test
            museumCheck = {
                formatAnswerSummary: jest.fn(),
                getOverallAssessment: jest.fn(),
                getKeyInsights: jest.fn(),
                getTopRecommendations: jest.fn(),
                getParentKeyInsights: jest.fn(),
                getChildKeyInsights: jest.fn()
            };
        }
        
        localStorage.clear();
    });

    describe('Technical Format Elimination', () => {
        test('should never display Q1, Q2, Q3 format in assessment results', () => {
            const mockAnswers = [2, 3, 1, 2, 3];
            
            if (museumCheck.formatAnswerSummary && typeof museumCheck.formatAnswerSummary === 'function') {
                const result = museumCheck.formatAnswerSummary(mockAnswers, 'parent');
                
                // Should NOT contain any technical question format
                expect(result).not.toContain('Q1:');
                expect(result).not.toContain('Q2:');
                expect(result).not.toContain('Q3:');
                expect(result).not.toContain('Q4:');
                expect(result).not.toContain('Q5:');
                
                // Should NOT contain raw average score format
                expect(result).not.toContain('平均得分：');
                expect(result).not.toContain('回答分布：');
                
                // Should NOT contain raw numerical scores like "2.2/3.0"
                expect(result).not.toMatch(/\d\.\d\/3\.0/);
                
                console.log('Assessment display result:', result);
            } else {
                // If method doesn't exist, that's also a test failure
                throw new Error('formatAnswerSummary method not found - implementation missing');
            }
        });

        test('should display user-friendly parent assessment summaries', () => {
            const testScores = [
                { scores: [3, 3, 3, 3, 3], expectedContent: ['优秀', '亲子关系'] },
                { scores: [2, 2, 2, 2, 2], expectedContent: ['良好', '亲子关系'] },
                { scores: [1, 1, 1, 1, 1], expectedContent: ['提升空间', '亲子关系'] },
                { scores: [0, 0, 0, 0, 0], expectedContent: ['呵护', '亲子关系'] }
            ];

            testScores.forEach(({ scores, expectedContent }) => {
                if (museumCheck.formatAnswerSummary && typeof museumCheck.formatAnswerSummary === 'function') {
                    const result = museumCheck.formatAnswerSummary(scores, 'parent');
                    
                    expectedContent.forEach(content => {
                        expect(result).toContain(content);
                    });
                    
                    // Should contain user-friendly elements
                    expect(result).toContain('总体评估');
                    expect(result).toContain('answer-summary-improved');
                }
            });
        });

        test('should display user-friendly child assessment summaries', () => {
            const testScores = [
                { scores: [3, 3, 3, 3, 3], expectedContent: ['优秀', '孩子表现'] },
                { scores: [2, 2, 2, 2, 2], expectedContent: ['良好', '孩子表现'] },
                { scores: [1, 1, 1, 1, 1], expectedContent: ['成长中', '孩子表现'] },
                { scores: [0, 0, 0, 0, 0], expectedContent: ['关爱', '孩子表现'] }
            ];

            testScores.forEach(({ scores, expectedContent }) => {
                if (museumCheck.formatAnswerSummary && typeof museumCheck.formatAnswerSummary === 'function') {
                    const result = museumCheck.formatAnswerSummary(scores, 'child');
                    
                    expectedContent.forEach(content => {
                        expect(result).toContain(content);
                    });
                    
                    // Should contain user-friendly elements
                    expect(result).toContain('总体评估');
                    expect(result).toContain('answer-summary-improved');
                }
            });
        });
    });

    describe('User Experience Improvements', () => {
        test('should include actionable insights instead of raw data', () => {
            const mockAnswers = [2, 3, 1, 2, 3];
            
            if (museumCheck.formatAnswerSummary && typeof museumCheck.formatAnswerSummary === 'function') {
                const result = museumCheck.formatAnswerSummary(mockAnswers, 'parent');
                
                // Should contain user-friendly insight elements
                expect(result).toContain('key-insights');
                expect(result).not.toContain('原始分数'); // No raw scores
                expect(result).not.toContain('数据统计'); // No statistics
                
                // Should be helpful to parents
                expect(result.length).toBeGreaterThan(100); // Substantial content
            }
        });

        test('should handle edge cases gracefully', () => {
            const edgeCases = [
                null,
                undefined,
                [],
                [null, null, null],
                [0],
                [3, 3, 3, 3, 3, 3] // Too many answers
            ];

            edgeCases.forEach(edgeCase => {
                if (museumCheck.formatAnswerSummary && typeof museumCheck.formatAnswerSummary === 'function') {
                    const result = museumCheck.formatAnswerSummary(edgeCase, 'parent');
                    
                    // Should not crash and should return something
                    expect(result).toBeDefined();
                    expect(typeof result).toBe('string');
                    
                    // Should not contain technical format even in edge cases
                    expect(result).not.toContain('Q1:');
                    expect(result).not.toContain('平均得分：');
                    
                    // Should contain either content or graceful fallback
                    expect(result.length).toBeGreaterThan(0);
                }
            });
        });
    });

    describe('Visual Formatting', () => {
        test('should include proper CSS classes for styling', () => {
            const mockAnswers = [2, 3, 1, 2, 3];
            
            if (museumCheck.formatAnswerSummary && typeof museumCheck.formatAnswerSummary === 'function') {
                const result = museumCheck.formatAnswerSummary(mockAnswers, 'parent');
                
                // Should include CSS classes for proper styling
                expect(result).toContain('answer-summary-improved');
                expect(result).toContain('overall-score-improved');
                
                // Should include semantic elements
                expect(result).toContain('<div');
                expect(result).toContain('class=');
            }
        });

        test('should include visual indicators and emojis', () => {
            const mockAnswers = [2, 3, 1, 2, 3];
            
            if (museumCheck.formatAnswerSummary && typeof museumCheck.formatAnswerSummary === 'function') {
                const result = museumCheck.formatAnswerSummary(mockAnswers, 'parent');
                
                // Should include emojis for better visual appeal
                const hasEmojis = /[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/u.test(result);
                expect(hasEmojis).toBe(true);
            }
        });
    });
});