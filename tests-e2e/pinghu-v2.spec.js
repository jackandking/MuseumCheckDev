// @ts-check
const { test, expect } = require('@playwright/test');
const path = require('path');
const fs = require('fs');

// E2E: Verify v2 (museum-checkin.html) renders Pinghu tasks and shows collection image in modal
// Run: npx playwright test tests-e2e/pinghu-v2.spec.js

/**
 * @param {string} p
 * @returns {string}
 */
function fileUrl(p){
  const abs = path.resolve(p);
  let u = 'file://' + abs;
  // Windows path fix
  if (process.platform === 'win32') {
    u = 'file:///' + abs.replace(/\\/g, '/');
  }
  return u;
}

test.describe('v2 Pinghu Museum tasks', () => {
  test('renders tasks and shows collection image in modal', async ({ page }) => {
    const htmlPath = path.join(__dirname, '..', 'museum-checkin.html');
    expect(fs.existsSync(htmlPath)).toBe(true);

    // Open museum-checkin with Pinghu and age preset
    const url = fileUrl(htmlPath) + '?museum=pinghu-museum&age=7-12';
    await page.goto(url);

    // Wait for museum name to appear
    const nameEl = page.locator('#museumName');
    await expect(nameEl).toHaveText(/平湖博物馆/);

    // Wait for task grid rendered
    const grid = page.locator('#taskGrid');
    await expect(grid).toBeVisible();

    // Expect start + collections + end (3 collections currently)
    // Check presence of start and end text
    await expect(page.getByText('门口打卡')).toBeVisible();
    await expect(page.getByText('亲子合影')).toBeVisible();

    // Verify at least one collection task visible
    await expect(page.getByText('镇馆之宝：找到「唐铸铁佛头」并合影')).toBeVisible();

    // Open a collection task modal
    await page.getByText('镇馆之宝：找到「新石器时代良渚文化黑皮陶盉」并合影').first().click();

    // Modal should show image with remote URL (we only assert attribute, not network)
    const modal = page.locator('#taskModal');
    await expect(modal).toHaveClass(/show/);

    const img = page.locator('#modalImage');
    await expect(img).toBeVisible();
    await expect(img).toHaveAttribute('src', /pinghumuseum\.com:9001\/kindeditorupload\/image\//);

    // Close modal
    await page.getByRole('button', { name: '完成任务 🎉' }).click();
    await expect(modal).not.toHaveClass(/show/);
  });
});
