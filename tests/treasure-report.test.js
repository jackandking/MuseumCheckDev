/**
 * Unit tests for treasure not-found reporting feature
 * Tests the reporting, display, and admin functionality
 */

const fs = require('fs');
const path = require('path');

describe('Treasure Not-Found Reporting Feature', () => {
    let htmlContent;
    let jsContent;
    let cssContent;
    
    beforeAll(() => {
        // Load the museum-checkin.html file
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

    describe('HTML Structure', () => {
        test('should have treasure report section in modal', () => {
            expect(htmlContent).toContain('id="treasureReportSection"');
            expect(htmlContent).toContain('class="treasure-report-section"');
        });

        test('should have report button with correct text', () => {
            expect(htmlContent).toContain('id="treasureReportBtn"');
            expect(htmlContent).toContain('报告：找不到这个镇馆之宝');
        });

        test('should have confirmation dialog elements', () => {
            expect(htmlContent).toContain('id="treasureReportConfirm"');
            expect(htmlContent).toContain('id="treasureReportYes"');
            expect(htmlContent).toContain('id="treasureReportNo"');
        });

        test('should have confirmation text asking for verification', () => {
            expect(htmlContent).toContain('与博物馆工作人员核实');
        });

        test('should have success status element', () => {
            expect(htmlContent).toContain('id="treasureReportStatus"');
        });
    });

    describe('CSS Styles', () => {
        test('should have warning class for 3+ reports', () => {
            expect(cssContent).toContain('.task-card.treasure-warning');
            expect(cssContent).toContain('border: 3px solid #ffc107');
        });

        test('should have unavailable class for 5+ reports', () => {
            expect(cssContent).toContain('.task-card.treasure-unavailable');
            expect(cssContent).toContain('border: 3px solid #dc3545');
        });

        test('should have warning badge styles', () => {
            expect(cssContent).toContain('.treasure-warning-badge');
        });

        test('should have unavailable badge styles', () => {
            expect(cssContent).toContain('.treasure-unavailable-badge');
        });
    });

    describe('JavaScript Configuration', () => {
        test('should define TREASURE_REPORT_KEY constant', () => {
            expect(jsContent).toContain("TREASURE_REPORT_KEY: 'museumcheck-treasure-report'");
        });

        test('should define WARNING_THRESHOLD constant (3)', () => {
            expect(jsContent).toContain('TREASURE_WARNING_THRESHOLD = 3');
        });

        test('should define UNAVAILABLE_THRESHOLD constant (5)', () => {
            expect(jsContent).toContain('TREASURE_UNAVAILABLE_THRESHOLD = 5');
        });
    });

    describe('JavaScript Functions', () => {
        test('should have loadTreasureReports function', () => {
            expect(jsContent).toContain('async function loadTreasureReports()');
        });

        test('should have getTreasureReportCount function', () => {
            expect(jsContent).toContain('function getTreasureReportCount(treasureName)');
        });

        test('should have reportTreasureNotFound function', () => {
            expect(jsContent).toContain('async function reportTreasureNotFound(treasureName)');
        });

        test('should have recordTreasurePhotoCheckin function', () => {
            expect(jsContent).toContain('async function recordTreasurePhotoCheckin(treasureName)');
        });

        test('should have isTreasureWarning function', () => {
            expect(jsContent).toContain('function isTreasureWarning(treasureName)');
        });

        test('should have isTreasureUnavailable function', () => {
            expect(jsContent).toContain('function isTreasureUnavailable(treasureName)');
        });

        test('should have hasUserReportedTreasure function', () => {
            expect(jsContent).toContain('function hasUserReportedTreasure(treasureName)');
        });

        test('should have getTreasureReportSortKey function', () => {
            expect(jsContent).toContain('function getTreasureReportSortKey(museumId, treasureName)');
        });
    });

    describe('Integration with Task Completion', () => {
        test('should record photo check-in for treasure tasks', () => {
            // Verify that completeTask function calls recordTreasurePhotoCheckin
            expect(jsContent).toContain('recordTreasurePhotoCheckin(treasureName)');
        });

        test('should check if task is treasure task before recording', () => {
            expect(jsContent).toMatch(/if.*title.*includes.*TREASURE_TASK_IDENTIFIER.*subtitle/s);
        });
        
        test('should define TREASURE_TASK_IDENTIFIER constant', () => {
            expect(jsContent).toContain("TREASURE_TASK_IDENTIFIER = '镇馆之宝'");
        });
    });

    describe('Treasure Selection Logic', () => {
        test('should filter out unavailable treasures by default', () => {
            // getSelectedTreasuresForMuseum should check report counts
            expect(jsContent).toContain('getTreasureReportCount(t.name)');
            expect(jsContent).toContain('TREASURE_UNAVAILABLE_THRESHOLD');
        });
    });

    describe('Treasure Selection UI (Issue: 标识不存在镇馆之宝)', () => {
        test('should have CSS for red border on selected unavailable treasures', () => {
            // Verify the CSS class for red border on manually selected unavailable treasures
            expect(cssContent).toContain('.treasure-checkbox-item.treasure-unavailable.selected');
            expect(cssContent).toContain('border-color: #dc3545 !important');
        });

        test('should have CSS for warning style on treasures with 3-4 reports', () => {
            // Verify the CSS class for yellow border on warning treasures
            expect(cssContent).toContain('.treasure-checkbox-item.treasure-warning');
            expect(cssContent).toContain('.treasure-checkbox-item.treasure-warning.selected');
        });

        test('should have report count badge CSS styles', () => {
            // Verify the badge styles for report count
            expect(cssContent).toContain('.treasure-report-count-badge');
            expect(cssContent).toContain('.treasure-report-count-badge.unavailable');
            expect(cssContent).toContain('.treasure-report-count-badge.warning');
        });

        test('should show report count badge in treasure selection list', () => {
            // Verify that renderV2TreasureConfigCheckboxes adds the report badge
            expect(jsContent).toContain("reportBadgeHtml = `<span class=\"treasure-report-count-badge unavailable\">${reportCount}人报告不存在</span>`");
            expect(jsContent).toContain("reportBadgeHtml = `<span class=\"treasure-report-count-badge warning\">${reportCount}人报告不存在</span>`");
        });

        test('should add treasure-unavailable class to checkbox items with 5+ reports', () => {
            // Verify the JS logic adds the unavailable class
            expect(jsContent).toContain("if (isUnavailable) itemClasses += ' treasure-unavailable'");
        });

        test('should add treasure-warning class to checkbox items with 3-4 reports', () => {
            // Verify the JS logic adds the warning class
            expect(jsContent).toContain("else if (isWarning) itemClasses += ' treasure-warning'");
        });

        test('should exclude unavailable treasures from default selection in checkbox list', () => {
            // Verify that the default selection logic in renderV2TreasureConfigCheckboxes
            // excludes treasures with 5+ reports
            expect(jsContent).toContain('const availableTreasures = allCollections.filter(t => {');
            // This is inside the default selection block where we filter by report count
            expect(jsContent).toContain('return reportCount < TREASURE_UNAVAILABLE_THRESHOLD;');
        });
    });
});

describe('Admin Treasure Reports Page', () => {
    let adminHtmlContent;
    
    beforeAll(() => {
        // Load the admin-treasure-reports.html file
        adminHtmlContent = fs.readFileSync(
            path.join(__dirname, '..', 'admin', 'admin-treasure-reports.html'),
            'utf8'
        );
    });

    describe('HTML Structure', () => {
        test('should have page title', () => {
            expect(adminHtmlContent).toContain('镇馆之宝报告管理');
        });

        test('should have reload button', () => {
            expect(adminHtmlContent).toContain('id="reload"');
            expect(adminHtmlContent).toContain('重新加载报告');
        });

        test('should have statistics display', () => {
            expect(adminHtmlContent).toContain('id="totalReports"');
            expect(adminHtmlContent).toContain('id="warningTreasures"');
            expect(adminHtmlContent).toContain('id="unavailableTreasures"');
            expect(adminHtmlContent).toContain('id="totalPhotoCheckins"');
        });

        test('should have filter dropdowns', () => {
            expect(adminHtmlContent).toContain('id="filterStatus"');
            expect(adminHtmlContent).toContain('id="filterMuseum"');
        });

        test('should have reports table', () => {
            expect(adminHtmlContent).toContain('id="reportsTable"');
            expect(adminHtmlContent).toContain('id="reportsTableBody"');
        });

        test('should have navigation links to other admin pages', () => {
            expect(adminHtmlContent).toContain('admin.html?admin=1');
            expect(adminHtmlContent).toContain('admin-fireworks.html?admin=1');
            expect(adminHtmlContent).toContain('admin-leaderboard.html?admin=1');
        });
    });

    describe('JavaScript Configuration', () => {
        test('should define correct API endpoint', () => {
            expect(adminHtmlContent).toContain("API_ENDPOINT: 'https://rlyhccdr2g.execute-api.us-west-2.amazonaws.com/default/keyValueStore'");
        });

        test('should define correct treasure report key', () => {
            expect(adminHtmlContent).toContain("TREASURE_REPORT_KEY: 'museumcheck-treasure-report'");
        });

        test('should define correct thresholds', () => {
            expect(adminHtmlContent).toContain('WARNING_THRESHOLD: 3');
            expect(adminHtmlContent).toContain('UNAVAILABLE_THRESHOLD: 5');
        });
    });

    describe('JavaScript Functions', () => {
        test('should have fetchReports function', () => {
            expect(adminHtmlContent).toContain('async function fetchReports()');
        });

        test('should have resetReport function', () => {
            expect(adminHtmlContent).toContain('async function resetReport(sortKey)');
        });

        test('should have renderTable function', () => {
            expect(adminHtmlContent).toContain('function renderTable(reports)');
        });

        test('should have updateStats function', () => {
            expect(adminHtmlContent).toContain('function updateStats(reports)');
        });

        test('should have getStatusTag function', () => {
            expect(adminHtmlContent).toContain('function getStatusTag(reportCount)');
        });
    });

    describe('Admin Authorization', () => {
        test('should check for admin query parameter', () => {
            expect(adminHtmlContent).toContain("isAdmin = qs.get('admin') === '1'");
        });

        test('should have unauthorized message', () => {
            expect(adminHtmlContent).toContain('id="unauthorized"');
            expect(adminHtmlContent).toContain('未授权访问');
        });
    });

    describe('Usage Instructions', () => {
        test('should explain reporting mechanism', () => {
            expect(adminHtmlContent).toContain('报告机制');
        });

        test('should explain status display', () => {
            expect(adminHtmlContent).toContain('状态显示');
        });

        test('should explain auto recovery', () => {
            expect(adminHtmlContent).toContain('自动恢复');
        });

        test('should explain manual reset', () => {
            expect(adminHtmlContent).toContain('手动重置');
        });
    });
});

describe('Admin Navigation Updates', () => {
    // admin.html has been removed - admin pages are now in admin/ folder
    test('admin pages should be in admin folder', () => {
        expect(fs.existsSync(path.join(__dirname, '..', 'admin', 'admin-treasure-reports.html'))).toBe(true);
    });

    test('admin-fireworks.html should link to treasure reports', () => {
        const content = fs.readFileSync(
            path.join(__dirname, '..', 'admin', 'admin-fireworks.html'),
            'utf8'
        );
        expect(content).toContain('admin-treasure-reports.html?admin=1');
    });

    test('admin-leaderboard.html should link to treasure reports', () => {
        const content = fs.readFileSync(
            path.join(__dirname, '..', 'admin', 'admin-leaderboard.html'),
            'utf8'
        );
        expect(content).toContain('admin-treasure-reports.html?admin=1');
    });
});

describe('Treasure Report Race Condition Fix', () => {
    let jsContent;
    
    beforeAll(() => {
        jsContent = fs.readFileSync(
            path.join(__dirname, '..', 'js', 'museum-checkin.js'),
            'utf8'
        );
    });

    describe('Fix: Fetch latest data from KV store before incrementing (Issue #735)', () => {
        test('should have fetchTreasureReportFromKV helper function', () => {
            // The fix adds a new function to fetch fresh data from KV store
            expect(jsContent).toContain('async function fetchTreasureReportFromKV(sortKey)');
        });

        test('fetchTreasureReportFromKV should use correct API endpoint', () => {
            // Verify the function uses the correct URL pattern with key and sortKey
            // Check for endpoint usage
            expect(jsContent).toContain('REMOTE_STORAGE_CONFIG.API_ENDPOINT');
            // Check that key parameter is encoded
            expect(jsContent).toContain('encodeURIComponent(REMOTE_STORAGE_CONFIG.TREASURE_REPORT_KEY)');
            // Check that sortKey parameter is encoded
            expect(jsContent).toContain('encodeURIComponent(sortKey)');
        });

        test('fetchTreasureReportFromKV should handle 404 gracefully', () => {
            // Should return null for non-existent reports
            expect(jsContent).toMatch(/if\s*\(\s*response\.status\s*===\s*404\s*\)/);
        });

        test('reportTreasureNotFound should fetch latest data before incrementing', () => {
            // The fix calls fetchTreasureReportFromKV before incrementing the count
            // This prevents race conditions when multiple users report simultaneously
            expect(jsContent).toContain('const latestReport = await fetchTreasureReportFromKV(sortKey);');
            expect(jsContent).toContain('const existingReport = latestReport || treasureReports[sortKey] || {};');
        });

        test('reportTreasureNotFound should have comment explaining the fix', () => {
            // Verify there's a comment explaining why we fetch fresh data
            expect(jsContent).toContain('CRITICAL FIX: Fetch latest report from KV store to avoid race conditions');
        });

        test('recordTreasurePhotoCheckin should also fetch latest data', () => {
            // The fix should also apply to the photo check-in function
            // to prevent race conditions when decrementing the count
            // Verify that recordTreasurePhotoCheckin calls fetchTreasureReportFromKV
            expect(jsContent).toContain('async function recordTreasurePhotoCheckin(treasureName)');
            // Check that it fetches latest report (appears after the function definition)
            const funcStart = jsContent.indexOf('async function recordTreasurePhotoCheckin');
            const funcEnd = jsContent.indexOf('async function', funcStart + 1);
            const funcBody = jsContent.substring(funcStart, funcEnd);
            expect(funcBody).toContain('fetchTreasureReportFromKV(sortKey)');
        });
    });
});

describe('Auto-Delete Treasures with 5+ Reports (Issue: 纠错)', () => {
    let jsContent;
    let adminHtmlContent;
    
    beforeAll(() => {
        jsContent = fs.readFileSync(
            path.join(__dirname, '..', 'js', 'museum-checkin.js'),
            'utf8'
        );
        adminHtmlContent = fs.readFileSync(
            path.join(__dirname, '..', 'admin', 'admin-treasure-reports.html'),
            'utf8'
        );
    });

    describe('Auto-Delete Function in museum-checkin.js', () => {
        test('should have autoDeleteTreasure function', () => {
            expect(jsContent).toContain('async function autoDeleteTreasure(treasureName)');
        });

        test('autoDeleteTreasure should load fresh museum data', () => {
            expect(jsContent).toContain('await window.museumDataLoader.loadMuseum(museumId, false)');
        });

        test('autoDeleteTreasure should filter out the treasure from collections', () => {
            // Check for filter operation to remove treasure
            expect(jsContent).toContain('museumData.collections.filter(t => t.name !== treasureName)');
        });

        test('autoDeleteTreasure should save updated museum data to KV store', () => {
            expect(jsContent).toContain('await window.museumDataLoader.saveToKVStore(museumId, museumData)');
        });

        test('autoDeleteTreasure should log deletion for admin tracking', () => {
            // Check for deletion log creation
            expect(jsContent).toContain('treasureDeletionLogs');
            expect(jsContent).toContain('deletedAt: Date.now()');
            expect(jsContent).toContain("reason: 'auto-delete-5plus-reports'");
        });

        test('autoDeleteTreasure should store deletion logs in localStorage', () => {
            expect(jsContent).toContain("localStorage.setItem('treasureDeletionLogs'");
            expect(jsContent).toContain("localStorage.getItem('treasureDeletionLogs'");
        });

        test('autoDeleteTreasure should limit deletion logs to 100 entries', () => {
            // Check for log size limit
            expect(jsContent).toContain('deletionLogs.length > 100');
            expect(jsContent).toContain('deletionLogs.shift()');
        });
    });

    describe('Integration with reportTreasureNotFound', () => {
        test('should call autoDeleteTreasure when report count reaches threshold', () => {
            expect(jsContent).toContain('await autoDeleteTreasure(treasureName)');
        });

        test('should check if report count >= TREASURE_UNAVAILABLE_THRESHOLD before auto-delete', () => {
            // Verify condition check before auto-delete
            expect(jsContent).toContain('newReportCount >= TREASURE_UNAVAILABLE_THRESHOLD');
        });

        test('should have comment explaining auto-delete feature', () => {
            expect(jsContent).toContain('AUTO-DELETE');
            expect(jsContent).toContain('automatically delete treasure');
        });
    });

    describe('Admin Page Deletion Logs Display', () => {
        test('should have deletion logs panel in admin page', () => {
            expect(adminHtmlContent).toContain('自动删除记录');
        });

        test('should have deletion logs table', () => {
            expect(adminHtmlContent).toContain('id="deletionLogsTable"');
            expect(adminHtmlContent).toContain('id="deletionLogsTableBody"');
        });

        test('should have renderDeletionLogs function', () => {
            expect(adminHtmlContent).toContain('function renderDeletionLogs()');
        });

        test('renderDeletionLogs should load from localStorage', () => {
            expect(adminHtmlContent).toContain("localStorage.getItem('treasureDeletionLogs'");
        });

        test('renderDeletionLogs should sort by deletion time', () => {
            expect(adminHtmlContent).toContain('deletionLogs.sort');
            expect(adminHtmlContent).toContain('deletedAt');
        });

        test('should display deletion reason', () => {
            expect(adminHtmlContent).toContain('auto-delete-5plus-reports');
            expect(adminHtmlContent).toContain('报告数达到5+自动删除');
        });

        test('should call renderDeletionLogs in loadReports', () => {
            expect(adminHtmlContent).toContain('renderDeletionLogs()');
        });
    });

    describe('Usage Documentation Updates', () => {
        test('admin page should document auto-delete in usage instructions', () => {
            expect(adminHtmlContent).toContain('自动删除');
            expect(adminHtmlContent).toContain('报告数达到5个或以上时');
            expect(adminHtmlContent).toContain('自动从博物馆数据中删除');
        });
    });
});

