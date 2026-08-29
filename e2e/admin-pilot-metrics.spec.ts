import { test, expect } from '@playwright/test';

const mockSignals = [
  ['pilot_open', 1786600000000, 'Q7M4KP'],
  ['pilot_preview_open', 1786600010000, 'Q7M4KP'],
  ['pilot_started', 1786600020000, 'Q7M4KP'],
  ['checkin_open', 1786600030000, 'Q7M4KP'],
  ['task_open', 1786600040000, 'Q7M4KP'],
  ['pilot_open', 1786600100000, 'J6R8PM']
].map(([signalType, timestamp, inviteCode], index) => ({
  value: JSON.stringify({
    type: 'visit_signal', signalType, timestamp,
    museumName: signalType === 'checkin_open' ? '故宫博物院' : '',
    pilotContext: { inviteCode, pilotSessionId: `pilot-test-${index}`, city: '北京' },
    parameters: {}
  })
}));

test('shows anonymous invite-code funnel without personal identifiers', async ({ page }) => {
  await page.route('**/default/keyValueStore?key=museumcheck-visit-signals&sortKey=*', route =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ value: JSON.stringify(mockSignals) }) })
  );
  await page.goto('/admin/pilot-metrics.html?admin=1');
  await expect(page.getByRole('heading', { name: '一张邀请链接，走到了哪一步？' })).toBeVisible();
  await expect(page.locator('#inviteSelect')).toHaveValue('J6R8PM');
  await page.locator('#inviteSelect').selectOption('Q7M4KP');
  await expect(page.locator('#openCount')).toHaveText('1');
  await expect(page.locator('#previewCount')).toHaveText('1');
  await expect(page.locator('#startCount')).toHaveText('1');
  await expect(page.locator('#completeCount')).toHaveText('0');
  await expect(page.locator('#timeline')).toContainText('打开任务');
  await expect(page.locator('body')).not.toContainText('phone');
});
