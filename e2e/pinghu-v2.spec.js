// @ts-check
const { test, expect } = require('@playwright/test');
const path = require('path');
const fs = require('fs');

// E2E: Verify v2 (museum-checkin.html) renders Pinghu tasks and shows collection image in modal
// Run: npx playwright test e2e/pinghu-v2.spec.js

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
    await page.waitForSelector('.task-card');

    // Expect start + collections + end (3 collections currently)
    await expect(page.getByText('门口打卡')).toBeVisible();
    await expect(page.getByText('亲子合影')).toBeVisible();

    // Check collections length from page data
    const hasCollections = await page.evaluate(() => {
      try {
        const id = new URLSearchParams(window.location.search).get('museum') || '';
        const m = Array.isArray(window.MUSEUMS) ? window.MUSEUMS.find(x => x && x.id === id) : null;
        const colls = m && Array.isArray(m.collections) ? m.collections : [];
        return colls.length > 0;
      } catch(e){ return false; }
    });

    // If collections exist, find a collection task card by scanning innerText
    let collCard;
    if (hasCollections) {
      const cards = page.locator('.task-card');
      const count = await cards.count();
      for (let i = 0; i < count; i++) {
        const txt = await cards.nth(i).innerText();
        if (txt.includes('镇馆之宝') || txt.includes('找到「')) { collCard = cards.nth(i); break; }
      }
      expect(collCard, 'Expected to find a collection task card').toBeTruthy();
      await expect(collCard).toBeVisible();
    }

    // Open a collection task modal by clicking the card containing the subtitle text
    if (hasCollections && collCard) {
      await collCard.click();

      // Modal should show image with remote URL (assert attribute only)
      const modal = page.locator('#taskModal');
      await expect(modal).toHaveClass(/show/);

      const img = page.locator('#modalImage');
      await expect(img).toBeVisible();
      await expect(img).toHaveAttribute('src', /pinghumuseum\.com:9001\/kindeditorupload\/image\//);

      // Close modal
      await page.getByRole('button', { name: '完成任务 🎉' }).click();
      await expect(modal).not.toHaveClass(/show/);
    }
  });
});
