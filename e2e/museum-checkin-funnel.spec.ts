import { test, expect } from '@playwright/test';
import { trackConsoleErrors } from './helpers/assertions';

// Focused smoke for the charter north-star funnel + leaderboard write fix (A).
// Run with: npx playwright test e2e/museum-checkin-funnel.spec.ts
// (Requires a browser; not executed in CI-less/sandbox envs.)
test.describe('Check-in funnel: 门口打卡 leads at index 0 (charter north-star)', () => {
  test('first task is the 门口打卡 entrance photo and a check-in writes the leaderboard', async ({ page }) => {
    const assertNoConsoleErrors = trackConsoleErrors(page);

    // Capture KV writes so we can assert the leaderboard fix (A) fires on check-in.
    const leaderboardWrites: string[] = [];
    page.on('request', (req) => {
      const url = req.url();
      const body = req.postData() || '';
      if (url.includes('keyValueStore') && body.includes('museumcheck-leaderboard')) {
        leaderboardWrites.push(body);
      }
    });

    await page.goto('/museum-checkin.html?museum=forbidden-city&age=7-12');
    await expect(page.locator('#museumName')).toContainText('故宫博物院');
    await expect(page.locator('#taskGrid')).toBeVisible();

    // 2026-09-12: the low-friction "进门第一步" welcome task was removed, so the museum-entrance
    // photo task (门口打卡) leads the funnel. It is still completable WITHOUT a photo.
    const firstCard = page.locator('.task-card').first();
    await expect(firstCard).toContainText('门口打卡');

    // No photo required, so the first win stays one tap away.
    await firstCard.click();
    await page.locator('#completeButton').click();

    // Leaderboard fix (A): a check-in should now write museumcheck-leaderboard.
    // This also proves the 门口打卡 task is genuinely completable without a photo
    // (markMuseumAsVisited fires on completion and calls updateLeaderboardAfterCheckin).
    await expect(async () => {
      expect(leaderboardWrites.length).toBeGreaterThan(0);
    }).toPass({ timeout: 5000 });

    assertNoConsoleErrors();
  });

  test('remaps v1 saved progress onto the v2 task list (welcome task removed)', async ({ page }) => {
    const assertNoConsoleErrors = trackConsoleErrors(page);

    // v1 layout: [进门第一步(welcome), 门口打卡, 镇馆之宝×3, 合影留念]. A visitor who had only
    // done the welcome task + the entrance photo => v1 indices [0, 1]. The welcome task no longer
    // exists in v2, so v1 index 0 must DROP OUT (not shift into a treasure) and 门口打卡 (v1 idx 1)
    // must become v2 idx 0.
    await page.addInitScript(() => {
      localStorage.clear();
      localStorage.setItem('ageGroup', '7-12');
      localStorage.setItem('museumChecklists', JSON.stringify({
        'forbidden-city-child-7-12': [0, 1],
        '__taskListVersion': 1,
      }));
    });

    await page.goto('/museum-checkin.html?museum=forbidden-city&age=7-12');
    await expect(page.locator('#taskGrid')).toBeVisible();

    // 1 task complete (门口打卡), NOT 2 — the welcome task's completion is intentionally dropped,
    // not shifted into a treasure task. This is exactly what the version-aware remap fixes.
    await expect(page.locator('#completedCount')).toHaveText('1');
    const firstCard = page.locator('.task-card').first();
    await expect(firstCard).toContainText('门口打卡');
    await expect(firstCard).toHaveClass(/completed/);

    assertNoConsoleErrors();
  });
});
