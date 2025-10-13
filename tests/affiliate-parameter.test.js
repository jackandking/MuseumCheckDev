/**
 * Affiliate Parameter Tests
 * 
 * Tests for the URL parameter feature - affiliate parameter enables special modes.
 * App works without affiliate parameter (no longer shows "under construction" message).
 * With affiliate parameter (any value), shows full app content.
 * When affiliate=DY specifically, also makes checkboxes read-only and hides assessments.
 */

describe('Affiliate Parameter Feature', () => {
    let museumCheck;
    
    beforeEach(() => {
        // Setup DOM elements needed for testing
        document.body.innerHTML = `
            <div id="underConstructionMessage" class="under-construction-message" style="display: none;">
                <div class="construction-content">
                    <div class="construction-icon">🏗️</div>
                    <h1 class="construction-title">网站建设中</h1>
                    <p class="construction-text">敬请期待</p>
                </div>
            </div>
            
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

    describe('Affiliate Parameter Check (Legacy)', () => {
        test('checkAffiliateAccess returns false when no affiliate parameter', () => {
            // Mock window.location without affiliate parameter
            delete window.location;
            window.location = new URL('http://localhost:8000/');
            
            if (museumCheck) {
                // Check affiliate access method still works
                const hasAccess = museumCheck.checkAffiliateAccess();
                
                // Should return false (no affiliate parameter)
                expect(hasAccess).toBe(false);
            }
        });
        
        test('checkAffiliateAccess returns true with affiliate parameter', () => {
            // Mock window.location with affiliate parameter
            delete window.location;
            window.location = new URL('http://localhost:8000/?affiliate=DY');
            
            if (museumCheck) {
                const hasAccess = museumCheck.checkAffiliateAccess();
                
                // Should return true
                expect(hasAccess).toBe(true);
            }
        });
    });

    describe('URL Parameter Detection', () => {
        test('should allow access with affiliate=DY parameter', () => {
            // Mock window.location with affiliate parameter
            delete window.location;
            window.location = new URL('http://localhost:8000/?affiliate=DY');
            
            if (museumCheck) {
                // Check affiliate access
                const hasAccess = museumCheck.checkAffiliateAccess();
                
                // Should have access
                expect(hasAccess).toBe(true);
            }
        });
        
        test('should allow access with any affiliate parameter value', () => {
            const testValues = ['DY', 'TEST', 'WX', 'TT', '123', 'any-value'];
            
            testValues.forEach(value => {
                delete window.location;
                window.location = new URL(`http://localhost:8000/?affiliate=${value}`);
                
                if (museumCheck) {
                    const hasAccess = museumCheck.checkAffiliateAccess();
                    
                    // Should have access with any affiliate value
                    expect(hasAccess).toBe(true);
                }
            });
        });
        
        test('should detect affiliate=DY parameter and enable special mode', () => {
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

    describe('Checklist Checkbox Readonly Mode', () => {
        beforeEach(() => {
            // Add modal content container to DOM
            const modalContent = document.createElement('div');
            modalContent.id = 'modalContent';
            document.body.appendChild(modalContent);
        });
        
        afterEach(() => {
            const modalContent = document.getElementById('modalContent');
            if (modalContent) {
                modalContent.remove();
            }
        });
        
        test('should render checklist checkboxes with disabled attribute when readonly mode is active', () => {
            if (museumCheck && MUSEUMS && MUSEUMS.length > 0) {
                // Enable readonly mode
                museumCheck.readonlyCheckboxes = true;
                
                // Get a test museum with checklists
                const testMuseum = MUSEUMS[0];
                const parentTasks = testMuseum.checklists.parent['7-12'];
                
                // Render checklist
                const checklistHTML = museumCheck.renderChecklist(testMuseum.id, 'parent', parentTasks);
                
                // Insert into modal
                const modalContent = document.getElementById('modalContent');
                modalContent.innerHTML = checklistHTML;
                
                // Verify all checklist checkboxes have disabled attribute
                const checkboxes = modalContent.querySelectorAll('input[type="checkbox"]');
                expect(checkboxes.length).toBeGreaterThan(0);
                
                checkboxes.forEach(checkbox => {
                    expect(checkbox.disabled).toBe(true);
                });
            }
        });
        
        test('should render checklist checkboxes without disabled attribute in normal mode', () => {
            if (museumCheck && MUSEUMS && MUSEUMS.length > 0) {
                // Ensure readonly mode is disabled
                museumCheck.readonlyCheckboxes = false;
                
                // Get a test museum with checklists
                const testMuseum = MUSEUMS[0];
                const childTasks = testMuseum.checklists.child['7-12'];
                
                // Render checklist
                const checklistHTML = museumCheck.renderChecklist(testMuseum.id, 'child', childTasks);
                
                // Insert into modal
                const modalContent = document.getElementById('modalContent');
                modalContent.innerHTML = checklistHTML;
                
                // Verify checkboxes do not have disabled attribute
                const checkboxes = modalContent.querySelectorAll('input[type="checkbox"]');
                expect(checkboxes.length).toBeGreaterThan(0);
                
                checkboxes.forEach(checkbox => {
                    expect(checkbox.disabled).toBe(false);
                });
            }
        });
        
        test('should preserve checked state in readonly mode for checklist items', () => {
            if (museumCheck && MUSEUMS && MUSEUMS.length > 0) {
                // Enable readonly mode
                museumCheck.readonlyCheckboxes = true;
                
                // Get a test museum
                const testMuseum = MUSEUMS[0];
                const checklistKey = `${testMuseum.id}-parent-7-12`;
                
                // Mark some items as completed
                museumCheck.museumChecklists[checklistKey] = [0, 2];
                
                // Render checklist
                const parentTasks = testMuseum.checklists.parent['7-12'];
                const checklistHTML = museumCheck.renderChecklist(testMuseum.id, 'parent', parentTasks);
                
                // Insert into modal
                const modalContent = document.getElementById('modalContent');
                modalContent.innerHTML = checklistHTML;
                
                // Verify checkboxes are checked and disabled
                const checkboxes = modalContent.querySelectorAll('input[type="checkbox"]');
                expect(checkboxes.length).toBeGreaterThan(0);
                
                checkboxes.forEach((checkbox, index) => {
                    expect(checkbox.disabled).toBe(true);
                    if ([0, 2].includes(index)) {
                        expect(checkbox.checked).toBe(true);
                    }
                });
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
            
            if (museumCheck) {
                // App should work normally
                museumCheck.handleURLParameters();
                
                // Verify normal mode
                expect(museumCheck.readonlyCheckboxes).toBe(false);
                expect(museumCheck.assessmentHidden).toBe(false);
            }
        });
    });

    describe('Edge Cases', () => {
        test('should not allow access with empty affiliate parameter value', () => {
            delete window.location;
            window.location = new URL('http://localhost:8000/?affiliate=');
            
            if (museumCheck) {
                const hasAccess = museumCheck.checkAffiliateAccess();
                
                // Empty string should not grant access
                expect(hasAccess).toBe(false);
            }
        });
        
        test('should allow access with different affiliate values but only DY enables readonly', () => {
            const testValues = ['TT', 'WX', 'OTHER', '123'];
            
            testValues.forEach(value => {
                delete window.location;
                window.location = new URL(`http://localhost:8000/?affiliate=${value}`);
                
                if (museumCheck) {
                    // Should have access with any non-empty affiliate value
                    const hasAccess = museumCheck.checkAffiliateAccess();
                    expect(hasAccess).toBe(true);
                    
                    // Reset flags
                    museumCheck.readonlyCheckboxes = false;
                    museumCheck.assessmentHidden = false;
                    document.body.classList.remove('hide-assessments');
                    
                    museumCheck.handleURLParameters();
                    
                    // Only 'DY' should enable readonly mode (these values should not)
                    expect(museumCheck.readonlyCheckboxes).toBe(false);
                    expect(museumCheck.assessmentHidden).toBe(false);
                }
            });
        });
    });

    describe('Museum Modal Blocking for Douyin', () => {
        beforeEach(() => {
            // Add museum modal to DOM
            const modal = document.createElement('div');
            modal.id = 'museumModal';
            modal.className = 'hidden';
            
            const modalContent = document.createElement('div');
            modalContent.id = 'modalContent';
            modal.appendChild(modalContent);
            
            const modalTitle = document.createElement('h2');
            modalTitle.id = 'modalTitle';
            modal.appendChild(modalTitle);
            
            document.body.appendChild(modal);
        });
        
        afterEach(() => {
            const modal = document.getElementById('museumModal');
            if (modal) {
                modal.remove();
            }
        });
        
        test('should block museum modal from opening when affiliate=DY', () => {
            // Mock window.location with affiliate=DY
            delete window.location;
            window.location = new URL('http://localhost:8000/?affiliate=DY');
            
            if (museumCheck && MUSEUMS && MUSEUMS.length > 0) {
                // Handle URL parameters to set Douyin mode
                museumCheck.handleURLParameters();
                
                // Verify Douyin affiliate flag is set
                expect(museumCheck.isDouyinAffiliate).toBe(true);
                
                const modal = document.getElementById('museumModal');
                const testMuseum = MUSEUMS[0];
                
                // Ensure modal is hidden initially
                modal.classList.add('hidden');
                
                // Try to open museum modal
                museumCheck.openMuseumModal(testMuseum);
                
                // Modal should remain hidden (not opened)
                expect(modal.classList.contains('hidden')).toBe(true);
            }
        });
        
        test('should allow museum modal to open without affiliate parameter', () => {
            // Mock window.location without affiliate parameter
            delete window.location;
            window.location = new URL('http://localhost:8000/');
            
            if (museumCheck && MUSEUMS && MUSEUMS.length > 0) {
                // Handle URL parameters
                museumCheck.handleURLParameters();
                
                // Verify Douyin affiliate flag is not set
                expect(museumCheck.isDouyinAffiliate).toBe(false);
                
                const modal = document.getElementById('museumModal');
                const testMuseum = MUSEUMS[0];
                
                // Ensure modal is hidden initially
                modal.classList.add('hidden');
                
                // Try to open museum modal
                museumCheck.openMuseumModal(testMuseum);
                
                // Modal should be opened (hidden class removed)
                expect(modal.classList.contains('hidden')).toBe(false);
            }
        });
        
        test('should allow museum modal to open with non-DY affiliate values', () => {
            const testValues = ['TT', 'WX', 'OTHER', '123'];
            
            testValues.forEach(value => {
                // Mock window.location with different affiliate values
                delete window.location;
                window.location = new URL(`http://localhost:8000/?affiliate=${value}`);
                
                if (museumCheck && MUSEUMS && MUSEUMS.length > 0) {
                    // Reset Douyin flag
                    museumCheck.isDouyinAffiliate = false;
                    
                    // Handle URL parameters
                    museumCheck.handleURLParameters();
                    
                    // Verify Douyin affiliate flag is not set for non-DY values
                    expect(museumCheck.isDouyinAffiliate).toBe(false);
                    
                    const modal = document.getElementById('museumModal');
                    const testMuseum = MUSEUMS[0];
                    
                    // Ensure modal is hidden initially
                    modal.classList.add('hidden');
                    
                    // Try to open museum modal
                    museumCheck.openMuseumModal(testMuseum);
                    
                    // Modal should be opened (hidden class removed)
                    expect(modal.classList.contains('hidden')).toBe(false);
                }
            });
        });
        
        test('should set isDouyinAffiliate flag only when affiliate=DY', () => {
            // Test with DY
            delete window.location;
            window.location = new URL('http://localhost:8000/?affiliate=DY');
            
            if (museumCheck) {
                museumCheck.isDouyinAffiliate = false;
                museumCheck.handleURLParameters();
                expect(museumCheck.isDouyinAffiliate).toBe(true);
            }
            
            // Test with other value
            delete window.location;
            window.location = new URL('http://localhost:8000/?affiliate=WX');
            
            if (museumCheck) {
                museumCheck.isDouyinAffiliate = false;
                museumCheck.handleURLParameters();
                expect(museumCheck.isDouyinAffiliate).toBe(false);
            }
            
            // Test without affiliate
            delete window.location;
            window.location = new URL('http://localhost:8000/');
            
            if (museumCheck) {
                museumCheck.isDouyinAffiliate = false;
                museumCheck.handleURLParameters();
                expect(museumCheck.isDouyinAffiliate).toBe(false);
            }
        });
    });
});
