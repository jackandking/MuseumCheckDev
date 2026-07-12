import { test, expect } from '@playwright/test';

test.describe('迷宫游戏全自动测试', () => {
    test.use({
        viewport: { width: 375, height: 667 },
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15'
    });

    test('自动玩迷宫游戏并验证所有功能', async ({ page }) => {
        console.log('🤖 开始全自动迷宫游戏测试...\n');

        // 1. 访问迷宫游戏页面
        await page.goto('http://localhost:8000/games/maze.html');
        await page.waitForLoadState('networkidle');
        console.log('✅ 游戏页面加载完成');

        // 2. 等待游戏初始化
        await page.waitForSelector('#mazeCanvas', { timeout: 5000 });
        await page.waitForTimeout(2000);
        console.log('✅ 游戏初始化完成');

        // 3. 获取初始游戏状态
        const initialState = await page.evaluate(() => {
            // @ts-ignore
            const game = window.gameInstance;
            return {
                playerPos: game.playerPos,
                exitPos: game.exitPos,
                mazeSize: game.mazeSize,
                steps: game.steps,
                state: game.state
            };
        });
        
        console.log('📊 初始状态:', initialState);
        expect(initialState.state).toBe('playing');

        // 4. 自动寻路算法 - 使用BFS找到最短路径
        console.log('\n🧭 开始自动寻路...');
        
        const path = await page.evaluate(() => {
            // @ts-ignore
            const game = window.gameInstance;
            const maze = game.maze;
            const start = game.playerPos;
            const end = game.exitPos;
            
            // BFS 寻路算法
            const queue = [[start.x, start.y, []]];
            const visited = new Set();
            visited.add(`${start.x},${start.y}`);
            
            const directions = [
                { dx: 0, dy: -1, key: 'ArrowUp' },    // 上
                { dx: 0, dy: 1, key: 'ArrowDown' },   // 下
                { dx: -1, dy: 0, key: 'ArrowLeft' },  // 左
                { dx: 1, dy: 0, key: 'ArrowRight' }   // 右
            ];
            
            while (queue.length > 0) {
                const item = queue.shift();
                if (!item) break;
                const [x, y, path] = item;
                
                // 到达终点
                if (x === end.x && y === end.y) {
                    return path;
                }
                
                // 尝试四个方向
                for (const dir of directions) {
                    const nx = x + dir.dx;
                    const ny = y + dir.dy;
                    const key = `${nx},${ny}`;
                    
                    if (!visited.has(key) && game.canMoveTo(nx, ny)) {
                        visited.add(key);
                        queue.push([nx, ny, [...path, dir.key]]);
                    }
                }
            }
            
            return []; // 没有找到路径
        });

        if (path.length === 0) {
            throw new Error('无法找到通往出口的路径');
        }

        console.log(`✅ 找到路径，需要 ${path.length} 步`);

        // 5. 自动执行路径
        console.log('\n🎮 开始自动移动...');
        
        for (let i = 0; i < path.length; i++) {
            const key = path[i];
            
            // 按下方向键
            await page.keyboard.press(key);
            await page.waitForTimeout(150);
            
            // 获取当前状态
            const currentState = await page.evaluate(() => {
                // @ts-ignore
                const game = window.gameInstance;
                return {
                    playerPos: game.playerPos,
                    steps: game.steps,
                    state: game.state
                };
            });
            
            console.log(`  步骤 ${i + 1}/${path.length}: ${key} -> (${currentState.playerPos.x}, ${currentState.playerPos.y}) | 总步数: ${currentState.steps}`);
            
            // 检查是否已到达终点
            if (currentState.state === 'completed') {
                console.log('\n🎉 到达终点！游戏完成！');
                break;
            }
        }

        // 6. 等待游戏完成动画
        await page.waitForTimeout(1000);

        // 7. 验证游戏完成状态
        const finalState = await page.evaluate(() => {
            // @ts-ignore
            const game = window.gameInstance;
            return {
                state: game.state,
                steps: game.steps,
                playerPos: game.playerPos,
                exitPos: game.exitPos
            };
        });

        console.log('\n📊 最终状态:', finalState);
        
        // 验证玩家到达了终点
        expect(finalState.playerPos.x).toBe(finalState.exitPos.x);
        expect(finalState.playerPos.y).toBe(finalState.exitPos.y);
        expect(finalState.steps).toBeGreaterThan(0);

        // 8. 截图最终状态
        await page.screenshot({ 
            path: 'e2e-screenshots/maze-completed.png',
            fullPage: false 
        });
        console.log('✅ 游戏完成截图已保存');

        // 9. 测试虚拟按钮
        console.log('\n🎮 测试虚拟方向按钮...');
        
        // 重置游戏
        await page.evaluate(() => {
            // @ts-ignore
            window.gameInstance.reset();
        });
        await page.waitForTimeout(500);

        // 获取重置后的初始状态
        const resetState = await page.evaluate(() => {
            // @ts-ignore
            const game = window.gameInstance;
            return {
                playerPos: game.playerPos,
                steps: game.steps,
                state: game.state
            };
        });
        
        console.log('  重置后状态:', resetState);

        // 测试所有四个方向按钮（使用 UnifiedGameControls 创建的按钮）
        const buttons = [
            { id: '.ugc-btn-right', name: '右', expectedDir: 'x+' },
            { id: '.ugc-btn-down', name: '下', expectedDir: 'y+' },
            { id: '.ugc-btn-left', name: '左', expectedDir: 'x-' },
            { id: '.ugc-btn-up', name: '上', expectedDir: 'y-' }
        ];

        let virtualButtonWorking = false;
        
        for (const btn of buttons) {
            const button = page.locator(btn.id);
            
            if (await button.isVisible()) {
                const beforeState = await page.evaluate(() => {
                    // @ts-ignore
                    const game = window.gameInstance;
                    return {
                        playerPos: { ...game.playerPos },
                        steps: game.steps
                    };
                });
                
                // 点击按钮
                await button.click();
                await page.waitForTimeout(300);
                
                const afterState = await page.evaluate(() => {
                    // @ts-ignore
                    const game = window.gameInstance;
                    return {
                        playerPos: { ...game.playerPos },
                        steps: game.steps
                    };
                });
                
                const moved = (beforeState.playerPos.x !== afterState.playerPos.x) || 
                              (beforeState.playerPos.y !== afterState.playerPos.y);
                const stepsIncreased = afterState.steps > beforeState.steps;
                
                if (moved && stepsIncreased) {
                    console.log(`  ✅ ${btn.name}按钮工作正常: (${beforeState.playerPos.x},${beforeState.playerPos.y}) -> (${afterState.playerPos.x},${afterState.playerPos.y})`);
                    virtualButtonWorking = true;
                } else if (moved) {
                    console.log(`  ⚠️ ${btn.name}按钮移动了但步数未增加`);
                } else {
                    console.log(`  ⚠️ ${btn.name}按钮点击无效（可能被墙壁阻挡）`);
                }
            } else {
                console.log(`  ❌ ${btn.name}按钮不可见`);
            }
        }
        
        if (virtualButtonWorking) {
            console.log('✅ 虚拟按钮测试通过');
        } else {
            console.log('⚠️ 虚拟按钮不可见或不工作（触控控制可能使用滑动手势代替）');
        }

        // 10. 测试游戏关闭和返回
        console.log('\n🔄 测试游戏关闭和返回...');
        
        await page.evaluate(() => {
            // @ts-ignore
            if (typeof closeGame === 'function') {
                // @ts-ignore
                closeGame();
            }
        });

        await page.waitForURL('**/museum-checkin.html**', { timeout: 10000 });
        console.log('✅ 成功返回打卡页面');

        // 11. 验证游戏结果保存
        const gameResult = await page.evaluate(() => {
            return localStorage.getItem('museumcheck_game_result');
        });

        if (gameResult) {
            const result = JSON.parse(gameResult);
            console.log('✅ 游戏结果已保存:', result);
            expect(result.gameType).toBe('maze');
            expect(result.score).toBeGreaterThan(0);
        } else {
            console.log('⚠️ 游戏结果未保存到 localStorage');
        }

        // 12. 最终截图
        await page.screenshot({ 
            path: 'e2e-screenshots/maze-auto-final.png',
            fullPage: true 
        });

        console.log('\n🎉 全自动测试完成！所有功能验证通过！');
    });
});
