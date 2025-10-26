import { test, expect } from '@playwright/test';

test.describe('Homepage smoke', () => {
  test('loads and renders museum grid', async ({ page }) => {
    await page.goto('/index.html');
    await expect(page).toHaveTitle(/博物馆|MuseumCheck/);

    // Grid visible
    const grid = page.locator('#museumGrid');
    await expect(grid).toBeVisible();

    // Wait until at least one card is rendered into grid
    await page.waitForFunction(() => {
      const el = document.getElementById('museumGrid');
      return !!el && el.children && el.children.length > 0;
    }, null, { timeout: 8000 });

    // Minimal assertion: grid has at least one child rendered
    const childCount = await page.evaluate(() => {
      const el = document.getElementById('museumGrid');
      return el && el.children ? el.children.length : 0;
    });
    expect(childCount).toBeGreaterThan(0);
  });
});
