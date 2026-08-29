import { test, expect } from '@playwright/test';
import { trackConsoleErrors } from './helpers/assertions';

function visitSignal(signalType: string, sessionId: string, overrides: Record<string, any> = {}) {
  const now = Date.now();
  const value = {
    type: 'visit_signal',
    signalType,
    page: 'museum-checkin',
    museumId: 'forbidden-city',
    museumName: '故宫博物院',
    ageGroup: '7-12',
    visitorId: `visitor-${sessionId}`,
    sessionId,
    completedCount: signalType === 'first_task_complete' ? 1 : 0,
    totalTasks: 8,
    secondsSinceOpen: 18,
    timestamp: now,
    childNickname: '不应展示的小朋友',
    parameters: {},
    ...overrides,
  };
  return {
    key: 'museumcheck-visit-signals',
    sortKey: `${signalType}-${sessionId}-${now}`,
    value: JSON.stringify(value),
    expireAt: Math.floor(now / 1000) + 90 * 24 * 60 * 60,
  };
}

test.describe('Visit metrics dashboard', () => {
  test('requires admin query parameter', async ({ page }) => {
    await page.goto('/admin/visit-metrics.html');
    await expect(page.locator('#unauthorized')).toBeVisible();
    await expect(page.locator('#app')).toBeHidden();
  });

  test('summarizes visit funnel and feedback without exposing visitor identifiers', async ({ page }) => {
    const assertNoConsoleErrors = trackConsoleErrors(page);
    const letmetryRequests: string[] = [];
    const kvPayload = {
      value: JSON.stringify([
        visitSignal('checkin_open', 's1'),
        visitSignal('first_task_cta_visible', 's1', {
          parameters: { taskIndex: 0, taskTitle: '门口打卡', source: 'visit_coach', ctaText: '开始第 1 个任务' },
        }),
        visitSignal('first_task_cta_click', 's1', {
          parameters: { taskIndex: 0, taskTitle: '门口打卡', source: 'visit_coach', ctaText: '开始第 1 个任务' },
        }),
        visitSignal('task_open', 's1', { parameters: { taskIndex: 0, taskTitle: '门口打卡' } }),
        visitSignal('first_task_complete', 's1', { parameters: { taskIndex: 0, taskTitle: '门口打卡' } }),
        visitSignal('visit_feedback', 's1', { parameters: { taskIndex: 0, taskTitle: '门口打卡', rating: 'helpful', comment: '' } }),
        visitSignal('checkin_open', 's2'),
        visitSignal('task_open', 's2', { parameters: { taskIndex: 0, taskTitle: '门口打卡' } }),
        visitSignal('visit_feedback', 's2', { parameters: { taskIndex: 0, taskTitle: '门口打卡', rating: 'not_helpful', comment: '按钮不明显' } }),
        visitSignal('checkin_open', 's3', {
          museumId: 'british-museum',
          museumName: '大英博物馆',
          parameters: { taskCount: 6 },
        }),
      ]),
    };

    page.on('request', request => {
      if (request.url().includes('letmetry.cloud')) {
        letmetryRequests.push(request.url());
      }
    });

    await page.route('**/default/keyValueStore**', route => {
      expect(route.request().url()).toContain('key=museumcheck-visit-signals');
      expect(route.request().url()).toContain('sortKey=*');
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(kvPayload) });
    });

    await page.goto('/admin/visit-metrics.html?admin=1');

    await expect(page.locator('#checkinOpenValue')).toHaveText('3');
    await expect(page.locator('#activationRateValue')).toHaveText('66.7%');
    await expect(page.locator('#firstCompletionRateValue')).toHaveText('33.3%');
    await expect(page.locator('#notHelpfulRateValue')).toHaveText('50%');
    await expect(page.locator('#northStarBadge')).toContainText('优先优化首任务');
    await expect(page.locator('#museumList')).toContainText('故宫博物院');
    await expect(page.locator('#museumList')).toContainText('大英博物馆');
    await expect(page.locator('#feedbackList')).toContainText('按钮不明显');
    await expect(page.locator('#signalTableBody')).toContainText('首任务按钮可见');
    await expect(page.locator('#signalTableBody')).toContainText('完成首任务');
    await expect(page.locator('body')).not.toContainText('visitor-s1');
    await expect(page.locator('body')).not.toContainText('s1');
    await expect(page.locator('body')).not.toContainText('不应展示的小朋友');

    expect(letmetryRequests).toEqual([]);
    assertNoConsoleErrors();
  });
});
