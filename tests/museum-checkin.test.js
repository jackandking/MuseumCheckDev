/**
 * Tests for Museum Check-in Page
 * Issue: 新页面 - Museum-specific check-in page for QR code access
 * 
 * Ensures the new museum check-in page functions correctly with:
 * - Task display and completion
 * - Progressive UX (child tasks -> parent awareness -> assessment)
 * - Local storage persistence
 * - Navigation to other features
 */

const fs = require('fs');
const path = require('path');

describe('Museum Check-in Page', () => {
    let htmlContent;
    let jsContent;
    let cssContent;
    
    beforeAll(() => {
        htmlContent = fs.readFileSync(
            path.join(__dirname, '..', 'museum-checkin.html'), 
            'utf8'
        );
        // Load the external JS file (CSS/JS refactored from museum-checkin.html)
        jsContent = fs.readFileSync(
            path.join(__dirname, '..', 'js', 'museum-checkin.js'), 
            'utf8'
        );
        cssContent = fs.readFileSync(
            path.join(__dirname, '..', 'css', 'museum-checkin.css'), 
            'utf8'
        );
    });

    describe('Page Structure', () => {
        test('should have correct page title (default)', () => {
            // Default title before nickname is loaded
            expect(htmlContent).toContain('<title>孩子任务 - 博物馆打卡</title>');
        });

        test('should update page title with child nickname', () => {
            // Check for updatePageTitle function (in JS)
            expect(jsContent).toContain('function updatePageTitle()');
            expect(jsContent).toContain('loadChildNickname()');
            expect(jsContent).toContain('的任务');
            expect(jsContent).toContain('document.title =');
        });

        test('should have page title element with id', () => {
            expect(htmlContent).toContain('id="pageTitle"');
        });

        test('should include required JavaScript dependencies', () => {
            expect(htmlContent).toContain('<script src="js/shared-menu.js"></script>');
            expect(htmlContent).toContain('<script src="js/firework.js"></script>');
            expect(htmlContent).toContain('<script src="js/leaderboard-template.js"></script>');
            expect(htmlContent).toContain('<script src="js/leaderboard-modal.js"></script>');
            expect(htmlContent).toContain('<script src="js/museum-checkin.js"></script>');
        });

        test('should have header with menu and settings buttons', () => {
            expect(htmlContent).toContain('id="menuButton"');
            expect(htmlContent).toContain('id="settingsButton"');
        });

        test('should have task grid container', () => {
            expect(htmlContent).toContain('id="taskGrid"');
        });

        test('should have progress tracking elements', () => {
            expect(htmlContent).toContain('id="completedCount"');
            expect(htmlContent).toContain('id="progressFill"');
            expect(htmlContent).toContain('id="progressStars"');
        });
    });

    describe('Modal Components', () => {
        test('should have task detail modal', () => {
            expect(htmlContent).toContain('id="taskModal"');
            expect(htmlContent).toContain('id="modalTitle"');
            expect(htmlContent).toContain('id="completeButton"');
        });

        test('should have menu modal for navigation', () => {
            expect(htmlContent).toContain('id="menuModal"');
            // Fireworks menu items are now handled by SharedMenu component (in HTML or JS)
            const combined = htmlContent + jsContent;
            expect(combined).toContain('SharedMenu.init');
        });
    });

    describe('Data Management', () => {
        test('should use museum ID from URL parameter', () => {
            expect(jsContent).toContain("urlParams.get('museum')");
            expect(jsContent).toContain('museumId');
        });

        test('should support age group parameter', () => {
            expect(jsContent).toContain("urlParams.get('age')");
            expect(jsContent).toContain('ageGroup');
        });

        test('should have local storage persistence', () => {
            expect(jsContent).toContain('localStorage.setItem');
            expect(jsContent).toContain('localStorage.getItem');
            expect(jsContent).toContain('museumCheckin_');
        });

        test('should save completed tasks to local storage', () => {
            expect(jsContent).toContain('saveCompletedTasks');
            expect(jsContent).toContain('loadCompletedTasks');
        });

        test('should load and save child nickname', () => {
            expect(jsContent).toContain('loadChildNickname');
            expect(jsContent).toContain('saveChildNickname');
            expect(jsContent).toContain('childNickname');
        });

        test('should update title when nickname is saved', () => {
            expect(jsContent).toContain('updatePageTitle()');
            // Check that saveChildNickname function exists and contains updatePageTitle call
            expect(jsContent).toContain('function saveChildNickname');
            const saveNicknameFnMatch = jsContent.match(/function saveChildNickname[\s\S]{0,500}updatePageTitle\(\)/);
            expect(saveNicknameFnMatch).toBeTruthy();
        });

        test('should have inline nickname editing on page title click', () => {
            // Check that pageTitle has click event listener setup (in JS)
            expect(jsContent).toContain("getElementById('pageTitle')");
            expect(jsContent).toContain("addEventListener('click'");
            expect(jsContent).toContain('startInlineNicknameEditOnTitle');
            
            // Check that the title element has tooltip (in HTML)
            expect(htmlContent).toContain('title="点击修改昵称"');
            
            // Check that cursor pointer style is set (in CSS)
            expect(cssContent).toContain('cursor: pointer');
            
            // Verify the inline editing function exists (in JS)
            expect(jsContent).toContain('function startInlineNicknameEditOnTitle(titleElement)');
        });

        test('should use museumDataLoader for dynamic data priority', () => {
            // Check that loadMuseumData is async (in JS)
            expect(jsContent).toContain('async function loadMuseumData()');
            
            // Check that it uses museumDataLoader
            expect(jsContent).toContain('window.museumDataLoader');
            expect(jsContent).toContain('museumDataLoader.loadMuseum');
        });

        test('should not use cache when loading museum data', () => {
            // Verify loadMuseum is called with false to bypass cache
            const loadMuseumMatch = jsContent.match(/museumDataLoader\.loadMuseum\([^,]+,\s*false\)/);
            expect(loadMuseumMatch).toBeTruthy();
        });

        test('should wait for async museum data loading in init', () => {
            // Check that init function is async (in JS)
            expect(jsContent).toContain('async function init()');
            
            // Check that it awaits loadMuseumData
            expect(jsContent).toContain('await loadMuseumData()');
        });
    });

    describe('Remote Storage Integration', () => {
        test('should have remote storage configuration', () => {
            expect(jsContent).toContain('REMOTE_STORAGE_CONFIG');
            expect(jsContent).toContain('API_ENDPOINT');
            expect(jsContent).toContain('FIREWORK_KEY');
        });

        test('should upload firework events to remote', () => {
            expect(jsContent).toContain('uploadFireworkEvent');
            expect(jsContent).toContain('uploadToRemoteStorage');
        });

        test('should include firework data in upload', () => {
            expect(jsContent).toContain('museumId');
            expect(jsContent).toContain('museumName');
            expect(jsContent).toContain('taskContent');
            expect(jsContent).toContain('childNickname');
        });
    });

    describe('Task Display and Interaction', () => {
        test('should render task cards from museum data', () => {
            expect(jsContent).toContain('renderTasks');
            expect(jsContent).toContain('createTaskCard');
        });

        test('should parse task strings for icon and title', () => {
            expect(jsContent).toContain('parseTaskString');
            expect(jsContent).toContain('emojiMatch');
        });

        test('should handle task completion', () => {
            expect(jsContent).toContain('completeTask');
            expect(jsContent).toContain('completedTasks.add');
        });

        test('should show fireworks celebration on task completion', () => {
            expect(jsContent).toContain('celebrateWithFireworks');
            expect(jsContent).toContain('fireworksCanvas');
        });

        test('should update progress after task completion', () => {
            expect(jsContent).toContain('updateProgress');
            expect(jsContent).toContain('completedTasks.size');
        });
    });

    describe('Edit Mode Support', () => {
        test('should support edit mode parameter', () => {
            expect(jsContent).toContain("urlParams.get('edit')");
            expect(jsContent).toContain('editMode');
        });

        test('should show edit mode indicator when enabled', () => {
            const combined = htmlContent + jsContent;
            expect(combined).toContain('editModeIndicator');
            expect(combined).toContain('编辑模式');
        });

        test('should allow adding new tasks in edit mode', () => {
            expect(jsContent).toContain('addNewTask');
            expect(jsContent).toContain('add-task-card');
        });

        test('should save tasks to remote storage in edit mode', () => {
            expect(jsContent).toContain('saveTasksToRemote');
            expect(jsContent).toContain('CHECKIN_KEY_PREFIX');
        });
    });

    describe('Navigation and Integration', () => {
        test('should navigate to fireworks wall with museum filter', () => {
            expect(jsContent).toContain('fireworks-wall.html?museum=');
        });

        test('should navigate back to main application', () => {
            const combined = htmlContent + jsContent;
            expect(combined).toContain('index.html');
            // Navigation is handled by SharedMenu component
            expect(combined).toContain('SharedMenu');
        });
    });

    describe('Styling and UX', () => {
        test('should have light blue gradient background', () => {
            expect(cssContent).toContain('linear-gradient(135deg, #a8d8ea');
        });

        test('should have completed task styling', () => {
            expect(cssContent).toContain('.task-card.completed');
            expect(cssContent).toContain('completion-badge');
        });

        test('should have responsive design', () => {
            expect(cssContent).toContain('@media (max-width: 768px)');
            expect(cssContent).toContain('grid-template-columns');
        });

        test('should have modal overlay styles', () => {
            expect(cssContent).toContain('.modal');
            expect(cssContent).toContain('modal.show');
        });
    });

    describe('Embeddable Features', () => {
        test('should be standalone page suitable for embedding', () => {
            // No dependency on main script bundle
            expect(htmlContent).not.toContain('<script src="script.js">');
            
            // Self-contained functionality (in external JS)
            expect(htmlContent).toContain('<script src="js/museum-checkin.js">');
            expect(jsContent).toContain('function init()');
        });

        test('should support URL parameters for museum-specific views', () => {
            expect(jsContent).toContain('URLSearchParams');
            expect(jsContent).toContain('window.location.search');
        });
    });

    describe('Data Flow and Logic', () => {
        test('should load museum data on initialization', () => {
            expect(jsContent).toContain('loadMuseumData');
            expect(jsContent).toContain('museumDataLoader.loadMuseum');
        });

        test('should extract child tasks for age group', () => {
            expect(jsContent).toContain('checklists.child');
            expect(jsContent).toContain('childTasks');
        });

        test('should handle missing museum gracefully', () => {
            expect(jsContent).toContain('博物馆未找到');
            expect(jsContent).toContain('未找到该博物馆的信息');
        });

        test('should initialize on DOM content loaded', () => {
            expect(jsContent).toContain('DOMContentLoaded');
            expect(jsContent).toContain('init');
        });

        test('should update page title on initialization', () => {
            // Check that init function and updatePageTitle both exist (in JS)
            expect(jsContent).toContain('async function init()');
            expect(jsContent).toContain('function updatePageTitle()');
            
            // Verify updatePageTitle is called somewhere
            expect(jsContent).toContain('updatePageTitle()');
            
            // Verify saveChildNickname also calls updatePageTitle (when nickname is saved)
            expect(jsContent).toMatch(/saveChildNickname[\s\S]{0,500}updatePageTitle/);
        });
    });
});
