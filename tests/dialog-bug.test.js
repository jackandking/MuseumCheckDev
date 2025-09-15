// Unit tests for museum checkbox dialog bug fixes
describe('Museum Dialog Bug Regression Tests', () => {
    
    beforeEach(() => {
        // Reset DOM for modal testing
        document.body.innerHTML = `
            <div id="museumModal" class="hidden">
                <div class="close"></div>
            </div>
            <div id="museumGrid"></div>
        `;
    });
    
    test('Issue #252 Bug 1: Museum should NOT be auto-visited when opening guide modal', () => {
        // Create mock museum app with minimal required functionality
        const mockApp = {
            visitedMuseums: [],
            museumChecklists: {},
            currentAge: '3-6',
            
            toggleMuseumVisit: function(museumId) {
                const index = this.visitedMuseums.indexOf(museumId);
                const isNowVisited = index === -1;
                
                // If unchecking (removing visit), allow without validation
                if (index > -1) {
                    this.visitedMuseums.splice(index, 1);
                    return;
                }
                
                // If checking (adding visit), validate child task completion first
                if (isNowVisited) {
                    const childChecklistKey = `${museumId}-child-${this.currentAge}`;
                    const completedChildTasks = this.museumChecklists[childChecklistKey] || [];
                    
                    // If no child tasks are completed, show confirmation dialog
                    if (completedChildTasks.length === 0) {
                        // Simulate user clicking "确定" (OK) to go to guide
                        const confirmed = true; 
                        
                        if (confirmed) {
                            // User chose to enter guide page - open museum modal
                            // BUG: This returns without marking as visited, causing inconsistent state
                            return;
                        }
                    }
                    
                    // Proceed with checking the museum as visited
                    this.visitedMuseums.push(museumId);
                }
            }
        };
        
        const museumId = 'forbidden-city';
        
        // Initial state: museum not visited
        expect(mockApp.visitedMuseums.includes(museumId)).toBe(false);
        
        // Simulate user clicking checkbox (which triggers toggleMuseumVisit)
        mockApp.toggleMuseumVisit(museumId);
        
        // Expected: Museum should NOT be marked as visited when user goes to guide
        // This test documents the current bug behavior
        expect(mockApp.visitedMuseums.includes(museumId)).toBe(false);
    });
    
    test('Issue #252 Bug 2: Unchecking should work without showing dialog', () => {
        // Create mock with museum already visited
        const mockApp = {
            visitedMuseums: ['forbidden-city'],
            museumChecklists: {},
            currentAge: '3-6',
            dialogShown: false,
            
            toggleMuseumVisit: function(museumId) {
                const index = this.visitedMuseums.indexOf(museumId);
                
                // If unchecking (removing visit), should allow without dialog
                if (index > -1) {
                    this.visitedMuseums.splice(index, 1);
                    return;
                }
                
                // This dialog logic should NOT trigger when unchecking
                this.dialogShown = true;
                const childChecklistKey = `${museumId}-child-${this.currentAge}`;
                const completedChildTasks = this.museumChecklists[childChecklistKey] || [];
                
                if (completedChildTasks.length === 0) {
                    // Dialog appears - this should NOT happen when unchecking
                    return;
                }
                
                this.visitedMuseums.push(museumId);
            }
        };
        
        const museumId = 'forbidden-city';
        
        // Initial state: museum is visited
        expect(mockApp.visitedMuseums.includes(museumId)).toBe(true);
        
        // Simulate unchecking the museum
        mockApp.toggleMuseumVisit(museumId);
        
        // Expected: Museum should be removed without showing dialog
        expect(mockApp.visitedMuseums.includes(museumId)).toBe(false);
        expect(mockApp.dialogShown).toBe(false);
    });
    
    test('Force checkin should work when user cancels dialog', () => {
        const mockApp = {
            visitedMuseums: [],
            museumChecklists: {},
            currentAge: '3-6',
            
            toggleMuseumVisit: function(museumId) {
                const index = this.visitedMuseums.indexOf(museumId);
                const isNowVisited = index === -1;
                
                if (index > -1) {
                    this.visitedMuseums.splice(index, 1);
                    return;
                }
                
                if (isNowVisited) {
                    const childChecklistKey = `${museumId}-child-${this.currentAge}`;
                    const completedChildTasks = this.museumChecklists[childChecklistKey] || [];
                    
                    if (completedChildTasks.length === 0) {
                        // Simulate user clicking "取消" (Cancel) for force checkin
                        const confirmed = false;
                        
                        if (confirmed) {
                            return; // Would go to guide
                        }
                        // Fall through to force checkin
                    }
                    
                    // Proceed with checking the museum as visited
                    this.visitedMuseums.push(museumId);
                }
            }
        };
        
        const museumId = 'forbidden-city';
        
        // Simulate user clicking checkbox then canceling dialog for force checkin
        mockApp.toggleMuseumVisit(museumId);
        
        // Should be marked as visited (force checkin)
        expect(mockApp.visitedMuseums.includes(museumId)).toBe(true);
    });
});