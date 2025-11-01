// @ts-check
const { test, expect } = require('@playwright/test');
const path = require('path');

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

test.describe('Workflow Display UX', () => {
  test('Pinghu Museum shows single workflow card', async ({ page }) => {
    const htmlPath = path.join(__dirname, '..', 'single-museum.html');
    const url = fileUrl(htmlPath) + '?museum=pinghu-museum';
    await page.goto(url);

    // Wait for workflow display to be ready
    await page.waitForSelector('#sgWorkflowDisplayWrap', { state: 'visible' });

    // Workflow display should be visible
    const workflowDisplay = page.locator('#sgWorkflowDisplayWrap');
    await expect(workflowDisplay).toBeVisible();

    // Workflow card should be visible (single workflow mode)
    const workflowCard = page.locator('#sgWorkflowCard');
    await expect(workflowCard).toBeVisible();

    // Check workflow name is displayed
    const workflowName = page.locator('#sgWorkflowCardName');
    await expect(workflowName).toHaveText('镇馆之宝探索');

    // Check workflow description is displayed
    const workflowDesc = page.locator('#sgWorkflowCardDesc');
    await expect(workflowDesc).toContainText('围绕平湖博物馆三大镇馆之宝');

    // Check task count is displayed
    const workflowTasks = page.locator('#sgWorkflowCardTasks');
    await expect(workflowTasks).toContainText('5 个任务');

    // Picker section should NOT be visible (single workflow)
    const pickerSection = page.locator('#sgWorkflowPickerSection');
    await expect(pickerSection).not.toBeVisible();
  });

  test('Forbidden City shows workflow picker for multiple workflows', async ({ page }) => {
    const htmlPath = path.join(__dirname, '..', 'single-museum.html');
    const url = fileUrl(htmlPath) + '?museum=forbidden-city';
    await page.goto(url);

    // Wait for workflow display to be ready
    await page.waitForSelector('#sgWorkflowDisplayWrap', { state: 'visible' });

    // Workflow display should be visible
    const workflowDisplay = page.locator('#sgWorkflowDisplayWrap');
    await expect(workflowDisplay).toBeVisible();

    // Workflow card should NOT be visible (multiple workflows)
    const workflowCard = page.locator('#sgWorkflowCard');
    await expect(workflowCard).not.toBeVisible();

    // Picker section SHOULD be visible
    const pickerSection = page.locator('#sgWorkflowPickerSection');
    await expect(pickerSection).toBeVisible();

    // Picker dropdown should have options
    const picker = page.locator('#sgWorkflowPicker');
    await expect(picker).toBeVisible();
    
    // Should have at least 2 workflow options plus the placeholder
    const options = await picker.locator('option').count();
    expect(options).toBeGreaterThanOrEqual(3); // 1 placeholder + 2 workflows

    // Select a workflow and check description appears
    await picker.selectOption({ index: 1 }); // Select first workflow
    
    const pickerDesc = page.locator('#sgWorkflowPickerDesc');
    await expect(pickerDesc).toBeVisible();
    await expect(pickerDesc).toContainText('个任务');
  });
});
