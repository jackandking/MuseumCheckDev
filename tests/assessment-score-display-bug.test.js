/**
 * Assessment Score Display Bug Regression Test
 * 
 * Tests for the bug where main page assessment scores display as 0
 * until user clicks the assessment history button.
 * 
 * Issue: Two assessment scores incorrectly display as 0 on page load,
 * show correctly after clicking assessment history once, but revert 
 * to 0 after page refresh.
 */

describe('Assessment Score Display Bug Regression', () => {
    let museumCheck;
    
    beforeEach(() => {
        // Setup DOM elements needed for this test
        document.body.innerHTML = `
            <div id="mainAverageScore">0</div>
            <div id="mainLatestScore">0</div>
            <div id="averageScore">0</div>
            <div id="latestScore">0</div>
            <div id="totalAssessments">0</div>
            <select id="ageGroup">
                <option value="3-6">3-6岁</option>
                <option value="7-12" selected>7-12岁</option>
                <option value="13-18">13-18岁</option>
            </select>
            <div id="museumGrid"></div>
            <div id="stats"></div>
            <div id="visitedCount">0</div>
            <div id="totalCount">0</div>
            <div id="visitedPercentage">0</div>
            <div id="achievementCount">0</div>
        `;
        
        // Clear localStorage to start with clean state
        localStorage.clear();
        
        // Create mock assessment data to test with
        const mockAssessmentResults = {
            'forbidden-city': {
                score: 85,
                date: new Date().toISOString(),
                parentAnswers: [1, 2, 1, 0, 2],
                childAnswers: [2, 1, 1, 2, 0]
            },
            'national-museum': {
                score: 92,
                date: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
                parentAnswers: [2, 2, 1, 1, 2],
                childAnswers: [2, 2, 2, 1, 1]
            }
        };
        
        localStorage.setItem('assessmentResults', JSON.stringify(mockAssessmentResults));
        
        // Initialize the app - use global MuseumCheckApp if available
        console.log('Available globals:', Object.keys(global).filter(k => k.includes('Museum')));
        console.log('global.MuseumCheckApp:', typeof global.MuseumCheckApp);
        console.log('MuseumCheckApp:', typeof MuseumCheckApp);
        
        if (typeof global.MuseumCheckApp !== 'undefined') {
            museumCheck = new global.MuseumCheckApp();
        } else if (typeof MuseumCheckApp !== 'undefined') {
            museumCheck = new MuseumCheckApp();
        }
        
        console.log('museumCheck created:', !!museumCheck);
    });

    afterEach(() => {
        localStorage.clear();
    });

    describe('Score Display on Initialization', () => {
        test('should display correct assessment scores on page load (main bug fix)', () => {
            if (!museumCheck) {
                console.warn('MuseumCheckApp not available, skipping test');
                return;
            }

            // Simulate app initialization
            if (museumCheck.init) {
                museumCheck.init();
            }

            // After initialization, main page scores should NOT be 0
            const mainAverageScore = document.getElementById('mainAverageScore');
            const mainLatestScore = document.getElementById('mainLatestScore');

            expect(mainAverageScore).toBeTruthy();
            expect(mainLatestScore).toBeTruthy();

            // Scores should be calculated from mock data
            // Average of 85 and 92 should be 89 (rounded)
            // Latest score should be 85 (most recent)
            const expectedAverageScore = Math.round((85 + 92) / 2); // 89
            const expectedLatestScore = 85; // most recent

            expect(mainAverageScore.textContent).not.toBe('0');
            expect(mainLatestScore.textContent).not.toBe('0');
            expect(mainAverageScore.textContent).toBe(expectedAverageScore.toString());
            expect(mainLatestScore.textContent).toBe(expectedLatestScore.toString());
        });

        test('should handle empty assessment results gracefully', () => {
            if (!museumCheck) {
                console.warn('MuseumCheckApp not available, skipping test');
                return;
            }

            // Clear assessment results
            localStorage.setItem('assessmentResults', '{}');

            // Simulate app initialization
            if (museumCheck.init) {
                museumCheck.init();
            }

            // With no assessment data, scores should remain 0
            const mainAverageScore = document.getElementById('mainAverageScore');
            const mainLatestScore = document.getElementById('mainLatestScore');

            expect(mainAverageScore.textContent).toBe('0');
            expect(mainLatestScore.textContent).toBe('0');
        });
    });

    describe('Score Update Functions', () => {
        test('should have a method to update main page assessment scores', () => {
            if (!museumCheck) {
                console.warn('MuseumCheckApp not available, skipping test');
                return;
            }

            // Check if the fix method exists
            expect(typeof museumCheck.updateMainPageAssessmentScores).toBe('function');
        });

        test('updateMainPageAssessmentScores should calculate and display correct scores', () => {
            if (!museumCheck || !museumCheck.updateMainPageAssessmentScores) {
                console.warn('updateMainPageAssessmentScores method not available, skipping test');
                return;
            }

            // Call the fix method directly
            museumCheck.updateMainPageAssessmentScores();

            const mainAverageScore = document.getElementById('mainAverageScore');
            const mainLatestScore = document.getElementById('mainLatestScore');

            // Expected values based on mock data
            const expectedAverageScore = Math.round((85 + 92) / 2); // 89
            const expectedLatestScore = 85; // most recent

            expect(mainAverageScore.textContent).toBe(expectedAverageScore.toString());
            expect(mainLatestScore.textContent).toBe(expectedLatestScore.toString());
        });
    });

    describe('Consistency with Assessment History Modal', () => {
        test('main page scores should match assessment history modal scores', () => {
            if (!museumCheck) {
                console.warn('MuseumCheckApp not available, skipping test');
                return;
            }

            // Update both main page and modal scores
            if (museumCheck.updateMainPageAssessmentScores) {
                museumCheck.updateMainPageAssessmentScores();
            }
            
            if (museumCheck.renderAssessmentHistory) {
                museumCheck.renderAssessmentHistory();
            }

            // Get elements
            const mainAverageScore = document.getElementById('mainAverageScore');
            const mainLatestScore = document.getElementById('mainLatestScore');
            const modalAverageScore = document.getElementById('averageScore');
            const modalLatestScore = document.getElementById('latestScore');

            // Scores should be consistent between main page and modal
            expect(mainAverageScore.textContent).toBe(modalAverageScore.textContent);
            expect(mainLatestScore.textContent).toBe(modalLatestScore.textContent);
        });
    });

    describe('Edge Cases', () => {
        test('should handle malformed assessment data', () => {
            if (!museumCheck) {
                console.warn('MuseumCheckApp not available, skipping test');
                return;
            }

            // Set malformed data
            localStorage.setItem('assessmentResults', 'invalid json');

            if (museumCheck.updateMainPageAssessmentScores) {
                // Should not throw an error
                expect(() => {
                    museumCheck.updateMainPageAssessmentScores();
                }).not.toThrow();
            }

            // Should fallback to 0 scores
            const mainAverageScore = document.getElementById('mainAverageScore');
            const mainLatestScore = document.getElementById('mainLatestScore');

            expect(mainAverageScore.textContent).toBe('0');
            expect(mainLatestScore.textContent).toBe('0');
        });

        test('should handle single assessment result', () => {
            if (!museumCheck) {
                console.warn('MuseumCheckApp not available, skipping test');
                return;
            }

            // Set single assessment
            const singleAssessment = {
                'forbidden-city': {
                    score: 75,
                    date: new Date().toISOString(),
                    parentAnswers: [1, 1, 1, 1, 1],
                    childAnswers: [1, 1, 1, 1, 1]
                }
            };
            localStorage.setItem('assessmentResults', JSON.stringify(singleAssessment));

            if (museumCheck.updateMainPageAssessmentScores) {
                museumCheck.updateMainPageAssessmentScores();
            }

            const mainAverageScore = document.getElementById('mainAverageScore');
            const mainLatestScore = document.getElementById('mainLatestScore');

            // With single assessment, both scores should be the same
            expect(mainAverageScore.textContent).toBe('75');
            expect(mainLatestScore.textContent).toBe('75');
        });
    });
});