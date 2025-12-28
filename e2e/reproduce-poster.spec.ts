import { test, expect } from '@playwright/test';

// Reproduction test: inject sample museumPosters into localStorage
// Requirements: serve repository root at http://localhost:8000 (e.g. `python3 -m http.server 8000`)

test('reproduce poster appears in achievements gallery', async ({ page }) => {
  const sample = {
    "sample-museum-001": {
      dataURL: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUA\nAAAFCAYAAACNbyblAAAAHElEQVQI12P4\n9/wHAAwDAAIYAFiZB9sAAAAASUVORK5CYII=",
      museumId: "sample-museum-001",
      museumName: "示例博物馆",
      ageGroup: "7-12",
      timestamp: Date.now(),
      date: new Date().toLocaleDateString('zh-CN')
    }
  };

  // Inject localStorage before any page script runs
  await page.addInitScript((storage) => {
    try {
      localStorage.setItem('museumPosters', JSON.stringify(storage));
      console.info('[playwright] injected museumPosters');
    } catch (e) {
      console.error('[playwright] failed to inject museumPosters', e);
    }
  }, sample);

  await page.goto('http://localhost:8000/achievements.html');

  // Wait for poster thumbnail to appear
  const thumb = page.locator('.poster-thumbnail');
  await expect(thumb).toHaveCount(1);

  // Verify the image src contains data:image or expected base64 prefix
  const src = await thumb.first().getAttribute('src');
  expect(src).toContain('data:image');

  // Also check our debug logs are present (console contains our loadPosters info)
  // Note: Playwright can capture console events if needed in a separate test run
});
