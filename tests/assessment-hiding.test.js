/**
 * Assessment Hiding Tests
 * 
 * Tests for the URL parameter feature to hide assessment functionality
 * for Douyin mini-program compliance.
 */

describe('Assessment Hiding Feature', () => {
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
        test('should detect hideAssessment=true parameter', () => {
            // Mock window.location with hideAssessment parameter
            delete window.location;
            window.location = new URL('http://localhost:8000/?hideAssessment=true');
            
            if (museumCheck) {
                // Manually call handleURLParameters to test it
                museumCheck.handleURLParameters();
                
                // Should set assessmentHidden flag
                expect(museumCheck.assessmentHidden).toBe(true);
                
                // Should add CSS class to body
                expect(document.body.classList.contains('hide-assessments')).toBe(true);
            }
        });
        
        test('should not hide assessments without parameter', () => {
            // Mock window.location without hideAssessment parameter
            delete window.location;
            window.location = new URL('http://localhost:8000/');
            
            if (museumCheck) {
                museumCheck.handleURLParameters();
                
                // Should not set assessmentHidden flag
                expect(museumCheck.assessmentHidden).toBe(false);
                
                // Should not add CSS class to body
                expect(document.body.classList.contains('hide-assessments')).toBe(false);
            }
        });
        
        test('should not hide assessments with hideAssessment=false', () => {
            // Mock window.location with hideAssessment=false
            delete window.location;
            window.location = new URL('http://localhost:8000/?hideAssessment=false');
            
            if (museumCheck) {
                museumCheck.handleURLParameters();
                
                // Should not set assessmentHidden flag
                expect(museumCheck.assessmentHidden).toBe(false);
                
                // Should not add CSS class to body
                expect(document.body.classList.contains('hide-assessments')).toBe(false);
            }
        });
        
        test('should work with other URL parameters', () => {
            // Mock window.location with multiple parameters including hideAssessment
            delete window.location;
            window.location = new URL('http://localhost:8000/?museum=capital-museum&type=parent&age=7-12&hideAssessment=true');
            
            if (museumCheck) {
                museumCheck.handleURLParameters();
                
                // Should hide assessments
                expect(museumCheck.assessmentHidden).toBe(true);
                expect(document.body.classList.contains('hide-assessments')).toBe(true);
            }
        });
    });

    describe('CSS-based Hiding', () => {
        test('should hide assessment elements when hide-assessments class is applied', () => {
            // Apply the hide-assessments class
            document.body.classList.add('hide-assessments');
            
            // Check that relevant elements exist first
            const assessmentStats = document.querySelector('.assessment-stats');
            const assessmentHistoryButton = document.querySelector('.assessment-history-button');
            const assessmentModal = document.querySelector('#assessmentModal');
            const assessmentHistoryModal = document.querySelector('#assessmentHistoryModal');
            
            expect(assessmentStats).not.toBeNull();
            expect(assessmentHistoryButton).not.toBeNull();
            expect(assessmentModal).not.toBeNull();
            expect(assessmentHistoryModal).not.toBeNull();
            
            // Note: We can't easily test CSS display:none in jsdom environment
            // But we can verify the class is applied correctly
            expect(document.body.classList.contains('hide-assessments')).toBe(true);
        });
    });

    describe('Museum Card Assessment Button Rendering', () => {
        test('should not render assessment buttons when assessmentHidden is true', () => {
            if (museumCheck && MUSEUMS && MUSEUMS.length > 0) {
                // Set up a visited museum
                const testMuseum = MUSEUMS[0];
                museumCheck.visitedMuseums = [testMuseum.id];
                museumCheck.assessmentHidden = true;
                
                // Mock the filteredMuseums to contain our test museum
                museumCheck.filteredMuseums = [testMuseum];
                
                // Render museums
                museumCheck.renderMuseums();
                
                // Check that no assessment buttons are rendered
                const assessmentButtons = document.querySelectorAll('.assessment-button');
                expect(assessmentButtons.length).toBe(0);
            }
        });
        
        test('should render assessment buttons when assessmentHidden is false', () => {
            if (museumCheck && MUSEUMS && MUSEUMS.length > 0) {
                // Set up a visited museum
                const testMuseum = MUSEUMS[0];
                museumCheck.visitedMuseums = [testMuseum.id];
                museumCheck.assessmentHidden = false;
                
                // Mock the filteredMuseums to contain our test museum
                museumCheck.filteredMuseums = [testMuseum];
                
                // Render museums
                museumCheck.renderMuseums();
                
                // Check that assessment buttons are rendered for visited museums
                const assessmentButtons = document.querySelectorAll('.assessment-button');
                expect(assessmentButtons.length).toBe(1);
                expect(assessmentButtons[0].textContent).toContain('亲子测评');
            }
        });
        
        test('should NOT hide check-in buttons with CSS when assessmentHidden is true', () => {
            // This is a regression test for issue: 打卡按钮不需要被设置页面中的是否显示亲子关系功能影响
            // The check-in button should never be hidden by the hide-assessments CSS class
            // because check-in functionality is independent of assessment features
            
            // Load and check the CSS file to ensure the incorrect rule is not present
            const fs = require('fs');
            const path = require('path');
            const cssPath = path.join(__dirname, '..', 'style.css');
            const cssContent = fs.readFileSync(cssPath, 'utf8');
            
            // Verify that the CSS does NOT contain a rule hiding .museum-checkin-button
            // when body has .hide-assessments class
            const badRule1 = 'body.hide-assessments .museum-checkin-button';
            const badRule2 = '.hide-assessments .museum-checkin-button';
            
            expect(cssContent).not.toContain(badRule1);
            expect(cssContent).not.toContain(badRule2);
            
            // Verify that other assessment-related elements ARE still hidden
            expect(cssContent).toContain('.hide-assessments .assessment-button');
        });
    });

    describe('Complete Integration Test', () => {
        test('should hide all assessment features when URL parameter is set', () => {
            // Mock window.location with hideAssessment parameter
            delete window.location;
            window.location = new URL('http://localhost:8000/?hideAssessment=true');
            
            if (museumCheck && MUSEUMS && MUSEUMS.length > 0) {
                // Set up some visited museums
                const testMuseum = MUSEUMS[0];
                museumCheck.visitedMuseums = [testMuseum.id];
                museumCheck.filteredMuseums = [testMuseum];
                
                // Handle URL parameters (this should hide assessments)
                museumCheck.handleURLParameters();
                
                // Render museums
                museumCheck.renderMuseums();
                
                // Verify assessments are hidden
                expect(museumCheck.assessmentHidden).toBe(true);
                expect(document.body.classList.contains('hide-assessments')).toBe(true);
                
                // Verify no assessment buttons are rendered
                const assessmentButtons = document.querySelectorAll('.assessment-button');
                expect(assessmentButtons.length).toBe(0);
            }
        });
        
        test('should show all assessment features by default', () => {
            // Mock window.location without hideAssessment parameter
            delete window.location;
            window.location = new URL('http://localhost:8000/');
            
            if (museumCheck && MUSEUMS && MUSEUMS.length > 0) {
                // Set up some visited museums
                const testMuseum = MUSEUMS[0];
                museumCheck.visitedMuseums = [testMuseum.id];
                museumCheck.filteredMuseums = [testMuseum];
                
                // Handle URL parameters (should not hide assessments)
                museumCheck.handleURLParameters();
                
                // Render museums
                museumCheck.renderMuseums();
                
                // Verify assessments are shown
                expect(museumCheck.assessmentHidden).toBe(false);
                expect(document.body.classList.contains('hide-assessments')).toBe(false);
                
                // Verify assessment buttons are rendered for visited museums
                const assessmentButtons = document.querySelectorAll('.assessment-button');
                expect(assessmentButtons.length).toBe(1);
            }
        });
    });
});