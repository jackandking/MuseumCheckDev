// @ts-check
const { test, expect } = require('@playwright/test');
const path = require('path');
const fs = require('fs');

// E2E: Verify v2 poster generation works correctly with and without photos
// Tests for issue: "平湖博物馆手机体验 - bug：v2的海报是空白的"
// Run: npx playwright test tests-e2e/poster-blank-fix.spec.js

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

test.describe('v2 Poster Generation Fix', () => {
  test('generates non-blank poster without photos', async ({ page }) => {
    const htmlPath = path.join(__dirname, '..', 'museum-checkin.html');
    expect(fs.existsSync(htmlPath)).toBe(true);

    // Open museum-checkin with Pinghu and age preset
    const url = fileUrl(htmlPath) + '?museum=pinghu-museum&age=7-12';
    await page.goto(url);

    // Wait for page to load
    await expect(page.locator('#museumName')).toContainText('平湖博物馆');

    // Simulate completing all tasks
    await page.evaluate(() => {
      // Mark all tasks as complete
      for (let i = 0; i < childTasks.length; i++) {
        completedTasks.add(i);
      }
      saveCompletedTasks();
      renderTasks();
      updateProgress();
    });

    // Wait for tasks to be rendered as complete
    await page.waitForTimeout(500);

    // Click poster card to open modal
    await page.getByText('成就海报').first().click();

    // Wait for poster generation
    await page.waitForTimeout(2000);

    // Verify poster modal is visible
    const modal = page.locator('#completionCelebration');
    await expect(modal).toHaveClass(/show/);

    // Verify poster preview contains an image
    const posterPreview = page.locator('#posterPreview');
    await expect(posterPreview).toBeVisible();
    
    const posterImg = posterPreview.locator('img');
    await expect(posterImg).toBeVisible();

    // Verify the poster image has content (not blank)
    const src = await posterImg.getAttribute('src');
    expect(src).toBeTruthy();
    expect(src).toContain('data:image/png;base64');
    
    // The base64 string should be substantial (not just empty canvas)
    // A blank canvas would be very short, a proper poster should be >10KB
    expect(src.length).toBeGreaterThan(10000);
  });

  test('generates non-blank poster with photos', async ({ page }) => {
    const htmlPath = path.join(__dirname, '..', 'museum-checkin.html');
    expect(fs.existsSync(htmlPath)).toBe(true);

    const url = fileUrl(htmlPath) + '?museum=pinghu-museum&age=7-12';
    await page.goto(url);

    await expect(page.locator('#museumName')).toContainText('平湖博物馆');

    // Simulate completing all tasks and adding photos
    await page.evaluate(() => {
      // Mark all tasks as complete
      for (let i = 0; i < childTasks.length; i++) {
        completedTasks.add(i);
      }
      saveCompletedTasks();

      // Add test photos (small test image)
      const testPhoto = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAFUlEQVR42mP8z8BQz0AEYBxVSF+FABJADveWkH6oAAAAAElFTkSuQmCC';
      taskPhotos[0] = testPhoto;
      taskPhotos[2] = testPhoto;
      savePhotos();

      renderTasks();
      updateProgress();
    });

    await page.waitForTimeout(500);

    // Click poster card
    await page.getByText('成就海报').first().click();

    // Wait for poster generation with photos
    await page.waitForTimeout(2500);

    // Verify poster modal
    const modal = page.locator('#completionCelebration');
    await expect(modal).toHaveClass(/show/);

    const posterPreview = page.locator('#posterPreview');
    await expect(posterPreview).toBeVisible();
    
    const posterImg = posterPreview.locator('img');
    await expect(posterImg).toBeVisible();

    const src = await posterImg.getAttribute('src');
    expect(src).toBeTruthy();
    expect(src).toContain('data:image/png;base64');
    
    // With photos, poster should be even larger
    expect(src.length).toBeGreaterThan(15000);
  });

  test('generates poster on mobile viewport', async ({ page }) => {
    // Set mobile viewport (iPhone 8)
    await page.setViewportSize({ width: 375, height: 667 });

    const htmlPath = path.join(__dirname, '..', 'museum-checkin.html');
    const url = fileUrl(htmlPath) + '?museum=pinghu-museum&age=7-12';
    await page.goto(url);

    await expect(page.locator('#museumName')).toContainText('平湖博物馆');

    await page.evaluate(() => {
      for (let i = 0; i < childTasks.length; i++) {
        completedTasks.add(i);
      }
      saveCompletedTasks();
      renderTasks();
      updateProgress();
    });

    await page.waitForTimeout(500);

    await page.getByText('成就海报').first().click();
    await page.waitForTimeout(2000);

    const modal = page.locator('#completionCelebration');
    await expect(modal).toHaveClass(/show/);

    const posterPreview = page.locator('#posterPreview');
    const posterImg = posterPreview.locator('img');
    await expect(posterImg).toBeVisible();

    const src = await posterImg.getAttribute('src');
    expect(src).toBeTruthy();
    expect(src.length).toBeGreaterThan(10000);
  });
});
