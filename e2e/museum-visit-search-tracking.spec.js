/**
 * E2E Test: Museum Visit and Search Tracking (Desktop and Mobile)
 * 
 * This test verifies that:
 * 1. Museum card clicks record "xxx visited xxx museum" events (desktop & mobile)
 * 2. Homepage search queries are recorded to event wall
 * 
 * Addresses user feedback on PR for Issue #1112
 */

const { test, expect, devices } = require('@playwright/test');

/**
 * Helper to set up event capture that survives page navigation.
 * Uses page.exposeFunction so events captured before navigation are available after.
 * @returns {Array} capturedEvents - array that receives events as they are recorded
 */
async function setupEventCapture(page) {
    const capturedEvents = [];
    await page.exposeFunction('__testCaptureEvent__', (event) => {
        capturedEvents.push(event);
    });
    return capturedEvents;
}

/**
 * Install the event-wall intercept on the current page context.
 * Must be called after the page has loaded and window.app is initialized.
 */
async function installEventIntercept(page) {
    await page.evaluate(() => {
        window.testEvents = [];
        if (window.app && window.app.eventWallService) {
            const originalRecordEvent = window.app.eventWallService.recordEvent.bind(window.app.eventWallService);
            window.app.eventWallService.recordEvent = function(eventType, title, description, parameters) {
                const event = { eventType, title, description, parameters };
                window.testEvents.push(event);
                if (typeof window.__testCaptureEvent__ === 'function') {
                    window.__testCaptureEvent__(event);
                }
                return originalRecordEvent(eventType, title, description, parameters);
            };
        }
    });
}

test.describe('Museum Visit Tracking', () => {
    
    test('should track museum visit when card is clicked on desktop', async ({ page }) => {
        // Set up cross-navigation event capture before loading the page
        const capturedEvents = await setupEventCapture(page);

        // Navigate to homepage
        await page.goto('/');
        await page.waitForLoadState('domcontentloaded');
        await page.waitForTimeout(2000); // Wait for app initialization
        
        // Close nickname onboarding modal if present
        try {
            const modal = page.locator('#nicknameOnboardingModal');
            const isVisible = await modal.isVisible();
            if (isVisible) {
                const closeButton = modal.locator('button:has-text("跳过")');
                await closeButton.click();
                await page.waitForTimeout(500);
            }
        } catch (e) {
            // Modal not present or already closed
        }
        
        // Check if EventWallService is available
        const hasEventWallService = await page.evaluate(() => {
            return (window.app && window.app.eventWallService &&
                   typeof window.app.eventWallService.recordEvent === 'function');
        });
        expect(hasEventWallService).toBeTruthy();
        
        // Install intercept that also calls the cross-navigation capture function
        await installEventIntercept(page);
        
        // Find and click a museum card (clicking navigates to museum-checkin.html)
        const museumCard = page.locator('.museum-card').first();
        await museumCard.waitFor({ state: 'visible' });
        await museumCard.click();
        
        // Wait for navigation to museum-checkin page
        await page.waitForURL('**/museum-checkin.html**', { timeout: 10000 });
        
        // Check captured events (collected before navigation via exposeFunction)
        const visitEvents = capturedEvents.filter(e => e.eventType === 'visit');
        
        expect(visitEvents.length).toBeGreaterThan(0);
        expect(visitEvents[0].title).toBe('访问博物馆');
        expect(visitEvents[0].description).toContain('查看');
        expect(visitEvents[0].parameters.museumId).toBeDefined();
        expect(visitEvents[0].parameters.museumName).toBeDefined();
    });
    
    test('should track museum visit when card is clicked on mobile', async ({ page }) => {
        // Set up cross-navigation event capture before loading the page
        const capturedEvents = await setupEventCapture(page);

        // Set mobile viewport (iPhone 12)
        await page.setViewportSize({ width: 390, height: 844 });
        
        // Navigate to homepage
        await page.goto('/');
        await page.waitForLoadState('domcontentloaded');
        await page.waitForTimeout(2000); // Wait for app initialization
        
        // Close nickname onboarding modal if present
        try {
            const modal = page.locator('#nicknameOnboardingModal');
            const isVisible = await modal.isVisible();
            if (isVisible) {
                const closeButton = modal.locator('button:has-text("跳过")');
                await closeButton.click();
                await page.waitForTimeout(500);
            }
        } catch (e) {
            // Modal not present or already closed
        }
        
        // Check if EventWallService is available on mobile
        const hasEventWallService = await page.evaluate(() => {
            return (window.app && window.app.eventWallService &&
                   typeof window.app.eventWallService.recordEvent === 'function');
        });
        expect(hasEventWallService).toBeTruthy();
        
        // Install intercept that also calls the cross-navigation capture function
        await installEventIntercept(page);
        
        // Find and click a museum card on mobile (use click, not tap, for event tracking test)
        const museumCard = page.locator('.museum-card').first();
        await museumCard.waitFor({ state: 'visible' });
        await museumCard.click();
        
        // Wait for navigation to museum-checkin page
        await page.waitForURL('**/museum-checkin.html**', { timeout: 10000 });
        
        // Check captured events (collected before navigation via exposeFunction)
        const visitEvents = capturedEvents.filter(e => e.eventType === 'visit');
        
        expect(visitEvents.length).toBeGreaterThan(0);
        expect(visitEvents[0].title).toBe('访问博物馆');
        expect(visitEvents[0].description).toContain('查看');
        expect(visitEvents[0].parameters.museumId).toBeDefined();
        expect(visitEvents[0].parameters.museumName).toBeDefined();
    });
});

test.describe('Search Tracking on Homepage', () => {
    
    test('should track search queries to event wall on desktop', async ({ page }) => {
        // Navigate to homepage
        await page.goto('/');
        await page.waitForLoadState('domcontentloaded');
        await page.waitForTimeout(2000); // Wait for app initialization
        
        // Track search events
        await page.evaluate(() => {
            window.testEvents = [];
            if (window.app && window.app.eventWallService) {
                const originalRecordEvent = window.app.eventWallService.recordEvent;
                window.app.eventWallService.recordEvent = function(eventType, title, description, parameters) {
                    window.testEvents.push({ eventType, title, description, parameters });
                    return originalRecordEvent.call(this, eventType, title, description, parameters);
                };
            }
        });
        
        // Find search input and enter a query
        const searchInput = page.locator('#museumSearch');
        await searchInput.waitFor({ state: 'visible' });
        await searchInput.fill('故宫');
        
        // Wait for debounce delay (300ms default + buffer)
        await page.waitForTimeout(1000);
        
        // Check if search event was recorded
        const searchEvents = await page.evaluate(() => {
            return (window.testEvents || []).filter(e => e.eventType === 'search');
        });
        
        expect(searchEvents.length).toBeGreaterThan(0);
        expect(searchEvents[0].title).toBe('搜索博物馆');
        expect(searchEvents[0].description).toContain('搜索关键字：故宫');
        expect(searchEvents[0].parameters.query).toBe('故宫');
        expect(searchEvents[0].parameters.resultsCount).toBeDefined();
    });
    
    test('should track search queries to event wall on mobile', async ({ page }) => {
        // Set mobile viewport (iPhone 12)
        await page.setViewportSize({ width: 390, height: 844 });
        
        // Navigate to homepage
        await page.goto('/');
        await page.waitForLoadState('domcontentloaded');
        await page.waitForTimeout(2000); // Wait for app initialization
        
        // Track search events
        await page.evaluate(() => {
            window.testEvents = [];
            if (window.app && window.app.eventWallService) {
                const originalRecordEvent = window.app.eventWallService.recordEvent;
                window.app.eventWallService.recordEvent = function(eventType, title, description, parameters) {
                    window.testEvents.push({ eventType, title, description, parameters });
                    return originalRecordEvent.call(this, eventType, title, description, parameters);
                };
            }
        });
        
        // Find search input and enter a query on mobile
        const searchInput = page.locator('#museumSearch');
        await searchInput.waitFor({ state: 'visible' });
        await searchInput.fill('北京博物馆');
        
        // Wait for debounce delay
        await page.waitForTimeout(1000);
        
        // Check if search event was recorded
        const searchEvents = await page.evaluate(() => {
            return (window.testEvents || []).filter(e => e.eventType === 'search');
        });
        
        expect(searchEvents.length).toBeGreaterThan(0);
        expect(searchEvents[0].title).toBe('搜索博物馆');
        expect(searchEvents[0].description).toContain('搜索关键字：北京博物馆');
        expect(searchEvents[0].parameters.query).toBe('北京博物馆');
        expect(searchEvents[0].parameters.resultsCount).toBeDefined();
    });
    
    test('should not track search queries shorter than 2 characters', async ({ page }) => {
        // Navigate to homepage
        await page.goto('/');
        await page.waitForLoadState('domcontentloaded');
        await page.waitForTimeout(2000);
        
        // Track events
        await page.evaluate(() => {
            window.testEvents = [];
            if (window.app && window.app.eventWallService) {
                const originalRecordEvent = window.app.eventWallService.recordEvent;
                window.app.eventWallService.recordEvent = function(eventType, title, description, parameters) {
                    window.testEvents.push({ eventType, title, description, parameters });
                    return originalRecordEvent.call(this, eventType, title, description, parameters);
                };
            }
        });
        
        // Enter a single character search
        const searchInput = page.locator('#museumSearch');
        await searchInput.fill('北');
        await page.waitForTimeout(1000);
        
        // Check that NO search event was recorded
        const searchEvents = await page.evaluate(() => {
            return (window.testEvents || []).filter(e => e.eventType === 'search');
        });
        
        expect(searchEvents.length).toBe(0);
    });
});

test.describe('Integration: Museum Visit and Search Together', () => {
    
    test('should track both search and museum visit in same session', async ({ page }) => {
        // Set up cross-navigation event capture before loading the page
        const capturedEvents = await setupEventCapture(page);

        await page.goto('/');
        await page.waitForLoadState('domcontentloaded');
        await page.waitForTimeout(2000);
        
        // Close nickname onboarding modal if present
        try {
            const modal = page.locator('#nicknameOnboardingModal');
            const isVisible = await modal.isVisible();
            if (isVisible) {
                const closeButton = modal.locator('button:has-text("跳过")');
                await closeButton.click();
                await page.waitForTimeout(500);
            }
        } catch (e) {
            // Modal not present or already closed
        }
        
        // Install intercept that also calls the cross-navigation capture function
        await installEventIntercept(page);
        
        // First, search for a museum (no navigation)
        const searchInput = page.locator('#museumSearch');
        await searchInput.fill('故宫');
        await page.waitForTimeout(1000);
        
        // Then, click a museum card (triggers navigation)
        const museumCard = page.locator('.museum-card').first();
        await museumCard.click();

        // Wait for navigation to museum-checkin page
        await page.waitForURL('**/museum-checkin.html**', { timeout: 10000 });
        
        // Verify both events were tracked via the cross-navigation capture
        const searchEvents = capturedEvents.filter(e => e.eventType === 'search');
        const visitEvents = capturedEvents.filter(e => e.eventType === 'visit');
        
        expect(searchEvents.length).toBeGreaterThan(0);
        expect(visitEvents.length).toBeGreaterThan(0);
    });
});
