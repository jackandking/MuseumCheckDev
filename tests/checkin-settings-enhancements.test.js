/**
 * Tests for Museum Check-in Page Settings Enhancements
 * Issue: checkin页面设置 - Add fireworks wall entry and clear check-in data functionality
 * 
 * Ensures the new settings features work correctly:
 * - Fireworks wall button in settings
 * - Clear check-in data functionality
 */

const fs = require('fs');
const path = require('path');

describe('Museum Check-in Settings Enhancements', () => {
    let htmlContent;
    
    beforeAll(() => {
        htmlContent = fs.readFileSync(
            path.join(__dirname, '..', 'museum-checkin.html'), 
            'utf8'
        );
    });

    describe('Fireworks Wall Entry in Settings', () => {
        test('should have settings section for museum features', () => {
            expect(htmlContent).toContain('<h3>🎆 本馆功能</h3>');
        });

        test('should have button to view museum fireworks wall from settings', () => {
            expect(htmlContent).toContain('id="viewFireworksFromSettings"');
            expect(htmlContent).toContain('查看本馆烟花墙');
        });

        test('should have hint text explaining fireworks wall', () => {
            expect(htmlContent).toContain('查看本博物馆所有小朋友完成的任务烟花');
        });

        test('should navigate to fireworks wall with museum filter when clicked', () => {
            // Check for event handler
            expect(htmlContent).toContain('viewFireworksFromSettings');
            // Check it navigates to fireworks-wall.html with museum parameter
            expect(htmlContent).toContain('fireworks-wall.html?museum=');
        });

        test('fireworks wall button should be primary style', () => {
            expect(htmlContent).toContain('button-primary');
            expect(htmlContent).toContain('viewFireworksFromSettings');
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
        test('should have three settings sections', () => {
            const sectionMatches = htmlContent.match(/<div class="settings-section">/g);
            expect(sectionMatches).toBeTruthy();
            expect(sectionMatches.length).toBeGreaterThanOrEqual(3);
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
        test('should set up event listener for fireworks wall button', () => {
            expect(htmlContent).toContain('viewFireworksFromSettings');
            expect(htmlContent).toContain('.onclick');
        });

        test('should set up event listener for clear data button', () => {
            expect(htmlContent).toContain('clearCheckinData');
            expect(htmlContent).toContain('.onclick');
        });
    });

    describe('Integration with Existing Features', () => {
        test('should maintain compatibility with existing menu fireworks button', () => {
            // Both should navigate to the same place
            expect(htmlContent).toContain('id="viewFireworks"');
            expect(htmlContent).toContain('id="viewFireworksFromSettings"');
        });

        test('should use consistent museum ID parameter', () => {
            const matches = htmlContent.match(/fireworks-wall\.html\?museum=\${museumId}/g);
            expect(matches).toBeTruthy();
            expect(matches.length).toBeGreaterThanOrEqual(2); // At least menu and settings
        });

        test('should preserve existing localStorage structure', () => {
            expect(htmlContent).toContain('museumChecklists');
            expect(htmlContent).toContain('checklistKey');
            expect(htmlContent).toContain('localStorage.getItem');
            expect(htmlContent).toContain('localStorage.setItem');
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
