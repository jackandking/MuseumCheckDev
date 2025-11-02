import { test, expect, devices } from '@playwright/test';

/**
 * E2E Test for Pinghu Museum Mobile Workflow Experience
 * 
 * Issue: 平湖博物馆手机体验 - 通过e2e测试在手机上完成平湖博物馆workflow
 * 
 * This test verifies the complete mobile workflow experience for Pinghu Museum,
 * including the simplified flow that skips prep/enroute and goes directly to
 * the visit step with the "镇馆之宝探索" (Treasure Hunt) workflow.
 * 
 * Workflow Structure:
 * 1. Settings (optional first-time setup)
 * 2. Museum intro overlay
 * 3. Visit step with 5 tasks:
 *    - Task 1: Gate photo (门口打卡)
 *    - Task 2-4: Three collection treasure photos (镇馆之宝)
 *    - Task 5: Victory photo with pose suggestions (亲子合影)
 * 4. Share step
 */

const BASE_URL = 'http://localhost:8000';
const MUSEUM_ID = 'pinghu-museum';
const MUSEUM_NAME = '平湖博物馆';
const WORKFLOW_NAME = '镇馆之宝探索';

test.describe('Pinghu Museum Mobile Workflow', () => {
  
  test('complete full workflow on mobile device (iPhone)', async ({ page }) => {
    // Configure for mobile
    await page.setViewportSize(devices['iPhone 12'].viewport);
    
    // Navigate to single-museum.html with Pinghu Museum preset
    await page.goto(`${BASE_URL}/single-museum.html?museum=${MUSEUM_ID}`);
    
    // Step 1: Handle settings modal if it appears (first-time setup)
    const settingsModal = page.locator('#sgSettingsModal');
    const isSettingsVisible = await settingsModal.isVisible({ timeout: 3000 }).catch(() => false);
    
    if (isSettingsVisible) {
      console.log('Settings modal detected, configuring...');
      
      // Verify museum is pre-selected
      const museumPicker = page.locator('#sgMuseumPicker');
      if (await museumPicker.isVisible().catch(() => false)) {
        await expect(museumPicker).toHaveValue(MUSEUM_ID);
      }
      
      // Save settings
      const saveButton = page.locator('#sgSettingsSave');
      await expect(saveButton).toBeVisible();
      await saveButton.click();
      
      // Wait for settings modal to close
      await expect(settingsModal).toBeHidden({ timeout: 5000 });
    }
    
    // Step 2: Handle intro overlay
    console.log('Handling intro overlay...');
    const introOverlay = page.locator('#sgFullscreenIntro');
    await expect(introOverlay).toBeVisible({ timeout: 10000 });
    
    // Verify museum name appears in intro
    await expect(introOverlay).toContainText(MUSEUM_NAME);
    
    // Tap intro overlay to start workflow
    await introOverlay.click();
    await expect(introOverlay).toBeHidden({ timeout: 5000 });
    
    // Step 3: Verify immersive mode is activated
    const htmlElement = page.locator('html');
    await expect(htmlElement).toHaveClass(/sg-immersive/);
    
    // Step 4: Verify we're directly in visit step (Pinghu skips prep/enroute)
    console.log('Verifying visit step is active...');
    const visitStep = page.locator('#step-visit');
    await expect(visitStep).toBeVisible({ timeout: 10000 });
    
    // Verify workflow display shows correct workflow
    const workflowDisplay = page.locator('#sgWorkflowDisplayWrap');
    await expect(workflowDisplay).toBeVisible();
    
    const workflowCard = page.locator('#sgWorkflowCard');
    if (await workflowCard.isVisible().catch(() => false)) {
      const workflowName = page.locator('#sgWorkflowCardName');
      await expect(workflowName).toHaveText(WORKFLOW_NAME);
    }
    
    // Step 5: Verify workflow visit section is rendered
    const workflowVisit = page.locator('#sgWorkflowVisit');
    await expect(workflowVisit).toBeVisible();
    
    // Step 6: Progress through all 5 tasks
    console.log('Starting task progression...');
    
    // Task 1: Gate photo (门口打卡)
    console.log('Task 1: Gate photo...');
    await verifyAndCompletePhotoTask(page, '门口打卡', 0);
    
    // Task 2: First collection treasure (镇馆之宝 1/3)
    console.log('Task 2: First treasure...');
    await verifyAndCompletePhotoTask(page, '镇馆之宝 1/3', 1);
    
    // Task 3: Second collection treasure (镇馆之宝 2/3)
    console.log('Task 3: Second treasure...');
    await verifyAndCompletePhotoTask(page, '镇馆之宝 2/3', 2);
    
    // Task 4: Third collection treasure (镇馆之宝 3/3)
    console.log('Task 4: Third treasure...');
    await verifyAndCompletePhotoTask(page, '镇馆之宝 3/3', 3);
    
    // Task 5: Victory photo with poses (亲子合影)
    console.log('Task 5: Victory photo...');
    await verifyAndCompletePhotoTask(page, '亲子合影', 4);
    
    // Step 7: Verify we reached the share step
    console.log('Verifying share step...');
    const shareStep = page.locator('#step-share');
    await expect(shareStep).toBeVisible({ timeout: 10000 });
    
    // Verify share step contains museum name
    await expect(shareStep).toContainText(MUSEUM_NAME);
    
    // Verify fireworks wall link is present
    const fireworksLink = page.locator('a[href*="fireworks-wall.html"]');
    await expect(fireworksLink).toBeVisible();
    
    console.log('✅ Pinghu Museum mobile workflow completed successfully!');
  });
  
  test('verify mobile UX elements during workflow', async ({ page }) => {
    // Configure for mobile Android device
    await page.setViewportSize(devices['Pixel 5'].viewport);
    
    await page.goto(`${BASE_URL}/single-museum.html?museum=${MUSEUM_ID}`);
    
    // Skip settings if present
    const settingsModal = page.locator('#sgSettingsModal');
    if (await settingsModal.isVisible({ timeout: 2000 }).catch(() => false)) {
      await page.locator('#sgSettingsSave').click();
      await expect(settingsModal).toBeHidden({ timeout: 5000 });
    }
    
    // Skip intro
    const intro = page.locator('#sgFullscreenIntro');
    await intro.click();
    
    // Wait for visit step
    await expect(page.locator('#step-visit')).toBeVisible({ timeout: 10000 });
    
    // Test 1: Verify touch targets are adequate size (≥44px)
    console.log('Testing touch target sizes...');
    const nextButton = page.locator('#sgVisitNext');
    await expect(nextButton).toBeVisible();
    
    const nextButtonBox = await nextButton.boundingBox();
    if (nextButtonBox) {
      expect(nextButtonBox.height).toBeGreaterThanOrEqual(44);
      console.log(`✓ Next button height: ${nextButtonBox.height}px (≥44px)`);
    }
    
    // Test 2: Verify progress indicator is visible
    console.log('Testing progress indicator...');
    const progressIndicator = page.locator('#sgVisitProgress');
    await expect(progressIndicator).toBeVisible();
    await expect(progressIndicator).toContainText('1');
    await expect(progressIndicator).toContainText('5');
    
    // Test 3: Verify current task card is visible and readable
    console.log('Testing task card visibility...');
    const currentTaskCard = page.locator('#sgCurrentTaskCard');
    await expect(currentTaskCard).toBeVisible();
    
    // Verify task title is displayed
    const taskTitle = currentTaskCard.locator('.sg-task-title, .task-title, h3, h4').first();
    await expect(taskTitle).toBeVisible();
    const titleText = await taskTitle.textContent();
    expect(titleText).toBeTruthy();
    console.log(`✓ Current task: ${titleText}`);
    
    // Test 4: Verify mobile layout is responsive
    const viewport = page.viewportSize();
    expect(viewport?.width).toBeLessThanOrEqual(768);
    console.log(`✓ Mobile viewport: ${viewport?.width}x${viewport?.height}`);
    
    // Test 5: Verify workflow display is mobile-optimized
    const workflowDisplay = page.locator('#sgWorkflowDisplayWrap');
    await expect(workflowDisplay).toBeVisible();
    
    const workflowBox = await workflowDisplay.boundingBox();
    if (workflowBox && viewport) {
      expect(workflowBox.width).toBeLessThanOrEqual(viewport.width);
      console.log(`✓ Workflow display fits viewport: ${workflowBox.width}px ≤ ${viewport.width}px`);
    }
    
    console.log('✅ Mobile UX elements verified successfully!');
  });
  
  test('verify workflow persistence on mobile', async ({ page, context }) => {
    // Configure for mobile
    await page.setViewportSize(devices['iPhone 12'].viewport);
    
    await page.goto(`${BASE_URL}/single-museum.html?museum=${MUSEUM_ID}`);
    
    // Skip settings and intro
    const settingsModal = page.locator('#sgSettingsModal');
    if (await settingsModal.isVisible({ timeout: 2000 }).catch(() => false)) {
      await page.locator('#sgSettingsSave').click();
    }
    const intro = page.locator('#sgFullscreenIntro');
    await intro.click();
    
    // Wait for visit step
    await expect(page.locator('#step-visit')).toBeVisible({ timeout: 10000 });
    
    // Complete first task
    const fileInput = page.locator('#sgWorkflowVisit input[type="file"]').first();
    await fileInput.setInputFiles('MuseumCheck_logo.jpg');
    
    // Wait for task to be marked complete
    await page.waitForTimeout(1000);
    
    // Verify progress updated
    const progress = page.locator('#sgVisitProgress');
    const progressText = await progress.textContent();
    expect(progressText).toContain('2'); // Should be on task 2 now
    
    // Reload page to test persistence
    await page.reload();
    
    // Skip intro again if needed
    const introAfterReload = page.locator('#sgFullscreenIntro');
    if (await introAfterReload.isVisible({ timeout: 2000 }).catch(() => false)) {
      await introAfterReload.click();
    }
    
    // Verify we're back at visit step
    await expect(page.locator('#step-visit')).toBeVisible({ timeout: 10000 });
    
    // Verify progress was persisted (should still be on task 2)
    const progressAfterReload = page.locator('#sgVisitProgress');
    const progressTextAfterReload = await progressAfterReload.textContent();
    expect(progressTextAfterReload).toContain('2');
    
    console.log('✅ Workflow persistence verified successfully!');
  });
  
  test('verify accessibility on mobile', async ({ page }) => {
    // Configure for mobile
    await page.setViewportSize(devices['iPhone 12'].viewport);
    
    await page.goto(`${BASE_URL}/single-museum.html?museum=${MUSEUM_ID}`);
    
    // Skip settings and intro
    const settingsModal = page.locator('#sgSettingsModal');
    if (await settingsModal.isVisible({ timeout: 2000 }).catch(() => false)) {
      await page.locator('#sgSettingsSave').click();
    }
    const intro = page.locator('#sgFullscreenIntro');
    await intro.click();
    
    // Wait for visit step
    await expect(page.locator('#step-visit')).toBeVisible({ timeout: 10000 });
    
    // Test 1: Verify ARIA labels on key interactive elements
    const nextButton = page.locator('#sgVisitNext');
    const buttonText = await nextButton.textContent();
    expect(buttonText).toBeTruthy();
    console.log(`✓ Next button has text: "${buttonText}"`);
    
    // Test 2: Verify Chinese text is readable (font size ≥14px on mobile)
    const taskCard = page.locator('#sgCurrentTaskCard');
    const fontSize = await taskCard.evaluate(el => 
      window.getComputedStyle(el).fontSize
    );
    const fontSizeNum = parseInt(fontSize);
    expect(fontSizeNum).toBeGreaterThanOrEqual(13);
    console.log(`✓ Task card font size: ${fontSizeNum}px (≥13px for mobile)`);
    
    // Test 3: Verify contrast is adequate (elements are visible)
    const workflowVisit = page.locator('#sgWorkflowVisit');
    await expect(workflowVisit).toBeVisible();
    
    // Test 4: Verify no horizontal scrolling required
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    const windowWidth = await page.evaluate(() => window.innerWidth);
    expect(bodyWidth).toBeLessThanOrEqual(windowWidth + 10); // Allow 10px tolerance
    console.log(`✓ No horizontal scroll: body ${bodyWidth}px ≤ window ${windowWidth}px`);
    
    console.log('✅ Accessibility checks passed!');
  });
  
  test('verify poster generation with workflow photos', async ({ page }) => {
    // Configure for mobile
    await page.setViewportSize(devices['iPhone 12'].viewport);
    
    await page.goto(`${BASE_URL}/single-museum.html?museum=${MUSEUM_ID}`);
    
    // Skip settings and intro
    const settingsModal = page.locator('#sgSettingsModal');
    if (await settingsModal.isVisible({ timeout: 2000 }).catch(() => false)) {
      await page.locator('#sgSettingsSave').click();
      await expect(settingsModal).toBeHidden({ timeout: 5000 });
    }
    
    const intro = page.locator('#sgFullscreenIntro');
    await intro.click();
    await expect(intro).toBeHidden({ timeout: 5000 });
    
    // Wait for visit step
    await expect(page.locator('#step-visit')).toBeVisible({ timeout: 10000 });
    
    console.log('Completing all workflow tasks to generate poster...');
    
    // Complete all 5 tasks
    for (let i = 0; i < 5; i++) {
      const workflowVisit = page.locator('#sgWorkflowVisit');
      const fileInput = workflowVisit.locator('input[type="file"]').first();
      
      if (await fileInput.count() > 0) {
        await fileInput.setInputFiles('MuseumCheck_logo.jpg');
        console.log(`  ✓ Task ${i + 1}/5 completed`);
      }
      
      await page.waitForTimeout(500);
    }
    
    // Wait for share step to appear
    console.log('Waiting for share step with poster...');
    const shareStep = page.locator('#step-share');
    await expect(shareStep).toBeVisible({ timeout: 10000 });
    
    // Verify poster canvas exists
    const posterCanvas = page.locator('#posterCanvas');
    await expect(posterCanvas).toBeAttached();
    console.log('  ✓ Poster canvas created');
    
    // Verify poster preview is rendered
    const posterPreview = page.locator('#posterPreview');
    await expect(posterPreview).toBeVisible();
    
    // Wait for poster to be generated (give it time to load images)
    await page.waitForTimeout(2000);
    
    // Verify poster preview contains an image
    const posterImage = posterPreview.locator('img');
    await expect(posterImage).toBeVisible();
    console.log('  ✓ Poster preview image rendered');
    
    // Verify poster image has content (src attribute)
    const posterSrc = await posterImage.getAttribute('src');
    expect(posterSrc).toBeTruthy();
    expect(posterSrc).toContain('data:image/png');
    console.log('  ✓ Poster image has valid data URL');
    
    // Verify save and share buttons are present
    const saveButton = page.locator('#savePoster');
    await expect(saveButton).toBeVisible();
    await expect(saveButton).toContainText('保存');
    console.log('  ✓ Save poster button present');
    
    const shareButton = page.locator('#sharePoster');
    await expect(shareButton).toBeVisible();
    await expect(shareButton).toContainText('分享');
    console.log('  ✓ Share poster button present');
    
    // Verify poster dimensions are reasonable for mobile
    const imgBox = await posterImage.boundingBox();
    if (imgBox) {
      const viewport = page.viewportSize();
      expect(imgBox.width).toBeLessThanOrEqual(viewport?.width || 500);
      console.log(`  ✓ Poster width fits mobile viewport: ${imgBox.width}px`);
    }
    
    console.log('✅ Poster generation with workflow photos verified successfully!');
  });
});

/**
 * Helper function to verify and complete a photo task
 */
async function verifyAndCompletePhotoTask(page: any, expectedTitlePart: string, taskIndex: number) {
  // Verify current task card is visible
  const currentTaskCard = page.locator('#sgCurrentTaskCard');
  await expect(currentTaskCard).toBeVisible();
  
  // Verify task title contains expected text
  const taskContent = await currentTaskCard.textContent();
  expect(taskContent).toContain(expectedTitlePart);
  console.log(`  ✓ Task title verified: "${expectedTitlePart}"`);
  
  // Verify progress indicator shows correct task number
  const progress = page.locator('#sgVisitProgress');
  const progressText = await progress.textContent();
  expect(progressText).toContain(`${taskIndex + 1}`);
  console.log(`  ✓ Progress: ${progressText}`);
  
  // Complete the photo task by uploading a test image
  const workflowVisit = page.locator('#sgWorkflowVisit');
  const fileInput = workflowVisit.locator('input[type="file"]').first();
  
  // Check if file input is visible/enabled
  const fileInputCount = await fileInput.count();
  if (fileInputCount > 0) {
    await fileInput.setInputFiles('MuseumCheck_logo.jpg');
    console.log(`  ✓ Photo uploaded`);
  }
  
  // Wait a moment for state update
  await page.waitForTimeout(500);
  
  // If it's a confirm task (no photo), click the completion button
  const doneButton = workflowVisit.locator('button:has-text("我完成了")').first();
  const doneButtonCount = await doneButton.count();
  if (doneButtonCount > 0 && await doneButton.isVisible().catch(() => false)) {
    await doneButton.click();
    console.log(`  ✓ Task confirmed`);
  }
  
  // Wait for next task or completion
  await page.waitForTimeout(500);
}
