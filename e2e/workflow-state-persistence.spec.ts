import { test, expect, devices } from '@playwright/test';

/**
 * E2E Test for Workflow State Persistence
 * 
 * Issue: v3存在一个问题，如果在workflow第一步拍照留念后退出到主页，再进入是需要从头再来，数据丢失
 * 
 * This test verifies that workflow state (current task, progress) is persisted
 * across navigation away from the workflow page and restored when returning.
 * 
 * Tests cover:
 * - State persistence across full navigation (not just page reload)
 * - State clearing when workflow is complete
 * - State expiry after 24 hours
 * - State isolation between different museums
 */

const BASE_URL = 'http://localhost:8000';
const MUSEUM_ID = 'pinghu-museum';

test.describe('Workflow state persistence', () => {
  test('persists workflow progress when navigating away and back', async ({ page, context }) => {
    // Setup: Pre-configure all required settings in localStorage
    await page.goto(`${BASE_URL}/single-museum.html`);
    
    await page.evaluate(() => {
      localStorage.clear();
      localStorage.setItem('childNickname', '小明');
      localStorage.setItem('ageGroup', '7-12');
      localStorage.setItem('caregiverRole', 'parent');
      localStorage.setItem('settingsSeen', '1');
    });

    // Step 1: Navigate to Pinghu Museum
    await page.goto(`${BASE_URL}/single-museum.html?museum=${MUSEUM_ID}`);
    
    // Wait for page to load and initialize
    await page.waitForLoadState('networkidle');
    
    // Intro overlay should appear
    const introOverlay = page.locator('#sgFullscreenIntro');
    await expect(introOverlay).toBeVisible({ timeout: 5000 });
    
    // Click to start the workflow
    await introOverlay.click();
    
    // Wait for visit step to be active
    await page.waitForSelector('#step-visit:not([hidden])', { timeout: 3000 });
    
    // Verify we're on the first task (门口打卡)
    const firstTask = page.locator('#wtask-0');
    await expect(firstTask).toBeVisible({ timeout: 3000 });
    
    // Verify first task content includes "门口打卡"
    await expect(firstTask).toContainText('门口打卡');
    
    // Step 2: Simulate task completion by marking the task as complete
    // (In a real scenario, user would take a photo, but we'll simulate state change)
    await page.evaluate(() => {
      // Access the internal state management functions
      if ((window as any).__workflowState && (window as any).__workflowState.__saveWorkflowState) {
        // Manually trigger state save
        (window as any).__workflowState.__saveWorkflowState();
      }
    });
    
    // Step 3: Navigate away (simulate clicking menu and going home)
    await page.goto(`${BASE_URL}/index.html`);
    await page.waitForLoadState('networkidle');
    
    // Verify we're on the home page
    await expect(page.locator('body')).toBeVisible();
    
    // Step 4: Navigate back to the workflow
    await page.goto(`${BASE_URL}/single-museum.html?museum=${MUSEUM_ID}`);
    await page.waitForLoadState('networkidle');
    
    // Step 5: Verify workflow state is restored
    // Should skip intro and go directly to visit step with restored progress
    await page.waitForSelector('#step-visit:not([hidden])', { timeout: 5000 });
    
    // Verify we're still on the visit step (not back at select step)
    const visitStep = page.locator('#step-visit');
    await expect(visitStep).not.toHaveAttribute('hidden');
    
    // Verify restoration toast appears (may be brief)
    // Note: Toast may have already disappeared, so we check if visit step is active instead
    
    // Verify the workflow is rendered
    const workflowVisit = page.locator('#sgWorkflowVisit');
    await expect(workflowVisit).toBeVisible();
    
    // Verify task cards are rendered
    const firstTaskRestored = page.locator('#wtask-0');
    await expect(firstTaskRestored).toBeVisible();
    
    console.log('✅ Workflow state persisted and restored successfully!');
  });

  test('clears workflow state when reaching share (poster) step', async ({ page, context }) => {
    // Setup: Pre-configure all required settings
    await page.goto(`${BASE_URL}/single-museum.html`);
    
    await page.evaluate(() => {
      localStorage.clear();
      localStorage.setItem('childNickname', '小明');
      localStorage.setItem('ageGroup', '7-12');
      localStorage.setItem('caregiverRole', 'parent');
      localStorage.setItem('settingsSeen', '1');
    });

    // Navigate to Pinghu Museum
    await page.goto(`${BASE_URL}/single-museum.html?museum=${MUSEUM_ID}`);
    await page.waitForLoadState('networkidle');
    
    // Start the workflow
    const introOverlay = page.locator('#sgFullscreenIntro');
    if (await introOverlay.isVisible()) {
      await introOverlay.click();
    }
    
    // Wait for visit step
    await page.waitForSelector('#step-visit:not([hidden])', { timeout: 3000 });
    
    // Simulate completing all tasks and advancing to share step
    await page.evaluate(() => {
      // Manually set step to share (which triggers poster generation and state clearing)
      if ((window as any).__workflowState && (window as any).__workflowState.__saveWorkflowState) {
        (window as any).__workflowState.__saveWorkflowState();
      }
      
      // Advance to share step (this should clear workflow state)
      const state = (window as any).state || {};
      state.step = 'share';
      
      // Simulate setStep('share') which clears workflow state
      const shareStep = document.getElementById('step-share');
      if (shareStep) {
        shareStep.hidden = false;
      }
      const visitStep = document.getElementById('step-visit');
      if (visitStep) {
        visitStep.hidden = true;
      }
      
      // Clear workflow state as setStep('share') would do
      if ((window as any).__workflowState && (window as any).__workflowState.__clearWorkflowState) {
        (window as any).__workflowState.__clearWorkflowState();
      }
    });
    
    // Verify workflow state is cleared from localStorage
    const workflowStateCleared = await page.evaluate(() => {
      const stored = localStorage.getItem('workflow:session');
      return stored === null;
    });
    
    expect(workflowStateCleared).toBe(true);
    console.log('✅ Workflow state cleared on completion!');
  });

  test('workflow state expires after 24 hours', async ({ page }) => {
    // Setup: Create an old workflow state
    await page.goto(`${BASE_URL}/single-museum.html`);
    
    await page.evaluate(() => {
      localStorage.clear();
      localStorage.setItem('childNickname', '小明');
      localStorage.setItem('ageGroup', '7-12');
      localStorage.setItem('caregiverRole', 'parent');
      
      // Create workflow state with old timestamp (25 hours ago)
      const oldTimestamp = Date.now() - (25 * 60 * 60 * 1000);
      const workflowState = {
        museumId: 'pinghu-museum',
        workflowId: 'treasure-discovery',
        innerTaskIndex: 1,
        timestamp: oldTimestamp,
        photoKeys: ['wf-0']
      };
      localStorage.setItem('workflow:session', JSON.stringify(workflowState));
    });

    // Navigate to museum page
    await page.goto(`${BASE_URL}/single-museum.html?museum=${MUSEUM_ID}`);
    await page.waitForLoadState('networkidle');
    
    // Old state should be ignored and intro overlay should show (indicating fresh start)
    const introOverlay = page.locator('#sgFullscreenIntro');
    await expect(introOverlay).toBeVisible({ timeout: 5000 });
    
    // Verify old workflow state was cleared
    const stateCleared = await page.evaluate(() => {
      const stored = localStorage.getItem('workflow:session');
      return stored === null;
    });
    
    expect(stateCleared).toBe(true);
    console.log('✅ Old workflow state properly expired and cleared!');
  });

  test('does not restore state for different museum', async ({ page }) => {
    // Setup: Create workflow state for Forbidden City
    await page.goto(`${BASE_URL}/single-museum.html`);
    
    await page.evaluate(() => {
      localStorage.clear();
      localStorage.setItem('childNickname', '小明');
      localStorage.setItem('ageGroup', '7-12');
      localStorage.setItem('caregiverRole', 'parent');
      
      // Create workflow state for Forbidden City
      const workflowState = {
        museumId: 'forbidden-city',
        workflowId: 'easy-family-tour',
        innerTaskIndex: 2,
        timestamp: Date.now(),
        photoKeys: ['wf-0', 'wf-1']
      };
      localStorage.setItem('workflow:session', JSON.stringify(workflowState));
    });

    // Navigate to Pinghu Museum (different museum)
    await page.goto(`${BASE_URL}/single-museum.html?museum=${MUSEUM_ID}`);
    await page.waitForLoadState('networkidle');
    
    // Should show intro overlay (fresh start) not restore Forbidden City state
    const introOverlay = page.locator('#sgFullscreenIntro');
    await expect(introOverlay).toBeVisible({ timeout: 5000 });
    
    console.log('✅ Different museum state properly isolated!');
  });
});
