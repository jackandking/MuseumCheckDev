import { test, expect } from '@playwright/test';

// v3 immersive mobile flow: settings -> intro -> prep -> enroute -> visit (photo/confirm) -> share
// Runs under mobile device projects configured in playwright.config.ts

test.describe('v3 immersive tour (mobile)', () => {
  test('forbidden city flow to share', async ({ page, context, browserName }) => {
    // Start at v3 with museum param to preselect
    await page.goto('/single-museum.html?museum=forbidden-city');

    // Settings should appear first time or when no museum set
    const settings = page.locator('#sgSettingsModal');
    await expect(settings).toBeVisible({ timeout: 5000 });

    // Fill minimal settings: nickname, age, role are prefilled from storage; ensure museum is selected
    const museumPicker = page.locator('#sgMuseumPicker');
    if (await museumPicker.isVisible().catch(() => false)) {
      await museumPicker.selectOption('forbidden-city');
    }

    // Save settings
    const saveBtn = page.locator('#sgSettingsSave');
    await saveBtn.click();
    await expect(settings).toBeHidden();

    // Fullscreen intro overlay shows; tap to start
    const intro = page.locator('#sgFullscreenIntro');
    await expect(intro).toBeVisible({ timeout: 5000 });
    // Tap center area
    await intro.click();

    // Immersive class applied and prep step visible
    await expect(page.locator('#step-prep')).toBeVisible({ timeout: 5000 });

    // Ensure prep button enabled: tick a checkbox if necessary
    const prepDone = page.locator('#sgPrepDone');
    if (await prepDone.isDisabled()) {
      const pack = page.locator('#sgItemPack');
      if (await pack.isVisible().catch(() => false)) {
        await pack.check();
      }
    }
    await prepDone.click();

    // Enroute step; proceed to visit
    await expect(page.locator('#step-enroute')).toBeVisible();
    await page.locator('#sgArrived').click();

    // Visit step visible
    await expect(page.locator('#step-visit')).toBeVisible();

    // In immersive mode, progress and next buttons may be hidden; focus on task advancing
    // Try workflow visit first, fallback to static tasks
    const wfVisit = page.locator('#sgWorkflowVisit');

    if (await wfVisit.isVisible().catch(() => false)) {
      // Photo task: upload a local image from repo to first file input
      const firstInput = wfVisit.locator('input[type="file"]').first();
      if (await firstInput.count() > 0) {
        await firstInput.setInputFiles('assets/images/MuseumCheck_logo.jpg');
      }
      // Confirm task: click "我完成了" if present
      const doneBtn = wfVisit.locator('button:has-text("我完成了")').first();
      if (await doneBtn.count() > 0) {
        await doneBtn.click();
      }
      // Attempt another photo if present (victory)
      const nextInput = wfVisit.locator('input[type="file"]').nth(1);
      if (await nextInput.count() > 0) {
        await nextInput.setInputFiles('assets/images/MuseumCheck_logo.jpg');
      }
    } else {
      // Static fallback: do entrance photo, confirm, victory photo
      const camEntrance = page.locator('#camEntrance');
      if (await camEntrance.count() > 0) {
        await camEntrance.setInputFiles('assets/images/MuseumCheck_logo.jpg');
      }
      const foundJade = page.locator('#foundJade');
      if (await foundJade.count() > 0) {
        await foundJade.click();
      }
      const camVictory = page.locator('#camVictory');
      if (await camVictory.count() > 0) {
        await camVictory.setInputFiles('assets/images/MuseumCheck_logo.jpg');
      }
    }

    // Should reach share step automatically after last task
    await expect(page.locator('#step-share')).toBeVisible({ timeout: 8000 });
  });
});
