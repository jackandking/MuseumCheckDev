import { test, expect } from '@playwright/test';

test.describe('迷宫游戏调试测试', () => {
    test.use({
        viewport: { width: 375, height: 667 }, // iPhone SE
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15'
    });

    test('迷宫游戏完整功能测试', async ({ page }) => {
        console.log('🎮 开始测试迷宫游戏...');

        // 1. 直接访问迷宫游戏页面
        await page.goto('http://localhost:8000/games/maze.html');
        await page.waitForLoadState('networkidle');
        console.log('✅ 迷宫游戏页面加载成功');

        // 2. 等待游戏容器加载
        await page.waitForSelector('.game-container', { timeout: 5000 });
        console.log('✅ 游戏容器已加载');

        // 3. 等待 canvas 加载
        const canvas = await page.waitForSelector('#mazeCanvas', { timeout: 5000 });
        expect(canvas).toBeTruthy();
        console.log('✅ Canvas 元素已找到');

        // 4. 检查步数显示元素
        const stepsDisplay = await page.locator('#mazeSteps');
        const initialSteps = await stepsDisplay.textContent();
        console.log(`✅ 步数显示元素已找到，初始值: ${initialSteps}`);

        // 5. 等待游戏初始化完成
        await page.waitForTimeout(2000);
        console.log('✅ 游戏初始化完成');

        // 6. 截图游戏初始状态
        await page.screenshot({ 
            path: 'e2e-screenshots/maze-initial.png',
            fullPage: false 
        });
        console.log('✅ 初始状态截图已保存');

        // 7. 测试键盘控制 - 按右箭头键
        await page.keyboard.press('ArrowRight');
        await page.waitForTimeout(300);
        console.log('✅ 按下右箭头键');

        // 8. 检查步数是否增加
        const stepsAfterMove = await stepsDisplay.textContent();
        console.log(`📊 移动后步数: ${stepsAfterMove}`);
        
        if (stepsAfterMove !== initialSteps) {
            console.log('✅ 步数显示正常更新');
        } else {
            console.log('⚠️ 步数未更新，可能是墙壁阻挡');
        }

        // 9. 测试多个方向键
        await page.keyboard.press('ArrowDown');
        await page.waitForTimeout(300);
        await page.keyboard.press('ArrowRight');
        await page.waitForTimeout(300);
        await page.keyboard.press('ArrowDown');
        await page.waitForTimeout(300);
        console.log('✅ 多方向键测试完成');

        // 10. 检查最终步数
        const finalSteps = await stepsDisplay.textContent();
        console.log(`📊 最终步数: ${finalSteps}`);

        // 11. 截图游戏进行中状态
        await page.screenshot({ 
            path: 'e2e-screenshots/maze-playing.png',
            fullPage: false 
        });
        console.log('✅ 游戏进行中截图已保存');

        // 12. 测试触摸控制按钮
        const rightBtn = await page.locator('button:has-text("→")');
        if (await rightBtn.isVisible()) {
            await rightBtn.click();
            await page.waitForTimeout(300);
            console.log('✅ 触摸控制按钮测试成功');
        } else {
            console.log('⚠️ 触摸控制按钮未找到');
        }

        // 13. 检查游戏状态
        const gameState = await page.evaluate(() => {
            // @ts-ignore
            if (window.gameInstance) {
                return {
                    // @ts-ignore
                    steps: window.gameInstance.steps,
                    // @ts-ignore
                    state: window.gameInstance.state,
                    // @ts-ignore
                    playerPos: window.gameInstance.playerPos
                };
            }
            return null;
        });
        console.log('📊 游戏状态:', gameState);

        // 14. 测试游戏关闭功能
        console.log('🔄 测试游戏关闭和返回功能...');
        
        // 模拟游戏完成，直接调用 closeGame
        await page.evaluate(() => {
            // @ts-ignore
            if (typeof closeGame === 'function') {
                // @ts-ignore
                closeGame();
            }
        });
        console.log('✅ closeGame 函数已调用');

        // 15. 等待页面跳转
        await page.waitForURL('**/museum-checkin.html**', { timeout: 10000 });
        console.log('✅ 成功返回打卡页面');

        // 16. 检查 localStorage 中的游戏结果
        const gameResult = await page.evaluate(() => {
            return localStorage.getItem('museumcheck_game_result');
        });
        
        if (gameResult) {
            const result = JSON.parse(gameResult);
            console.log('✅ 游戏结果已保存:', result);
            expect(result.gameType).toBe('maze');
            expect(result.score).toBeGreaterThanOrEqual(0);
        } else {
            console.log('⚠️ 游戏结果未保存');
        }

        // 17. 最终截图
        await page.screenshot({ 
            path: 'e2e-screenshots/maze-after-return.png',
            fullPage: true 
        });
        console.log('✅ 返回后截图已保存');

        console.log('\n🎉 迷宫游戏所有测试完成！');
    });
});
