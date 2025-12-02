/**
 * Tests for disabled manual check-in feature
 * 
 * Manual museum check-in is disabled - users can only:
 * 1. Uncheck museums (remove visits)
 * 2. Museums are automatically checked when all child tasks are completed
 * 
 * This ensures:
 * - Checkbox is disabled for unvisited museums
 * - toggleMuseumVisit() blocks manual checking
 * - Auto check-in still works with full functionality (leaderboard, achievements)
 */

describe('Disable Manual Check-in Feature', () => {
    const fs = require('fs');
    const path = require('path');
    const scriptPath = path.join(__dirname, '..', 'script.js');
    let scriptContent;
    
    /**
     * Helper function to extract a method body from script content
     * @param {string} methodName - The method name to find
     * @param {string} endMarker - A string that appears after the method ends
     * @returns {string} The method body
     */
    const extractMethodBody = (methodName, endMarker) => {
        const methodStart = scriptContent.indexOf(methodName);
        const methodEnd = scriptContent.indexOf(endMarker, methodStart);
        return scriptContent.substring(methodStart, methodEnd);
    };
    
    beforeEach(() => {
        scriptContent = fs.readFileSync(scriptPath, 'utf8');
        localStorage.clear();
    });
    
    afterEach(() => {
        localStorage.clear();
    });
    
    describe('UI Checkbox Rendering', () => {
        test('should disable checkbox for unvisited museums', () => {
            // Find the renderMuseums method and check for checkbox disabled logic
            expect(scriptContent).toContain('const checkboxDisabled = this.readonlyCheckboxes || !isVisited');
        });
        
        test('should add title tooltip explaining auto check-in requirement', () => {
            // Check for tooltip that explains behavior
            expect(scriptContent).toContain('完成任务后自动打卡');
        });
        
        test('should add unchecking title for visited museums', () => {
            // Check for tooltip for unchecking
            expect(scriptContent).toContain('取消打卡');
        });
        
        test('should pass checkboxDisabled to input element', () => {
            // Check that disabled attribute is conditional
            expect(scriptContent).toContain('${checkboxDisabled ? \'disabled\' : \'\'}');
        });
    });
    
    describe('toggleMuseumVisit Blocking Logic', () => {
        test('should block manual check-in attempts', () => {
            // Check for info message about manual check-in being disabled
            expect(scriptContent).toContain('不支持手动打卡');
        });
        
        test('should return cancelled for manual check-in attempts', () => {
            // Extract toggleMuseumVisit method
            const toggleMethod = extractMethodBody('toggleMuseumVisit(museumId)', 'checkAutoCheckin(museumId');
            
            // Should not contain the old manual check-in logic
            expect(toggleMethod).not.toContain('const isNowVisited = index === -1');
            expect(toggleMethod).not.toContain('this.visitedMuseums.push(museumId)');
            
            // Should return 'cancelled' for blocked attempts
            expect(toggleMethod).toContain("return 'cancelled'");
        });
        
        test('should still allow unchecking visited museums', () => {
            // Extract toggleMuseumVisit method
            const toggleMethod = extractMethodBody('toggleMuseumVisit(museumId)', 'checkAutoCheckin(museumId');
            
            // Should allow unchecking (splice for removal)
            expect(toggleMethod).toContain('this.visitedMuseums.splice(index, 1)');
            expect(toggleMethod).toContain("return 'unchecked'");
        });
        
        test('should show notification when manual check-in is blocked', () => {
            // Check for UIManager notification
            expect(scriptContent).toContain('UIManager.showNotification');
            expect(scriptContent).toContain('请完成');
            expect(scriptContent).toContain('的孩子任务后自动打卡');
        });
    });
    
    describe('Auto Check-in Still Works', () => {
        test('should still have checkAutoCheckin method', () => {
            expect(scriptContent).toContain('checkAutoCheckin(museumId, museum, ageGroup)');
        });
        
        test('should auto check-in when all child tasks completed', () => {
            const autoCheckinMethod = extractMethodBody('checkAutoCheckin(museumId, museum, ageGroup)', 'toggleFavorite(museumId)');
            
            // Should add museum to visited list
            expect(autoCheckinMethod).toContain('this.visitedMuseums.push(museumId)');
            
            // Should trigger rocket animation
            expect(autoCheckinMethod).toContain('this.triggerLargeRocket()');
            
            // Should save and render
            expect(autoCheckinMethod).toContain('this.saveVisitedMuseums()');
            expect(autoCheckinMethod).toContain('this.renderMuseums()');
        });
        
        test('should submit to leaderboard on auto check-in', () => {
            const autoCheckinMethod = extractMethodBody('checkAutoCheckin(museumId, museum, ageGroup)', 'toggleFavorite(museumId)');
            
            // Should have leaderboard integration
            expect(autoCheckinMethod).toContain('this.leaderboardManager');
            expect(autoCheckinMethod).toContain('autoSubmitScore');
        });
        
        test('should trigger gamification achievements on auto check-in', () => {
            const autoCheckinMethod = extractMethodBody('checkAutoCheckin(museumId, museum, ageGroup)', 'toggleFavorite(museumId)');
            
            // Should have gamification hooks
            expect(autoCheckinMethod).toContain('this.achievementGamification');
            expect(autoCheckinMethod).toContain('updateStreak');
            expect(autoCheckinMethod).toContain('checkMicroAchievements');
        });
        
        test('should show notification on auto check-in', () => {
            const autoCheckinMethod = extractMethodBody('checkAutoCheckin(museumId, museum, ageGroup)', 'toggleFavorite(museumId)');
            
            // Should show success notification
            expect(autoCheckinMethod).toContain('自动打卡成功');
        });
    });
    
    describe('Old Manual Check-in Code Removed', () => {
        test('should not have old force check-in dialog code', () => {
            // Extract toggleMuseumVisit method
            const toggleMethod = extractMethodBody('toggleMuseumVisit(museumId)', 'checkAutoCheckin(museumId');
            
            // Should NOT have old force check-in dialog
            expect(toggleMethod).not.toContain('您还没有完成任何孩子任务就要打卡');
            expect(toggleMethod).not.toContain('confirm(');
        });
        
        test('should not have old manual check-in tracking', () => {
            // Extract toggleMuseumVisit method
            const toggleMethod = extractMethodBody('toggleMuseumVisit(museumId)', 'checkAutoCheckin(museumId');
            
            // Should NOT have old manual check-in events
            expect(toggleMethod).not.toContain('force_checkin');
            expect(toggleMethod).not.toContain("'visited': true");
        });
    });
    
    describe('Regression: Unchecking Still Works', () => {
        test('should track museum visit removal', () => {
            // Extract toggleMuseumVisit method
            const toggleMethod = extractMethodBody('toggleMuseumVisit(museumId)', 'checkAutoCheckin(museumId');
            
            // Should track unchecking event
            expect(toggleMethod).toContain("'visited': false");
            expect(toggleMethod).toContain('museum_visit_toggled');
        });
        
        test('should save and render after unchecking', () => {
            // Extract toggleMuseumVisit method
            const toggleMethod = extractMethodBody('toggleMuseumVisit(museumId)', 'checkAutoCheckin(museumId');
            
            // Should save and render on uncheck
            expect(toggleMethod).toContain('this.saveVisitedMuseums()');
            expect(toggleMethod).toContain('this.renderMuseums()');
        });
    });
});
