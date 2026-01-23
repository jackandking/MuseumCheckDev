import { test, expect } from '@playwright/test';

// Basic single museum flow smoke
// Test museum checkin page loads and shows tasks

test.describe('Single museum flow', () => {
  test('museum checkin page loads and displays tasks', async ({ page }) => {
    await page.goto('/museum-checkin.html?museum=pinghu-museum&age=7-12');

    // Wait for page to load
    await expect(page.locator('#museumName')).toContainText('平湖博物馆');

    // Task grid visible
    const taskGrid = page.locator('#taskGrid');
    await expect(taskGrid).toBeVisible();

    // Wait until at least one task card is rendered
    await page.waitForSelector('.task-card', { timeout: 8000 });

    // Verify we have task cards
    const taskCards = page.locator('.task-card');
    expect(await taskCards.count()).toBeGreaterThan(0);

    // Progress container visible
    await expect(page.locator('.progress-container')).toBeVisible();
  });
});
