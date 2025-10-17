/**
 * Tests for Museum Check-in Page Settings and Menu Enhancements
 * Issue: checkin页面 - Fireworks wall moved from settings to menu, clear check-in data functionality
 * 
 * Ensures the features work correctly:
 * - Museum fireworks wall button in menu (本馆烟花墙)
 * - Total fireworks wall button in menu (总烟花墙)
 * - Clear check-in data functionality in settings
 */

const fs = require('fs');
const path = require('path');

describe('Museum Check-in Settings and Menu Enhancements', () => {
    let htmlContent;
    
    beforeAll(() => {
        htmlContent = fs.readFileSync(
            path.join(__dirname, '..', 'museum-checkin.html'), 
            'utf8'
        );
    });

    describe('Fireworks Wall Entry in Menu', () => {
        test('should have button to view museum fireworks wall in menu', () => {
            expect(htmlContent).toContain('id="viewMuseumFireworks"');
            expect(htmlContent).toContain('查看本馆烟花墙');
        });

        test('should have separate button for total fireworks wall', () => {
            expect(htmlContent).toContain('id="viewFireworks"');
            expect(htmlContent).toContain('查看总烟花墙');
        });

        test('should navigate museum fireworks to fireworks wall with museum filter', () => {
            // Check for event handler for museum-specific fireworks
            expect(htmlContent).toContain('viewMuseumFireworks');
            // Check it navigates to fireworks-wall.html with museum parameter
            expect(htmlContent).toContain('fireworks-wall.html?museum=');
        });

        test('should navigate total fireworks to fireworks wall without filter', () => {
            // Check for event handler for total fireworks
            expect(htmlContent).toContain('viewFireworks');
            // Find the viewFireworks onclick handler
            const viewFireworksMatch = htmlContent.match(/getElementById\(['"]viewFireworks['"]\)\.onclick[\s\S]*?fireworks-wall\.html/);
            expect(viewFireworksMatch).toBeTruthy();
            // Make sure it doesn't have ?museum= in the same statement
            const handlerCode = viewFireworksMatch[0];
            expect(handlerCode).not.toContain('?museum=');
        });

        test('museum fireworks button should be in menu modal', () => {
            // Check that viewMuseumFireworks button is within menuModal
            const menuModalStart = htmlContent.indexOf('id="menuModal"');
            const menuModalEnd = htmlContent.indexOf('</div>', htmlContent.indexOf('</div>', menuModalStart) + 1);
            const menuModalContent = htmlContent.substring(menuModalStart, menuModalEnd);
            expect(menuModalContent).toContain('viewMuseumFireworks');
        });

        test('should NOT have museum features section in settings', () => {
            expect(htmlContent).not.toContain('<h3>🎆 本馆功能</h3>');
            expect(htmlContent).not.toContain('id="viewFireworksFromSettings"');
        });
    });

    describe('Clear Check-in Data Functionality', () => {
        test('should have settings section for data management', () => {
            expect(htmlContent).toContain('<h3>🗑️ 数据管理</h3>');
        });

        test('should have button to clear check-in data', () => {
            expect(htmlContent).toContain('id="clearCheckinData"');
            expect(htmlContent).toContain('清空本馆打卡数据');
        });

        test('should have warning hint about clearing data', () => {
            expect(htmlContent).toContain('清空后可以重新完成所有任务');
            expect(htmlContent).toContain('此操作不可撤销');
        });

        test('should have clearCheckinData function defined', () => {
            expect(htmlContent).toContain('function clearCheckinData()');
        });

        test('should show confirmation dialog before clearing', () => {
            expect(htmlContent).toContain('confirm(confirmMessage)');
            expect(htmlContent).toContain('清空打卡数据');
            expect(htmlContent).toContain('此操作不可撤销');
        });

        test('should clear data from both main and legacy storage formats', () => {
            expect(htmlContent).toContain('museumChecklists');
            expect(htmlContent).toContain('museumCheckin_');
            expect(htmlContent).toContain('delete checklistsData[checklistKey]');
            expect(htmlContent).toContain('localStorage.removeItem(legacyKey)');
        });

        test('should clear in-memory completed tasks', () => {
            expect(htmlContent).toContain('completedTasks.clear()');
        });

        test('should re-render tasks after clearing', () => {
            expect(htmlContent).toContain('renderTasks()');
            expect(htmlContent).toContain('updateProgress()');
        });

        test('should close settings modal after clearing', () => {
            expect(htmlContent).toContain('settingsModal');
            expect(htmlContent).toContain('classList.remove(\'show\')');
        });

        test('should show success message after clearing', () => {
            expect(htmlContent).toContain('打卡数据已成功清空');
            expect(htmlContent).toContain('您现在可以重新完成所有任务了');
        });

        test('should handle errors gracefully', () => {
            expect(htmlContent).toContain('catch (error)');
            expect(htmlContent).toContain('清空数据失败，请重试');
        });

        test('clear button should have warning styling', () => {
            expect(htmlContent).toContain('background: #f8d7da');
            expect(htmlContent).toContain('color: #721c24');
            expect(htmlContent).toContain('clearCheckinData');
        });
    });

    describe('Settings Modal Structure', () => {
        test('should have at least two settings sections', () => {
            const sectionMatches = htmlContent.match(/<div class="settings-section">/g);
            expect(sectionMatches).toBeTruthy();
            expect(sectionMatches.length).toBeGreaterThanOrEqual(2); // Child info and data management at minimum
        });

        test('should NOT have museum features section', () => {
            expect(htmlContent).not.toContain('<h3>🎆 本馆功能</h3>');
        });

        test('should maintain existing child info section', () => {
            expect(htmlContent).toContain('<h3>👶 孩子信息</h3>');
            expect(htmlContent).toContain('childNicknameInput');
            expect(htmlContent).toContain('ageGroupSelector');
        });

        test('new sections should follow existing styling patterns', () => {
            expect(htmlContent).toContain('settings-item');
            expect(htmlContent).toContain('settings-label');
            expect(htmlContent).toContain('settings-hint');
        });
    });

    describe('Event Listeners', () => {
        test('should set up event listener for museum fireworks button in menu', () => {
            expect(htmlContent).toContain('viewMuseumFireworks');
            expect(htmlContent).toContain('.onclick');
        });

        test('should set up event listener for total fireworks button in menu', () => {
            expect(htmlContent).toContain('viewFireworks');
            expect(htmlContent).toContain('.onclick');
        });

        test('should set up event listener for clear data button', () => {
            expect(htmlContent).toContain('clearCheckinData');
            expect(htmlContent).toContain('.onclick');
        });
    });

    describe('Integration with Existing Features', () => {
        test('should have both museum-specific and total fireworks buttons in menu', () => {
            // Both should be in menu now
            expect(htmlContent).toContain('id="viewMuseumFireworks"');
            expect(htmlContent).toContain('id="viewFireworks"');
        });

        test('should use consistent museum ID parameter for museum fireworks', () => {
            const matches = htmlContent.match(/fireworks-wall\.html\?museum=\${museumId}/g);
            expect(matches).toBeTruthy();
            expect(matches.length).toBeGreaterThanOrEqual(1); // At least in menu
        });

        test('should preserve existing localStorage structure', () => {
            expect(htmlContent).toContain('museumChecklists');
            expect(htmlContent).toContain('checklistKey');
            expect(htmlContent).toContain('localStorage.getItem');
            expect(htmlContent).toContain('localStorage.setItem');
        });

        test('total fireworks should navigate without museum filter', () => {
            // Check that viewFireworks navigates to fireworks-wall.html without museum parameter
            const viewFireworksMatch = htmlContent.match(/getElementById\(['"]viewFireworks['"]\)\.onclick[\s\S]*?fireworks-wall\.html/);
            expect(viewFireworksMatch).toBeTruthy();
            // Make sure it doesn't have ?museum= in the same statement
            const handlerCode = viewFireworksMatch[0];
            expect(handlerCode).not.toContain('?museum=');
        });
    });

    describe('User Experience', () => {
        test('clear button should have full width in settings', () => {
            expect(htmlContent).toContain('width: 100%');
            expect(htmlContent).toContain('clearCheckinData');
        });

        test('buttons should have appropriate margin', () => {
            expect(htmlContent).toContain('margin-top: 8px');
        });

        test('should use emojis for better visual recognition', () => {
            expect(htmlContent).toContain('🎆'); // Fireworks
            expect(htmlContent).toContain('🗑️'); // Trash/clear
        });

        test('confirmation message should be detailed and clear', () => {
            expect(htmlContent).toContain('可以重新完成所有任务');
            expect(htmlContent).toContain('所有任务将回到未完成状态');
        });
    });
});
