import { test, expect } from '@playwright/test';
import { trackConsoleErrors } from './helpers/assertions';

async function mockRemoteStorage(page, kvWrites: any[] = []) {
  await page.route('**/default/keyValueStore', async route => {
    const request = route.request();
    if (request.method() === 'POST' && request.postData()) {
      kvWrites.push(JSON.parse(request.postData()!));
    }
    await route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
  });
  await page.route('**/mysql/query', route => {
    route.fulfill({ status: 200, contentType: 'application/json', body: '{"rows":[]}' });
  });
}

function signals(kvWrites: any[]) {
  return kvWrites
    .filter(write => write.key === 'museumcheck-visit-signals')
    .map(write => JSON.parse(write.value));
}

test.describe('invited pilot mobile flow', () => {
  test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });

  test('collects anonymous visit context and reaches the tailored first task', async ({ page }) => {
    const kvWrites: any[] = [];
    const assertNoConsoleErrors = trackConsoleErrors(page);
    await mockRemoteStorage(page, kvWrites);
    await page.addInitScript(() => {
      if (sessionStorage.getItem('pilot-test-cleared') !== 'true') {
        localStorage.clear();
        sessionStorage.setItem('pilot-test-cleared', 'true');
      }
    });

    await page.goto('/pilot.html?pilot=one-camp');
    await expect(page.locator('#pilotInviteLine')).toContainText('给这次真实参观');
    await expect(page.locator('#pilotTitle')).toBeVisible();
    await expect(page.locator('#pilotForm')).toBeVisible();

    const submitBox = await page.locator('.pilot-submit').boundingBox();
    expect(submitBox).not.toBeNull();
    expect(submitBox!.height).toBeGreaterThanOrEqual(58);

    await page.locator('#museumInput').fill('故宫博物院｜北京');
    await page.locator('.pilot-submit').click();

    await expect(page.locator('#pilotPreview')).toBeVisible();
    await expect(page.locator('#pilotPreviewTitle')).toContainText('故宫博物院');
    await page.locator('#formatSelect').selectOption('camp');
    await page.locator('#groupSelect').selectOption('9-20');
    await page.locator('#durationSelect').selectOption('90-120');
    await page.locator('.pilot-submit').click();

    await page.waitForURL(/museum-checkin\.html\?.*museum=forbidden-city/);
    await expect(page.locator('#visitCoachKicker')).toContainText('受邀共创试用');
    await expect(page.locator('#museumName')).toContainText('故宫博物院');
    await expect(page.locator('#visitCoachButton')).toBeVisible();

    const state = await page.evaluate(() => ({
      context: JSON.parse(localStorage.getItem('museumcheckPilotContext:v1') || '{}'),
      childName: localStorage.getItem('childName'),
      phone: localStorage.getItem('phone')
    }));
    expect(state.context).toEqual(expect.objectContaining({
      cohort: 'one-camp',
      age: '7-12',
      museumId: 'forbidden-city',
      format: 'camp',
      group: '9-20',
      duration: '90-120'
    }));
    expect(state.childName).toBeNull();
    expect(state.phone).toBeNull();

    await page.locator('#visitCoachButton').click();
    await page.locator('#completeButton').click();
    await expect(page.locator('#visitFeedbackQuestion')).toContainText('这次试用的第 1 个任务');

    await expect.poll(() => signals(kvWrites).map(signal => signal.signalType)).toEqual(
      expect.arrayContaining(['pilot_open', 'pilot_preview_open', 'pilot_started', 'checkin_open', 'first_task_complete'])
    );
    const checkinOpen = signals(kvWrites).find(signal => signal.signalType === 'checkin_open');
    expect(checkinOpen.parameters.source).toBe('pilot');
    expect(checkinOpen.pilotContext).toEqual(expect.objectContaining({
      cohort: 'one-camp',
      format: 'camp',
      group: '9-20',
      duration: '90-120'
    }));
    expect(checkinOpen).not.toHaveProperty('childNickname');
    assertNoConsoleErrors();
  });

  test('requires a specific museum instead of guessing from a city', async ({ page }) => {
    await mockRemoteStorage(page);
    await page.goto('/pilot.html?pilot=early-family');
    await page.locator('#museumInput').fill('北京');
    await page.locator('.pilot-submit').click();

    await expect(page).toHaveURL(/pilot\.html/);
    await expect(page.locator('#pilotError')).toContainText('选择一个具体博物馆');
    await expect(page.locator('#museumInput')).toBeFocused();
  });
});
