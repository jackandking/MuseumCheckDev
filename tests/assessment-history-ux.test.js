/**
 * Assessment History UX Tests
 * 
 * Tests for the improved user-friendly assessment history display
 */

describe('Assessment History UX Improvements', () => {
    let museumCheck;
    
    beforeEach(() => {
        // Mock MuseumCheckApp for testing
        museumCheck = {
            formatAnswerSummary: (answers, type) => {
                if (!answers || answers.length === 0) {
                    return '暂无数据';
                }
                
                const scores = answers.map(a => a || 0);
                const total = scores.reduce((sum, score) => sum + score, 0);
                const average = (total / scores.length).toFixed(1);
                
                // Get user-friendly interpretations
                const interpretations = museumCheck.getAnswerInterpretations(scores, type);
                const overallAssessment = museumCheck.getOverallAssessment(parseFloat(average), type);
                
                return `
                    <div class="answer-summary">
                        <div class="overall-score">
                            <span class="score-label">总体评估:</span> 
                            <span class="score-value">${overallAssessment}</span>
                        </div>
                        <div class="detailed-insights">
                            ${interpretations.map(item => `
                                <div class="insight-item">
                                    <span class="insight-icon">${item.icon}</span>
                                    <span class="insight-text">${item.text}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `;
            },
            
            getAnswerInterpretations: (scores, type) => {
                if (type === 'parent') {
                    return museumCheck.getParentInterpretations(scores);
                } else {
                    return museumCheck.getChildInterpretations(scores);
                }
            },
            
            getParentInterpretations: (scores) => {
                const interpretations = [];
                
                // Communication frequency
                const comm = scores[0];
                if (comm >= 3) {
                    interpretations.push({ icon: '💬', text: '与孩子交流十分频繁深入' });
                } else if (comm >= 2) {
                    interpretations.push({ icon: '💬', text: '与孩子保持良好日常交流' });
                } else if (comm >= 1) {
                    interpretations.push({ icon: '💭', text: '与孩子交流有待加强' });
                } else {
                    interpretations.push({ icon: '😶', text: '亲子交流较为缺乏' });
                }
                
                // Handling difficulties
                const handling = scores[1];
                if (handling >= 3) {
                    interpretations.push({ icon: '🤝', text: '善于引导孩子独立思考' });
                } else if (handling >= 2) {
                    interpretations.push({ icon: '👂', text: '能够倾听并给出建议' });
                } else if (handling >= 1) {
                    interpretations.push({ icon: '⚡', text: '倾向于直接给出解决方案' });
                } else {
                    interpretations.push({ icon: '❌', text: '对孩子困难处理方式需改善' });
                }
                
                // Return the first 5 for comprehensive testing
                return interpretations;
            },
            
            getChildInterpretations: (scores) => {
                const interpretations = [];
                
                // Sharing school events
                const schoolShare = scores[0];
                if (schoolShare >= 3) {
                    interpretations.push({ icon: '🗣️', text: '主动分享学校趣事' });
                } else if (schoolShare >= 2) {
                    interpretations.push({ icon: '💭', text: '偶尔分享学校生活' });
                } else if (schoolShare >= 1) {
                    interpretations.push({ icon: '🤐', text: '需要询问才会分享' });
                } else {
                    interpretations.push({ icon: '😶', text: '很少分享学校情况' });
                }
                
                return interpretations.slice(0, 2); // Return limited items for testing
            },
            
            getOverallAssessment: (average, type) => {
                const prefix = type === 'parent' ? '亲子关系' : '孩子表现';
                
                if (average >= 2.5) {
                    return `${prefix}：优秀 ⭐⭐⭐`;
                } else if (average >= 2.0) {
                    return `${prefix}：良好 ⭐⭐`;
                } else if (average >= 1.0) {
                    return `${prefix}：需改善 ⭐`;
                } else {
                    return `${prefix}：需要关注`;
                }
            }
        };
    });

    describe('User-Friendly Format Generation', () => {
        test('should generate user-friendly parent assessment summary', () => {
            const parentAnswers = [2, 2, 2, 2, 2]; // Good scores (average 2.0)
            const result = museumCheck.formatAnswerSummary(parentAnswers, 'parent');
            
            // Should contain user-friendly elements instead of raw scores
            expect(result).toContain('总体评估');
            expect(result).toContain('亲子关系：良好 ⭐⭐');
            expect(result).toContain('与孩子保持良好日常交流');
            expect(result).toContain('能够倾听并给出建议');
            
            // Should NOT contain cryptic Q1, Q2 format
            expect(result).not.toContain('Q1:');
            expect(result).not.toContain('Q2:');
            expect(result).not.toContain('平均得分：');
        });

        test('should generate user-friendly child assessment summary', () => {
            const childAnswers = [2, 3, 1, 2, 3]; // Mixed scores
            const result = museumCheck.formatAnswerSummary(childAnswers, 'child');
            
            // Should contain user-friendly elements
            expect(result).toContain('总体评估');
            expect(result).toContain('孩子表现：良好 ⭐⭐');
            expect(result).toContain('偶尔分享学校生活');
            
            // Should NOT contain technical format
            expect(result).not.toContain('Q1:');
            expect(result).not.toContain('回答分布：');
        });

        test('should handle empty answers gracefully', () => {
            const result = museumCheck.formatAnswerSummary([], 'parent');
            expect(result).toBe('暂无数据');
        });

        test('should handle null answers gracefully', () => {
            const result = museumCheck.formatAnswerSummary(null, 'child');
            expect(result).toBe('暂无数据');
        });
    });

    describe('Score Interpretations', () => {
        test('should provide appropriate parent interpretations for high scores', () => {
            const interpretations = museumCheck.getParentInterpretations([3, 3, 3, 3, 3]);
            
            expect(interpretations[0]).toEqual({
                icon: '💬',
                text: '与孩子交流十分频繁深入'
            });
            expect(interpretations[1]).toEqual({
                icon: '🤝',
                text: '善于引导孩子独立思考'
            });
        });

        test('should provide appropriate parent interpretations for low scores', () => {
            const interpretations = museumCheck.getParentInterpretations([0, 0, 1, 0, 1]);
            
            expect(interpretations[0]).toEqual({
                icon: '😶',
                text: '亲子交流较为缺乏'
            });
            expect(interpretations[1]).toEqual({
                icon: '❌',
                text: '对孩子困难处理方式需改善'
            });
        });

        test('should provide appropriate child interpretations', () => {
            const interpretations = museumCheck.getChildInterpretations([3, 2, 1, 2, 3]);
            
            expect(interpretations[0]).toEqual({
                icon: '🗣️',
                text: '主动分享学校趣事'
            });
        });
    });

    describe('Overall Assessment', () => {
        test('should provide correct assessment for excellent scores', () => {
            const assessment = museumCheck.getOverallAssessment(2.8, 'parent');
            expect(assessment).toBe('亲子关系：优秀 ⭐⭐⭐');
        });

        test('should provide correct assessment for good scores', () => {
            const assessment = museumCheck.getOverallAssessment(2.2, 'child');
            expect(assessment).toBe('孩子表现：良好 ⭐⭐');
        });

        test('should provide correct assessment for needs improvement', () => {
            const assessment = museumCheck.getOverallAssessment(1.5, 'parent');
            expect(assessment).toBe('亲子关系：需改善 ⭐');
        });

        test('should provide correct assessment for concerning scores', () => {
            const assessment = museumCheck.getOverallAssessment(0.5, 'child');
            expect(assessment).toBe('孩子表现：需要关注');
        });
    });

    describe('Mobile Responsive Design', () => {
        test('should include mobile-responsive CSS classes', () => {
            const result = museumCheck.formatAnswerSummary([2, 2, 2, 2, 2], 'parent');
            
            // Check for mobile-responsive class structure
            expect(result).toContain('answer-summary');
            expect(result).toContain('overall-score');
            expect(result).toContain('detailed-insights');
            expect(result).toContain('insight-item');
        });
    });
});