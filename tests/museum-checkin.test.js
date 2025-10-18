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
    
    beforeAll(() => {
        htmlContent = fs.readFileSync(
            path.join(__dirname, '..', 'museum-checkin.html'), 
            'utf8'
        );
    });

    describe('Page Structure', () => {
        test('should have correct page title (default)', () => {
            // Default title before nickname is loaded
            expect(htmlContent).toContain('<title>孩子任务 - 博物馆打卡</title>');
        });

        test('should update page title with child nickname', () => {
            // Check for updatePageTitle function
            expect(htmlContent).toContain('function updatePageTitle()');
            expect(htmlContent).toContain('loadChildNickname()');
            expect(htmlContent).toContain('的任务');
            expect(htmlContent).toContain('document.title =');
        });

        test('should have page title element with id', () => {
            expect(htmlContent).toContain('id="pageTitle"');
        });

        test('should include required JavaScript dependencies', () => {
            expect(htmlContent).toContain('<script src="museums-data.js"></script>');
            expect(htmlContent).toContain('<script src="firework.js"></script>');
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
            expect(htmlContent).toContain('id="totalCount"');
            expect(htmlContent).toContain('id="progressFill"');
        });
    });

    describe('Modal Components', () => {
        test('should have task detail modal', () => {
            expect(htmlContent).toContain('id="taskModal"');
            expect(htmlContent).toContain('id="modalTitle"');
            expect(htmlContent).toContain('id="completeButton"');
        });

        test('should have menu modal', () => {
            expect(htmlContent).toContain('id="menuModal"');
            expect(htmlContent).toContain('id="viewParentTasks"');
            expect(htmlContent).toContain('id="viewAssessment"');
            expect(htmlContent).toContain('id="viewFireworks"');
        });

        test('should have parent hint section in task modal', () => {
            expect(htmlContent).toContain('id="parentHint"');
            expect(htmlContent).toContain('给家长的提示');
            expect(htmlContent).toContain('家长任务清单');
        });
    });

    describe('Progressive UX Implementation', () => {
        test('should show parent hint after completing tasks', () => {
            // Parent hint should be hidden by default
            expect(htmlContent).toContain('class="parent-hint"');
            
            // Logic to show parent hint after 1-2 completed tasks
            expect(htmlContent).toContain('completedTasks.size >= 1');
            expect(htmlContent).toContain('completedTasks.size <= 2');
            expect(htmlContent).toContain('parentHint');
            expect(htmlContent).toContain('classList.add');
        });

        test('should have navigation to parent tasks', () => {
            expect(htmlContent).toContain('viewParentTasks');
            expect(htmlContent).toContain('index.html?museum=');
            expect(htmlContent).toContain('focus=parent');
        });

        test('should have navigation to assessment', () => {
            expect(htmlContent).toContain('viewAssessment');
            expect(htmlContent).toContain('assessment=true');
        });
    });

    describe('Data Management', () => {
        test('should use museum ID from URL parameter', () => {
            expect(htmlContent).toContain('urlParams.get(\'museum\')');
            expect(htmlContent).toContain('museumId');
        });

        test('should support age group parameter', () => {
            expect(htmlContent).toContain('urlParams.get(\'age\')');
            expect(htmlContent).toContain('ageGroup');
        });

        test('should have local storage persistence', () => {
            expect(htmlContent).toContain('localStorage.setItem');
            expect(htmlContent).toContain('localStorage.getItem');
            expect(htmlContent).toContain('museumCheckin_');
        });

        test('should save completed tasks to local storage', () => {
            expect(htmlContent).toContain('saveCompletedTasks');
            expect(htmlContent).toContain('loadCompletedTasks');
        });

        test('should load and save child nickname', () => {
            expect(htmlContent).toContain('loadChildNickname');
            expect(htmlContent).toContain('saveChildNickname');
            expect(htmlContent).toContain('childNickname');
        });

        test('should update title when nickname is saved', () => {
            expect(htmlContent).toContain('updatePageTitle()');
            // Check that saveChildNickname function exists and contains updatePageTitle call
            expect(htmlContent).toContain('function saveChildNickname');
            const saveNicknameFnMatch = htmlContent.match(/function saveChildNickname[\s\S]{0,500}updatePageTitle\(\)/);
            expect(saveNicknameFnMatch).toBeTruthy();
        });
    });

    describe('Remote Storage Integration', () => {
        test('should have remote storage configuration', () => {
            expect(htmlContent).toContain('REMOTE_STORAGE_CONFIG');
            expect(htmlContent).toContain('API_ENDPOINT');
            expect(htmlContent).toContain('FIREWORK_KEY');
        });

        test('should upload firework events to remote', () => {
            expect(htmlContent).toContain('uploadFireworkEvent');
            expect(htmlContent).toContain('uploadToRemoteStorage');
        });

        test('should include firework data in upload', () => {
            expect(htmlContent).toContain('museumId');
            expect(htmlContent).toContain('museumName');
            expect(htmlContent).toContain('taskContent');
            expect(htmlContent).toContain('childNickname');
        });
    });

    describe('Task Display and Interaction', () => {
        test('should render task cards from museum data', () => {
            expect(htmlContent).toContain('renderTasks');
            expect(htmlContent).toContain('createTaskCard');
        });

        test('should parse task strings for icon and title', () => {
            expect(htmlContent).toContain('parseTaskString');
            expect(htmlContent).toContain('emojiMatch');
        });

        test('should handle task completion', () => {
            expect(htmlContent).toContain('completeTask');
            expect(htmlContent).toContain('completedTasks.add');
        });

        test('should show fireworks celebration on task completion', () => {
            expect(htmlContent).toContain('celebrateWithFireworks');
            expect(htmlContent).toContain('fireworksCanvas');
        });

        test('should update progress after task completion', () => {
            expect(htmlContent).toContain('updateProgress');
            expect(htmlContent).toContain('completedTasks.size');
        });
    });

    describe('Edit Mode Support', () => {
        test('should support edit mode parameter', () => {
            expect(htmlContent).toContain('urlParams.get(\'edit\')');
            expect(htmlContent).toContain('editMode');
        });

        test('should show edit mode indicator when enabled', () => {
            expect(htmlContent).toContain('editModeIndicator');
            expect(htmlContent).toContain('编辑模式');
        });

        test('should allow adding new tasks in edit mode', () => {
            expect(htmlContent).toContain('addNewTask');
            expect(htmlContent).toContain('add-task-card');
        });

        test('should save tasks to remote storage in edit mode', () => {
            expect(htmlContent).toContain('saveTasksToRemote');
            expect(htmlContent).toContain('CHECKIN_KEY_PREFIX');
        });
    });

    describe('Navigation and Integration', () => {
        test('should navigate to fireworks wall with museum filter', () => {
            expect(htmlContent).toContain('fireworks-wall.html?museum=');
        });

        test('should navigate back to main application', () => {
            expect(htmlContent).toContain('index.html');
            expect(htmlContent).toContain('backToHome');
        });

        test('should provide link to parent tasks from hint', () => {
            expect(htmlContent).toContain('parentTasksLink');
            expect(htmlContent).toContain('家长任务清单');
        });
    });

    describe('Styling and UX', () => {
        test('should have light blue gradient background', () => {
            expect(htmlContent).toContain('linear-gradient(135deg, #a8d8ea');
        });

        test('should have completed task styling', () => {
            expect(htmlContent).toContain('.task-card.completed');
            expect(htmlContent).toContain('completion-badge');
        });

        test('should have responsive design', () => {
            expect(htmlContent).toContain('@media (max-width: 768px)');
            expect(htmlContent).toContain('grid-template-columns');
        });

        test('should have modal overlay styles', () => {
            expect(htmlContent).toContain('.modal');
            expect(htmlContent).toContain('modal.show');
        });
    });

    describe('Embeddable Features', () => {
        test('should be standalone page suitable for embedding', () => {
            // No external dependencies beyond museums-data.js and firework.js
            expect(htmlContent).not.toContain('<script src="script.js">');
            
            // Self-contained functionality
            expect(htmlContent).toContain('<script>');
            expect(htmlContent).toContain('function init()');
        });

        test('should support URL parameters for museum-specific views', () => {
            expect(htmlContent).toContain('URLSearchParams');
            expect(htmlContent).toContain('window.location.search');
        });
    });

    describe('Data Flow and Logic', () => {
        test('should load museum data on initialization', () => {
            expect(htmlContent).toContain('loadMuseumData');
            expect(htmlContent).toContain('MUSEUMS.find');
        });

        test('should extract child tasks for age group', () => {
            expect(htmlContent).toContain('checklists.child');
            expect(htmlContent).toContain('childTasks');
        });

        test('should handle missing museum gracefully', () => {
            expect(htmlContent).toContain('博物馆未找到');
            expect(htmlContent).toContain('未找到该博物馆的信息');
        });

        test('should initialize on DOM content loaded', () => {
            expect(htmlContent).toContain('DOMContentLoaded');
            expect(htmlContent).toContain('init');
        });

        test('should update page title on initialization', () => {
            // Check that init function exists and contains updatePageTitle call
            expect(htmlContent).toContain('function init()');
            const initFnMatch = htmlContent.match(/function init\(\)[\s\S]{0,300}updatePageTitle\(\)/);
            expect(initFnMatch).toBeTruthy();
        });
    });
});
