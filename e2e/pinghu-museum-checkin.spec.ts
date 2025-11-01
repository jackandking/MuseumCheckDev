import { test, expect } from '@playwright/test';

/**
 * E2E Test for Pinghu Museum Checkin Page
 * 
 * This test verifies that the checkin page for Pinghu Museum (平湖博物馆)
 * works correctly across all age groups.
 * 
 * Issue: Checkin平湖 - 测试平湖博物馆的checkin页面支持
 * 
 * Note: For comprehensive workflow-based experience, use single-museum.html
 * museum-checkin.html is optimized for quick task-focused check-ins (child-focused)
 */

const BASE_URL = 'http://localhost:8000';
const MUSEUM_ID = 'pinghu-museum';
const MUSEUM_NAME = '平湖博物馆';

test.describe('Pinghu Museum Checkin Page', () => {
  
  test('should not display JavaScript code as text on page', async ({ page }) => {
    await page.goto(`${BASE_URL}/museum-checkin.html?museum=${MUSEUM_ID}`);
    
    // Verify no JavaScript code is visible as text
    const bodyText = await page.locator('body').textContent();
    expect(bodyText).not.toContain('buildParentTasksURL');
    expect(bodyText).not.toContain('addEventListener');
    expect(bodyText).not.toContain('// Build parent tasks URL');
  });
  
  test('should load checkin page for Pinghu Museum with default age group', async ({ page }) => {
    await page.goto(`${BASE_URL}/museum-checkin.html?museum=${MUSEUM_ID}`);
    
    // Verify page title
    await expect(page).toHaveTitle(/任务 - 博物馆打卡/);
    
    // Verify museum name is displayed
    const museumNameElement = page.locator('#museumName');
    await expect(museumNameElement).toHaveText(MUSEUM_NAME);
    
    // Verify task grid is present
    const taskGrid = page.locator('#taskGrid');
    await expect(taskGrid).toBeVisible();
    
    // Verify progress counter is present
    const progressText = page.locator('.progress-text');
    await expect(progressText).toBeVisible();
    await expect(progressText).toContainText('已完成');
  });

  test('should display correct tasks for age group 3-6', async ({ page }) => {
    await page.goto(`${BASE_URL}/museum-checkin.html?museum=${MUSEUM_ID}&age=3-6`);
    
    // Wait for tasks to load
    await page.waitForSelector('.task-card', { timeout: 5000 });
    
    // Verify museum name
    await expect(page.locator('#museumName')).toHaveText(MUSEUM_NAME);
    
    // Count task cards (should be 6 for Pinghu Museum, age 3-6)
    const taskCards = page.locator('.task-card:not(.add-task-card)');
    await expect(taskCards).toHaveCount(6);
    
    // Verify at least one age-appropriate task title is present
    const taskTitles = page.locator('.task-title');
    const titlesText = await taskTitles.allTextContents();
    
    // Age 3-6 tasks should include simple observation tasks
    const hasSimpleTasks = titlesText.some(title => 
      title.includes('找找鱼') || 
      title.includes('小船') || 
      title.includes('稻谷')
    );
    expect(hasSimpleTasks).toBeTruthy();
  });

  test('should display correct tasks for age group 7-12', async ({ page }) => {
    await page.goto(`${BASE_URL}/museum-checkin.html?museum=${MUSEUM_ID}&age=7-12`);
    
    // Wait for tasks to load
    await page.waitForSelector('.task-card', { timeout: 5000 });
    
    // Verify museum name
    await expect(page.locator('#museumName')).toHaveText(MUSEUM_NAME);
    
    // Count task cards
    const taskCards = page.locator('.task-card:not(.add-task-card)');
    await expect(taskCards).toHaveCount(6);
    
    // Verify at least one educational task title is present
    const taskTitles = page.locator('.task-title');
    const titlesText = await taskTitles.allTextContents();
    
    // Age 7-12 tasks should include educational activities
    const hasEducationalTasks = titlesText.some(title => 
      title.includes('水系与城市') || 
      title.includes('航运') || 
      title.includes('匠作')
    );
    expect(hasEducationalTasks).toBeTruthy();
  });

  test('should display correct tasks for age group 13-18', async ({ page }) => {
    await page.goto(`${BASE_URL}/museum-checkin.html?museum=${MUSEUM_ID}&age=13-18`);
    
    // Wait for tasks to load
    await page.waitForSelector('.task-card', { timeout: 5000 });
    
    // Verify museum name
    await expect(page.locator('#museumName')).toHaveText(MUSEUM_NAME);
    
    // Count task cards
    const taskCards = page.locator('.task-card:not(.add-task-card)');
    await expect(taskCards).toHaveCount(6);
    
    // Verify at least one research task title is present
    const taskTitles = page.locator('.task-title');
    const titlesText = await taskTitles.allTextContents();
    
    // Age 13-18 tasks should include research projects
    const hasResearchTasks = titlesText.some(title => 
      title.includes('研究') || 
      title.includes('产业') || 
      title.includes('档案')
    );
    expect(hasResearchTasks).toBeTruthy();
  });

  test('should open task detail modal when clicking a task card', async ({ page }) => {
    await page.goto(`${BASE_URL}/museum-checkin.html?museum=${MUSEUM_ID}&age=7-12`);
    
    // Wait for tasks to load
    await page.waitForSelector('.task-card', { timeout: 5000 });
    
    // Click the first task card
    const firstTaskCard = page.locator('.task-card').first();
    await firstTaskCard.click();
    
    // Verify modal is displayed
    const modal = page.locator('#taskModal');
    await expect(modal).toHaveClass(/show/);
    
    // Verify modal title
    const modalTitle = page.locator('#modalTitle');
    await expect(modalTitle).toHaveText('任务详情');
    
    // Verify complete button is present
    const completeButton = page.locator('#completeButton');
    await expect(completeButton).toBeVisible();
  });

  test('should complete a task and update progress', async ({ page }) => {
    await page.goto(`${BASE_URL}/museum-checkin.html?museum=${MUSEUM_ID}&age=7-12`);
    
    // Wait for tasks to load
    await page.waitForSelector('.task-card', { timeout: 5000 });
    
    // Verify initial progress is 0/6
    let progressText = page.locator('#completedCount');
    await expect(progressText).toHaveText('0');
    
    // Click first task card
    const firstTaskCard = page.locator('.task-card').first();
    await firstTaskCard.click();
    
    // Wait for modal to open
    await page.waitForSelector('#taskModal.show', { timeout: 3000 });
    
    // Click complete button
    const completeButton = page.locator('#completeButton');
    await completeButton.click();
    
    // Wait a bit for animation and state update
    await page.waitForTimeout(1000);
    
    // Verify progress updated to 1/6
    progressText = page.locator('#completedCount');
    await expect(progressText).toHaveText('1');
    
    // Verify the task card now shows as completed
    const completedCards = page.locator('.task-card.completed');
    await expect(completedCards).toHaveCount(1);
  });

  test('should have menu button and settings button', async ({ page }) => {
    await page.goto(`${BASE_URL}/museum-checkin.html?museum=${MUSEUM_ID}`);
    
    // Verify menu button exists
    const menuButton = page.locator('#menuButton');
    await expect(menuButton).toBeVisible();
    
    // Verify settings button exists
    const settingsButton = page.locator('#settingsButton');
    await expect(settingsButton).toBeVisible();
  });

  test('should display progress bar', async ({ page }) => {
    await page.goto(`${BASE_URL}/museum-checkin.html?museum=${MUSEUM_ID}`);
    
    // Wait for tasks to load
    await page.waitForSelector('.task-card', { timeout: 5000 });
    
    // Verify progress bar exists
    const progressBar = page.locator('.progress-bar');
    await expect(progressBar).toBeVisible();
    
    // Verify progress fill starts at 0%
    const progressFill = page.locator('#progressFill');
    const width = await progressFill.evaluate(el => el.style.width);
    expect(width).toBe('0%');
  });
});

test.describe('Pinghu Museum QR Code Verification', () => {
  
  test('should have QR code file in repository', async ({ page }) => {
    // This is a smoke test to verify the QR code file exists
    // In a real scenario, we'd verify the QR code content decodes to the correct URL
    
    const response = await page.request.get(`${BASE_URL}/MuseumCheck_QRCode_PinghuMuseum.png`);
    expect(response.ok()).toBeTruthy();
    expect(response.status()).toBe(200);
    
    // Verify it's a PNG image
    const contentType = response.headers()['content-type'];
    expect(contentType).toContain('image/png');
  });
});
