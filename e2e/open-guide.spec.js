// E2E: Open homepage -> click first museum -> open guide -> verify parent/child tasks
// Uses Playwright's baseURL from playwright.config.ts
const { test, expect } = require('@playwright/test');

test.setTimeout(60000);

test('Open guide and see parent/child tasks', async ({ page }) => {
  await page.goto('/index.html', { waitUntil: 'domcontentloaded' });
  // Wait for at least one museum card to render
  await page.waitForSelector('#museumGrid .museum-card', { timeout: 20000 });

  // Ensure full dataset and choose a museum that actually has checklist items
  await page.evaluate(async () => {
    const app = window.museumCheck || window.app || window.MuseumCheckAppInstance || null;
    if (app && typeof app.ensureFullMuseumsData === 'function') {
      try { await app.ensureFullMuseumsData(); } catch (e) {}
    }
    const list = (window.MUSEUMS || []);
    const hasTasks = (arr) => Array.isArray(arr) && arr.length > 0;
    const pick = list.find(m => m && m.checklists && m.checklists.parent && m.checklists.child &&
      (hasTasks(m.checklists.parent['7-12']) || hasTasks(m.checklists.parent['3-6']) || hasTasks(m.checklists.parent['13-18']) ||
       hasTasks(m.checklists.child['7-12']) || hasTasks(m.checklists.child['3-6']) || hasTasks(m.checklists.child['13-18'])));
    if (app && pick && typeof app.openMuseumModal === 'function') {
      app.openMuseumModal(pick);
    } else {
      // Fallback: click first card to trigger modal
      const card = document.querySelector('#museumGrid .museum-card .museum-info');
      if (card) (card).dispatchEvent(new MouseEvent('click', { bubbles: true }));
    }
  });

  // Wait for modal to be shown (not have 'hidden' class)
  await page.waitForSelector('#museumModal:not(.hidden)', { timeout: 20000 });

  // Ensure parent tab is active then wait for items
  const parentTab = page.locator('.tab-button[data-target="parent"]');
  if (await parentTab.count()) {
    await parentTab.first().click();
  }
  await page.waitForTimeout(200); // allow re-render after tab switch

  // Wait for Option B lazy-load to populate any checklist items
  await page.waitForFunction(() => {
    const p = document.querySelectorAll('#parentChecklist .checklist-item .checklist-label').length;
    const c = document.querySelectorAll('#childChecklist .checklist-item .checklist-label').length;
    return p > 0 || c > 0;
  }, null, { timeout: 30000 });

  // If parent still empty, try child tab
  let parentCount = await page.locator('#parentChecklist .checklist-item .checklist-label').count();
  let childCount = await page.locator('#childChecklist .checklist-item .checklist-label').count();
  if (parentCount === 0 && childCount === 0) {
    const childTab = page.locator('.tab-button[data-target="child"]');
    if (await childTab.count()) {
      await childTab.first().click();
      await page.waitForTimeout(200);
      parentCount = await page.locator('#parentChecklist .checklist-item .checklist-label').count();
      childCount = await page.locator('#childChecklist .checklist-item .checklist-label').count();
    }
  }

  expect(Math.max(parentCount, childCount)).toBeGreaterThan(0);
  console.log(`Parent tasks: ${parentCount}, Child tasks: ${childCount}`);
});
