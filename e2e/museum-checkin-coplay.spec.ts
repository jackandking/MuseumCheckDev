import { test, expect } from '@playwright/test';
import { trackConsoleErrors } from './helpers/assertions';

// Real-browser smoke for the co-play MVP (charter C: Together as primary growth vector).
// Uses a real event that has KV joins (shanghai-museum-aug22 -> 2 joins), so the panel
// must surface the real explorer count fetched from museumcheck-together-events.
// Run with: npx playwright test e2e/museum-checkin-coplay.spec.ts
test.describe('Check-in co-play panel (Together growth vector, C)', () => {
  test('shows 同游小队 panel with real join count and refreshes progress on task complete', async ({ page }) => {
    const assertNoConsoleErrors = trackConsoleErrors(page);

    await page.goto('/museum-checkin.html?museum=forbidden-city&age=7-12&together=shanghai-museum-aug22');
    await expect(page.locator('#museumName')).toContainText('故宫博物院');
    await expect(page.locator('#taskGrid')).toBeVisible();

    // Co-play panel must become visible, using the real KV join count (proves the
    // museumcheck-together-events fetch + explorerCount wiring works end to end).
    const panel = page.locator('#togetherSharedGoal');
    await expect(panel).toBeVisible();
    await expect(panel).toContainText('同游小队');
    // Only present once loadTogetherEventMeta resolved explorerCount > 0.
    await expect(panel).toContainText('位小伙伴一起探险');

    // The first task is the low-friction welcome task; completing it must keep the
    // panel alive and advance the child's own progress bar.
    const firstCard = page.locator('.task-card').first();
    await expect(firstCard).toContainText('进门第一步');
    await firstCard.click();
    await page.locator('#completeButton').click();
    await expect(panel).toContainText('你的进度 1/');

    assertNoConsoleErrors();
  });
});
