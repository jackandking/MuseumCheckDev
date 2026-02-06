/**
 * E2E Test: Museum Check-in Page Visit Tracking
 * 
 * This test verifies that:
 * When a museum check-in page is visited, it records "xxx访问了xxx博物馆" to the event wall
 * 
 * Addresses Issue: 事件墙记录博物馆访问
 */

const { test, expect } = require('@playwright/test');

test.describe('Museum Check-in Page Visit Tracking', () => {
    
    test('should track museum visit when check-in page loads', async ({ page }) => {
        const consoleLogs = [];
        page.on('console', msg => {
            consoleLogs.push({ type: msg.type(), text: msg.text() });
        });
        
        // Navigate to a specific museum check-in page (故宫博物院)
        await page.goto('/museum-checkin.html?id=forbidden-city&age=7-12');
        await page.waitForLoadState('domcontentloaded');
        
        // Wait for museum data to load and page to initialize
        await page.waitForTimeout(3000);
        
        // Check if EventWallService is available
        const hasEventWallService = await page.evaluate(() => {
            return (window.eventWallService && 
                   typeof window.eventWallService.recordEvent === 'function');
        });
        expect(hasEventWallService).toBeTruthy();
        
        // Check if tracking console log was emitted
        const trackingLog = consoleLogs.find(log => 
            log.text.includes('[Event Tracking] Recorded museum check-in page visit')
        );
        expect(trackingLog).toBeDefined();
        expect(trackingLog.text).toContain('故宫博物院');
    });
    
    test('should track visit for different museums', async ({ page }) => {
        const consoleLogs = [];
        page.on('console', msg => {
            consoleLogs.push({ type: msg.type(), text: msg.text() });
        });
        
        // Test with a different museum (中国国家博物馆)
        await page.goto('/museum-checkin.html?id=national-museum&age=7-12');
        await page.waitForLoadState('domcontentloaded');
        await page.waitForTimeout(3000);
        
        // Check tracking log
        const trackingLog = consoleLogs.find(log => 
            log.text.includes('[Event Tracking] Recorded museum check-in page visit')
        );
        expect(trackingLog).toBeDefined();
        expect(trackingLog.text).toContain('中国国家博物馆');
    });
    
    test('should track visit on mobile devices', async ({ page }) => {
        // Set mobile viewport (iPhone 12)
        await page.setViewportSize({ width: 390, height: 844 });
        
        const consoleLogs = [];
        page.on('console', msg => {
            consoleLogs.push({ type: msg.type(), text: msg.text() });
        });
        
        // Navigate to museum check-in page
        await page.goto('/museum-checkin.html?id=shanghai-museum&age=7-12');
        await page.waitForLoadState('domcontentloaded');
        await page.waitForTimeout(3000);
        
        // Check EventWallService on mobile
        const hasEventWallService = await page.evaluate(() => {
            return (window.eventWallService && 
                   typeof window.eventWallService.recordEvent === 'function');
        });
        expect(hasEventWallService).toBeTruthy();
        
        // Check tracking log
        const trackingLog = consoleLogs.find(log => 
            log.text.includes('[Event Tracking] Recorded museum check-in page visit')
        );
        expect(trackingLog).toBeDefined();
        expect(trackingLog.text).toContain('上海博物馆');
    });
    
    test('should only track visit once per page load', async ({ page }) => {
        const consoleLogs = [];
        page.on('console', msg => {
            consoleLogs.push({ type: msg.type(), text: msg.text() });
        });
        
        // Navigate to check-in page
        await page.goto('/museum-checkin.html?id=forbidden-city&age=7-12');
        await page.waitForLoadState('domcontentloaded');
        
        // Wait for initialization
        await page.waitForTimeout(3000);
        
        // Count tracking logs
        const trackingLogs = consoleLogs.filter(log => 
            log.text.includes('[Event Tracking] Recorded museum check-in page visit')
        );
        
        // Should have exactly one tracking log (not duplicates)
        expect(trackingLogs.length).toBe(1);
    });
});
