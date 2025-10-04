/**
 * Affiliate Parameter Tests
 * 
 * Tests for the URL parameter feature to handle affiliate mode (affiliate=DY)
 * which makes checkboxes read-only and hides assessment features.
 */

describe('Affiliate Parameter Feature', () => {
    let museumCheck;
    
    beforeEach(() => {
        // Setup DOM elements needed for testing
        document.body.innerHTML = `
            <div class="container">
                <div class="stats">
                    <div class="assessment-stats">
                        <div class="assessment-inline">
                            <div class="assessment-scores">
                                <div class="assessment-score-item">
                                    <span class="score-number" id="averageScore">85</span>
                                    <span class="score-label">平均得分</span>
                                </div>
                                <div class="assessment-score-item">
                                    <span class="score-number" id="latestScore">89</span>
                                    <span class="score-label">最新得分</span>
                                </div>
                            </div>
                            <button id="assessmentHistoryButton" class="assessment-history-button assessment-history-button-inline" title="查看测评历史">📊 <span class="button-text">测评历史</span></button>
                        </div>
                    </div>
                </div>
                <div id="museumGrid"></div>
                <select id="ageGroup">
                    <option value="3-6">3-6岁</option>
                    <option value="7-12" selected>7-12岁</option>
                    <option value="13-18">13-18岁</option>
                </select>
            </div>
            
            <!-- Assessment Modal -->
            <div id="assessmentModal" class="modal hidden">
                <div class="modal-content assessment-content">
                    <span class="close">&times;</span>
                    <h2 id="assessmentTitle">🧡 亲子关系测评</h2>
                    <div id="assessmentContent">
                        <div class="assessment-intro">
                            <!-- Simplified introduction -->
                        </div>
                        <div class="assessment-form" id="assessmentForm">
                            <!-- Content will be filled dynamically -->
                        </div>
                        <div class="assessment-buttons">
                            <button id="assessmentPrev" class="btn-secondary" style="display: none;">上一步</button>
                            <button id="assessmentNext" class="btn-primary">开始测评</button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Assessment History Modal -->
            <div id="assessmentHistoryModal" class="modal assessment-history-modal hidden">
                <div class="modal-content assessment-history-content">
                    <span class="close">&times;</span>
                    <h2>📊 亲子测评历史</h2>
                    <div class="assessment-history-summary">
                        <div class="history-overview">
                            <div class="history-stat">
                                <span class="stat-number" id="totalAssessments">0</span>
                                <span class="stat-label">总测评次数</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Reset body classes
        document.body.className = '';
        
        // Create new MuseumCheckApp instance
        if (typeof MuseumCheckApp !== 'undefined') {
            museumCheck = new MuseumCheckApp();
        }
    });
    
    afterEach(() => {
        // Clean up
        document.body.innerHTML = '';
        document.body.className = '';
        
        // Reset window.location for next test
        delete window.location;
        window.location = new URL('http://localhost:8000/');
    });

    describe('URL Parameter Detection', () => {
        test('should detect affiliate=DY parameter', () => {
            // Mock window.location with affiliate parameter
            delete window.location;
            window.location = new URL('http://localhost:8000/?affiliate=DY');
            
            if (museumCheck) {
                // Manually call handleURLParameters to test it
                museumCheck.handleURLParameters();
                
                // Should set readonlyCheckboxes flag
                expect(museumCheck.readonlyCheckboxes).toBe(true);
                
                // Should also hide assessments
                expect(museumCheck.assessmentHidden).toBe(true);
                
                // Should add CSS class to body
                expect(document.body.classList.contains('hide-assessments')).toBe(true);
            }
        });
        
        test('should not enable readonly mode without affiliate parameter', () => {
            // Mock window.location without affiliate parameter
            delete window.location;
            window.location = new URL('http://localhost:8000/');
            
            if (museumCheck) {
                museumCheck.handleURLParameters();
                
                // Should not set readonlyCheckboxes flag
                expect(museumCheck.readonlyCheckboxes).toBe(false);
                
                // Should not hide assessments
                expect(museumCheck.assessmentHidden).toBe(false);
                
                // Should not add CSS class to body
                expect(document.body.classList.contains('hide-assessments')).toBe(false);
            }
        });
        
        test('should only enable readonly mode for affiliate=DY (case sensitive)', () => {
            // Test with lowercase 'dy'
            delete window.location;
            window.location = new URL('http://localhost:8000/?affiliate=dy');
            
            if (museumCheck) {
                museumCheck.readonlyCheckboxes = false; // Reset
                museumCheck.assessmentHidden = false;
                document.body.classList.remove('hide-assessments');
                
                museumCheck.handleURLParameters();
                
                // Should not enable readonly mode for lowercase
                expect(museumCheck.readonlyCheckboxes).toBe(false);
                expect(museumCheck.assessmentHidden).toBe(false);
            }
        });
        
        test('should work with other URL parameters', () => {
            // Mock window.location with multiple parameters including affiliate
            delete window.location;
            window.location = new URL('http://localhost:8000/?museum=capital-museum&type=parent&age=7-12&affiliate=DY');
            
            if (museumCheck) {
                museumCheck.handleURLParameters();
                
                // Should enable readonly mode
                expect(museumCheck.readonlyCheckboxes).toBe(true);
                
                // Should hide assessments
                expect(museumCheck.assessmentHidden).toBe(true);
                expect(document.body.classList.contains('hide-assessments')).toBe(true);
            }
        });
        
        test('should prioritize affiliate parameter over hideAssessment', () => {
            // Test affiliate=DY with hideAssessment=false
            delete window.location;
            window.location = new URL('http://localhost:8000/?affiliate=DY&hideAssessment=false');
            
            if (museumCheck) {
                museumCheck.handleURLParameters();
                
                // affiliate=DY should still enable readonly mode and hide assessments
                expect(museumCheck.readonlyCheckboxes).toBe(true);
                expect(museumCheck.assessmentHidden).toBe(true);
            }
        });
    });

    describe('Checkbox Rendering in Readonly Mode', () => {
        test('should render checkboxes with disabled attribute when readonly mode is active', () => {
            if (museumCheck && MUSEUMS && MUSEUMS.length > 0) {
                // Enable readonly mode
                museumCheck.readonlyCheckboxes = true;
                museumCheck.filteredMuseums = [MUSEUMS[0]];
                
                // Render museums
                museumCheck.renderMuseums();
                
                // Verify all checkboxes have disabled attribute
                const checkboxes = document.querySelectorAll('.visit-checkbox');
                expect(checkboxes.length).toBeGreaterThan(0);
                
                checkboxes.forEach(checkbox => {
                    expect(checkbox.disabled).toBe(true);
                });
            }
        });
        
        test('should render checkboxes without disabled attribute in normal mode', () => {
            if (museumCheck && MUSEUMS && MUSEUMS.length > 0) {
                // Ensure readonly mode is disabled
                museumCheck.readonlyCheckboxes = false;
                museumCheck.filteredMuseums = [MUSEUMS[0]];
                
                // Render museums
                museumCheck.renderMuseums();
                
                // Verify checkboxes do not have disabled attribute
                const checkboxes = document.querySelectorAll('.visit-checkbox');
                expect(checkboxes.length).toBeGreaterThan(0);
                
                checkboxes.forEach(checkbox => {
                    expect(checkbox.disabled).toBe(false);
                });
            }
        });
        
        test('should preserve checked state in readonly mode', () => {
            if (museumCheck && MUSEUMS && MUSEUMS.length > 0) {
                // Mark first museum as visited
                const testMuseum = MUSEUMS[0];
                museumCheck.visitedMuseums = [testMuseum.id];
                museumCheck.readonlyCheckboxes = true;
                museumCheck.filteredMuseums = [testMuseum];
                
                // Render museums
                museumCheck.renderMuseums();
                
                // Verify checkbox is checked and disabled
                const checkbox = document.querySelector('.visit-checkbox');
                expect(checkbox).not.toBeNull();
                expect(checkbox.checked).toBe(true);
                expect(checkbox.disabled).toBe(true);
            }
        });
    });

    describe('Complete Integration Test', () => {
        test('should apply all affiliate=DY changes when URL parameter is set', () => {
            // Mock window.location with affiliate parameter
            delete window.location;
            window.location = new URL('http://localhost:8000/?affiliate=DY');
            
            if (museumCheck && MUSEUMS && MUSEUMS.length > 0) {
                // Set up some visited museums
                const testMuseum = MUSEUMS[0];
                museumCheck.visitedMuseums = [testMuseum.id];
                museumCheck.filteredMuseums = [testMuseum];
                
                // Handle URL parameters (this should enable readonly and hide assessments)
                museumCheck.handleURLParameters();
                
                // Render museums
                museumCheck.renderMuseums();
                
                // Verify readonly mode is enabled
                expect(museumCheck.readonlyCheckboxes).toBe(true);
                
                // Verify assessments are hidden
                expect(museumCheck.assessmentHidden).toBe(true);
                expect(document.body.classList.contains('hide-assessments')).toBe(true);
                
                // Verify no assessment buttons are rendered
                const assessmentButtons = document.querySelectorAll('.assessment-button');
                expect(assessmentButtons.length).toBe(0);
                
                // Verify checkboxes are disabled
                const checkboxes = document.querySelectorAll('.visit-checkbox');
                checkboxes.forEach(checkbox => {
                    expect(checkbox.disabled).toBe(true);
                });
            }
        });
        
        test('should work normally without affiliate parameter', () => {
            // Mock window.location without affiliate parameter
            delete window.location;
            window.location = new URL('http://localhost:8000/');
            
            if (museumCheck && MUSEUMS && MUSEUMS.length > 0) {
                // Set up some visited museums
                const testMuseum = MUSEUMS[0];
                museumCheck.visitedMuseums = [testMuseum.id];
                museumCheck.filteredMuseums = [testMuseum];
                
                // Handle URL parameters (should not change anything)
                museumCheck.handleURLParameters();
                
                // Render museums
                museumCheck.renderMuseums();
                
                // Verify readonly mode is not enabled
                expect(museumCheck.readonlyCheckboxes).toBe(false);
                
                // Verify assessments are shown
                expect(museumCheck.assessmentHidden).toBe(false);
                expect(document.body.classList.contains('hide-assessments')).toBe(false);
                
                // Verify assessment buttons are rendered for visited museums
                const assessmentButtons = document.querySelectorAll('.assessment-button');
                expect(assessmentButtons.length).toBeGreaterThan(0);
                
                // Verify checkboxes are not disabled
                const checkboxes = document.querySelectorAll('.visit-checkbox');
                checkboxes.forEach(checkbox => {
                    expect(checkbox.disabled).toBe(false);
                });
            }
        });
    });

    describe('Edge Cases', () => {
        test('should handle empty affiliate parameter value', () => {
            delete window.location;
            window.location = new URL('http://localhost:8000/?affiliate=');
            
            if (museumCheck) {
                museumCheck.handleURLParameters();
                
                // Empty string should not enable readonly mode
                expect(museumCheck.readonlyCheckboxes).toBe(false);
            }
        });
        
        test('should handle different affiliate values', () => {
            const testValues = ['TT', 'WX', 'OTHER', '123'];
            
            testValues.forEach(value => {
                delete window.location;
                window.location = new URL(`http://localhost:8000/?affiliate=${value}`);
                
                if (museumCheck) {
                    museumCheck.readonlyCheckboxes = false; // Reset
                    museumCheck.assessmentHidden = false;
                    document.body.classList.remove('hide-assessments');
                    
                    museumCheck.handleURLParameters();
                    
                    // Only 'DY' should enable readonly mode
                    expect(museumCheck.readonlyCheckboxes).toBe(false);
                }
            });
        });
    });
});
