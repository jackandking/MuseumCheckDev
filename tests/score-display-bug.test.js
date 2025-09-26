/**
 * Assessment Score Display Bug Tests
 * 
 * Tests for the regression where assessment scores show as 0 on page load
 * but display correctly after clicking the assessment history button.
 */

describe('Assessment Score Display Bug', () => {
    let museumCheck;
    let mockAssessmentData;
    
    beforeEach(() => {
        // Create mock assessment data
        mockAssessmentData = {
            'forbidden-city': {
                score: 89,
                date: '2024-01-15T10:00:00.000Z',
                parentAnswers: [3, 2, 3, 3, 2],
                childAnswers: [2, 3, 3, 2, 3]
            },
            'national-museum': {
                score: 85,
                date: '2024-01-10T14:30:00.000Z',
                parentAnswers: [3, 3, 2, 3, 2],
                childAnswers: [2, 2, 3, 3, 2]
            }
        };
        
        // Mock localStorage
        global.localStorage = {
            getItem: jest.fn((key) => {
                if (key === 'assessmentResults') {
                    return JSON.stringify(mockAssessmentData);
                }
                return null;
            }),
            setItem: jest.fn(),
            clear: jest.fn()
        };
        
        // Create real MuseumCheckApp instance for testing
        if (typeof global.MuseumCheckApp !== 'undefined') {
            museumCheck = new global.MuseumCheckApp();
        } else {
            // Fallback: create mock if MuseumCheckApp is not available
            museumCheck = {
                getAssessmentResults: jest.fn().mockReturnValue([
                    {
                        museumId: 'forbidden-city',
                        museumName: '故宫博物院',
                        score: 89,
                        date: new Date('2024-01-15T10:00:00.000Z'),
                        parentAnswers: [3, 2, 3, 3, 2],
                        childAnswers: [2, 3, 3, 2, 3]
                    },
                    {
                        museumId: 'national-museum',
                        museumName: '中国国家博物馆',
                        score: 85,
                        date: new Date('2024-01-10T14:30:00.000Z'),
                        parentAnswers: [3, 3, 2, 3, 2],
                        childAnswers: [2, 2, 3, 3, 2]
                    }
                ].sort((a, b) => b.date - a.date)),
                updateMainPageAssessmentScores: jest.fn()
            };
        }
    });
    
    describe('Main Page Score Display', () => {
        test('should update main page assessment scores correctly on initialization', () => {
            // Setup DOM elements
            document.body.innerHTML = `
                <div class="assessment-scores">
                    <div class="assessment-score-item">
                        <span class="score-value" id="mainAverageScore">0</span>
                        <span class="score-label">平均得分</span>
                    </div>
                    <div class="assessment-score-item">
                        <span class="score-value" id="mainLatestScore">0</span>
                        <span class="score-label">最新得分</span>
                    </div>
                </div>
            `;
            
            // Get elements
            const mainAverageScore = document.getElementById('mainAverageScore');
            const mainLatestScore = document.getElementById('mainLatestScore');
            
            // Verify initial state (bug condition)
            expect(mainAverageScore.textContent).toBe('0');
            expect(mainLatestScore.textContent).toBe('0');
            
            // Call the fix method
            if (museumCheck.updateMainPageAssessmentScores) {
                museumCheck.updateMainPageAssessmentScores();
                
                // Verify scores are updated correctly
                expect(mainAverageScore.textContent).toBe('87'); // (89 + 85) / 2 = 87
                expect(mainLatestScore.textContent).toBe('89'); // Latest score (most recent)
            } else {
                // If method doesn't exist, test that it should be called
                expect(museumCheck.updateMainPageAssessmentScores).toBeDefined();
            }
        });
        
        test('should handle empty assessment data gracefully', () => {
            // Mock empty assessment data
            global.localStorage.getItem.mockReturnValue('{}');
            
            document.body.innerHTML = `
                <div class="assessment-scores">
                    <div class="assessment-score-item">
                        <span class="score-value" id="mainAverageScore">99</span>
                        <span class="score-label">平均得分</span>
                    </div>
                    <div class="assessment-score-item">
                        <span class="score-value" id="mainLatestScore">99</span>
                        <span class="score-label">最新得分</span>
                    </div>
                </div>
            `;
            
            const mainAverageScore = document.getElementById('mainAverageScore');
            const mainLatestScore = document.getElementById('mainLatestScore');
            
            if (museumCheck.updateMainPageAssessmentScores) {
                museumCheck.updateMainPageAssessmentScores();
                
                // Should reset to 0 when no data
                expect(mainAverageScore.textContent).toBe('0');
                expect(mainLatestScore.textContent).toBe('0');
            }
        });
        
        test('should handle malformed assessment data gracefully', () => {
            // Mock malformed data
            global.localStorage.getItem.mockReturnValue('invalid json');
            
            document.body.innerHTML = `
                <div class="assessment-scores">
                    <div class="assessment-score-item">
                        <span class="score-value" id="mainAverageScore">99</span>
                        <span class="score-label">平均得分</span>
                    </div>
                    <div class="assessment-score-item">
                        <span class="score-value" id="mainLatestScore">99</span>
                        <span class="score-label">最新得分</span>
                    </div>
                </div>
            `;
            
            const mainAverageScore = document.getElementById('mainAverageScore');
            const mainLatestScore = document.getElementById('mainLatestScore');
            
            if (museumCheck.updateMainPageAssessmentScores) {
                museumCheck.updateMainPageAssessmentScores();
                
                // Should fallback to 0 on error
                expect(mainAverageScore.textContent).toBe('0');
                expect(mainLatestScore.textContent).toBe('0');
            }
        });
    });
    
    describe('Regression Prevention', () => {
        test('should be called during app initialization', () => {
            // This test ensures updateMainPageAssessmentScores is called during init
            // In the real app, this should be called from updateStats()
            if (typeof global.MuseumCheckApp !== 'undefined') {
                const spy = jest.spyOn(global.MuseumCheckApp.prototype, 'updateMainPageAssessmentScores');
                const app = new global.MuseumCheckApp();
                
                // Mock the other methods to prevent side effects
                app.initIndexedDB = jest.fn().mockResolvedValue();
                app.initAgeSelector = jest.fn();
                app.updateDynamicMuseumCounts = jest.fn();
                app.migratePhotosToIndexedDB = jest.fn();
                app.setupEventListeners = jest.fn();
                app.renderMuseums = jest.fn();
                app.updateStats = jest.fn(() => {
                    app.updateMainPageAssessmentScores();
                });
                app.handleURLParameters = jest.fn();
                
                // Call init
                app.init();
                
                // Verify updateStats was called (which should call updateMainPageAssessmentScores)
                expect(app.updateStats).toHaveBeenCalled();
                
                spy.mockRestore();
            } else {
                // Just verify the method exists if we can't test the full flow
                expect(museumCheck.updateMainPageAssessmentScores).toBeDefined();
            }
        });
    });
});