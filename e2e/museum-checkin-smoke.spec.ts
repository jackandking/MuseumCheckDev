import { test, expect } from '@playwright/test';
import { trackConsoleErrors } from './helpers/assertions';

test.describe('Museum check-in page smoke test', () => {
  test('museum check-in page loads without console errors', async ({ page }) => {
    // Track console errors throughout the test
    const assertNoConsoleErrors = trackConsoleErrors(page);

    // Navigate to museum check-in page with default parameters
    await page.goto('/museum-checkin.html?museum=forbidden-city&age=7-12');

    // Wait for page to load and render
    await expect(page.locator('#museumName')).toContainText('故宫博物院');

    // Wait a bit for any JavaScript errors to surface
    await page.waitForTimeout(2000);

    // Assert no console errors occurred
    assertNoConsoleErrors();

    // Verify essential elements are present
    await expect(page.locator('#taskGrid')).toBeVisible();
    await expect(page.locator('.progress-container')).toBeVisible();

    // Final check for errors after interactions
    await page.waitForTimeout(1000);
    assertNoConsoleErrors();
  });
});
