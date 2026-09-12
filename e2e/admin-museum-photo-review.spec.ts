import { test, expect, Page } from '@playwright/test';

/**
 * M2 e2e：馆图纠错审核页（admin/museum-photo-review.html）
 * mock 后端 /api/kv/admin/* 三接口，验证列表渲染、通过/驳回流程与请求体结构。
 */

const PENDING = [
  {
    id: 'c-1',
    museumId: 'forbidden-city',
    submitterId: 'u-123',
    submittedAt: '2026-09-12T09:00:00Z',
    originalImageUrl: 'https://museumcheck.cn/images/old-1.jpg',
    candidateImageUrl: 'https://museumcheck.cn/images/new-1.jpg',
    source: 'upload',
    reason: '这不是正门',
    status: 'pending'
  },
  {
    id: 'c-2',
    museumId: 'national-museum',
    submitterId: 'u-456',
    submittedAt: '2026-09-12T10:00:00Z',
    originalImageUrl: 'https://museumcheck.cn/images/old-2.jpg',
    candidateImageUrl: 'https://museumcheck.cn/images/new-2.jpg',
    source: 'upload',
    reason: '图片过旧',
    status: 'pending'
  }
];

function mockBackend(page: Page, captured: any[]) {
  // 列表
  page.route('**/api/kv/admin/photo-candidates*', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, items: PENDING }) });
  });
  // 发布
  page.route('**/api/kv/admin/photo-candidate/publish', async (route) => {
    try { captured.push({ type: 'publish', body: JSON.parse(route.request().postData() || '{}') }); } catch (_) {}
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true }) });
  });
  // 驳回
  page.route('**/api/kv/admin/photo-candidate/reject', async (route) => {
    try { captured.push({ type: 'reject', body: JSON.parse(route.request().postData() || '{}') }); } catch (_) {}
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true }) });
  });
}

test.describe('馆图纠错审核页 (M2)', () => {
  const captured: any[] = [];

  test('加载待审列表，通过/驳回均正确调用后端并更新 UI', async ({ page }) => {
    captured.length = 0;
    mockBackend(page, captured);
    page.on('dialog', (d) => d.accept('确实不对')); // 驳回时的 prompt

    await page.goto('/admin/museum-photo-review.html');
    await page.locator('#adminKey').fill('test-admin-key');
    await page.locator('#loadBtn').click();

    // 两条待审渲染
    const cards = page.locator('.card');
    await expect(cards).toHaveCount(2);
    await expect(page.locator('#status')).toContainText('待审 2 条');

    // 第一条：原图 vs 候选并排
    await expect(cards.first().locator('img').first()).toHaveAttribute('src', 'https://museumcheck.cn/images/old-1.jpg');
    await expect(cards.first().locator('img').nth(1)).toHaveAttribute('src', 'https://museumcheck.cn/images/new-1.jpg');

    // 通过第一条
    await cards.first().locator('button[data-act="approve"]').click();
    await expect(page.locator('.toast')).toContainText('已发布', { timeout: 10000 });
    await expect(cards).toHaveCount(1);

    // 驳回第二条（会弹 prompt，已自动接受）
    await cards.first().locator('button[data-act="reject"]').click();
    await expect(page.locator('.empty')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('#status')).toContainText('待审 0 条');

    // 断言后端收到正确请求体
    const publish = captured.find((c) => c.type === 'publish');
    const reject = captured.find((c) => c.type === 'reject');
    expect(publish).toBeTruthy();
    expect(publish.body.museumId).toBe('forbidden-city');
    expect(publish.body.candidateId).toBe('c-1');
    expect(publish.body.candidateImageUrl).toBe('https://museumcheck.cn/images/new-1.jpg');
    expect(reject).toBeTruthy();
    expect(reject.body.museumId).toBe('national-museum');
    expect(reject.body.candidateId).toBe('c-2');
    expect(reject.body.reviewedNote).toBe('确实不对');
  });

  test('缺 admin key 时拒绝加载', async ({ page }) => {
    mockBackend(page, captured);
    await page.goto('/admin/museum-photo-review.html');
    // 不填 key 直接加载
    await page.locator('#loadBtn').click();
    await expect(page.locator('#status')).toContainText('请先填写 admin key');
    await expect(page.locator('.card')).toHaveCount(0);
  });
});
