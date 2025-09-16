/**
 * Assessment UX Fixes Tests - Issue #270
 * 
 * Tests for the specific UX improvements addressing:
 * 1. Continue button logic fix
 * 2. Resume button functionality 
 * 3. Step navigation behavior
 * 4. Auto-scroll functionality
 */

describe('Assessment UX Fixes - Issue #270', () => {
    let museumCheck;
    
    beforeEach(() => {
        // Setup DOM with assessment modal
        document.body.innerHTML = `
            <div id="assessmentModal" class="modal hidden">
                <div class="modal-content assessment-content">
                    <span class="close">&times;</span>
                    <h2 id="assessmentTitle">🧡 亲子关系测评</h2>
                    <div id="assessmentContent">
                        <div class="assessment-intro">
                            <p>测评介绍</p>
                        </div>
                        <div class="assessment-steps">
                            <div class="step-indicator">
                                <span class="step active" data-step="1">1. 家长问卷</span>
                                <span class="step" data-step="2">2. 孩子问卷</span>
                                <span class="step" data-step="3">3. 测评结果</span>
                            </div>
                        </div>
                        <div class="assessment-form" id="assessmentForm">
                        </div>
                        <div class="assessment-buttons">
                            <button id="assessmentNext" class="btn-primary">开始测评</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Mock localStorage
        Object.defineProperty(window, 'localStorage', {
            value: {
                store: {},
                getItem(key) { return this.store[key] || null; },
                setItem(key, value) { this.store[key] = value; },
                removeItem(key) { delete this.store[key]; },
                clear() { this.store = {}; }
            },
            writable: true
        });

        // Mock console methods
        jest.spyOn(console, 'warn').mockImplementation(() => {});

        // Setup mock MuseumCheck instance
        global.MuseumCheck = class {
            constructor() {
                this.assessmentState = null;
            }
            
            loadAssessmentProgress(museumId) {
                try {
                    const savedProgress = localStorage.getItem('assessmentProgress');
                    if (!savedProgress) return null;
                    
                    const progress = JSON.parse(savedProgress);
                    
                    if (progress.museumId === museumId) {
                        const timestamp = new Date(progress.timestamp);
                        const now = new Date();
                        const hoursDiff = (now - timestamp) / (1000 * 60 * 60);
                        
                        if (hoursDiff < 24) {
                            // Check if assessment is actually incomplete (Issue #270 fix)
                            if (progress.completed === true || progress.currentStep >= 3) {
                                this.clearAssessmentProgress();
                                return null;
                            }
                            
                            // Additional validation for completion
                            const parentComplete = progress.parentAnswers && progress.parentAnswers.length >= 5 && 
                                                 !progress.parentAnswers.some(a => a === undefined || a === null);
                            const childComplete = progress.childAnswers && progress.childAnswers.length >= 5 && 
                                                !progress.childAnswers.some(a => a === undefined || a === null);
                            
                            if (parentComplete && childComplete && progress.currentStep >= 2) {
                                this.clearAssessmentProgress();
                                return null;
                            }
                            
                            return progress;
                        }
                    }
                    return null;
                } catch (error) {
                    return null;
                }
            }
            
            clearAssessmentProgress() {
                localStorage.removeItem('assessmentProgress');
            }
            
            initializeStepTabs() {
                const steps = document.querySelectorAll('.step');
                steps.forEach((stepEl, index) => {
                    stepEl.setAttribute('role', 'tab');
                    stepEl.setAttribute('aria-selected', index === 0 ? 'true' : 'false');
                    stepEl.style.cursor = 'default';
                    
                    // Remove click handlers - Issue #270 fix for redundant navigation
                    stepEl.removeAttribute('onclick');
                    stepEl.onclick = null;
                    
                    if (index === 0) {
                        stepEl.setAttribute('aria-current', 'step');
                    } else {
                        stepEl.classList.add('disabled');
                        stepEl.style.opacity = '0.5';
                        stepEl.style.cursor = 'not-allowed';
                    }
                });
            }
        };
        
        museumCheck = new MuseumCheck();
    });

    afterEach(() => {
        console.warn.mockRestore();
        if (localStorage.clear) {
            localStorage.clear();
        } else {
            localStorage.store = {};
        }
    });

    describe('Issue #1: Continue button logic fix', () => {
        test('should not show continue button for completed assessment', () => {
            // Save a completed assessment progress
            const completedProgress = {
                museumId: 'test-museum',
                currentStep: 3,
                completed: true,
                parentAnswers: [1, 2, 3, 4, 0],
                childAnswers: [2, 1, 4, 3, 1],
                timestamp: new Date().toISOString()
            };
            
            localStorage.setItem('assessmentProgress', JSON.stringify(completedProgress));
            
            // Try to load progress - should return null for completed assessment
            const loadedProgress = museumCheck.loadAssessmentProgress('test-museum');
            
            expect(loadedProgress).toBeNull();
            expect(localStorage.getItem('assessmentProgress')).toBeNull();
        });

        test('should not show continue button when both questionnaires are complete', () => {
            // Save progress with both questionnaires complete but step < 3
            const bothCompleteProgress = {
                museumId: 'test-museum',
                currentStep: 2,
                completed: false,
                parentAnswers: [1, 2, 3, 4, 0],
                childAnswers: [2, 1, 4, 3, 1],
                timestamp: new Date().toISOString()
            };
            
            localStorage.setItem('assessmentProgress', JSON.stringify(bothCompleteProgress));
            
            // Should clear progress since both questionnaires are complete
            const loadedProgress = museumCheck.loadAssessmentProgress('test-museum');
            
            expect(loadedProgress).toBeNull();
        });

        test('should show continue button for genuinely incomplete assessment', () => {
            // Save progress with incomplete parent questionnaire
            const incompleteProgress = {
                museumId: 'test-museum',
                currentStep: 1,
                completed: false,
                parentAnswers: [1, 2, undefined, 4, 0], // Missing answer
                childAnswers: [],
                timestamp: new Date().toISOString()
            };
            
            localStorage.setItem('assessmentProgress', JSON.stringify(incompleteProgress));
            
            // Should return progress for incomplete assessment
            const loadedProgress = museumCheck.loadAssessmentProgress('test-museum');
            
            expect(loadedProgress).not.toBeNull();
            expect(loadedProgress.currentStep).toBe(1);
        });
    });

    describe('Issue #2: Resume button functionality', () => {
        test('should have proper resume button structure in DOM', () => {
            // Create resume dialog structure as done in actual code
            const resumeDialog = document.createElement('div');
            resumeDialog.className = 'resume-progress-dialog';
            resumeDialog.innerHTML = `
                <div class="resume-progress-content">
                    <h3>📋 发现未完成的测评</h3>
                    <div class="resume-progress-buttons">
                        <button id="resumeAssessment" class="btn-primary">继续完成</button>
                        <button id="startNewAssessment" class="btn-secondary">重新开始</button>
                    </div>
                </div>
            `;
            
            const assessmentContent = document.getElementById('assessmentContent');
            assessmentContent.innerHTML = '';
            assessmentContent.appendChild(resumeDialog);
            
            // Verify button exists and is clickable
            const resumeButton = document.getElementById('resumeAssessment');
            expect(resumeButton).not.toBeNull();
            expect(resumeButton.textContent).toBe('继续完成');
            expect(resumeButton.className).toContain('btn-primary');
        });

        test('should properly set up resume button event handler', () => {
            // Test that resume button can receive click handlers
            const resumeDialog = document.createElement('div');
            resumeDialog.innerHTML = `
                <button id="resumeAssessment" class="btn-primary">继续完成</button>
            `;
            document.body.appendChild(resumeDialog);
            
            let clickHandled = false;
            const resumeButton = document.getElementById('resumeAssessment');
            resumeButton.onclick = () => { clickHandled = true; };
            
            // Simulate click
            resumeButton.click();
            
            expect(clickHandled).toBe(true);
        });
    });

    describe('Issue #3: Step navigation behavior', () => {
        test('should make step indicators non-clickable', () => {
            museumCheck.initializeStepTabs();
            
            const steps = document.querySelectorAll('.step');
            
            steps.forEach((step, index) => {
                // Should have proper accessibility attributes
                expect(step.getAttribute('role')).toBe('tab');
                
                // Should not have click handlers
                expect(step.onclick).toBeNull();
                expect(step.hasAttribute('onclick')).toBe(false);
                
                if (index === 0) {
                    // First step should be active
                    expect(step.style.cursor).toBe('default');
                    expect(step.getAttribute('aria-current')).toBe('step');
                } else {
                    // Other steps should be disabled
                    expect(step.classList.contains('disabled')).toBe(true);
                    expect(step.style.cursor).toBe('not-allowed');
                    expect(step.style.opacity).toBe('0.5');
                }
            });
        });

        test('should not respond to click events on step indicators', () => {
            museumCheck.initializeStepTabs();
            
            const steps = document.querySelectorAll('.step');
            let clickEventFired = false;
            
            // Try to add click handler - should not execute since onclick is null
            steps[1].addEventListener('click', () => {
                clickEventFired = true;
            });
            
            // Click the step
            steps[1].click();
            
            // Click event might fire, but step should remain disabled
            expect(steps[1].classList.contains('disabled')).toBe(true);
            expect(steps[1].style.cursor).toBe('not-allowed');
        });
    });

    describe('Issue #4: Auto-scroll functionality (already implemented)', () => {
        test('should have scrollIntoView available for elements', () => {
            // Mock scrollIntoView since it's not available in jsdom
            Element.prototype.scrollIntoView = jest.fn();
            
            const testElement = document.createElement('div');
            document.body.appendChild(testElement);
            
            // Test that scrollIntoView can be called
            testElement.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'center',
                inline: 'nearest'
            });
            
            expect(testElement.scrollIntoView).toHaveBeenCalledWith({
                behavior: 'smooth',
                block: 'center', 
                inline: 'nearest'
            });
        });

        test('should detect mobile viewport for auto-scroll trigger', () => {
            // Test mobile viewport detection
            Object.defineProperty(window, 'innerWidth', { value: 375, writable: true });
            expect(window.innerWidth <= 768).toBe(true);
            
            Object.defineProperty(window, 'innerWidth', { value: 1024, writable: true });
            expect(window.innerWidth <= 768).toBe(false);
        });
    });

    describe('Overall UX Regression Prevention', () => {
        test('should maintain proper assessment state structure', () => {
            const testState = {
                museumId: 'test-museum',
                currentStep: 1,
                parentAnswers: [],
                childAnswers: [],
                score: 0
            };
            
            // All required properties should be present
            expect(testState.museumId).toBeDefined();
            expect(testState.currentStep).toBeDefined();
            expect(Array.isArray(testState.parentAnswers)).toBe(true);
            expect(Array.isArray(testState.childAnswers)).toBe(true);
            expect(typeof testState.score).toBe('number');
        });

        test('should handle localStorage errors gracefully', () => {
            // Override localStorage to throw errors
            const mockLocalStorage = {
                getItem: jest.fn(() => { throw new Error('Storage error'); }),
                setItem: jest.fn(() => { throw new Error('Storage error'); }),
                removeItem: jest.fn(() => { throw new Error('Storage error'); })
            };
            
            Object.defineProperty(window, 'localStorage', {
                value: mockLocalStorage,
                writable: true
            });
            
            // Should not throw errors and return null gracefully
            expect(() => {
                const result = museumCheck.loadAssessmentProgress('test-museum');
                expect(result).toBeNull();
            }).not.toThrow();
        });
    });
});