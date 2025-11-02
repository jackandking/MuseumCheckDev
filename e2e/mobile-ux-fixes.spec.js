// @ts-check
const { test, expect } = require('@playwright/test');
const path = require('path');
const fs = require('fs');

/**
 * E2E tests for mobile UX fixes
 * - v2: Close button on completion celebration poster
 * - v3: X button on settings modal
 * - v3: No unwanted intro overlay after settings close during journey
 */

/**
 * @param {string} p
 * @returns {string}
 */
function fileUrl(p){
  const abs = path.resolve(p);
  let u = 'file://' + abs;
  if (process.platform === 'win32') {
    u = 'file:///' + abs.replace(/\\/g, '/');
  }
  return u;
}

test.describe('Mobile UX Fixes', () => {
  
  test('v2: completion celebration modal has close button', async ({ page }) => {
    const htmlPath = path.join(__dirname, '..', 'museum-checkin.html');
    expect(fs.existsSync(htmlPath)).toBe(true);

    const url = fileUrl(htmlPath) + '?museum=pinghu-museum&age=7-12';
    await page.goto(url);

    // Wait for page to load
    await expect(page.locator('#museumName')).toBeVisible();

    // Check that close button exists in the completion celebration modal
    const closeBtn = page.locator('#closeCelebration');
    await expect(closeBtn).toBeAttached();
    
    // Verify it's a close button with × character
    await expect(closeBtn).toHaveText('×');
    
    // Verify it has proper styling class
    await expect(closeBtn).toHaveClass(/celebration-close-button/);
  });

  test('v2: clicking close button hides completion celebration', async ({ page }) => {
    const htmlPath = path.join(__dirname, '..', 'museum-checkin.html');
    const url = fileUrl(htmlPath) + '?museum=pinghu-museum&age=7-12';
    await page.goto(url);

    // Manually trigger completion celebration to show
    await page.evaluate(() => {
      document.getElementById('completionCelebration').classList.add('show');
    });

    const celebration = page.locator('#completionCelebration');
    await expect(celebration).toHaveClass(/show/);

    // Click close button
    await page.locator('#closeCelebration').click();

    // Verify modal is hidden
    await expect(celebration).not.toHaveClass(/show/);
  });

  test('v3: settings modal has X close button', async ({ page }) => {
    const htmlPath = path.join(__dirname, '..', 'single-museum.html');
    expect(fs.existsSync(htmlPath)).toBe(true);

    const url = fileUrl(htmlPath);
    await page.goto(url);

    // Wait for page to load
    await page.waitForSelector('#sgSettingsBtn');

    // Check that X close button exists in settings modal
    const closeXBtn = page.locator('#sgSettingsCloseX');
    await expect(closeXBtn).toBeAttached();
    
    // Verify it's a close button with × character
    await expect(closeXBtn).toHaveText('×');
    
    // Verify it has proper styling class
    await expect(closeXBtn).toHaveClass(/sg-modal-close-x/);
  });

  test('v3: clicking X button closes settings modal', async ({ page }) => {
    const htmlPath = path.join(__dirname, '..', 'single-museum.html');
    const url = fileUrl(htmlPath);
    await page.goto(url);

    await page.waitForSelector('#sgSettingsBtn');

    // Open settings modal
    await page.locator('#sgSettingsBtn').click();

    const modal = page.locator('#sgSettingsModal');
    await expect(modal).toHaveCSS('display', 'flex');

    // Click X close button
    await page.locator('#sgSettingsCloseX').click();

    // Verify modal is hidden
    await expect(modal).toHaveCSS('display', 'none');
  });

  test('v3: no intro overlay shown when closing settings during journey', async ({ page }) => {
    const htmlPath = path.join(__dirname, '..', 'single-museum.html');
    const url = fileUrl(htmlPath) + '?museum=pinghu-museum';
    await page.goto(url);

    await page.waitForSelector('#sgSettingsBtn');

    // Simulate being in the middle of a journey (not on 'select' step)
    await page.evaluate(() => {
      // Select museum and advance to visit step
      const museum = window.MUSEUMS && window.MUSEUMS.find(m => m.id === 'pinghu-museum');
      if (museum) {
        window.state = window.state || {};
        window.state.selectedMuseum = museum;
        window.state.step = 'visit'; // Not on 'select' step anymore
        window.state.startAfterSettings = false;
      }
    });

    // Open settings modal
    await page.locator('#sgSettingsBtn').click();
    const modal = page.locator('#sgSettingsModal');
    await expect(modal).toHaveCSS('display', 'flex');

    // Close settings
    await page.locator('#sgSettingsCloseX').click();
    await expect(modal).toHaveCSS('display', 'none');

    // Verify intro overlay is NOT shown (should remain hidden)
    const introOverlay = page.locator('#sgFullscreenIntro');
    await expect(introOverlay).toHaveCSS('display', 'none');
  });

  test('v3: intro overlay shown when closing settings before journey starts', async ({ page }) => {
    const htmlPath = path.join(__dirname, '..', 'single-museum.html');
    const url = fileUrl(htmlPath) + '?museum=pinghu-museum';
    await page.goto(url);

    await page.waitForSelector('#sgSettingsBtn');

    // Simulate initial state (on 'select' step, startAfterSettings flag set)
    await page.evaluate(() => {
      const museum = window.MUSEUMS && window.MUSEUMS.find(m => m.id === 'pinghu-museum');
      if (museum) {
        window.state = window.state || {};
        window.state.selectedMuseum = museum;
        window.state.step = 'select'; // Still on select step
        window.state.startAfterSettings = true; // Flag is set
      }
    });

    // Open settings modal
    await page.locator('#sgSettingsBtn').click();
    const modal = page.locator('#sgSettingsModal');
    await expect(modal).toHaveCSS('display', 'flex');

    // Close settings
    await page.locator('#sgSettingsCloseX').click();
    await expect(modal).toHaveCSS('display', 'none');

    // Verify intro overlay IS shown (expected behavior when starting journey)
    const introOverlay = page.locator('#sgFullscreenIntro');
    await expect(introOverlay).toHaveCSS('display', 'flex');
  });
});
