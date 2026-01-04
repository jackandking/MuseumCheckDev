/**
 * Test suite for Hotjar integration in museum-checkin.html page
 * 
 * This test verifies that Hotjar feedback collection is properly integrated
 * in the check-in page, matching the implementation pattern from index.html
 */

const fs = require('fs');
const path = require('path');

describe('Museum Check-in Page - Hotjar Integration', () => {
    let checkinHtml;
    let indexHtml;

    beforeAll(() => {
        // Read the museum-checkin.html file
        const checkinPath = path.join(__dirname, '..', 'museum-checkin.html');
        checkinHtml = fs.readFileSync(checkinPath, 'utf8');

        // Read the index.html file for reference
        const indexPath = path.join(__dirname, '..', 'index.html');
        indexHtml = fs.readFileSync(indexPath, 'utf8');
    });

    describe('Hotjar Script Integration', () => {
        test('should include Hotjar script in museum-checkin.html', () => {
            // Check for Hotjar initialization code
            expect(checkinHtml).toContain('h.hj=h.hj||function()');
            expect(checkinHtml).toContain('h._hjSettings');
        });

        test('should use the correct Hotjar site ID', () => {
            // Extract Hotjar ID from both files
            const checkinHjidMatch = checkinHtml.match(/hjid:(\d+)/);
            const indexHjidMatch = indexHtml.match(/hjid:(\d+)/);

            expect(checkinHjidMatch).toBeTruthy();
            expect(indexHjidMatch).toBeTruthy();

            // Both pages should use the same Hotjar ID
            expect(checkinHjidMatch[1]).toBe('6525526');
            expect(checkinHjidMatch[1]).toBe(indexHjidMatch[1]);
        });

        test('should use the correct Hotjar script version', () => {
            // Extract Hotjar version from both files
            const checkinVersionMatch = checkinHtml.match(/hjsv:(\d+)/);
            const indexVersionMatch = indexHtml.match(/hjsv:(\d+)/);

            expect(checkinVersionMatch).toBeTruthy();
            expect(indexVersionMatch).toBeTruthy();

            // Both pages should use the same version
            expect(checkinVersionMatch[1]).toBe('6');
            expect(checkinVersionMatch[1]).toBe(indexVersionMatch[1]);
        });

        test('should load Hotjar script from correct CDN', () => {
            expect(checkinHtml).toContain("'https://static.hotjar.com/c/hotjar-'");
            expect(checkinHtml).toContain("'.js?sv='");
        });

        test('should load Hotjar asynchronously', () => {
            // Check that Hotjar script is loaded with async flag
            expect(checkinHtml).toMatch(/r\.async\s*=\s*1/);
        });
    });

    describe('Performance Optimization', () => {
        test('should defer Hotjar loading after page becomes interactive', () => {
            // Check for requestIdleCallback usage
            expect(checkinHtml).toContain('requestIdleCallback');
            expect(checkinHtml).toContain('setTimeout fallback');
        });

        test('should load Hotjar with additional delay', () => {
            // Hotjar should load after other analytics with extra delay
            expect(checkinHtml).toContain('HOTJAR_EXTRA_DELAY');
            expect(checkinHtml).toMatch(/HOTJAR_EXTRA_DELAY\s*=\s*2000/);
        });

        test('should have DNS prefetch for Hotjar domain', () => {
            // Check for DNS prefetch optimization
            expect(checkinHtml).toContain('dns-prefetch');
            expect(checkinHtml).toContain('static.hotjar.com');
        });

        test('should follow same loading pattern as index.html', () => {
            // Both pages should use similar timing constants
            const checkinIdleTimeout = checkinHtml.match(/IDLE_CALLBACK_TIMEOUT\s*=\s*(\d+)/);
            const indexIdleTimeout = indexHtml.match(/IDLE_CALLBACK_TIMEOUT\s*=\s*(\d+)/);

            expect(checkinIdleTimeout).toBeTruthy();
            expect(indexIdleTimeout).toBeTruthy();
            expect(checkinIdleTimeout[1]).toBe(indexIdleTimeout[1]);
        });
    });

    describe('Analytics Integration', () => {
        test('should include both Baidu Analytics and Hotjar', () => {
            // Check for Baidu Analytics
            expect(checkinHtml).toContain('hm.baidu.com');
            expect(checkinHtml).toContain('_hmt');

            // Check for Hotjar
            expect(checkinHtml).toContain('static.hotjar.com');
            expect(checkinHtml).toContain('h.hj');
        });

        test('should load analytics in correct order', () => {
            // Baidu Analytics should be loaded before Hotjar
            const baiduIndex = checkinHtml.indexOf('hm.baidu.com');
            const hotjarIndex = checkinHtml.indexOf('static.hotjar.com');

            expect(baiduIndex).toBeGreaterThan(0);
            expect(hotjarIndex).toBeGreaterThan(0);
            expect(baiduIndex).toBeLessThan(hotjarIndex);
        });

        test('should use consolidated analytics loading function', () => {
            // Check that both analytics are loaded from a single function
            expect(checkinHtml).toContain('function loadAnalytics()');
            
            // The function should handle both Baidu and Hotjar
            const loadAnalyticsMatch = checkinHtml.match(/function loadAnalytics\(\)\s*\{[\s\S]*?Baidu Analytics[\s\S]*?Hotjar[\s\S]*?\}/);
            expect(loadAnalyticsMatch).toBeTruthy();
        });
    });

    describe('Comments and Documentation', () => {
        test('should have descriptive comments explaining Hotjar integration', () => {
            expect(checkinHtml).toContain('Hotjar - Load last as it\'s least critical');
            expect(checkinHtml).toContain('Additional delay for Hotjar');
        });

        test('should explain performance optimization strategy', () => {
            expect(checkinHtml).toContain('Performance optimization');
            expect(checkinHtml).toContain('Defer all analytics');
            expect(checkinHtml).toContain('after first paint');
        });
    });

    describe('No Breaking Changes', () => {
        test('should maintain existing Baidu Analytics functionality', () => {
            // Ensure Baidu Analytics is still present and functional
            expect(checkinHtml).toContain('var _hmt = window._hmt = window._hmt || []');
            expect(checkinHtml).toContain('hm.baidu.com/hm.js?10856afa2ea23687b7e8f5b901795c57');
        });

        test('should not break existing page structure', () => {
            // Essential page elements should still be present
            expect(checkinHtml).toContain('<title>孩子任务 - 博物馆打卡</title>');
            expect(checkinHtml).toContain('<!DOCTYPE html>');
            expect(checkinHtml).toContain('<html lang="zh-CN">');
        });

        test('should preserve timing constants for requestIdleCallback', () => {
            expect(checkinHtml).toMatch(/IDLE_CALLBACK_TIMEOUT\s*=\s*3000/);
            expect(checkinHtml).toMatch(/FALLBACK_LOAD_DELAY\s*=\s*1500/);
        });
    });
});
