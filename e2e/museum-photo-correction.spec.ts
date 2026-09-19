import { test, expect, Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

/**
 * M1 e2e：馆图/镇馆之宝图片纠错 · 提交侧
 * 不依赖生产网络 —— 用 route 拦截 /image/upload 与 KV PUT，断言候选对象结构正确写出。
 *
 * 2026-09-19 交互改版：
 *  - 按钮不再全局悬浮，改为任务弹窗内图片正下方的内联按钮（setTarget 惰性注入）。
 *  - 反馈目标跟随当前展示图片：museum（馆图）/ collection（镇馆之宝图片）。
 *  - 无图（target=null）时按钮隐藏。
 */

const FAKE_UPLOAD_URL = 'https://museumcheck.cn/images/fake-candidate.jpg';
const FAKE_ORIGINAL_URL = 'https://museumcheck.cn/images/fake-original.jpg';
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

/** 打开打卡页 + 第一个任务弹窗（与其他 checkin spec 一致的既有模式） */
async function openTaskModal(page: Page) {
  await page.goto('/museum-checkin.html?museum=forbidden-city&age=7-12');
  await expect(page.locator('#taskGrid')).toBeVisible();
  await page.waitForSelector('.task-card', { timeout: 10000 });
  await page.locator('.task-card:not(.poster-card):not(.add-task-card)').first().click();
  await expect(page.locator('#taskModal')).toHaveClass(/show/);
}

test.describe('馆图纠错 · 提交侧 (M1)', () => {
  const captured: any[] = [];

  test.beforeAll(() => { tmpImagePath = makeTmpImage(); });
  test.afterAll(() => { try { if (tmpImagePath) fs.unlinkSync(tmpImagePath); } catch (_) {} });

  test('弹窗内图片下方显示反馈按钮（museum 目标），提交后写入 pending 候选', async ({ page }) => {
    captured.length = 0;
    await mockBackendRoutes(page, captured);
    await openTaskModal(page);

    // 打开反馈 modal（openTaskDetail 已随任务打开自动调用 setTarget，这里显式指定 museum 目标覆盖）
    await page.evaluate((url) => {
      window.MuseumPhotoCorrection.setTarget({ type: 'museum', imageUrl: url });
    }, FAKE_ORIGINAL_URL);

    // 按钮出现在弹窗内且可见
    const btn = page.locator('#mcPhotoCorrection-btn');
    await expect(btn).toBeVisible();
    await expect(btn).toContainText('馆图不对');

    // 打开反馈 modal
    await btn.click();
    const modal = page.locator('#mcPhotoCorrection-modal');
    await expect(modal).toBeVisible();

    // 缺原因 / 缺照片应被拦截
    await page.locator('#mcPhotoCorrection-submit').click();
    await expect(page.locator('#mcPhotoCorrection-status')).toContainText('请填写图片哪里不对');

    // 填原因 + 上传照片
    await page.locator('#mcPhotoCorrection-reason').fill('这不是正门，是侧门');
    await page.locator('#mcPhotoCorrection-file').setInputFiles(tmpImagePath);

    // 提交
    await page.locator('#mcPhotoCorrection-submit').click();

    // 成功状态出现（modal 1.8s 后自动关闭，故先断言成功文案）
    await expect(page.locator('#mcPhotoCorrection-status')).toContainText('已提交', { timeout: 15000 });

    // 断言 KV 捕获的候选对象结构正确（页面可能还会写其它 KV，过滤出候选记录）
    await expect.poll(() => captured.length, { timeout: 15000 }).toBeGreaterThan(0);
    const body = captured.find((c) => c.key === 'museumcheck-photo-candidates');
    expect(body).toBeTruthy();
    const value = JSON.parse(body.value);
    expect(value.museumId).toBe('forbidden-city');
    expect(value.target).toBe('museum');
    expect(value.originalImageUrl).toBe(FAKE_ORIGINAL_URL);
    expect(value.source).toBe('upload');
    expect(value.status).toBe('pending');
    expect(value.candidateImageUrl).toBe(FAKE_UPLOAD_URL);
    expect(value.reason).toBe('这不是正门，是侧门');
    expect(typeof value.id).toBe('string');
    expect(typeof value.submittedAt).toBe('string');
  });

  test('镇馆之宝目标：候选记录带 target=collection 与 collectionName', async ({ page }) => {
    captured.length = 0;
    await mockBackendRoutes(page, captured);
    await openTaskModal(page);

    await page.evaluate((url) => {
      window.MuseumPhotoCorrection.setTarget({ type: 'collection', name: '玉玦', imageUrl: url });
    }, FAKE_ORIGINAL_URL);

    const btn = page.locator('#mcPhotoCorrection-btn');
    await expect(btn).toBeVisible();
    await expect(btn).toContainText('图片不对');

    await btn.click();
    await expect(page.locator('#mcPhotoCorrection-modal')).toBeVisible();
    await expect(page.locator('#mcPhotoCorrection-modal h3')).toContainText('镇馆之宝');

    await page.locator('#mcPhotoCorrection-reason').fill('图片不是这件文物');
    await page.locator('#mcPhotoCorrection-file').setInputFiles(tmpImagePath);
    await page.locator('#mcPhotoCorrection-submit').click();
    await expect(page.locator('#mcPhotoCorrection-status')).toContainText('已提交', { timeout: 15000 });

    await expect.poll(() => captured.length, { timeout: 15000 }).toBeGreaterThan(0);
    const candBody = captured.find((c) => c.key === 'museumcheck-photo-candidates');
    expect(candBody).toBeTruthy();
    const value = JSON.parse(candBody.value);
    expect(value.target).toBe('collection');
    expect(value.collectionName).toBe('玉玦');
    expect(value.originalImageUrl).toBe(FAKE_ORIGINAL_URL);
    expect(value.status).toBe('pending');
  });

  test('无目标（setTarget null）时按钮隐藏', async ({ page }) => {
    captured.length = 0;
    await mockBackendRoutes(page, captured);
    await openTaskModal(page);

    await page.evaluate((url) => {
      window.MuseumPhotoCorrection.setTarget({ type: 'museum', imageUrl: url });
    }, FAKE_ORIGINAL_URL);
    await expect(page.locator('#mcPhotoCorrection-btn')).toBeVisible();

    await page.evaluate(() => {
      window.MuseumPhotoCorrection.setTarget(null);
    });
    await expect(page.locator('#mcPhotoCorrection-btn')).toBeHidden();
  });

  test('无 museum 参数的页面不注入反馈按钮', async ({ page }) => {
    await mockBackendRoutes(page, captured);
    await page.goto('/leaderboard.html');
    await expect(page.locator('#mcPhotoCorrection-btn')).toHaveCount(0);
  });

  /**
   * 回归守卫：openTaskDetail 打开任务弹窗时必须「自动」调用 setTarget 注入按钮。
   * 之前的线上事故：museum-checkin.js 因 CDN 按 query 缓存了旧版（无 setTarget 调用），
   * 导致按钮永不出现——而旧用例都在手动 setTarget，掩盖了该问题。此用例不手动调用。
   */
  test('打开门口打卡弹窗时自动显示反馈按钮（openTaskDetail 自动 setTarget）', async ({ page }) => {
    captured.length = 0;
    await mockBackendRoutes(page, captured);
    // 找「门口打卡」卡片（有馆图，target=museum），不手动 setTarget
    await page.goto('/museum-checkin.html?museum=forbidden-city&age=7-12');
    await expect(page.locator('#taskGrid')).toBeVisible();
    await page.waitForSelector('.task-card', { timeout: 10000 });
    const card = page.locator('.task-card', { hasText: '门口打卡' }).first();
    await card.click();
    await expect(page.locator('#taskModal')).toHaveClass(/show/);

    const btn = page.locator('#mcPhotoCorrection-btn');
    await expect(btn).toBeVisible({ timeout: 10000 });
    await expect(btn).toContainText('馆图不对');
  });
});
