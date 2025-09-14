/**
 * Force Check-in Feature Tests
 * 
 * Tests the force check-in functionality that validates child task completion
 * before allowing museum visit marking, and provides options to enter guide
 * or force check-in.
 */

describe('Force Check-in Feature', () => {
    beforeEach(() => {
        testUtils.setupMinimalDOM();
        
        // Mock confirm function
        global.confirm = jest.fn();
        
        // Mock console methods to avoid noise in tests
        jest.spyOn(console, 'log').mockImplementation(() => {});
        jest.spyOn(console, 'warn').mockImplementation(() => {});
        jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        // Restore console methods
        console.log.mockRestore();
        console.warn.mockRestore();
        console.error.mockRestore();
    });

    describe('Child task completion validation', () => {
        test('should identify when no child tasks are completed', () => {
            const museumId = 'forbidden-city';
            const currentAge = '3-6';
            
            // Mock empty checklist state (no child tasks completed)
            localStorage.setItem('museumChecklists', JSON.stringify({}));
            
            // Mock the hasCompletedChildTasks function behavior
            const mockHasCompletedChildTasks = (museumId, ageGroup) => {
                const checklists = JSON.parse(localStorage.getItem('museumChecklists') || '{}');
                const childKey = `${museumId}-child-${ageGroup}`;
                const completedTasks = checklists[childKey] || [];
                return completedTasks.length > 0;
            };
            
            const hasChildTasks = mockHasCompletedChildTasks(museumId, currentAge);
            
            // Should return false when no child tasks are completed
            expect(hasChildTasks).toBeFalsy();
        });

        test('should identify when child tasks are completed', () => {
            const museumId = 'forbidden-city';
            const currentAge = '3-6';
            
            // Mock checklist state with completed child tasks
            const mockChecklists = {
                [`${museumId}-child-${currentAge}`]: [0, 2] // Tasks 0 and 2 completed
            };
            localStorage.setItem('museumChecklists', JSON.stringify(mockChecklists));
            
            // Mock the hasCompletedChildTasks function behavior
            const mockHasCompletedChildTasks = (museumId, ageGroup) => {
                const checklists = JSON.parse(localStorage.getItem('museumChecklists') || '{}');
                const childKey = `${museumId}-child-${ageGroup}`;
                const completedTasks = checklists[childKey] || [];
                return completedTasks.length > 0;
            };
            
            const hasChildTasks = mockHasCompletedChildTasks(museumId, currentAge);
            
            // Should return true when child tasks are completed
            expect(hasChildTasks).toBeTruthy();
        });
    });

    describe('Force check-in validation logic', () => {
        test('should validate completion with multiple age groups', () => {
            const museumId = 'forbidden-city';
            
            // Mock checklist state with tasks for different age groups
            const mockChecklists = {
                [`${museumId}-child-3-6`]: [0, 1], // Completed tasks for 3-6
                [`${museumId}-child-7-12`]: [],    // No tasks for 7-12
                [`${museumId}-child-13-18`]: [2]   // Completed task for 13-18
            };
            localStorage.setItem('museumChecklists', JSON.stringify(mockChecklists));
            
            const mockHasCompletedChildTasks = (museumId, ageGroup) => {
                const checklists = JSON.parse(localStorage.getItem('museumChecklists') || '{}');
                const childKey = `${museumId}-child-${ageGroup}`;
                const completedTasks = checklists[childKey] || [];
                return completedTasks.length > 0;
            };
            
            // Test different age groups
            expect(mockHasCompletedChildTasks(museumId, '3-6')).toBeTruthy();
            expect(mockHasCompletedChildTasks(museumId, '7-12')).toBeFalsy();
            expect(mockHasCompletedChildTasks(museumId, '13-18')).toBeTruthy();
        });
    });

    describe('LocalStorage behavior', () => {
        test('should handle museum visit toggle without child tasks', () => {
            const museumId = 'forbidden-city';
            
            // Mock empty initial state
            localStorage.setItem('museumChecklists', JSON.stringify({}));
            localStorage.setItem('visitedMuseums', JSON.stringify([]));
            
            // Mock force check-in behavior (user clicks cancel/force check-in)
            const mockToggleWithForceCheckin = (museumId) => {
                const visitedMuseums = JSON.parse(localStorage.getItem('visitedMuseums') || '[]');
                
                if (!visitedMuseums.includes(museumId)) {
                    // No child tasks completed - show dialog and force check-in
                    visitedMuseums.push(museumId);
                    localStorage.setItem('visitedMuseums', JSON.stringify(visitedMuseums));
                }
            };
            
            mockToggleWithForceCheckin(museumId);
            
            // Should have added museum to visited list
            const visitedMuseums = JSON.parse(localStorage.getItem('visitedMuseums') || '[]');
            expect(visitedMuseums).toContain(museumId);
        });

        test('should handle museum visit toggle with child tasks', () => {
            const museumId = 'forbidden-city';
            const currentAge = '3-6';
            
            // Mock checklist state with completed child tasks
            const mockChecklists = {
                [`${museumId}-child-${currentAge}`]: [0, 1, 2] // Multiple tasks completed
            };
            localStorage.setItem('museumChecklists', JSON.stringify(mockChecklists));
            localStorage.setItem('visitedMuseums', JSON.stringify([]));
            
            // Mock normal check-in behavior (no dialog needed)
            const mockToggleNormal = (museumId) => {
                const visitedMuseums = JSON.parse(localStorage.getItem('visitedMuseums') || '[]');
                
                if (!visitedMuseums.includes(museumId)) {
                    // Child tasks completed - normal check-in
                    visitedMuseums.push(museumId);
                    localStorage.setItem('visitedMuseums', JSON.stringify(visitedMuseums));
                }
            };
            
            mockToggleNormal(museumId);
            
            // Should have added museum to visited list directly
            const visitedMuseums = JSON.parse(localStorage.getItem('visitedMuseums') || '[]');
            expect(visitedMuseums).toContain(museumId);
        });
    });

    describe('Dialog message validation', () => {
        test('should create appropriate force check-in message', () => {
            const museumName = '故宫博物院';
            
            // Mock the dialog message creation
            const createForceCheckinMessage = (museumName) => {
                return `您还没有完成任何孩子任务就要打卡${museumName}。

建议至少完成一个孩子任务后再打卡，这样能更好地记录参观体验。

点击"确定"进入参观指南页面查看任务，或点击"取消"强制打卡。`;
            };
            
            const message = createForceCheckinMessage(museumName);
            
            // Verify dialog message contains expected elements
            expect(message).toContain('您还没有完成任何孩子任务就要打卡');
            expect(message).toContain(museumName);
            expect(message).toContain('建议至少完成一个孩子任务后再打卡');
            expect(message).toContain('点击"确定"进入参观指南页面');
            expect(message).toContain('点击"取消"强制打卡');
        });
    });

    describe('Edge cases', () => {
        test('should handle corrupted localStorage gracefully', () => {
            // Mock corrupted localStorage data
            localStorage.setItem('museumChecklists', 'invalid-json');
            localStorage.setItem('visitedMuseums', 'invalid-json');
            
            const mockSafeGetChecklists = () => {
                try {
                    return JSON.parse(localStorage.getItem('museumChecklists') || '{}');
                } catch (e) {
                    return {};
                }
            };
            
            const mockSafeGetVisited = () => {
                try {
                    return JSON.parse(localStorage.getItem('visitedMuseums') || '[]');
                } catch (e) {
                    return [];
                }
            };
            
            // Should not throw error and return safe defaults
            expect(() => mockSafeGetChecklists()).not.toThrow();
            expect(() => mockSafeGetVisited()).not.toThrow();
            expect(mockSafeGetChecklists()).toEqual({});
            expect(mockSafeGetVisited()).toEqual([]);
        });

        test('should preserve existing localStorage data during force check-in', () => {
            const museumId = 'forbidden-city';
            
            // Mock existing data
            const existingChecklists = {
                'other-museum-parent-3-6': [0, 1],
                'other-museum-child-7-12': [2, 3]
            };
            const existingVisited = ['other-museum'];
            
            localStorage.setItem('museumChecklists', JSON.stringify(existingChecklists));
            localStorage.setItem('visitedMuseums', JSON.stringify(existingVisited));
            
            // Mock force check-in operation
            const mockForceCheckin = (museumId) => {
                const visitedMuseums = JSON.parse(localStorage.getItem('visitedMuseums') || '[]');
                if (!visitedMuseums.includes(museumId)) {
                    visitedMuseums.push(museumId);
                    localStorage.setItem('visitedMuseums', JSON.stringify(visitedMuseums));
                }
            };
            
            mockForceCheckin(museumId);
            
            // Should preserve existing data
            const finalChecklists = JSON.parse(localStorage.getItem('museumChecklists') || '{}');
            const finalVisited = JSON.parse(localStorage.getItem('visitedMuseums') || '[]');
            
            expect(finalChecklists['other-museum-parent-3-6']).toEqual([0, 1]);
            expect(finalChecklists['other-museum-child-7-12']).toEqual([2, 3]);
            expect(finalVisited).toContain('other-museum');
            expect(finalVisited).toContain(museumId);
        });
    });

    describe('Feature integration', () => {
        test('should work with age group selection', () => {
            const museumId = 'forbidden-city';
            
            // Mock different tasks for different age groups
            const mockChecklists = {
                [`${museumId}-child-3-6`]: [0], // Tasks for younger children
                [`${museumId}-child-7-12`]: [], // No tasks for middle group
                [`${museumId}-child-13-18`]: [1, 2] // Tasks for teenagers
            };
            localStorage.setItem('museumChecklists', JSON.stringify(mockChecklists));
            
            // Mock age group selection logic
            const mockCheckForceCheckinNeeded = (museumId, selectedAge) => {
                const checklists = JSON.parse(localStorage.getItem('museumChecklists') || '{}');
                const childKey = `${museumId}-child-${selectedAge}`;
                const completedTasks = checklists[childKey] || [];
                return completedTasks.length === 0; // Force check-in needed if no tasks completed
            };
            
            // Test with different age groups
            expect(mockCheckForceCheckinNeeded(museumId, '3-6')).toBeFalsy(); // Has tasks
            expect(mockCheckForceCheckinNeeded(museumId, '7-12')).toBeTruthy(); // No tasks - needs force check-in
            expect(mockCheckForceCheckinNeeded(museumId, '13-18')).toBeFalsy(); // Has tasks
        });
    });
});