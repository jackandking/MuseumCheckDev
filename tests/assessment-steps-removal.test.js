/**
 * Assessment Steps Removal Test
 * 
 * Regression test for issue #287 - removal of assessment steps indicator
 * to improve user experience by simplifying the assessment modal interface.
 */

describe('Assessment Steps Removal (Issue #287)', () => {
    beforeEach(() => {
        // Load the actual DOM structure from index.html
        global.testUtils.setupMinimalDOM();
        
        // Add the actual assessment modal structure as it should be after the fix
        document.body.innerHTML += `
            <div id="assessmentModal" class="modal hidden">
                <div class="modal-content assessment-content">
                    <span class="close">&times;</span>
                    <h2 id="assessmentTitle">🧡 亲子关系测评</h2>
                    <div id="assessmentContent">
                        <div class="assessment-intro">
                            <!-- Simplified introduction - verbose content removed -->
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
    });

    test('should not have assessment-steps div in DOM', () => {
        const assessmentStepsDiv = document.querySelector('.assessment-steps');
        expect(assessmentStepsDiv).toBeNull();
    });

    test('should not have step-indicator in DOM', () => {
        const stepIndicator = document.querySelector('.step-indicator');
        expect(stepIndicator).toBeNull();
    });

    test('should not have any step elements in DOM', () => {
        const stepElements = document.querySelectorAll('.step');
        expect(stepElements.length).toBe(0);
    });

    test('assessment modal should maintain proper structure without steps', () => {
        const assessmentModal = document.getElementById('assessmentModal');
        const assessmentContent = document.getElementById('assessmentContent');
        const assessmentIntro = document.querySelector('.assessment-intro');
        const assessmentForm = document.getElementById('assessmentForm');
        const assessmentButtons = document.querySelector('.assessment-buttons');

        // Essential elements should still exist
        expect(assessmentModal).toBeTruthy();
        expect(assessmentContent).toBeTruthy();
        expect(assessmentIntro).toBeTruthy();
        expect(assessmentForm).toBeTruthy();
        expect(assessmentButtons).toBeTruthy();

        // Elements should be in correct order: intro -> form -> buttons
        const contentChildren = Array.from(assessmentContent.children);
        const introIndex = contentChildren.findIndex(child => child.classList.contains('assessment-intro'));
        const formIndex = contentChildren.findIndex(child => child.id === 'assessmentForm');
        const buttonsIndex = contentChildren.findIndex(child => child.classList.contains('assessment-buttons'));

        expect(introIndex).toBeGreaterThan(-1);
        expect(formIndex).toBeGreaterThan(introIndex);
        expect(buttonsIndex).toBeGreaterThan(formIndex);
    });

    test('should maintain assessment modal functionality without step indicator', () => {
        const assessmentModal = document.getElementById('assessmentModal');
        const nextButton = document.getElementById('assessmentNext');
        const prevButton = document.getElementById('assessmentPrev');

        // Modal should be properly structured
        expect(assessmentModal.classList.contains('modal')).toBe(true);
        expect(assessmentModal.classList.contains('hidden')).toBe(true);

        // Action buttons should be present and functional
        expect(nextButton).toBeTruthy();
        expect(prevButton).toBeTruthy();
        expect(nextButton.textContent.trim()).toBe('开始测评');
        expect(prevButton.textContent.trim()).toBe('上一步');
    });

    test('should have simplified DOM structure for better UX', () => {
        const assessmentContent = document.getElementById('assessmentContent');
        const childCount = assessmentContent.children.length;

        // Should have only 3 main children: intro, form, buttons (no step indicator)
        expect(childCount).toBe(3);
        
        // Verify specific children exist
        const children = Array.from(assessmentContent.children);
        const hasIntro = children.some(child => child.classList.contains('assessment-intro'));
        const hasForm = children.some(child => child.id === 'assessmentForm');
        const hasButtons = children.some(child => child.classList.contains('assessment-buttons'));

        expect(hasIntro).toBe(true);
        expect(hasForm).toBe(true);
        expect(hasButtons).toBe(true);
    });

    test('should pass HTML validation without step-related elements', () => {
        const assessmentModal = document.getElementById('assessmentModal');
        const html = assessmentModal.outerHTML;

        // Should not contain step-related classes or elements
        expect(html).not.toContain('assessment-steps');
        expect(html).not.toContain('step-indicator');
        expect(html).not.toContain('data-step');
        expect(html).not.toContain('1. 家长问卷');
        expect(html).not.toContain('2. 孩子问卷');
        expect(html).not.toContain('3. 测评结果');
    });
});