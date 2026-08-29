import { test, expect } from '@playwright/test';
import { trackConsoleErrors } from './helpers/assertions';

async function mockRemoteStorage(page, kvWrites: any[] = []) {
  await page.route('**/default/keyValueStore', async route => {
    const request = route.request();
    const postData = request.postData();
    if (request.method() === 'POST' && postData) {
      try {
        kvWrites.push(JSON.parse(postData));
      } catch (error) {
        kvWrites.push({ parseError: true, raw: postData });
      }
    }
    await route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
  });
  await page.route('**/mysql/query', route => {
    route.fulfill({ status: 200, contentType: 'application/json', body: '{"rows":[]}' });
  });
}

function visitSignalTypes(kvWrites: any[]) {
  return kvWrites
    .filter(write => write.key === 'museumcheck-visit-signals')
    .map(write => JSON.parse(write.value).signalType);
}

test.describe('Museum check-in mobile visit guide', () => {
  test.use({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });

  test('guides an on-site mobile visitor into the first task', async ({ page }) => {
    const assertNoConsoleErrors = trackConsoleErrors(page);
    const letmetryRequests: string[] = [];
    await mockRemoteStorage(page);

    page.on('request', request => {
      if (request.url().includes('letmetry.cloud')) {
        letmetryRequests.push(request.url());
      }
    });

    await page.addInitScript(() => {
      localStorage.clear();
      localStorage.setItem('childNickname', '测试小朋友');
      localStorage.setItem('ageGroup', '7-12');
      localStorage.setItem('childModeEnabled', 'false');
      localStorage.setItem('gameRewardEnabled', 'false');
      localStorage.setItem('nicknameHasBeenSet', 'true');
    });

    await page.goto('/museum-checkin.html?museum=forbidden-city&age=7-12');
    await expect(page.locator('#museumName')).toContainText('故宫博物院');
    await page.waitForSelector('.task-card', { timeout: 10000 });

    const visitCoach = page.locator('#visitCoach');
    await expect(visitCoach).toBeVisible();
    await expect(page.locator('#visitCoachTitle')).toContainText('先做第 1 个任务');
    await expect(page.locator('#visitCoachDescription')).toContainText('门口');
    await expect(page.locator('#visitCoachSteps')).toContainText('看实物');
    await expect(page.locator('#visitCoachSteps')).toContainText('收起手机继续逛');

    const coachBox = await visitCoach.boundingBox();
    expect(coachBox).not.toBeNull();
    expect(coachBox!.y).toBeGreaterThanOrEqual(0);
    expect(coachBox!.y + coachBox!.height).toBeLessThan(844);

    const startButton = page.locator('#visitCoachButton');
    await expect(startButton).toBeVisible();
    await expect(startButton).toContainText('开始第 1 个任务');
    const buttonBox = await startButton.boundingBox();
    expect(buttonBox).not.toBeNull();
    expect(buttonBox!.height).toBeGreaterThanOrEqual(54);

    const firstTask = page.locator('.task-card').first();
    await expect(firstTask).toHaveClass(/next-task/);
    await expect(firstTask).toHaveAttribute('role', 'button');
    await expect(firstTask).toHaveAttribute('aria-label', /从这里开始：门口打卡/);

    await startButton.click();

    const taskModal = page.locator('#taskModal');
    await expect(taskModal).toHaveClass(/show/);
    await expect(page.locator('#modalTaskTitle')).toContainText('门口打卡');
    await expect(page.locator('#completeButton')).toContainText('完成第 1 个任务');

    await page.locator('#completeButton').click();
    await expect(taskModal).not.toHaveClass(/show/);
    await expect(page.locator('#completedCount')).toHaveText('1');
    await expect(page.locator('#visitCoachTitle')).toContainText('第 2 个任务');
    await expect(page.locator('.task-card').first()).toHaveClass(/completed/);

    expect(letmetryRequests).toEqual([]);
    assertNoConsoleErrors();
  });

  test('does not block a brand-new visitor with nickname onboarding', async ({ page }) => {
    const assertNoConsoleErrors = trackConsoleErrors(page);
    const letmetryRequests: string[] = [];
    await mockRemoteStorage(page);

    page.on('request', request => {
      if (request.url().includes('letmetry.cloud')) {
        letmetryRequests.push(request.url());
      }
    });

    await page.addInitScript(() => {
      localStorage.clear();
      localStorage.setItem('ageGroup', '7-12');
      localStorage.setItem('childModeEnabled', 'false');
      localStorage.setItem('gameRewardEnabled', 'false');
    });

    await page.goto('/museum-checkin.html?museum=forbidden-city&age=7-12');
    await expect(page.locator('#museumName')).toContainText('故宫博物院');
    await page.waitForSelector('.task-card', { timeout: 10000 });
    await page.waitForTimeout(1000);

    await expect(page.locator('#nicknameOnboardingModal')).not.toBeVisible();
    await expect(page.locator('#visitCoachButton')).toBeVisible();

    await page.locator('#visitCoachButton').click();
    await expect(page.locator('#taskModal')).toHaveClass(/show/);
    await expect(page.locator('#modalTaskTitle')).toContainText('门口打卡');

    const nicknameState = await page.evaluate(() => ({
      childNickname: localStorage.getItem('childNickname'),
      nicknameHasBeenSet: localStorage.getItem('nicknameHasBeenSet'),
    }));

    expect(nicknameState.childNickname).toMatch(/^用户[0-9a-f]{6}$/);
    expect(nicknameState.nicknameHasBeenSet).toBeNull();
    expect(letmetryRequests).toEqual([]);
    assertNoConsoleErrors();
  });

  test('captures first-task funnel and lightweight feedback', async ({ page }) => {
    const assertNoConsoleErrors = trackConsoleErrors(page);
    const letmetryRequests: string[] = [];
    const kvWrites: any[] = [];
    await mockRemoteStorage(page, kvWrites);

    page.on('request', request => {
      if (request.url().includes('letmetry.cloud')) {
        letmetryRequests.push(request.url());
      }
    });

    await page.addInitScript(() => {
      localStorage.clear();
      localStorage.setItem('childNickname', '反馈小朋友');
      localStorage.setItem('ageGroup', '7-12');
      localStorage.setItem('childModeEnabled', 'false');
      localStorage.setItem('gameRewardEnabled', 'false');
      localStorage.setItem('nicknameHasBeenSet', 'true');
    });

    await page.goto('/museum-checkin.html?museum=forbidden-city&age=7-12');
    await expect(page.locator('#museumName')).toContainText('故宫博物院');
    await page.waitForSelector('.task-card', { timeout: 10000 });

    await page.locator('#visitCoachButton').click();
    await expect(page.locator('#taskModal')).toHaveClass(/show/);
    await page.locator('#completeButton').click();

    const feedback = page.locator('#visitFeedback');
    await expect(feedback).toBeVisible();
    await expect(page.locator('#visitFeedbackQuestion')).toContainText('第 1 个任务');

    await page.locator('[data-feedback-rating="helpful"]').click();
    await expect(page.locator('#visitFeedbackThanks')).toBeVisible();

    await expect.poll(() => visitSignalTypes(kvWrites)).toEqual(
      expect.arrayContaining([
        'checkin_open',
        'first_task_cta_visible',
        'first_task_cta_click',
        'task_open',
        'task_complete',
        'first_task_complete',
        'visit_feedback',
      ])
    );

    const feedbackWrite = kvWrites.find(write => {
      if (write.key !== 'museumcheck-visit-signals') return false;
      return JSON.parse(write.value).signalType === 'visit_feedback';
    });
    expect(feedbackWrite).toBeDefined();

    const feedbackValue = JSON.parse(feedbackWrite.value);
    expect(feedbackValue.parameters).toEqual(expect.objectContaining({
      rating: 'helpful',
      taskIndex: 0,
      taskTitle: '门口打卡',
    }));
    expect(feedbackValue.visitorId).toMatch(/^visitor-/);
    expect(feedbackValue).not.toHaveProperty('childNickname');

    const taskOpenWrite = kvWrites.find(write => {
      if (write.key !== 'museumcheck-visit-signals') return false;
      return JSON.parse(write.value).signalType === 'task_open';
    });
    expect(taskOpenWrite).toBeDefined();

    const taskOpenValue = JSON.parse(taskOpenWrite.value);
    expect(taskOpenValue.parameters).toEqual(expect.objectContaining({
      source: 'visit_coach',
      taskIndex: 0,
      taskTitle: '门口打卡',
    }));

    expect(letmetryRequests).toEqual([]);
    assertNoConsoleErrors();
  });
});
