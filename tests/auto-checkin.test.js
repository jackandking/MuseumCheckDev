/**
 * Tests for auto check-in feature
 * 
 * When all child tasks are completed for a museum, the museum should be
 * automatically marked as visited with the same effects as manual check-in:
 * - Large rocket animation
 * - Fireworks wall display
 * - Gamification achievements
 * - Leaderboard update
 */

describe('Auto Check-in Feature', () => {
    let mockMuseum;
    
    beforeEach(() => {
        // Clear localStorage before each test
        localStorage.clear();
        
        // Create a mock museum with child tasks
        mockMuseum = {
            id: 'test-museum',
            name: '测试博物馆',
            location: '北京',
            checklists: {
                parent: {
                    '7-12': ['家长任务1', '家长任务2']
                },
                child: {
                    '7-12': ['孩子任务1', '孩子任务2', '孩子任务3']
                }
            }
        };
    });
    
    afterEach(() => {
        localStorage.clear();
    });
    
    describe('checkAutoCheckin method in script.js', () => {
        test('should exist on MuseumCheckApp prototype', () => {
            // Verify the method exists by checking the script content
            const fs = require('fs');
            const path = require('path');
            const scriptPath = path.join(__dirname, '..', 'script.js');
            const scriptContent = fs.readFileSync(scriptPath, 'utf8');
            
            // Check for method definition in class
            expect(scriptContent).toContain('checkAutoCheckin(museumId, museum, ageGroup)');
        });
        
        test('checkAutoCheckin method should have correct structure', () => {
            const fs = require('fs');
            const path = require('path');
            const scriptPath = path.join(__dirname, '..', 'script.js');
            const scriptContent = fs.readFileSync(scriptPath, 'utf8');
            
            // Check for key parts of the auto-checkin logic
            
            // 1. Check for early return if already visited
            expect(scriptContent).toContain('if (this.visitedMuseums.includes(museumId))');
            
            // 2. Check for getting child tasks
            expect(scriptContent).toContain('museum.checklists && museum.checklists.child && museum.checklists.child[ageGroup]');
            
            // 3. Check for comparison of completed vs total tasks
            expect(scriptContent).toContain('completedChildTasks.length < childTasks.length');
            
            // 4. Check for adding to visited list
            expect(scriptContent).toContain('this.visitedMuseums.push(museumId)');
            
            // 5. Check for triggering large rocket
            expect(scriptContent).toContain('this.triggerLargeRocket()');
            
            // 6. Check for saving visited museums
            expect(scriptContent).toContain('this.saveVisitedMuseums()');
            
            // 7. Check for rendering museums
            expect(scriptContent).toContain('this.renderMuseums()');
            
            // 8. Check for tracking auto check-in event
            expect(scriptContent).toContain('museum_auto_checkin');
        });
        
        test('checkAutoCheckin is called after child task completion', () => {
            const fs = require('fs');
            const path = require('path');
            const scriptPath = path.join(__dirname, '..', 'script.js');
            const scriptContent = fs.readFileSync(scriptPath, 'utf8');
            
            // Find the addChecklistEventListeners method
            const listenerMethodStart = scriptContent.indexOf('addChecklistEventListeners()');
            expect(listenerMethodStart).toBeGreaterThan(0);
            
            // Check that checkAutoCheckin is called in the context of child task completion
            // This should be after 'checklistType === \'child\'' and after 'e.target.checked'
            const autoCheckinCall = scriptContent.indexOf('this.checkAutoCheckin(museumId, museum, fullAgeGroup)');
            expect(autoCheckinCall).toBeGreaterThan(listenerMethodStart);
            
            // Check that it's wrapped in a conditional for child tasks
            const surroundingCode = scriptContent.substring(autoCheckinCall - 200, autoCheckinCall + 100);
            expect(surroundingCode).toContain('checklistType === \'child\'');
            expect(surroundingCode).toContain('e.target.checked');
        });
    });
    
    describe('Auto check-in logic validation', () => {
        test('should have gamification hooks', () => {
            const fs = require('fs');
            const path = require('path');
            const scriptPath = path.join(__dirname, '..', 'script.js');
            const scriptContent = fs.readFileSync(scriptPath, 'utf8');
            
            // Find the checkAutoCheckin method
            const methodStart = scriptContent.indexOf('checkAutoCheckin(museumId, museum, ageGroup)');
            const methodEnd = scriptContent.indexOf('toggleFavorite(museumId)', methodStart);
            const methodBody = scriptContent.substring(methodStart, methodEnd);
            
            // Check for gamification hooks (same as manual check-in)
            expect(methodBody).toContain('this.achievementGamification');
            expect(methodBody).toContain('updateStreak');
            expect(methodBody).toContain('checkMicroAchievements');
        });
        
        test('should auto-submit to leaderboard', () => {
            const fs = require('fs');
            const path = require('path');
            const scriptPath = path.join(__dirname, '..', 'script.js');
            const scriptContent = fs.readFileSync(scriptPath, 'utf8');
            
            // Find the checkAutoCheckin method
            const methodStart = scriptContent.indexOf('checkAutoCheckin(museumId, museum, ageGroup)');
            const methodEnd = scriptContent.indexOf('toggleFavorite(museumId)', methodStart);
            const methodBody = scriptContent.substring(methodStart, methodEnd);
            
            // Check for leaderboard integration
            expect(methodBody).toContain('this.leaderboardManager');
            expect(methodBody).toContain('autoSubmitScore');
        });
        
        test('should show notification on auto check-in', () => {
            const fs = require('fs');
            const path = require('path');
            const scriptPath = path.join(__dirname, '..', 'script.js');
            const scriptContent = fs.readFileSync(scriptPath, 'utf8');
            
            // Find the checkAutoCheckin method
            const methodStart = scriptContent.indexOf('checkAutoCheckin(museumId, museum, ageGroup)');
            const methodEnd = scriptContent.indexOf('toggleFavorite(museumId)', methodStart);
            const methodBody = scriptContent.substring(methodStart, methodEnd);
            
            // Check for success notification
            expect(methodBody).toContain('UIManager.showNotification');
            expect(methodBody).toContain('自动打卡成功');
        });
    });
    
    describe('Edge case handling', () => {
        test('should handle missing checklists object', () => {
            const fs = require('fs');
            const path = require('path');
            const scriptPath = path.join(__dirname, '..', 'script.js');
            const scriptContent = fs.readFileSync(scriptPath, 'utf8');
            
            // Find the checkAutoCheckin method
            const methodStart = scriptContent.indexOf('checkAutoCheckin(museumId, museum, ageGroup)');
            const methodEnd = scriptContent.indexOf('toggleFavorite(museumId)', methodStart);
            const methodBody = scriptContent.substring(methodStart, methodEnd);
            
            // Check for safe access to nested properties
            expect(methodBody).toContain('museum.checklists && museum.checklists.child');
            
            // Check for handling of empty/undefined child tasks
            expect(methodBody).toContain('if (!childTasks || childTasks.length === 0)');
        });
        
        test('should prevent duplicate visits', () => {
            const fs = require('fs');
            const path = require('path');
            const scriptPath = path.join(__dirname, '..', 'script.js');
            const scriptContent = fs.readFileSync(scriptPath, 'utf8');
            
            // Find the checkAutoCheckin method
            const methodStart = scriptContent.indexOf('checkAutoCheckin(museumId, museum, ageGroup)');
            const methodEnd = scriptContent.indexOf('toggleFavorite(museumId)', methodStart);
            const methodBody = scriptContent.substring(methodStart, methodEnd);
            
            // Check for early return if already visited
            expect(methodBody).toContain('if (this.visitedMuseums.includes(museumId))');
            expect(methodBody).toContain('return;');
        });
    });
    
    describe('Auto check-in in single-museum.js', () => {
        test('should have auto check-in function', () => {
            const fs = require('fs');
            const path = require('path');
            const scriptPath = path.join(__dirname, '..', 'single-museum.js');
            const scriptContent = fs.readFileSync(scriptPath, 'utf8');
            
            // Check for function definition
            expect(scriptContent).toContain('checkAutoCheckinOnWorkflowComplete(museum)');
        });
        
        test('should be called when workflow tasks are completed', () => {
            const fs = require('fs');
            const path = require('path');
            const scriptPath = path.join(__dirname, '..', 'single-museum.js');
            const scriptContent = fs.readFileSync(scriptPath, 'utf8');
            
            // Check that auto check-in is called before setStep('share')
            const completeTaskSection = scriptContent.indexOf('completeWorkflowTask');
            expect(completeTaskSection).toBeGreaterThan(0);
            
            // Verify auto check-in is triggered when all tasks done
            expect(scriptContent).toContain('checkAutoCheckinOnWorkflowComplete(state.selectedMuseum)');
        });
        
        test('should save visitedMuseums to localStorage', () => {
            const fs = require('fs');
            const path = require('path');
            const scriptPath = path.join(__dirname, '..', 'single-museum.js');
            const scriptContent = fs.readFileSync(scriptPath, 'utf8');
            
            // Find the checkAutoCheckinOnWorkflowComplete function
            const funcStart = scriptContent.indexOf('function checkAutoCheckinOnWorkflowComplete');
            const funcEnd = scriptContent.indexOf('function showAutoCheckinNotification', funcStart);
            const funcBody = scriptContent.substring(funcStart, funcEnd);
            
            // Check for localStorage save operation
            expect(funcBody).toContain('localStorage.setItem(\'visitedMuseums\'');
            expect(funcBody).toContain('visitedMuseums.push(museum.id)');
        });
        
        test('should prevent duplicate auto check-ins', () => {
            const fs = require('fs');
            const path = require('path');
            const scriptPath = path.join(__dirname, '..', 'single-museum.js');
            const scriptContent = fs.readFileSync(scriptPath, 'utf8');
            
            // Find the checkAutoCheckinOnWorkflowComplete function
            const funcStart = scriptContent.indexOf('function checkAutoCheckinOnWorkflowComplete');
            const funcEnd = scriptContent.indexOf('function showAutoCheckinNotification', funcStart);
            const funcBody = scriptContent.substring(funcStart, funcEnd);
            
            // Check for duplicate prevention
            expect(funcBody).toContain('if(visitedMuseums.includes(museum.id))');
        });
        
        test('should show notification on auto check-in', () => {
            const fs = require('fs');
            const path = require('path');
            const scriptPath = path.join(__dirname, '..', 'single-museum.js');
            const scriptContent = fs.readFileSync(scriptPath, 'utf8');
            
            // Check for notification function
            expect(scriptContent).toContain('function showAutoCheckinNotification');
            expect(scriptContent).toContain('自动打卡成功');
        });
        
        test('should track auto check-in with analytics', () => {
            const fs = require('fs');
            const path = require('path');
            const scriptPath = path.join(__dirname, '..', 'single-museum.js');
            const scriptContent = fs.readFileSync(scriptPath, 'utf8');
            
            // Find the checkAutoCheckinOnWorkflowComplete function
            const funcStart = scriptContent.indexOf('function checkAutoCheckinOnWorkflowComplete');
            const funcEnd = scriptContent.indexOf('function showAutoCheckinNotification', funcStart);
            const funcBody = scriptContent.substring(funcStart, funcEnd);
            
            // Check for analytics tracking
            expect(funcBody).toContain('museum_auto_checkin');
            expect(funcBody).toContain('gtag');
        });
    });
});

