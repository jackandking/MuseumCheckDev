// @ts-check
const { test, expect } = require('@playwright/test');
const path = require('path');
const fs = require('fs');

// E2E: Verify v2 (museum-checkin.html) renders Forbidden City tasks and shows collection info
// Run: npx playwright test e2e/forbidden-city-v2.spec.js

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

test.describe('v2 Forbidden City Museum tasks', () => {
  test('renders tasks and shows collection treasures', async ({ page }) => {
    const htmlPath = path.join(__dirname, '..', 'museum-checkin.html');
    expect(fs.existsSync(htmlPath)).toBe(true);

    // Open museum-checkin with Forbidden City and age preset
    const url = fileUrl(htmlPath) + '?museum=forbidden-city&age=7-12';
    await page.goto(url);

    // Wait for museum name to appear
    const nameEl = page.locator('#museumName');
    await expect(nameEl).toHaveText(/故宫博物院/);

    // Wait for task grid rendered
    const grid = page.locator('#taskGrid');
    await expect(grid).toBeVisible();

    // Check presence of start and end text
    await expect(page.getByText('门口打卡')).toBeVisible();
    await expect(page.getByText('胜利合影')).toBeVisible();

    // Verify workflow tasks are present for Forbidden City
    // The tasks should include finding treasures or architectural elements
    const hasWorkflowTasks = await page.getByText(/寻找神兽|龙椅观察|三大殿/).count();
    expect(hasWorkflowTasks).toBeGreaterThan(0);
  });

  test('loads independent data file for Forbidden City', async ({ page }) => {
    const htmlPath = path.join(__dirname, '..', 'single-museum.html');
    expect(fs.existsSync(htmlPath)).toBe(true);

    // Open single-museum with Forbidden City
    const url = fileUrl(htmlPath) + '?museum=forbidden-city';
    await page.goto(url);

    // Wait for museum selection to load
    await page.waitForLoadState('networkidle');

    // Check that the independent data file is loaded
    const hasMuseumData = await page.evaluate(() => {
      return window.MUSEUM_FORBIDDEN_CITY !== undefined;
    });
    expect(hasMuseumData).toBe(true);

    // Verify collections data is present
    const hasCollections = await page.evaluate(() => {
      const museum = window.MUSEUM_FORBIDDEN_CITY;
      return museum && Array.isArray(museum.collections) && museum.collections.length > 0;
    });
    expect(hasCollections).toBe(true);

    // Verify workflows data is present
    const hasWorkflows = await page.evaluate(() => {
      const museum = window.MUSEUM_FORBIDDEN_CITY;
      return museum && Array.isArray(museum.workflows) && museum.workflows.length > 0;
    });
    expect(hasWorkflows).toBe(true);

    // Verify the three treasures are present
    const treasuresCount = await page.evaluate(() => {
      const museum = window.MUSEUM_FORBIDDEN_CITY;
      if (!museum || !museum.collections) return 0;
      return museum.collections.length;
    });
    expect(treasuresCount).toBe(3);

    // Verify treasure names
    const treasureNames = await page.evaluate(() => {
      const museum = window.MUSEUM_FORBIDDEN_CITY;
      if (!museum || !museum.collections) return [];
      return museum.collections.map(c => c.name);
    });
    expect(treasureNames).toContain('《清明上河图》');
    expect(treasureNames).toContain('太和殿金漆雕龙宝座');
    expect(treasureNames).toContain('翠玉白菜');
  });
});
