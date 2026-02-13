/**
 * Unit tests for treasure report API response format handling
 * Tests that both KV store response formats are correctly parsed
 */

const fs = require('fs');
const path = require('path');

describe('Treasure Report API Response Format Handling', () => {
    let adminHtmlContent;
    let checkinJsContent;
    
    beforeAll(() => {
        // Load the admin treasure reports HTML file
        adminHtmlContent = fs.readFileSync(
            path.join(__dirname, '..', 'admin', 'admin-treasure-reports.html'),
            'utf8'
        );
        
        // Load the museum-checkin JS file
        checkinJsContent = fs.readFileSync(
            path.join(__dirname, '..', 'js', 'museum-checkin.js'),
            'utf8'
        );
    });

    describe('Admin Treasure Reports - fetchReports()', () => {
        test('should handle Format 1: direct items array', () => {
            // Check that code handles data.items || data.Items
            expect(adminHtmlContent).toContain('data.items || data.Items');
        });

        test('should handle Format 2: JSON string in value field', () => {
            // Check that code handles data.value as JSON string
            expect(adminHtmlContent).toContain('data.value && typeof data.value === \'string\'');
            expect(adminHtmlContent).toContain('JSON.parse(data.value)');
        });

        test('should have comments explaining both formats', () => {
            // Verify documentation of supported formats
            expect(adminHtmlContent).toContain('Support multiple response formats');
            expect(adminHtmlContent).toContain('DynamoDB direct format');
            expect(adminHtmlContent).toContain('JSON string in value field');
        });

        test('should handle parsing errors gracefully', () => {
            // Check error handling for Format 2
            expect(adminHtmlContent).toContain('Failed to parse value field');
        });

        test('should initialize itemsArray to empty array on failure', () => {
            // Ensure fallback to empty array
            expect(adminHtmlContent).toMatch(/itemsArray\s*=\s*\[\]/);
        });
    });

    describe('Museum Checkin - loadTreasureReports()', () => {
        test('should handle Format 1: direct items array', () => {
            // Check that code handles data.items || data.Items
            expect(checkinJsContent).toContain('data.items || data.Items');
        });

        test('should handle Format 2: JSON string in value field', () => {
            // Check that code handles data.value as JSON string
            expect(checkinJsContent).toContain('data.value && typeof data.value === \'string\'');
            expect(checkinJsContent).toContain('JSON.parse(data.value)');
        });

        test('should have comments explaining both formats', () => {
            // Verify documentation of supported formats
            expect(checkinJsContent).toContain('Support multiple response formats');
            expect(checkinJsContent).toContain('DynamoDB direct format');
            expect(checkinJsContent).toContain('JSON string in value field');
        });

        test('should handle parsing errors gracefully', () => {
            // Check error handling for Format 2
            expect(checkinJsContent).toContain('Failed to parse value field');
        });

        test('should initialize itemsArray to empty array on failure', () => {
            // Ensure fallback to empty array
            expect(checkinJsContent).toMatch(/itemsArray\s*=\s*\[\]/);
        });
    });

    describe('Consistency Between Files', () => {
        test('both files should use the same dual-format handling pattern', () => {
            // Extract the format handling logic from both files
            const adminFormatCheck = /if \(data\.items \|\| data\.Items\)[\s\S]{0,200}else if \(data\.value && typeof data\.value === 'string'\)/;
            const checkinFormatCheck = /if \(data\.items \|\| data\.Items\)[\s\S]{0,200}else if \(data\.value && typeof data\.value === 'string'\)/;
            
            expect(adminHtmlContent).toMatch(adminFormatCheck);
            expect(checkinJsContent).toMatch(checkinFormatCheck);
        });

        test('both files should filter for treasure- prefixed sortKeys', () => {
            // Verify sortKey filtering
            expect(adminHtmlContent).toContain("sortKey.startsWith('treasure-')");
            expect(checkinJsContent).toContain("sortKey.startsWith('treasure-')");
        });
    });

    describe('Regression Prevention', () => {
        test('should not remove original Format 1 handling', () => {
            // Ensure backward compatibility with Format 1
            expect(adminHtmlContent).toContain('data.items || data.Items');
            expect(checkinJsContent).toContain('data.items || data.Items');
        });

        test('should preserve sortKey extraction logic', () => {
            // Verify sortKey extraction still works
            expect(adminHtmlContent).toContain('item.sortKey || item.sk');
            expect(checkinJsContent).toContain('item.sortKey || item.sk');
        });

        test('should preserve report value parsing', () => {
            // Verify report JSON parsing
            expect(adminHtmlContent).toContain('JSON.parse(item.value)');
            expect(checkinJsContent).toContain('JSON.parse(item.value)');
        });
    });

    describe('Error Handling', () => {
        test('admin page should show status message on load failure', () => {
            expect(adminHtmlContent).toContain("el.status.textContent = '加载失败:");
        });

        test('admin page should handle 404 responses', () => {
            expect(adminHtmlContent).toContain('res.status === 404');
            expect(adminHtmlContent).toContain('return []');
        });

        test('checkin page should return empty object on load failure', () => {
            expect(checkinJsContent).toContain('return {}');
        });

        test('checkin page should handle 404 responses', () => {
            expect(checkinJsContent).toContain('response.status === 404');
        });
    });

    describe('API Integration Patterns', () => {
        test('should use correct KV store endpoint', () => {
            expect(adminHtmlContent).toContain('API_ENDPOINT:');
            expect(adminHtmlContent).toContain('keyValueStore');
        });

        test('should use correct treasure report key', () => {
            expect(adminHtmlContent).toContain("TREASURE_REPORT_KEY: 'museumcheck-treasure-report'");
            expect(checkinJsContent).toContain("TREASURE_REPORT_KEY: 'museumcheck-treasure-report'");
        });

        test('should use wildcard sortKey query', () => {
            expect(adminHtmlContent).toContain('sortKey=*');
            expect(checkinJsContent).toContain('sortKey=*');
        });
    });
});
