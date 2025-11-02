// @ts-check
const { test, expect } = require('@playwright/test');

// E2E: Verify workflow skips settings when all required settings exist
// Run: npx playwright test tests-e2e/workflow-skip-settings.spec.js

test.describe('Workflow settings optimization', () => {
  test('skips settings page when all required settings exist', async ({ page, context }) => {
    // Setup: Pre-configure all required settings in localStorage
    await page.goto('/single-museum.html');
    
    await page.evaluate(() => {
      localStorage.setItem('childNickname', '小明');
      localStorage.setItem('ageGroup', '7-12');
      localStorage.setItem('caregiverRole', 'parent');
      localStorage.setItem('settingsSeen', '1');
    });

    // Navigate with museum parameter
    await page.goto('/single-museum.html?museum=pinghu-museum');

    // Settings modal should NOT appear - intro overlay should appear instead
    const settingsModal = page.locator('#sgSettingsModal');
    const introOverlay = page.locator('#sgFullscreenIntro');
    
    // Wait for page to initialize and check modal state
    await page.waitForLoadState('networkidle');
    
    // Settings modal should be hidden
    const settingsVisible = await settingsModal.isVisible().catch(() => false);
    expect(settingsVisible).toBe(false);
    
    // Intro overlay should be visible
    await expect(introOverlay).toBeVisible({ timeout: 3000 });
    
    // Verify intro shows personalized content
    const headline = page.locator('#introHeadline');
    await expect(headline).toContainText('小明');
    await expect(headline).toContainText('平湖博物馆');
  });

  test('shows settings page when nickname is missing', async ({ page }) => {
    // Setup: Only set age and role, no nickname
    await page.goto('/single-museum.html');
    
    await page.evaluate(() => {
      localStorage.removeItem('childNickname');
      localStorage.setItem('ageGroup', '7-12');
      localStorage.setItem('caregiverRole', 'parent');
    });

    // Navigate with museum parameter
    await page.goto('/single-museum.html?museum=pinghu-museum');

    // Settings modal SHOULD appear
    const settingsModal = page.locator('#sgSettingsModal');
    await expect(settingsModal).toBeVisible({ timeout: 3000 });
  });

  test('shows settings page when age is missing', async ({ page }) => {
    // Setup: Only set nickname and role, no age
    await page.goto('/single-museum.html');
    
    await page.evaluate(() => {
      localStorage.setItem('childNickname', '小红');
      localStorage.removeItem('ageGroup');
      localStorage.setItem('caregiverRole', 'parent');
    });

    // Navigate with museum parameter
    await page.goto('/single-museum.html?museum=pinghu-museum');

    // Settings modal SHOULD appear
    const settingsModal = page.locator('#sgSettingsModal');
    await expect(settingsModal).toBeVisible({ timeout: 3000 });
  });

  test('shows settings page when caregiver role is missing', async ({ page }) => {
    // Setup: Only set nickname and age, no role
    await page.goto('/single-museum.html');
    
    await page.evaluate(() => {
      localStorage.setItem('childNickname', '小明');
      localStorage.setItem('ageGroup', '7-12');
      localStorage.removeItem('caregiverRole');
    });

    // Navigate with museum parameter
    await page.goto('/single-museum.html?museum=pinghu-museum');

    // Settings modal SHOULD appear
    const settingsModal = page.locator('#sgSettingsModal');
    await expect(settingsModal).toBeVisible({ timeout: 3000 });
  });

  test('shows settings page for new user with no settings', async ({ page }) => {
    // Setup: Clear all settings
    await page.goto('/single-museum.html');
    
    await page.evaluate(() => {
      localStorage.clear();
    });

    // Navigate with museum parameter
    await page.goto('/single-museum.html?museum=pinghu-museum');

    // Settings modal SHOULD appear
    const settingsModal = page.locator('#sgSettingsModal');
    await expect(settingsModal).toBeVisible({ timeout: 3000 });
  });
});
