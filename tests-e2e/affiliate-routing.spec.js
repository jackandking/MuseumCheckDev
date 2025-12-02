// @ts-check
const { test, expect } = require('@playwright/test');
const path = require('path');
const fs = require('fs');

// E2E: Verify affiliate routing works without console errors
// Run: npx playwright test tests-e2e/affiliate-routing.spec.js

/**
 * @param {string} p
 * @returns {string}
 */
function fileUrl(p){
  const abs = path.resolve(p);
  let u = 'file://' + abs;
  // Windows path fix
  if (process.platform === 'win32') {
    u = 'file:///' + abs.replace(/\\/g, '/');
  }
  return u;
}

test.describe('Affiliate Routing', () => {
  test('loads index.html with affiliate parameter without XHR timeout errors', async ({ page }) => {
    const htmlPath = path.join(__dirname, '..', 'index.html');
    expect(fs.existsSync(htmlPath)).toBe(true);

    // Collect console messages
    /** @type {Array<{type: string, text: string}>} */
    const consoleMessages = [];
    page.on('console', msg => {
      consoleMessages.push({
        type: msg.type(),
        text: msg.text()
      });
    });

    // Open index.html with affiliate parameter
    const url = fileUrl(htmlPath) + '?affiliate=test';
    await page.goto(url);

    // Wait for page to load
    await page.waitForLoadState('domcontentloaded');

    // Verify no XMLHttpRequest timeout errors in console
    const timeoutErrors = consoleMessages.filter(msg => 
      msg.text.includes('timeout') && 
      msg.text.includes('XMLHttpRequest')
    );
    
    expect(timeoutErrors).toHaveLength(0);

    // Verify the page loaded successfully (check for main content)
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });

  test('handles affiliate routing config check gracefully on failure', async ({ page }) => {
    const htmlPath = path.join(__dirname, '..', 'index.html');
    
    // Collect console messages
    /** @type {Array<{type: string, text: string}>} */
    const consoleMessages = [];
    page.on('console', msg => {
      consoleMessages.push({
        type: msg.type(),
        text: msg.text()
      });
    });

    // Open with affiliate parameter
    const url = fileUrl(htmlPath) + '?affiliate=unknown';
    await page.goto(url);
    
    await page.waitForLoadState('domcontentloaded');

    // Should see the fallback message if config check fails
    const affiliateRoutingLogs = consoleMessages.filter(msg => 
      msg.text.includes('[AffiliateRouting]')
    );
    
    // Either succeeds silently or logs a fallback message
    // Should NOT have any error about timeout property
    const timeoutPropertyErrors = consoleMessages.filter(msg =>
      msg.text.includes("Failed to set the 'timeout' property")
    );
    
    expect(timeoutPropertyErrors).toHaveLength(0);
  });

  test('loads index.html without affiliate parameter normally', async ({ page }) => {
    const htmlPath = path.join(__dirname, '..', 'index.html');
    
    // Open without affiliate parameter
    const url = fileUrl(htmlPath);
    await page.goto(url);
    
    await page.waitForLoadState('domcontentloaded');

    // Page should load normally
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });
});
