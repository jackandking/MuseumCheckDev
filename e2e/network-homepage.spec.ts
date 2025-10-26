import { test, expect } from '@playwright/test';

// Verifies homepage does at most one remote fetch for fireworks (no polling)
// We allow 0 or 1 because remote may be blocked or cached

test('homepage makes at most one remote fireworks request', async ({ page }) => {
  const target = 'https://rlyhccdr2g.execute-api.us-west-2.amazonaws.com/default/keyValueStore';
  let count = 0;
  page.on('request', req => {
    const url = req.url();
    if (url.startsWith(target) && url.includes('key=museumcheck-firework') && url.includes('sortKey=*')) {
      count++;
    }
  });

  await page.goto('/index.html');
  // Wait some time to allow any one-off fetch to happen
  await page.waitForTimeout(4000);

  // Homepage should not poll; at most one request is acceptable
  expect(count).toBeLessThanOrEqual(1);
});
