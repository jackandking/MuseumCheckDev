import { test, expect, Page } from '@playwright/test';

// Regression guard for the "share achievement poster" (发布到大家的成就) flow.
//
// Context: after the letmetry.cloud -> museumcheck.cn migration, API_ENDPOINTS.IMAGE.UPLOAD
// became a RELATIVE path ("/image/upload"). The upload response handler built the final image
// URL with `new URL(this.config.endpoint)` (no base), which throws
// "Failed to construct 'URL': Invalid URL" — so publishing failed on every attempt.
//
// Run with: npx playwright test e2e/museum-poster-publish.spec.ts --project=chromium

test.setTimeout(120000);

const MUSEUM = 'forbidden-city';

async function completeAllTasks(page: Page) {
  for (let i = 0; i < 12; i++) {
    const next = page.locator('.task-card:not(.completed):not(.poster-card)').first();
    if ((await next.count()) === 0) break;

    await next.click({ timeout: 5000 }).catch(() => {});
    const complete = page.locator('#completeButton');
    if (await complete.isVisible().catch(() => false)) {
      await complete.click().catch(() => {});
    }
    await page.waitForTimeout(350);
    await dismissOverlays(page);
  }
}

async function dismissOverlays(page: Page) {
  // Reward / pet-adoption dialogs can cover the poster card after a task completes.
  for (const label of ['稍后再说', '关闭', '去领养']) {
    const btn = page.getByRole('button', { name: label }).first();
    if (await btn.isVisible().catch(() => false)) {
      await btn.click({ timeout: 3000 }).catch(() => {});
      await page.waitForTimeout(250);
    }
  }
  // The virtual-pet panel overlay can linger on top of the poster card and intercept clicks.
  // (Reported UX friction: it covers the poster/publish area after the final task.)
  await page
    .addStyleTag({ content: '#petPanelOverlay{display:none !important;}' })
    .catch(() => {});
  await page.keyboard.press('Escape').catch(() => {});
}

async function waitForPosterStored(page: Page) {
  await expect
    .poll(
      () =>
        page.evaluate((id) => {
          try {
            const posters = JSON.parse(localStorage.getItem('museumPosters') || '{}');
            return !!(posters[id] && posters[id].dataURL);
          } catch {
            return false;
          }
        }, MUSEUM),
      { timeout: 20000 }
    )
    .toBe(true);
}

test.describe('Achievement poster publish', () => {
  test('resolves relative upload endpoint and publishes the poster to 大家的成就', async ({ page }) => {
    const uploadRequests: string[] = [];
    const insertBodies: any[] = [];

    page.on('dialog', (d) => {
      // Accept alerts, but dismiss the "open 大家的成就?" confirm so it cannot spawn a new tab.
      if (d.type() === 'confirm') return d.dismiss().catch(() => {});
      return d.accept().catch(() => {});
    });

    await page.route('**/image/upload', async (route) => {
      uploadRequests.push(route.request().url());
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          filename: 'e2e-poster.png',
          originalname: 'e2e-poster.png',
          path: 'images/e2e-poster.png',
          size: 1234,
        }),
      });
    });

    await page.route('**/mysql/insert', async (route) => {
      try {
        insertBodies.push(JSON.parse(route.request().postData() || '{}'));
      } catch {
        insertBodies.push({ raw: route.request().postData() });
      }
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, insertId: 424242 }),
      });
    });

    await page.goto(`/museum-checkin.html?museum=${MUSEUM}&age=7-12`);
    await expect(page.locator('#museumName')).toContainText('故宫博物院');

    await completeAllTasks(page);

    const publishBtn = page.locator('#posterCardPublishBtn');
    await expect(publishBtn).toBeVisible({ timeout: 15000 });
    await expect(publishBtn).toContainText('发布');

    await waitForPosterStored(page);
    await dismissOverlays(page);
    await page.keyboard.press('Escape').catch(() => {});

    await publishBtn.click({ timeout: 10000 });

    // The publish must actually reach the backend.
    await expect.poll(() => insertBodies.length, { timeout: 10000 }).toBeGreaterThan(0);

    const record = insertBodies.find((b) => b && b.table === 'achievement_posters') || insertBodies[0];
    const inserted = record && (record.data || record.record || record);
    const imageUrl = inserted && (inserted.image_url || inserted.imageUrl);

    expect(uploadRequests.length).toBeGreaterThan(0);
    // The relative endpoint must resolve against the page origin instead of throwing.
    expect(uploadRequests[0]).toContain('/image/upload');
    expect(imageUrl).toBeTruthy();
    expect(imageUrl).toContain('/images/e2e-poster.png');

    await expect(publishBtn).toContainText('已发布');

    const published = await page.evaluate(() => localStorage.getItem('publishedPosters'));
    expect(published).toBeTruthy();
    expect(published).toContain('424242');
  });

  test('does not report success when the image upload fails', async ({ page }) => {
    const insertBodies: any[] = [];

    page.on('dialog', (d) => {
      // Accept alerts, but dismiss the "open 大家的成就?" confirm so it cannot spawn a new tab.
      if (d.type() === 'confirm') return d.dismiss().catch(() => {});
      return d.accept().catch(() => {});
    });

    await page.route('**/image/upload', async (route) => {
      await route.fulfill({ status: 500, contentType: 'application/json', body: '{"error":"boom"}' });
    });
    await page.route('**/mysql/insert', async (route) => {
      insertBodies.push(JSON.parse(route.request().postData() || '{}'));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, insertId: 1 }),
      });
    });

    await page.goto(`/museum-checkin.html?museum=${MUSEUM}&age=7-12`);
    await expect(page.locator('#museumName')).toContainText('故宫博物院');

    await completeAllTasks(page);

    const publishBtn = page.locator('#posterCardPublishBtn');
    await expect(publishBtn).toBeVisible({ timeout: 15000 });
    await waitForPosterStored(page);
    await dismissOverlays(page);
    await page.keyboard.press('Escape').catch(() => {});

    await publishBtn.click({ timeout: 10000 });
    await page.waitForTimeout(3000);

    // No record may be written, and the card must not claim success.
    expect(insertBodies.length).toBe(0);
    await expect(publishBtn).toContainText('发布');
    await expect(publishBtn).not.toContainText('已发布');

    const published = await page.evaluate(() => localStorage.getItem('publishedPosters'));
    expect(published === null || !published.includes('"recordId"')).toBe(true);
  });
});
