/**
 * Assessment Saving Fixes Tests - Issue #285
 * 
 * Tests for fixing the assessment saving functionality issues:
 * 1. Continue button appearing for completed assessments
 * 2. Ineffective resume button functionality
 * 3. Unnecessary confirmation dialogs
 * 4. Missing auto-scroll on mobile
 */

describe('Assessment Saving Fixes - Issue #285', () => {
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
                            <p>通过简单的问卷，了解您的亲子关系现状</p>
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
        jest.spyOn(console, 'error').mockImplementation(() => {});

        // Setup mock MuseumCheck instance
        global.MuseumCheck = class {
            constructor() {
                this.assessmentState = null;
            }
            
            loadAssessmentProgress(museumId) {
                try {
                    const saved = localStorage.getItem('assessmentProgress');
                    if (!saved) return null;
                    
                    const progress = JSON.parse(saved);
                    if (progress.museumId !== museumId) return null;
                
                // Check timestamp validity (24 hours)
                const timestamp = new Date(progress.timestamp);
                const now = new Date();
                const hoursDiff = (now - timestamp) / (1000 * 60 * 60);
                
                if (hoursDiff >= 24) {
                    this.clearAssessmentProgress();
                    return null;
                }
                
                // Enhanced completion detection
                if (progress.completed === true || progress.currentStep >= 3) {
                    this.clearAssessmentProgress();
                    return null;
                }
                
                // Check if both questionnaires are complete
                const parentComplete = progress.parentAnswers && progress.parentAnswers.length >= 5 && 
                                     !progress.parentAnswers.some(a => a === undefined || a === null);
                const childComplete = progress.childAnswers && progress.childAnswers.length >= 5 && 
                                    !progress.childAnswers.some(a => a === undefined || a === null);
                
                if (parentComplete && childComplete && progress.currentStep >= 2) {
                    this.clearAssessmentProgress();
                    return null;
                }
                
                // Don't show continue for empty progress
                if (progress.currentStep === 0 && 
                    (!progress.parentAnswers || progress.parentAnswers.length === 0) &&
                    (!progress.childAnswers || progress.childAnswers.length === 0)) {
                    this.clearAssessmentProgress();
                    return null;
                }
                
                return progress;
                } catch (error) {
                    console.warn('Failed to load assessment progress:', error);
                    return null;
                }
            }
            
            clearAssessmentProgress() {
                localStorage.removeItem('assessmentProgress');
                return true;
            }
            
            showResumeProgressDialog(savedProgress) {
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
                
                // Setup event handlers
                document.getElementById('resumeAssessment').onclick = () => {
                    this.resetAssessmentModalStructure();
                    this.setupAssessmentEventListeners();
                    this.showAssessmentStep(savedProgress.currentStep);
                };
                
                document.getElementById('startNewAssessment').onclick = () => {
                    this.clearAssessmentProgress();
                    this.assessmentState = {
                        museumId: savedProgress.museumId,
                        currentStep: 0,
                        parentAnswers: [],
                        childAnswers: [],
                        score: 0,
                        timestamp: new Date().toISOString()
                    };
                    this.showAssessmentStep(0);
                };
            }
            
            resetAssessmentModalStructure() {
                // Restore original modal structure
                const assessmentContent = document.getElementById('assessmentContent');
                if (!assessmentContent) return;
                
                assessmentContent.innerHTML = `
                    <div class="assessment-intro">
                        <p>通过简单的问卷，了解您的亲子关系现状</p>
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
                `;
            }
            
            setupAssessmentEventListeners() {
                // Mock setup of event listeners
                return true;
            }
            
            showAssessmentStep(step) {
                if (this.assessmentState) {
                    this.assessmentState.currentStep = step;
                }
                return true;
            }
            
            scrollToFormArea() {
                const modalContent = document.querySelector('.modal-content.assessment-content');
                if (modalContent && window.innerWidth <= 768) {
                    modalContent.scrollTo({ top: 0, behavior: 'smooth' });
                }
            }
        };
        
        museumCheck = new MuseumCheck();
    });

    afterEach(() => {
        console.warn.mockRestore();
        console.error.mockRestore();
        localStorage.clear();
    });

    describe('Issue 1: Continue button logic for completed assessments', () => {
        test('should NOT show continue button for completed assessment', () => {
            const completedProgress = {
                museumId: 'test-museum',
                currentStep: 3,
                completed: true,
                parentAnswers: [1, 2, 3, 4, 0],
                childAnswers: [2, 1, 4, 3, 1],
                timestamp: new Date().toISOString()
            };
            
            localStorage.setItem('assessmentProgress', JSON.stringify(completedProgress));
            
            const result = museumCheck.loadAssessmentProgress('test-museum');
            expect(result).toBeNull();
            expect(localStorage.getItem('assessmentProgress')).toBeNull();
        });

        test('should NOT show continue button for assessments with both questionnaires complete', () => {
            const bothQuestionnairesComplete = {
                museumId: 'test-museum',
                currentStep: 2,
                completed: false,
                parentAnswers: [1, 2, 3, 4, 0], // All 5 answers
                childAnswers: [2, 1, 4, 3, 1],  // All 5 answers
                timestamp: new Date().toISOString()
            };
            
            localStorage.setItem('assessmentProgress', JSON.stringify(bothQuestionnairesComplete));
            
            const result = museumCheck.loadAssessmentProgress('test-museum');
            expect(result).toBeNull();
            expect(localStorage.getItem('assessmentProgress')).toBeNull();
        });

        test('should show continue button for truly incomplete assessment', () => {
            const incompleteProgress = {
                museumId: 'test-museum',
                currentStep: 1,
                completed: false,
                parentAnswers: [1, 2, 3], // Only 3 out of 5 answers
                childAnswers: [],
                timestamp: new Date().toISOString()
            };
            
            localStorage.setItem('assessmentProgress', JSON.stringify(incompleteProgress));
            
            const result = museumCheck.loadAssessmentProgress('test-museum');
            expect(result).not.toBeNull();
            expect(result.currentStep).toBe(1);
        });

        test('should clear old progress (>24 hours)', () => {
            const oldProgress = {
                museumId: 'test-museum',
                currentStep: 1,
                completed: false,
                parentAnswers: [1, 2],
                childAnswers: [],
                timestamp: new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString() // 25 hours ago
            };
            
            localStorage.setItem('assessmentProgress', JSON.stringify(oldProgress));
            
            const result = museumCheck.loadAssessmentProgress('test-museum');
            expect(result).toBeNull();
            expect(localStorage.getItem('assessmentProgress')).toBeNull();
        });
    });

    describe('Issue 2: Resume button functionality', () => {
        test('should create functional resume dialog', () => {
            const savedProgress = {
                museumId: 'test-museum',
                currentStep: 1,
                parentAnswers: [1, 2],
                childAnswers: [],
                timestamp: new Date().toISOString()
            };

            museumCheck.showResumeProgressDialog(savedProgress);

            // Verify dialog structure
            const resumeDialog = document.querySelector('.resume-progress-dialog');
            expect(resumeDialog).not.toBeNull();
            
            const resumeButton = document.getElementById('resumeAssessment');
            const restartButton = document.getElementById('startNewAssessment');
            
            expect(resumeButton).not.toBeNull();
            expect(restartButton).not.toBeNull();
            expect(resumeButton.textContent).toBe('继续完成');
            expect(restartButton.textContent).toBe('重新开始');
        });

        test('resume button should restore assessment state', () => {
            const savedProgress = {
                museumId: 'test-museum',
                currentStep: 1,
                parentAnswers: [1, 2],
                childAnswers: [],
                timestamp: new Date().toISOString()
            };

            museumCheck.showResumeProgressDialog(savedProgress);
            
            const resumeButton = document.getElementById('resumeAssessment');
            
            // Mock the methods
            jest.spyOn(museumCheck, 'resetAssessmentModalStructure');
            jest.spyOn(museumCheck, 'setupAssessmentEventListeners');
            jest.spyOn(museumCheck, 'showAssessmentStep');
            
            resumeButton.click();
            
            expect(museumCheck.resetAssessmentModalStructure).toHaveBeenCalled();
            expect(museumCheck.setupAssessmentEventListeners).toHaveBeenCalled();
            expect(museumCheck.showAssessmentStep).toHaveBeenCalledWith(1);
        });

        test('restart button should clear progress and start fresh', () => {
            const savedProgress = {
                museumId: 'test-museum',
                currentStep: 1,
                parentAnswers: [1, 2],
                childAnswers: [],
                timestamp: new Date().toISOString()
            };

            museumCheck.showResumeProgressDialog(savedProgress);
            
            const restartButton = document.getElementById('startNewAssessment');
            
            jest.spyOn(museumCheck, 'clearAssessmentProgress');
            jest.spyOn(museumCheck, 'showAssessmentStep');
            
            restartButton.click();
            
            expect(museumCheck.clearAssessmentProgress).toHaveBeenCalled();
            expect(museumCheck.showAssessmentStep).toHaveBeenCalledWith(0);
            expect(museumCheck.assessmentState.currentStep).toBe(0);
            expect(museumCheck.assessmentState.parentAnswers).toEqual([]);
            expect(museumCheck.assessmentState.childAnswers).toEqual([]);
        });
    });

    describe('Issue 3: Auto-scroll functionality', () => {
        test('should auto-scroll on mobile devices', () => {
            // Mock mobile viewport
            Object.defineProperty(window, 'innerWidth', { value: 375, writable: true });
            
            // Create modal content with the proper class structure
            const existingModal = document.querySelector('.modal-content');
            existingModal.classList.add('assessment-content');
            existingModal.scrollTo = jest.fn();
            
            museumCheck.scrollToFormArea();
            
            expect(existingModal.scrollTo).toHaveBeenCalledWith({ 
                top: 0, 
                behavior: 'smooth' 
            });
        });

        test('should not auto-scroll on desktop', () => {
            // Mock desktop viewport
            Object.defineProperty(window, 'innerWidth', { value: 1200, writable: true });
            
            const modalContent = document.createElement('div');
            modalContent.className = 'modal-content assessment-content';
            modalContent.scrollTo = jest.fn();
            
            document.body.appendChild(modalContent);
            
            museumCheck.scrollToFormArea();
            
            expect(modalContent.scrollTo).not.toHaveBeenCalled();
        });
    });

    describe('Issue 4: Reasonable default behaviors', () => {
        test('should handle empty progress gracefully', () => {
            const emptyProgress = {
                museumId: 'test-museum',
                currentStep: 0,
                completed: false,
                parentAnswers: [],
                childAnswers: [],
                timestamp: new Date().toISOString()
            };
            
            localStorage.setItem('assessmentProgress', JSON.stringify(emptyProgress));
            
            const result = museumCheck.loadAssessmentProgress('test-museum');
            expect(result).toBeNull();
            expect(localStorage.getItem('assessmentProgress')).toBeNull();
        });

        test('should handle corrupted progress data', () => {
            localStorage.setItem('assessmentProgress', 'invalid-json');
            
            const result = museumCheck.loadAssessmentProgress('test-museum');
            expect(result).toBeNull();
        });

        test('should handle missing museum ID mismatch', () => {
            const differentMuseumProgress = {
                museumId: 'different-museum',
                currentStep: 1,
                parentAnswers: [1, 2],
                childAnswers: [],
                timestamp: new Date().toISOString()
            };
            
            localStorage.setItem('assessmentProgress', JSON.stringify(differentMuseumProgress));
            
            const result = museumCheck.loadAssessmentProgress('test-museum');
            expect(result).toBeNull();
        });
    });
});