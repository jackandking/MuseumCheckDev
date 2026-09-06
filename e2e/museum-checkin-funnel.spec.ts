import { test, expect } from '@playwright/test';
import { trackConsoleErrors } from './helpers/assertions';

// Focused smoke for the charter north-star funnel fix + leaderboard write fix (A).
// Run with: npx playwright test e2e/museum-checkin-funnel.spec.ts
// (Requires a browser; not executed in CI-less/sandbox envs.)
test.describe('Check-in funnel: welcome task at index 0 (charter north-star)', () => {
  test('first task is the low-friction welcome task and a check-in writes the leaderboard', async ({ page }) => {
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

    // Charter fix: index 0 must be the one-tap welcome task, NOT the photo-dependent 门口打卡.
    const firstCard = page.locator('.task-card').first();
    await expect(firstCard).toContainText('进门第一步');

    // One-tap completion of the welcome task.
    await firstCard.click();
    await page.locator('#completeButton').click();

    // Leaderboard fix (A): a check-in should now write museumcheck-leaderboard.
    // This also proves the welcome task is genuinely completable (markMuseumAsVisited
    // fires on completion and calls updateLeaderboardAfterCheckin).
    await expect(async () => {
      expect(leaderboardWrites.length).toBeGreaterThan(0);
    }).toPass({ timeout: 5000 });

    assertNoConsoleErrors();
  });
});
