import { test, expect, Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

/**
 * M1 e2e：馆图纠错 · 提交侧
 * 不依赖生产网络 —— 用 route 拦截 /image/upload 与 KV PUT，断言候选对象结构正确写出。
 */

const FAKE_UPLOAD_URL = 'https://museumcheck.cn/images/fake-candidate.jpg';
const PNG_1x1 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+M8AAAMBAQDJ/pLvAAAAAElFTkSuQmCC';

let tmpImagePath: string;

function makeTmpImage() {
  const p = path.join(__dirname, '..', 'test-results', `pc-${Date.now()}.png`);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, Buffer.from(PNG_1x1, 'base64'));
  return p;
}

async function mockBackendRoutes(page: Page, captured: any[]) {
  // 上传替代照：返回假 URL
  await page.route('**/image/upload', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ url: FAKE_UPLOAD_URL }),
    });
  });
  // KV 写入：捕获候选对象
  await page.route('**/default/keyValueStore', async (route) => {
    const req = route.request();
    if (req.method() === 'POST') {
      try {
        const body = JSON.parse(req.postData() || '{}');
        captured.push(body);
      } catch (_) { /* ignore */ }
    }
    await route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
  });
}

test.describe('馆图纠错 · 提交侧 (M1)', () => {
  const captured: any[] = [];

  test.beforeAll(() => { tmpImagePath = makeTmpImage(); });
  test.afterAll(() => { try { if (tmpImagePath) fs.unlinkSync(tmpImagePath); } catch (_) {} });

  test('打卡页显示反馈按钮，提交后写入 pending 候选', async ({ page }) => {
    captured.length = 0;
    await mockBackendRoutes(page, captured);

    await page.goto('/museum-checkin.html?museum=forbidden-city&age=7-12');
    await expect(page.locator('#taskGrid')).toBeVisible();

    // 悬浮反馈按钮出现
    const btn = page.locator('#mcPhotoCorrection-btn');
    await expect(btn).toBeVisible();

    // 打开 modal
    await btn.click();
    const modal = page.locator('#mcPhotoCorrection-modal');
    await expect(modal).toBeVisible();

    // 缺原因 / 缺照片应被拦截
    await page.locator('#mcPhotoCorrection-submit').click();
    await expect(page.locator('#mcPhotoCorrection-status')).toContainText('请填写馆图哪里不对');

    // 填原因 + 上传照片
    await page.locator('#mcPhotoCorrection-reason').fill('这不是正门，是侧门');
    await page.locator('#mcPhotoCorrection-file').setInputFiles(tmpImagePath);

    // 提交
    await page.locator('#mcPhotoCorrection-submit').click();

    // 成功状态出现（modal 1.8s 后自动关闭，故先断言成功文案）
    await expect(page.locator('#mcPhotoCorrection-status')).toContainText('已提交', { timeout: 15000 });

    // 断言 KV 捕获的候选对象结构正确
    await expect.poll(() => captured.length, { timeout: 15000 }).toBeGreaterThan(0);
    const body = captured[0];
    expect(body.key).toBe('museumcheck-photo-candidates');
    const value = JSON.parse(body.value);
    expect(value.museumId).toBe('forbidden-city');
    expect(value.source).toBe('upload');
    expect(value.status).toBe('pending');
    expect(value.candidateImageUrl).toBe(FAKE_UPLOAD_URL);
    expect(value.reason).toBe('这不是正门，是侧门');
    expect(typeof value.id).toBe('string');
    expect(typeof value.submittedAt).toBe('string');
  });

  test('无 museum 参数的页面不显示反馈按钮', async ({ page }) => {
    await mockBackendRoutes(page, captured);
    await page.goto('/leaderboard.html');
    await expect(page.locator('#mcPhotoCorrection-btn')).toHaveCount(0);
  });
});
