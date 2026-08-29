import { test, expect } from '@playwright/test';
import { trackConsoleErrors } from './helpers/assertions';

test.describe('Debug status page', () => {
  test('loads safe diagnostics without calling legacy hosts', async ({ page }) => {
    const assertNoConsoleErrors = trackConsoleErrors(page);
    const letmetryRequests: string[] = [];

    page.on('request', request => {
      if (request.url().includes('letmetry.cloud')) {
        letmetryRequests.push(request.url());
      }
    });

    await page.goto('/debug/status/');

    await expect(page.locator('h1')).toContainText('部署与连通性状态');
    await expect(page.locator('#environmentValue')).not.toHaveText('-');
    await expect(page.locator('#baseUrlValue')).toContainText('localhost:3000');
    await expect(page.locator('#apiHealthResult')).toHaveText('未检查');
    await expect(page.locator('[data-check-name="legacy-image-rewrite"] .check-state')).toContainText('OK');
    await expect(page.locator('[data-check-name="api-hosts"] .check-state')).toContainText('OK');
    await expect(page.locator('[data-check-name="runtime-resources"] .check-state')).toContainText('OK');
    await expect(page.locator('#summaryOutput')).toHaveValue(/MuseumCheck debug status/);
    await expect(page.locator('#summaryOutput')).toHaveValue(/Commit:/);

    expect(letmetryRequests).toEqual([]);
    assertNoConsoleErrors();
  });
});
