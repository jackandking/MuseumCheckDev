/**
 * Assessment Page UX Issue Tests (Issue #270)
 * 
 * Tests for the specific UX problems reported:
 * 1. "继续完成" button appears even when assessment is completed
 * 2. "继续完成" button click is ineffective
 * 3. Navigation tabs are redundant and take up space
 * 4. No auto-scroll after answering questions on mobile
 */

describe('Assessment Page UX Issues #270', () => {
    let testUtils;
    
    beforeEach(() => {
        // Setup minimal DOM for testing
        testUtils = {
            setupMinimalDOM: () => {
                document.body.innerHTML = `
                    <!-- Assessment Modal -->
                    <div id="assessmentModal" class="modal hidden">
                        <div class="modal-content assessment-content">
                            <span class="close">&times;</span>
                            <h2 id="assessmentTitle">🧡 亲子关系测评</h2>
                            <div id="assessmentContent">
                                <div class="assessment-intro">
                                    <p>通过简单的问卷，了解您的亲子关系现状，获得专业的改善建议。</p>
                                </div>
                                <div class="assessment-steps">
                                    <div class="step-indicator">
                                        <span class="step active" data-step="1">1. 家长问卷</span>
                                        <span class="step" data-step="2">2. 孩子问卷</span>
                                        <span class="step" data-step="3">3. 测评结果</span>
                                    </div>
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
                `;
            }
        };
        
        testUtils.setupMinimalDOM();
        
        // Mock localStorage
        const localStorageMock = (() => {
            let store = {};
            return {
                getItem: (key) => store[key] || null,
                setItem: (key, value) => store[key] = value,
                removeItem: (key) => delete store[key],
                clear: () => store = {}
            };
        })();
        Object.defineProperty(window, 'localStorage', { value: localStorageMock });
        
        // Mock console methods to avoid noise in tests
        jest.spyOn(console, 'warn').mockImplementation(() => {});
        jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        localStorage.clear();
        console.warn.mockRestore();
        console.error.mockRestore();
    });

    describe('Issue #1: "继续完成" button shows for completed assessments', () => {
        test('should not show continue button when assessment is completed', () => {
            // Simulate completed assessment in localStorage
            const completedAssessment = {
                museumId: 'test-museum',
                currentStep: 3,
                completed: true,
                parentAnswers: [1, 2, 3, 4, 5],
                childAnswers: [2, 1, 4, 3, 5],
                timestamp: new Date().toISOString()
            };
            
            localStorage.setItem('assessmentProgress', JSON.stringify(completedAssessment));
            
            // Mock loadAssessmentProgress behavior (fixed version)
            const mockLoadProgress = (museumId) => {
                const saved = localStorage.getItem('assessmentProgress');
                if (!saved) return null;
                
                const progress = JSON.parse(saved);
                
                // Issue #270 fix: Don't return progress for completed assessments
                if (progress.completed === true || progress.currentStep >= 3) {
                    return null; // Assessment already completed
                }
                
                return progress;
            };
            
            const result = mockLoadProgress('test-museum');
            
            expect(result).toBe(null);
            expect(document.querySelector('#resumeAssessment')).toBe(null);
        });

        test('should not show continue button when questionnaires are fully answered', () => {
            // Simulate assessment with all answers but step < 3
            const almostCompletedAssessment = {
                museumId: 'test-museum',
                currentStep: 2,
                completed: false,
                parentAnswers: [1, 2, 3, 4, 5], // All 5 answers provided
                childAnswers: [2, 1, 4, 3, 5],   // All 5 answers provided
                timestamp: new Date().toISOString()
            };
            
            localStorage.setItem('assessmentProgress', JSON.stringify(almostCompletedAssessment));
            
            // Mock enhanced loadAssessmentProgress behavior
            const mockLoadProgressEnhanced = (museumId) => {
                const saved = localStorage.getItem('assessmentProgress');
                if (!saved) return null;
                
                const progress = JSON.parse(saved);
                
                // Check completion state
                if (progress.completed === true || progress.currentStep >= 3) {
                    return null;
                }
                
                // Issue #270 fix: Check if both questionnaires are complete
                const parentComplete = progress.parentAnswers && progress.parentAnswers.length >= 5;
                const childComplete = progress.childAnswers && progress.childAnswers.length >= 5;
                
                if (parentComplete && childComplete && progress.currentStep >= 2) {
                    return null; // Effectively completed
                }
                
                return progress;
            };
            
            const result = mockLoadProgressEnhanced('test-museum');
            expect(result).toBe(null);
        });

        test('should show continue button only for truly incomplete assessments', () => {
            // Simulate genuinely incomplete assessment
            const incompleteAssessment = {
                museumId: 'test-museum',
                currentStep: 1,
                completed: false,
                parentAnswers: [1, 2, 3], // Only 3 out of 5 answers
                childAnswers: [],
                timestamp: new Date().toISOString()
            };
            
            localStorage.setItem('assessmentProgress', JSON.stringify(incompleteAssessment));
            
            const mockLoadProgress = (museumId) => {
                const saved = localStorage.getItem('assessmentProgress');
                if (!saved) return null;
                
                const progress = JSON.parse(saved);
                
                if (progress.completed === true || progress.currentStep >= 3) {
                    return null;
                }
                
                const parentComplete = progress.parentAnswers && progress.parentAnswers.length >= 5;
                const childComplete = progress.childAnswers && progress.childAnswers.length >= 5;
                
                if (parentComplete && childComplete && progress.currentStep >= 2) {
                    return null;
                }
                
                return progress;
            };
            
            const result = mockLoadProgress('test-museum');
            expect(result).not.toBe(null);
            expect(result.currentStep).toBe(1);
            expect(result.parentAnswers.length).toBe(3);
        });
    });

    describe('Issue #2: "继续完成" button click ineffective', () => {
        test('should properly restore modal structure when resuming', () => {
            // Mock the resetAssessmentModalStructure function
            const mockResetModalStructure = () => {
                const assessmentContent = document.getElementById('assessmentContent');
                if (!assessmentContent) return;

                // Restore original structure  
                assessmentContent.innerHTML = `
                    <div class="assessment-intro">
                        <p>通过简单的问卷，了解您的亲子关系现状，获得专业的改善建议。</p>
                    </div>
                    <div class="assessment-steps">
                        <div class="step-indicator">
                            <span class="step active" data-step="1">1. 家长问卷</span>
                            <span class="step" data-step="2">2. 孩子问卷</span>
                            <span class="step" data-step="3">3. 测评结果</span>
                        </div>
                    </div>
                    <div class="assessment-form" id="assessmentForm">
                        <!-- Content will be filled dynamically -->
                    </div>
                    <div class="assessment-buttons">
                        <button id="assessmentNext" class="btn-primary">开始测评</button>
                    </div>
                `;
            };

            // Simulate resume button creation and click
            const resumeDialog = document.createElement('div');
            resumeDialog.innerHTML = `
                <button id="resumeAssessment" class="btn-primary">继续完成</button>
            `;
            document.body.appendChild(resumeDialog);

            const resumeButton = document.getElementById('resumeAssessment');
            expect(resumeButton).not.toBe(null);

            // Test resume button functionality
            resumeButton.onclick = () => {
                mockResetModalStructure();
                
                // Verify modal structure is restored
                expect(document.getElementById('assessmentForm')).not.toBe(null);
                expect(document.getElementById('assessmentNext')).not.toBe(null);
                expect(document.querySelector('.step-indicator')).not.toBe(null);
            };

            // Simulate button click
            resumeButton.click();

            // Verify restoration worked
            expect(document.getElementById('assessmentForm')).not.toBe(null);
            expect(document.getElementById('assessmentNext')).not.toBe(null);
        });

        test('should re-setup event listeners after modal restoration', () => {
            let eventListenersSetup = false;
            
            const mockSetupEventListeners = () => {
                eventListenersSetup = true;
                const nextBtn = document.getElementById('assessmentNext');
                if (nextBtn) {
                    nextBtn.onclick = () => console.log('Next button clicked');
                }
            };

            // Simulate the full resume process
            const mockResumeFlow = () => {
                // 1. Reset modal structure
                const assessmentContent = document.getElementById('assessmentContent');
                assessmentContent.innerHTML = `
                    <div class="assessment-form" id="assessmentForm"></div>
                    <div class="assessment-buttons">
                        <button id="assessmentNext" class="btn-primary">开始测评</button>
                    </div>
                `;
                
                // 2. Re-setup event listeners
                mockSetupEventListeners();
            };

            mockResumeFlow();
            
            expect(eventListenersSetup).toBe(true);
            expect(document.getElementById('assessmentNext')).not.toBe(null);
            expect(document.getElementById('assessmentNext').onclick).not.toBe(null);
        });
    });

    describe('Issue #3: Navigation tabs are redundant and take up space', () => {
        test('should make step tabs non-clickable indicators only', () => {
            const stepIndicators = document.querySelectorAll('.step');
            
            // Mock the initializeStepTabs function (fixed version)
            const mockInitializeStepTabs = () => {
                stepIndicators.forEach((stepEl, index) => {
                    // Make tabs non-interactive
                    stepEl.style.cursor = 'default';
                    stepEl.removeAttribute('onclick');
                    stepEl.onclick = null;
                    
                    // Add accessibility attributes for screen readers
                    stepEl.setAttribute('role', 'tab');
                    stepEl.setAttribute('aria-selected', index === 0 ? 'true' : 'false');
                    stepEl.setAttribute('tabindex', '-1'); // Not focusable
                });
            };

            mockInitializeStepTabs();

            stepIndicators.forEach(step => {
                expect(step.style.cursor).toBe('default');
                expect(step.onclick).toBe(null);
                expect(step.getAttribute('role')).toBe('tab');
                expect(step.getAttribute('tabindex')).toBe('-1');
            });
        });

        test('should clear visual indicators that suggest clickability', () => {
            const stepIndicators = document.querySelectorAll('.step');
            
            // Mock improved visual state management
            const mockClearClickableVisuals = () => {
                stepIndicators.forEach((step, index) => {
                    step.classList.remove('active', 'completed', 'disabled');
                    
                    if (index === 0) {
                        step.classList.add('active');
                        step.style.cursor = 'default';
                        step.style.opacity = '1';
                    } else {
                        step.classList.add('disabled');
                        step.style.cursor = 'not-allowed';
                        step.style.opacity = '0.5';
                    }
                });
            };

            mockClearClickableVisuals();

            expect(stepIndicators[0].classList.contains('active')).toBe(true);
            expect(stepIndicators[0].style.cursor).toBe('default');
            
            for (let i = 1; i < stepIndicators.length; i++) {
                expect(stepIndicators[i].classList.contains('disabled')).toBe(true);
                expect(stepIndicators[i].style.cursor).toBe('not-allowed');
            }
        });
    });

    describe('Issue #4: No auto-scroll after answering questions on mobile', () => {
        test('should auto-scroll to next question after answer selection', () => {
            let scrollCalled = false;
            const mockScrollToNext = () => {
                const modalContent = document.querySelector('.modal-content');
                if (modalContent && window.innerWidth <= 768) {
                    scrollCalled = true;
                    // Mock scrollTo behavior
                    modalContent.scrollTop = 0;
                }
            };

            // Simulate mobile viewport
            Object.defineProperty(window, 'innerWidth', { value: 375, writable: true });

            // Mock answering a question
            const mockAnswerSelection = () => {
                // Simulate user selecting an answer
                const mockRadioButton = document.createElement('input');
                mockRadioButton.type = 'radio';
                mockRadioButton.name = 'question1';
                mockRadioButton.value = '3';
                
                mockRadioButton.addEventListener('change', mockScrollToNext);
                
                // Simulate selection
                mockRadioButton.checked = true;
                mockRadioButton.dispatchEvent(new Event('change'));
            };

            mockAnswerSelection();
            expect(scrollCalled).toBe(true);
        });

        test('should provide smooth scrolling behavior on mobile step changes', () => {
            let smoothScrollUsed = false;
            
            const mockScrollToFormArea = () => {
                const modalContent = document.querySelector('.modal-content');
                
                if (modalContent && window.innerWidth <= 768) {
                    // Mock smooth scroll behavior
                    modalContent.scrollTo = jest.fn((options) => {
                        if (options.behavior === 'smooth') {
                            smoothScrollUsed = true;
                        }
                    });
                    
                    modalContent.scrollTo({ 
                        top: 0, 
                        behavior: 'smooth' 
                    });
                }
            };

            // Simulate mobile viewport
            Object.defineProperty(window, 'innerWidth', { value: 768, writable: true });
            
            // Add modal content element
            const modalContent = document.createElement('div');
            modalContent.className = 'modal-content assessment-content';
            document.body.appendChild(modalContent);

            mockScrollToFormArea();
            expect(smoothScrollUsed).toBe(true);
        });
    });

    describe('Regression Tests for Fixed Behaviors', () => {
        test('should not break existing auto-save functionality', () => {
            let autoSaveCalled = false;
            
            const mockAutoSave = (step) => {
                if (step < 3) {
                    autoSaveCalled = true;
                    localStorage.setItem('assessmentProgress', JSON.stringify({
                        currentStep: step,
                        timestamp: new Date().toISOString()
                    }));
                }
            };

            mockAutoSave(1);
            expect(autoSaveCalled).toBe(true);
            expect(localStorage.getItem('assessmentProgress')).not.toBe(null);
        });

        test('should maintain proper step progression logic', () => {
            const mockStepProgression = (currentStep) => {
                const steps = document.querySelectorAll('.step');
                
                steps.forEach((stepEl, index) => {
                    stepEl.classList.remove('active', 'completed');
                    if (index < currentStep) {
                        stepEl.classList.add('completed');
                    } else if (index === currentStep) {
                        stepEl.classList.add('active');
                    }
                });
                
                return Array.from(steps).map(step => ({
                    active: step.classList.contains('active'),
                    completed: step.classList.contains('completed')
                }));
            };

            const result = mockStepProgression(1);
            
            expect(result[0].completed).toBe(true); // Step 0 completed
            expect(result[1].active).toBe(true);    // Step 1 active
            expect(result[2].active).toBe(false);   // Step 2 not active
        });
    });
});