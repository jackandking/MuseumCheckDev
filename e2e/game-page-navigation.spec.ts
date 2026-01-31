import { test, expect } from '@playwright/test';

test.describe('游戏页面跳转流程测试', () => {
    test.use({
        viewport: { width: 375, height: 667 }, // iPhone SE
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15'
    });

    test('完整的游戏选择-跳转-返回流程', async ({ page }) => {
        // 1. 访问打卡页面
        await page.goto('http://localhost:8000/museum-checkin.html?museum=capital');
        await page.waitForLoadState('networkidle');
        
        console.log('✅ 打卡页面加载成功');

        // 2. 等待页面加载完成
        await page.waitForSelector('.task-card', { timeout: 10000 });
        
        // 3. 点击第一个任务
        const firstTask = page.locator('.task-card').first();
        await firstTask.click();
        await page.waitForTimeout(500);
        
        console.log('✅ 任务卡片点击成功');

        // 4. 模拟上传照片（直接标记为已完成）
        await page.evaluate(() => {
            // @ts-ignore
            if (window.taskPhotos) {
                // @ts-ignore
                window.taskPhotos[0] = 'data:image/png;base64,test';
            }
        });

        // 5. 点击完成按钮
        const completeBtn = page.locator('#completeTaskBtn');
        if (await completeBtn.isVisible()) {
            await completeBtn.click();
            await page.waitForTimeout(1000);
            console.log('✅ 任务完成按钮点击成功');
        }

        // 6. 等待游戏选择界面出现
        await page.waitForSelector('.game-choice-overlay.show', { timeout: 5000 });
        console.log('✅ 游戏选择界面显示成功');

        // 7. 截图查看游戏选择界面
        await page.screenshot({ 
            path: 'e2e-screenshots/game-choice-claymorphism.png',
            fullPage: false 
        });
        console.log('✅ 游戏选择界面截图已保存');

        // 8. 点击迷宫游戏
        const mazeGame = page.locator('.game-choice-card[data-game="maze"]');
        await mazeGame.click();
        console.log('✅ 迷宫游戏按钮点击成功');

        // 9. 等待跳转到游戏页面
        await page.waitForURL('**/games/maze.html', { timeout: 5000 });
        console.log('✅ 成功跳转到迷宫游戏页面');

        // 10. 等待游戏加载
        await page.waitForSelector('.game-container', { timeout: 5000 });
        await page.waitForTimeout(1000);
        
        // 11. 截图游戏页面
        await page.screenshot({ 
            path: 'e2e-screenshots/maze-game-page.png',
            fullPage: false 
        });
        console.log('✅ 迷宫游戏页面截图已保存');

        // 12. 检查 localStorage 中是否有游戏上下文
        const gameContext = await page.evaluate(() => {
            return localStorage.getItem('museumcheck_game_context');
        });
        expect(gameContext).toBeTruthy();
        console.log('✅ 游戏上下文已保存到 localStorage');

        // 13. 模拟游戏完成，点击继续游览按钮
        await page.waitForTimeout(2000);
        
        // 直接调用 closeGame 函数
        await page.evaluate(() => {
            // @ts-ignore
            if (typeof closeGame === 'function') {
                // @ts-ignore
                closeGame();
            }
        });
        console.log('✅ 游戏关闭函数调用成功');

        // 14. 等待返回打卡页面
        await page.waitForURL('**/museum-checkin.html', { timeout: 5000 });
        console.log('✅ 成功返回打卡页面');

        // 15. 检查是否有游戏结果
        const gameResult = await page.evaluate(() => {
            return localStorage.getItem('museumcheck_game_result');
        });
        console.log('游戏结果:', gameResult ? '已保存' : '未保存');

        // 16. 等待页面处理游戏结果
        await page.waitForTimeout(2000);

        // 17. 截图返回后的页面
        await page.screenshot({ 
            path: 'e2e-screenshots/after-game-return.png',
            fullPage: true 
        });
        console.log('✅ 返回后页面截图已保存');

        console.log('\n🎉 完整流程测试成功！');
    });
});
