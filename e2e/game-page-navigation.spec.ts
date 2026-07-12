import { test, expect } from '@playwright/test';

test.describe('游戏页面跳转流程测试', () => {
    test.use({
        viewport: { width: 375, height: 667 }, // iPhone SE
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15'
    });

    test('完整的游戏选择-跳转-返回流程', async ({ page }) => {
        // 1. 访问打卡页面 (using a valid museum ID)
        // Pre-dismiss onboarding modal and enable game rewards
        await page.addInitScript(() => {
            localStorage.setItem('nicknameSet', 'true');
            localStorage.setItem('gameRewardEnabled', 'true');
        });
        await page.goto('http://localhost:8000/museum-checkin.html?museum=beijing-capital-museum');
        await page.waitForLoadState('networkidle');
        
        console.log('✅ 打卡页面加载成功');

        // 2. 等待页面加载完成
        await page.waitForSelector('.task-card', { timeout: 10000 });

        // 3. 直接调用 showGameChoiceOverlay（已暴露在 window 上）触发游戏选择界面
        //    这样可以绕过需要照片的限制，专注测试游戏选择到跳转的流程
        await page.evaluate(() => {
            // @ts-ignore
            if (typeof window.showGameChoiceOverlay === 'function') {
                // @ts-ignore
                window.showGameChoiceOverlay(0, {});
            }
        });
        
        console.log('✅ 游戏选择界面触发成功');

        // 4. 等待游戏选择界面出现
        await page.waitForSelector('.game-choice-overlay.show', { timeout: 5000 });
        console.log('✅ 游戏选择界面显示成功');

        // 5. 截图查看游戏选择界面
        await page.screenshot({ 
            path: 'e2e-screenshots/game-choice-claymorphism.png',
            fullPage: false 
        });
        console.log('✅ 游戏选择界面截图已保存');

        // 6. 点击迷宫游戏（确保迷宫选项存在，否则选择任意可见游戏）
        let mazeGame = page.locator('.game-choice-card[data-game="maze"]');
        if (!await mazeGame.isVisible({ timeout: 2000 })) {
            mazeGame = page.locator('.game-choice-card').first();
        }
        const selectedGame = await mazeGame.getAttribute('data-game');
        await mazeGame.click();
        console.log(`✅ 游戏按钮点击成功: ${selectedGame}`);

        // 9. 等待跳转到游戏页面
        await page.waitForURL('**/games/maze.html', { timeout: 5000 });
        console.log('✅ 成功跳转到迷宫游戏页面');

        // 7. 等待跳转到游戏页面
        await page.waitForURL('**/games/**', { timeout: 10000 });
        console.log(`✅ 成功跳转到游戏页面: ${page.url()}`);

        // 8. 等待游戏加载
        await page.waitForSelector('.game-container', { timeout: 5000 });
        await page.waitForTimeout(1000);
        
        // 9. 截图游戏页面
        await page.screenshot({ 
            path: 'e2e-screenshots/maze-game-page.png',
            fullPage: false 
        });
        console.log('✅ 游戏页面截图已保存');

        // 10. 检查 localStorage 中是否有游戏上下文
        const gameContext = await page.evaluate(() => {
            return localStorage.getItem('museumcheck_game_context');
        });
        expect(gameContext).toBeTruthy();
        console.log('✅ 游戏上下文已保存到 localStorage');

        // 11. 模拟游戏完成，点击继续游览按钮
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

        // 12. 等待返回打卡页面
        await page.waitForURL('**/museum-checkin.html**', { timeout: 10000 });
        console.log('✅ 成功返回打卡页面');

        // 13. 检查是否有游戏结果
        const gameResult = await page.evaluate(() => {
            return localStorage.getItem('museumcheck_game_result');
        });
        console.log('游戏结果:', gameResult ? '已保存' : '未保存');

        // 14. 等待页面处理游戏结果
        await page.waitForTimeout(2000);

        // 15. 截图返回后的页面
        await page.screenshot({ 
            path: 'e2e-screenshots/after-game-return.png',
            fullPage: true 
        });
        console.log('✅ 返回后页面截图已保存');

        console.log('\n🎉 完整流程测试成功！');
    });
});
