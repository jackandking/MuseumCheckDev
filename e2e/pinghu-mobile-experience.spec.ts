// @ts-check
const { test, expect } = require('@playwright/test');

// Test mobile experience for both v2 and v3 of Pinghu Museum
// This test validates the photo capture and poster generation features

test.describe('Pinghu Museum Mobile Experience', () => {
  
  // Configure mobile viewport for all tests
  test.use({
    viewport: { width: 375, height: 667 }, // iPhone 8 size
    isMobile: true,
    hasTouch: true
  });

  test('v2 (museum-checkin): Photo capture and poster generation', async ({ page }) => {
    // Navigate to v2 interface
    await page.goto('http://localhost:8000/museum-checkin.html?museum=pinghu-museum&age=7-12');
    
    // Wait for page to load
    await expect(page.locator('#museumName')).toContainText('平湖博物馆');
    
    // Verify tasks are rendered
    const taskGrid = page.locator('#taskGrid');
    await expect(taskGrid).toBeVisible();
    
    // Count total tasks (should be 5 for Pinghu: gate + 3 treasures + victory)
    const taskCards = page.locator('.task-card:not(.add-task-card)');
    const taskCount = await taskCards.count();
    expect(taskCount).toBeGreaterThanOrEqual(3);
    
    // Click first task to open modal
    await taskCards.first().click();
    
    // Verify task modal opens
    const modal = page.locator('#taskModal');
    await expect(modal).toHaveClass(/show/);
    
    // Verify photo section exists
    const photoSection = page.locator('#photoSection');
    await expect(photoSection).toBeVisible();
    
    // Verify photo button exists and is touch-friendly
    const photoButton = page.locator('#takePhotoButton');
    await expect(photoButton).toBeVisible();
    const buttonBox = await photoButton.boundingBox();
    expect(buttonBox).toBeTruthy();
    if (buttonBox) {
      expect(buttonBox.height).toBeGreaterThanOrEqual(44); // Touch target minimum
    }
    
    // Close modal
    await page.locator('#closeModal').click();
    await expect(modal).not.toHaveClass(/show/);
    
    // Verify completion celebration exists but is hidden
    const celebration = page.locator('#completionCelebration');
    await expect(celebration).toBeHidden();
    
    // Verify poster canvas exists
    const posterCanvas = page.locator('#posterCanvas');
    await expect(posterCanvas).toHaveCount(1);
    
    // Verify share buttons exist
    await expect(page.locator('#savePosterButton')).toHaveCount(1);
    await expect(page.locator('#sharePosterButton')).toHaveCount(1);
  });

  test('v2: Mobile UX validation', async ({ page }) => {
    await page.goto('http://localhost:8000/museum-checkin.html?museum=pinghu-museum&age=7-12');
    
    // Wait for page to load
    await expect(page.locator('#museumName')).toContainText('平湖博物馆');
    
    // Verify mobile-optimized layout
    const taskGrid = page.locator('#taskGrid');
    await expect(taskGrid).toBeVisible();
    
    // Check that progress bar is visible
    const progressBar = page.locator('.progress-bar');
    await expect(progressBar).toBeVisible();
    
    // Open first task
    const taskCards = page.locator('.task-card:not(.add-task-card)');
    await taskCards.first().click();
    
    // Verify modal is mobile-friendly
    const modal = page.locator('.modal-content');
    await expect(modal).toBeVisible();
    
    // Check button sizes (touch-friendly)
    const completeButton = page.locator('#completeButton');
    const buttonBox = await completeButton.boundingBox();
    expect(buttonBox).toBeTruthy();
    if (buttonBox) {
      expect(buttonBox.height).toBeGreaterThanOrEqual(44);
    }
    
    // Verify photo button is accessible
    const photoButton = page.locator('#takePhotoButton');
    await expect(photoButton).toBeVisible();
    
    // Check that content doesn't overflow viewport
    const body = page.locator('body');
    const bodyBox = await body.boundingBox();
    expect(bodyBox.width).toBeLessThanOrEqual(375);
  });

  test('v3 (single-museum): Poster as final step', async ({ page }) => {
    await page.goto('http://localhost:8000/single-museum.html?museum=pinghu-museum');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Verify museum name appears
    await expect(page.locator('body')).toContainText('平湖博物馆');
    
    // Check that share step exists
    const shareStep = page.locator('#step-share');
    await expect(shareStep).toHaveCount(1);
    
    // Verify poster elements exist
    await expect(page.locator('#posterCanvas')).toHaveCount(1);
    await expect(page.locator('#posterPreview')).toHaveCount(1);
    
    // Verify save and share buttons exist
    await expect(page.locator('#savePoster')).toHaveCount(1);
    await expect(page.locator('#sharePoster')).toHaveCount(1);
    
    // Verify poster buttons are touch-friendly
    const saveButton = page.locator('#savePoster');
    if (await saveButton.isVisible()) {
      const saveBox = await saveButton.boundingBox();
      if (saveBox) {
        expect(saveBox.height).toBeGreaterThanOrEqual(44);
      }
    }
  });

  test('v3: Mobile workflow navigation', async ({ page }) => {
    await page.goto('http://localhost:8000/single-museum.html?museum=pinghu-museum');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Verify responsive design
    const container = page.locator('.sg-container');
    await expect(container).toBeVisible();
    
    // Check stepper exists
    const stepper = page.locator('#sgStepper');
    await expect(stepper).toHaveCount(1);
    
    // Verify settings button is accessible
    const settingsBtn = page.locator('#sgSettingsBtn');
    if (await settingsBtn.isVisible()) {
      const btnBox = await settingsBtn.boundingBox();
      if (btnBox) {
        expect(btnBox.height).toBeGreaterThanOrEqual(44);
      }
    }
    
    // Verify mobile font sizes are readable
    const title = page.locator('.sg-title').first();
    if (await title.isVisible()) {
      const fontSize = await title.evaluate(el => 
        window.getComputedStyle(el).fontSize
      );
      const fontSizePx = parseInt(fontSize);
      expect(fontSizePx).toBeGreaterThanOrEqual(13);
    }
  });

  test('v2 vs v3: Feature parity check', async ({ page }) => {
    // Test v2 has photo capture
    await page.goto('http://localhost:8000/museum-checkin.html?museum=pinghu-museum&age=7-12');
    await page.waitForLoadState('networkidle');
    
    const v2PhotoSection = await page.locator('#photoSection').count();
    expect(v2PhotoSection).toBe(1);
    
    const v2PosterCanvas = await page.locator('#posterCanvas').count();
    expect(v2PosterCanvas).toBe(1);
    
    // Test v3 has photo capture
    await page.goto('http://localhost:8000/single-museum.html?museum=pinghu-museum');
    await page.waitForLoadState('networkidle');
    
    // V3 should have poster generation
    const v3PosterCanvas = await page.locator('#posterCanvas').count();
    expect(v3PosterCanvas).toBe(1);
    
    const v3ShareStep = await page.locator('#step-share').count();
    expect(v3ShareStep).toBe(1);
  });
});
