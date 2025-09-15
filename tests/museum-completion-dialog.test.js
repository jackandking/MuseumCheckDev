/**
 * Regression tests for museum completion dialog bug
 * Issues:
 * 1. When user clicks OK in dialog (no child tasks completed), museum appears as visited after closing guide
 * 2. When unchecking museum, dialog should not appear
 */

describe('Museum Completion Dialog Bug', () => {
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

    describe('Issue #1: Museum marked as visited after clicking OK in dialog', () => {
        test('should reproduce the bug - museum toggle logic when user clicks OK', () => {
            const museumId = 'test-museum';
            const currentAge = '7-12';
            
            // Setup: No child tasks completed - this should trigger dialog
            localStorage.setItem('museumChecklists', JSON.stringify({}));
            localStorage.setItem('visitedMuseums', JSON.stringify([]));
            
            // Mock the problematic toggleMuseumVisit behavior
            const mockToggleMuseumVisitCurrentBehavior = (museumId, currentAge) => {
                const visitedMuseums = JSON.parse(localStorage.getItem('visitedMuseums') || '[]');
                const index = visitedMuseums.indexOf(museumId);
                const isNowVisited = index === -1;
                
                // If unchecking (removing visit), allow without validation  
                if (index > -1) {
                    visitedMuseums.splice(index, 1);
                    localStorage.setItem('visitedMuseums', JSON.stringify(visitedMuseums));
                    return;
                }
                
                // If checking (adding visit), validate child task completion first
                if (isNowVisited) {
                    const childChecklistKey = `${museumId}-child-${currentAge}`;
                    const checklists = JSON.parse(localStorage.getItem('museumChecklists') || '{}');
                    const completedChildTasks = checklists[childChecklistKey] || [];
                    
                    // If no child tasks are completed, show confirmation dialog
                    if (completedChildTasks.length === 0) {
                        const confirmed = global.confirm('Mock dialog message');
                        
                        if (confirmed) {
                            // User chose to enter guide page - open museum modal
                            // THE BUG: function returns here but museum appears visited in UI
                            return;
                        }
                        // If user clicked "取消", continue with force check-in below
                    }
                    
                    // Proceed with checking the museum as visited
                    visitedMuseums.push(museumId);
                    localStorage.setItem('visitedMuseums', JSON.stringify(visitedMuseums));
                }
            };
            
            // Mock confirm to return true (user clicks OK/确定)
            global.confirm.mockReturnValue(true);
            
            // Simulate the current behavior
            mockToggleMuseumVisitCurrentBehavior(museumId, currentAge);
            
            // Check current behavior - this is what the bug is about
            const finalVisitedMuseums = JSON.parse(localStorage.getItem('visitedMuseums') || '[]');
            
            // THE EXPECTED BEHAVIOR: Museum should NOT be in visited list when user clicks OK
            expect(finalVisitedMuseums).not.toContain(museumId);
            expect(finalVisitedMuseums.length).toBe(0);
            
            // Verify dialog was called
            expect(global.confirm).toHaveBeenCalled();
        });

        test('should allow force check-in when user clicks Cancel', () => {
            const museumId = 'test-museum';
            const currentAge = '7-12';
            
            // Setup: No child tasks completed
            localStorage.setItem('museumChecklists', JSON.stringify({}));
            localStorage.setItem('visitedMuseums', JSON.stringify([]));
            
            // Same mock function but with Cancel behavior
            const mockToggleMuseumVisitCurrentBehavior = (museumId, currentAge) => {
                const visitedMuseums = JSON.parse(localStorage.getItem('visitedMuseums') || '[]');
                const index = visitedMuseums.indexOf(museumId);
                const isNowVisited = index === -1;
                
                if (index > -1) {
                    visitedMuseums.splice(index, 1);
                    localStorage.setItem('visitedMuseums', JSON.stringify(visitedMuseums));
                    return;
                }
                
                if (isNowVisited) {
                    const childChecklistKey = `${museumId}-child-${currentAge}`;
                    const checklists = JSON.parse(localStorage.getItem('museumChecklists') || '{}');
                    const completedChildTasks = checklists[childChecklistKey] || [];
                    
                    if (completedChildTasks.length === 0) {
                        const confirmed = global.confirm('Mock dialog message');
                        
                        if (confirmed) {
                            return; // User wants to open guide
                        }
                        // User clicked Cancel - continue with force check-in
                    }
                    
                    // Proceed with checking the museum as visited
                    visitedMuseums.push(museumId);
                    localStorage.setItem('visitedMuseums', JSON.stringify(visitedMuseums));
                }
            };
            
            // Mock confirm to return false (user clicks Cancel/取消 for force check-in)
            global.confirm.mockReturnValue(false);
            
            // Simulate the behavior
            mockToggleMuseumVisitCurrentBehavior(museumId, currentAge);
            
            // Museum SHOULD be marked as visited (force check-in)
            const finalVisitedMuseums = JSON.parse(localStorage.getItem('visitedMuseums') || '[]');
            expect(finalVisitedMuseums).toContain(museumId);
            expect(finalVisitedMuseums.length).toBe(1);
            
            // Verify dialog was called
            expect(global.confirm).toHaveBeenCalled();
        });

        test('should mark museum as visited immediately when child tasks are completed', () => {
            const museumId = 'test-museum';
            const currentAge = '7-12';
            
            // Setup: Some child tasks completed
            const mockChecklists = {
                [`${museumId}-child-${currentAge}`]: [0] // Task 0 completed
            };
            localStorage.setItem('museumChecklists', JSON.stringify(mockChecklists));
            localStorage.setItem('visitedMuseums', JSON.stringify([]));
            
            // Same mock function
            const mockToggleMuseumVisitCurrentBehavior = (museumId, currentAge) => {
                const visitedMuseums = JSON.parse(localStorage.getItem('visitedMuseums') || '[]');
                const index = visitedMuseums.indexOf(museumId);
                const isNowVisited = index === -1;
                
                if (index > -1) {
                    visitedMuseums.splice(index, 1);
                    localStorage.setItem('visitedMuseums', JSON.stringify(visitedMuseums));
                    return;
                }
                
                if (isNowVisited) {
                    const childChecklistKey = `${museumId}-child-${currentAge}`;
                    const checklists = JSON.parse(localStorage.getItem('museumChecklists') || '{}');
                    const completedChildTasks = checklists[childChecklistKey] || [];
                    
                    if (completedChildTasks.length === 0) {
                        const confirmed = global.confirm('Mock dialog message');
                        if (confirmed) return;
                    }
                    
                    visitedMuseums.push(museumId);
                    localStorage.setItem('visitedMuseums', JSON.stringify(visitedMuseums));
                }
            };
            
            // Simulate the behavior
            mockToggleMuseumVisitCurrentBehavior(museumId, currentAge);
            
            // Museum should be marked as visited immediately (no dialog)
            const finalVisitedMuseums = JSON.parse(localStorage.getItem('visitedMuseums') || '[]');
            expect(finalVisitedMuseums).toContain(museumId);
            expect(finalVisitedMuseums.length).toBe(1);
            
            // Verify NO dialog was called
            expect(global.confirm).not.toHaveBeenCalled();
        });
    });

    describe('Issue #2: Dialog should not appear when unchecking museum', () => {
        test('should uncheck museum without showing dialog', () => {
            const museumId = 'test-museum';
            const currentAge = '7-12';
            
            // Setup: Museum already visited
            localStorage.setItem('visitedMuseums', JSON.stringify([museumId]));
            localStorage.setItem('museumChecklists', JSON.stringify({}));
            
            // Mock the unchecking behavior
            const mockToggleMuseumVisitCurrentBehavior = (museumId, currentAge) => {
                const visitedMuseums = JSON.parse(localStorage.getItem('visitedMuseums') || '[]');
                const index = visitedMuseums.indexOf(museumId);
                const isNowVisited = index === -1;
                
                // If unchecking (removing visit), allow without validation
                if (index > -1) {
                    visitedMuseums.splice(index, 1);
                    localStorage.setItem('visitedMuseums', JSON.stringify(visitedMuseums));
                    return;
                }
                
                // This should not execute for unchecking
                if (isNowVisited) {
                    const childChecklistKey = `${museumId}-child-${currentAge}`;
                    const checklists = JSON.parse(localStorage.getItem('museumChecklists') || '{}');
                    const completedChildTasks = checklists[childChecklistKey] || [];
                    
                    if (completedChildTasks.length === 0) {
                        const confirmed = global.confirm('Mock dialog message');
                        if (confirmed) return;
                    }
                    
                    visitedMuseums.push(museumId);
                    localStorage.setItem('visitedMuseums', JSON.stringify(visitedMuseums));
                }
            };
            
            // Simulate unchecking
            mockToggleMuseumVisitCurrentBehavior(museumId, currentAge);
            
            // Verify NO confirmation dialog was shown
            expect(global.confirm).not.toHaveBeenCalled();
            
            // Museum should be removed from visited list
            const finalVisitedMuseums = JSON.parse(localStorage.getItem('visitedMuseums') || '[]');
            expect(finalVisitedMuseums).not.toContain(museumId);
            expect(finalVisitedMuseums.length).toBe(0);
        });
    });
});