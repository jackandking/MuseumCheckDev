import { test, expect } from '@playwright/test';

// Basic single museum flow smoke
// Select first museum, go enroute -> visit, verify progress updates

test.describe('Single museum flow', () => {
  test('select museum and progress through visit steps', async ({ page }) => {
    await page.goto('/single-museum.html');

    // Select section visible
    await expect(page.locator('#step-select')).toBeVisible();

    // If first-time settings modal shows, close it
    const modal = page.locator('#sgSettingsModal');
    if (await modal.isVisible({ timeout: 1000 }).catch(() => false)) {
      const save = page.locator('#sgSettingsSave');
      if (await save.isVisible().catch(() => false)) {
        await save.click();
      } else {
        // click backdrop to close
        await modal.click();
      }
      await expect(modal).toBeHidden({ timeout: 5000 });
    }

    // Click first museum card (sg-card) or list item
    const card = page.locator('.sg-card').first();
    if (await card.count() > 0) {
      await card.click();
    } else {
      // fallback: any museum list button
      const any = page.locator('#sgMuseumList button, #sgMuseumList .sg-card');
      await any.first().click();
    }

    // Either go to prep or directly enroute; continue to enroute
    const goReserve = page.locator('#sgGoReserve');
    if (await page.locator('#step-prep').isVisible()) {
      await page.locator('#sgPrepDone').click();
    }
    await expect(page.locator('#step-enroute')).toBeVisible();

    // Arrive to visit
    await page.locator('#sgArrived').click();
    await expect(page.locator('#step-visit')).toBeVisible();

    // Progress visible
    const progress = page.locator('#sgVisitProgress');
    await expect(progress).toBeVisible();

    // Next step twice then share
    const next = page.locator('#sgVisitNext');
    await next.click();
    await expect(progress).toBeVisible();

    await next.click();
    // third click may go to share depending on workflow length
    await next.click();

    // Either at share or still visit
    const onShare = await page.locator('#step-share').isVisible();
    expect(onShare || (await page.locator('#step-visit').isVisible())).toBeTruthy();
  });
});
