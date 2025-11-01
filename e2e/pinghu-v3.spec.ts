import { test, expect } from '@playwright/test';

// E2E: Verify v3 (single-museum.html) supports Pinghu museum with collection tasks
// Run: npx playwright test e2e/pinghu-v3.spec.ts

test.describe('v3 Pinghu Museum support', () => {
  test('pinghu-museum is available in v3 and shows collection tasks', async ({ page }) => {
    // Navigate to v3 with pinghu-museum parameter
    await page.goto('/single-museum.html?museum=pinghu-museum');

    // Settings modal should appear for first-time users
    const settingsModal = page.locator('#sgSettingsModal');
    const isSettingsVisible = await settingsModal.isVisible({ timeout: 3000 }).catch(() => false);
    
    if (isSettingsVisible) {
      // Verify pinghu-museum is available in the museum picker
      const museumPicker = page.locator('#sgMuseumPicker');
      await expect(museumPicker).toBeVisible();
      
      // Check that pinghu-museum is an option
      const pinghuOption = museumPicker.locator('option[value="pinghu-museum"]');
      await expect(pinghuOption).toHaveCount(1);
      
      // Select pinghu-museum if not already selected
      await museumPicker.selectOption('pinghu-museum');
      
      // Save settings
      const saveBtn = page.locator('#sgSettingsSave');
      await saveBtn.click();
      await expect(settingsModal).toBeHidden({ timeout: 3000 });
    }

    // Verify museum is loaded by checking for museum name or skip intro
    const intro = page.locator('#sgFullscreenIntro');
    if (await intro.isVisible({ timeout: 2000 }).catch(() => false)) {
      await intro.click();
    }

    // Navigate through prep step if present
    if (await page.locator('#step-prep').isVisible({ timeout: 2000 }).catch(() => false)) {
      const prepDone = page.locator('#sgPrepDone');
      if (await prepDone.isDisabled()) {
        // Check first checkbox to enable button
        const firstCheckbox = page.locator('#step-prep input[type="checkbox"]').first();
        if (await firstCheckbox.count() > 0) {
          await firstCheckbox.check();
        }
      }
      await prepDone.click();
    }

    // Navigate to visit step
    if (await page.locator('#step-enroute').isVisible({ timeout: 2000 }).catch(() => false)) {
      await page.locator('#sgArrived').click();
    }

    // Verify visit step is visible
    await expect(page.locator('#step-visit')).toBeVisible({ timeout: 5000 });

    // Verify that collection tasks are present
    // Pinghu has 3 collections, so we should see tasks for them
    const visitSection = page.locator('#step-visit');
    
    // Check for collection-related content in the visit section
    const hasCollectionTasks = await visitSection.evaluate((el) => {
      const text = el.textContent || '';
      // Check for any of the collection names or the word "镇馆之宝"
      return text.includes('唐铸铁佛头') || 
             text.includes('新石器时代崧泽文化夹砂红陶鼎') ||
             text.includes('新石器时代良渚文化黑皮陶盉') ||
             text.includes('镇馆之宝');
    });
    
    expect(hasCollectionTasks).toBeTruthy();
  });
});
