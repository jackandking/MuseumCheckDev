/**
 * Unit tests for treasure not-found reporting feature
 * Tests the reporting, display, and admin functionality
 */

const fs = require('fs');
const path = require('path');

describe('Treasure Not-Found Reporting Feature', () => {
    let htmlContent;
    
    beforeAll(() => {
        // Load the museum-checkin.html file
        htmlContent = fs.readFileSync(
            path.join(__dirname, '..', 'museum-checkin.html'),
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
            expect(htmlContent).toContain('.task-card.treasure-warning');
            expect(htmlContent).toContain('border: 3px solid #ffc107');
        });

        test('should have unavailable class for 5+ reports', () => {
            expect(htmlContent).toContain('.task-card.treasure-unavailable');
            expect(htmlContent).toContain('border: 3px solid #dc3545');
        });

        test('should have warning badge styles', () => {
            expect(htmlContent).toContain('.treasure-warning-badge');
        });

        test('should have unavailable badge styles', () => {
            expect(htmlContent).toContain('.treasure-unavailable-badge');
        });
    });

    describe('JavaScript Configuration', () => {
        test('should define TREASURE_REPORT_KEY constant', () => {
            expect(htmlContent).toContain("TREASURE_REPORT_KEY: 'museumcheck-treasure-report'");
        });

        test('should define WARNING_THRESHOLD constant (3)', () => {
            expect(htmlContent).toContain('TREASURE_WARNING_THRESHOLD = 3');
        });

        test('should define UNAVAILABLE_THRESHOLD constant (5)', () => {
            expect(htmlContent).toContain('TREASURE_UNAVAILABLE_THRESHOLD = 5');
        });
    });

    describe('JavaScript Functions', () => {
        test('should have loadTreasureReports function', () => {
            expect(htmlContent).toContain('async function loadTreasureReports()');
        });

        test('should have getTreasureReportCount function', () => {
            expect(htmlContent).toContain('function getTreasureReportCount(treasureName)');
        });

        test('should have reportTreasureNotFound function', () => {
            expect(htmlContent).toContain('async function reportTreasureNotFound(treasureName)');
        });

        test('should have recordTreasurePhotoCheckin function', () => {
            expect(htmlContent).toContain('async function recordTreasurePhotoCheckin(treasureName)');
        });

        test('should have isTreasureWarning function', () => {
            expect(htmlContent).toContain('function isTreasureWarning(treasureName)');
        });

        test('should have isTreasureUnavailable function', () => {
            expect(htmlContent).toContain('function isTreasureUnavailable(treasureName)');
        });

        test('should have hasUserReportedTreasure function', () => {
            expect(htmlContent).toContain('function hasUserReportedTreasure(treasureName)');
        });

        test('should have getTreasureReportSortKey function', () => {
            expect(htmlContent).toContain('function getTreasureReportSortKey(museumId, treasureName)');
        });
    });

    describe('Integration with Task Completion', () => {
        test('should record photo check-in for treasure tasks', () => {
            // Verify that completeTask function calls recordTreasurePhotoCheckin
            expect(htmlContent).toContain('recordTreasurePhotoCheckin(treasureName)');
        });

        test('should check if task is treasure task before recording', () => {
            expect(htmlContent).toMatch(/if.*title.*includes.*TREASURE_TASK_IDENTIFIER.*subtitle/s);
        });
        
        test('should define TREASURE_TASK_IDENTIFIER constant', () => {
            expect(htmlContent).toContain("TREASURE_TASK_IDENTIFIER = '镇馆之宝'");
        });
    });

    describe('Treasure Selection Logic', () => {
        test('should filter out unavailable treasures by default', () => {
            // getSelectedTreasuresForMuseum should check report counts
            expect(htmlContent).toContain('getTreasureReportCount(t.name)');
            expect(htmlContent).toContain('TREASURE_UNAVAILABLE_THRESHOLD');
        });
    });
});

describe('Admin Treasure Reports Page', () => {
    let adminHtmlContent;
    
    beforeAll(() => {
        // Load the admin-treasure-reports.html file
        adminHtmlContent = fs.readFileSync(
            path.join(__dirname, '..', 'admin-treasure-reports.html'),
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
    test('main admin.html should link to treasure reports', () => {
        const content = fs.readFileSync(
            path.join(__dirname, '..', 'admin.html'),
            'utf8'
        );
        expect(content).toContain('admin-treasure-reports.html?admin=1');
        expect(content).toContain('镇馆之宝报告');
    });

    test('admin-fireworks.html should link to treasure reports', () => {
        const content = fs.readFileSync(
            path.join(__dirname, '..', 'admin-fireworks.html'),
            'utf8'
        );
        expect(content).toContain('admin-treasure-reports.html?admin=1');
    });

    test('admin-leaderboard.html should link to treasure reports', () => {
        const content = fs.readFileSync(
            path.join(__dirname, '..', 'admin-leaderboard.html'),
            'utf8'
        );
        expect(content).toContain('admin-treasure-reports.html?admin=1');
    });
});
