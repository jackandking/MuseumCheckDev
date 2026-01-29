import { test, expect } from '@playwright/test';
import { trackConsoleErrors } from './helpers/assertions';

test.describe('Museum check-in settings flow', () => {
  test('allows configuring settings and completing a task without errors', async ({ page }) => {
    const assertNoConsoleErrors = trackConsoleErrors(page);

    await page.addInitScript(() => {
      localStorage.clear();
      localStorage.setItem('childNickname', '测试宝贝');
      localStorage.setItem('ageGroup', '7-12');
      localStorage.setItem('childModeEnabled', 'false');
      localStorage.setItem('nicknameHasBeenSet', 'true');
    });

    await page.goto('/museum-checkin.html?museum=forbidden-city&age=7-12');
    await expect(page.locator('#museumName')).toContainText('故宫博物院');

    // Ensure onboarding modal or other overlays don't block clicks
    await page.evaluate(() => {
      const onboarding = document.getElementById('nicknameOnboardingModal');
      if (onboarding) {
        onboarding.style.display = 'none';
        onboarding.remove();
      }
      const settingsButtonEl = document.getElementById('settingsButton');
      if (settingsButtonEl) {
        settingsButtonEl.style.display = 'flex';
      }
    });

    await page.waitForFunction(() => {
      const btn = document.getElementById('settingsButton');
      return !!(btn && typeof btn.onclick === 'function');
    });

    const settingsButton = page.locator('#settingsButton');
    await expect(settingsButton).toBeVisible();
    await settingsButton.click();

    const settingsModal = page.locator('#settingsModal');
    const modalClassAfterClick = await settingsModal.evaluate((el) => el.className);
    console.log('Settings modal class after click:', modalClassAfterClick);
    await expect(settingsModal).toHaveClass(/show/, { timeout: 10000 });

    await page.waitForSelector('#v2TreasureCheckboxList .treasure-checkbox-item', { timeout: 8000 });
    const treasureCheckboxes = page.locator('#v2TreasureCheckboxList input[type="checkbox"]');
    const checkboxCount = await treasureCheckboxes.count();
    expect(checkboxCount).toBeGreaterThan(0);

    const selectedCount = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('#v2TreasureCheckboxList input[type="checkbox"]'))
        .filter((el) => (el as HTMLInputElement).checked).length;
    });
    expect(selectedCount).toBeGreaterThanOrEqual(3);

    if (selectedCount > 3) {
      await treasureCheckboxes.first().click();
      await page.waitForTimeout(200);
      await treasureCheckboxes.first().click();
    }

    const puzzleToggle = page.locator('#puzzleGameToggle');
    if (await puzzleToggle.isVisible()) {
      const isChecked = await puzzleToggle.isChecked();
      await puzzleToggle.setChecked(!isChecked);
      await page.waitForTimeout(200);
      await puzzleToggle.setChecked(isChecked);
    }

    await page.locator('#closeSettings').click();
    await expect(settingsModal).not.toHaveClass(/show/);

    const firstTask = page.locator('.task-card').first();
    await firstTask.scrollIntoViewIfNeeded();
    await expect(firstTask).toBeVisible();
    await firstTask.click();

    const taskModal = page.locator('#taskModal');
    await expect(taskModal).toHaveClass(/show/);

    const completeButton = page.locator('#completeButton');
    await expect(completeButton).toBeVisible();
    await completeButton.click();

    await expect(taskModal).not.toHaveClass(/show/);

    await expect(page.locator('#completedCount')).toHaveText(/1/);

    assertNoConsoleErrors();
  });
});
