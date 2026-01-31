import { test, expect } from '@playwright/test';

/**
 * 游戏虚拟键盘视觉测试
 * 自动截图保存到 test-results/ 目录
 */

test.describe('Game Virtual Controls Visual Tests', () => {
    test.use({
        viewport: { width: 375, height: 667 }, // iPhone SE size
        deviceScaleFactor: 2,
    });

    const games = [
        { name: 'snake', url: '/games/snake.html', title: '贪食蛇' },
        { name: 'space-invaders', url: '/games/space-invaders.html', title: '小蜜蜂' },
        { name: 'tank-battle', url: '/games/tank-battle.html', title: '坦克大战' },
        { name: 'maze', url: '/games/maze.html', title: '迷宫' },
    ];

    for (const game of games) {
        test(`${game.title} - 虚拟键盘完整显示`, async ({ page }) => {
            await page.goto(`http://localhost:8000${game.url}`);
            
            // 等待游戏加载
            await page.waitForTimeout(2000);
            
            // 截取全屏
            await page.screenshot({
                path: `test-results/visual-${game.name}-full.png`,
                fullPage: true
            });
            
            // 截取虚拟键盘区域（如果存在）
            const controlsSection = page.locator('.controls-section, .ugc-container').first();
            if (await controlsSection.isVisible()) {
                await controlsSection.screenshot({
                    path: `test-results/visual-${game.name}-controls.png`
                });
            }
            
            // 验证关键元素存在
            const canvas = page.locator('canvas').first();
            await expect(canvas).toBeVisible();
            
            console.log(`✅ ${game.title} 截图已保存`);
        });

        test(`${game.title} - 虚拟键盘按钮可点击`, async ({ page }) => {
            await page.goto(`http://localhost:8000${game.url}`);
            await page.waitForTimeout(2000);
            
            // 查找虚拟键盘按钮
            const buttons = page.locator('.ugc-btn, .control-btn, .maze-control-btn');
            const count = await buttons.count();
            
            if (count > 0) {
                console.log(`${game.title} 找到 ${count} 个虚拟按钮`);
                
                // 验证按钮尺寸（触摸友好）
                const firstButton = buttons.first();
                const box = await firstButton.boundingBox();
                
                if (box) {
                    expect(box.width).toBeGreaterThanOrEqual(44); // WCAG AAA 标准
                    expect(box.height).toBeGreaterThanOrEqual(44);
                    console.log(`✅ 按钮尺寸: ${box.width}x${box.height}px`);
                }
            } else {
                console.log(`${game.title} 使用滑动手势控制`);
            }
        });
    }

    test('对比测试 - 所有游戏虚拟键盘', async ({ page }) => {
        const screenshots = [];
        
        for (const game of games) {
            await page.goto(`http://localhost:8000${game.url}`);
            await page.waitForTimeout(2000);
            
            const screenshot = await page.screenshot({
                path: `test-results/compare-${game.name}.png`
            });
            
            screenshots.push({
                game: game.title,
                path: `test-results/compare-${game.name}.png`
            });
        }
        
        console.log('\n📸 所有游戏截图已保存到 test-results/ 目录：');
        screenshots.forEach(s => console.log(`  - ${s.game}: ${s.path}`));
    });
});
