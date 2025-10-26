import { test, expect } from '@playwright/test';

// Verifies fireworks-wall polls the remote API periodically when visible

test('fireworks wall polls remote API periodically', async ({ page }) => {
  const target = 'https://rlyhccdr2g.execute-api.us-west-2.amazonaws.com/default/keyValueStore';
  let count = 0;
  page.on('request', req => {
    const url = req.url();
    if (url.startsWith(target) && url.includes('key=museumcheck-firework') && url.includes('sortKey=*')) {
      count++;
    }
  });

  await page.goto('/fireworks-wall.html');

  // Wait a bit longer than 2 intervals (DOWNLOAD_INTERVAL = 10000ms)
  await page.waitForTimeout(22000);

  // Expect at least 2 requests over ~22 seconds
  expect(count).toBeGreaterThanOrEqual(2);
});
