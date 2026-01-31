import { test } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

/**
 * 自动化视觉分析 - 生成详细的UI报告
 * AI可以读取这个报告来"看到"UI问题
 */

test.describe('Visual Analysis Report', () => {
    test.use({
        viewport: { width: 375, height: 667 },
        deviceScaleFactor: 2,
    });

    const games = [
        { name: 'snake', url: '/games/snake.html', title: '贪食蛇' },
        { name: 'space-invaders', url: '/games/space-invaders.html', title: '小蜜蜂' },
        { name: 'tank-battle', url: '/games/tank-battle.html', title: '坦克大战' },
        { name: 'maze', url: '/games/maze.html', title: '迷宫' },
    ];

    test('生成所有游戏的视觉分析报告', async ({ page }) => {
        const report: any = {
            timestamp: new Date().toISOString(),
            viewport: { width: 375, height: 667 },
            games: []
        };

        for (const game of games) {
            console.log(`\n📊 分析 ${game.title}...`);
            
            await page.goto(`http://localhost:8000${game.url}`);
            await page.waitForTimeout(2000);

            const gameReport: any = {
                name: game.title,
                url: game.url,
                screenshot: `test-results/visual-${game.name}-full.png`,
                analysis: {}
            };

            // 1. 分析画布
            const canvas = page.locator('canvas').first();
            if (await canvas.isVisible()) {
                const canvasBox = await canvas.boundingBox();
                gameReport.analysis.canvas = {
                    visible: true,
                    position: canvasBox,
                    inViewport: canvasBox ? (canvasBox.y >= 0 && canvasBox.y + canvasBox.height <= 667) : false
                };
                console.log(`  ✅ 画布: ${canvasBox?.width}x${canvasBox?.height}px at (${canvasBox?.x}, ${canvasBox?.y})`);
            }

            // 2. 分析虚拟键盘
            const controlsContainer = page.locator('.controls-section, .ugc-container').first();
            if (await controlsContainer.isVisible()) {
                const containerBox = await controlsContainer.boundingBox();
                
                // 查找所有按钮
                const buttons = page.locator('.ugc-btn, .control-btn, .maze-control-btn');
                const buttonCount = await buttons.count();
                
                const buttonAnalysis: any = {
                    container: containerBox,
                    count: buttonCount,
                    buttons: []
                };

                // 分析每个按钮
                for (let i = 0; i < Math.min(buttonCount, 10); i++) {
                    const button = buttons.nth(i);
                    const box = await button.boundingBox();
                    const text = await button.textContent();
                    
                    if (box) {
                        const isVisible = box.x >= 0 && box.x + box.width <= 375 && 
                                        box.y >= 0 && box.y + box.height <= 667;
                        const isTouchFriendly = box.width >= 44 && box.height >= 44;
                        
                        buttonAnalysis.buttons.push({
                            index: i,
                            text: text?.trim() || '',
                            size: { width: box.width, height: box.height },
                            position: { x: box.x, y: box.y },
                            visible: isVisible,
                            touchFriendly: isTouchFriendly,
                            issues: [
                                !isVisible ? '❌ 按钮在屏幕外' : null,
                                !isTouchFriendly ? '⚠️ 按钮太小 (需要≥44x44px)' : null
                            ].filter(Boolean)
                        });

                        const status = isVisible && isTouchFriendly ? '✅' : '❌';
                        console.log(`  ${status} 按钮${i+1}: ${box.width}x${box.height}px at (${box.x}, ${box.y})`);
                    }
                }

                gameReport.analysis.controls = buttonAnalysis;

                // 检查是否有按钮被截断
                const hiddenButtons = buttonAnalysis.buttons.filter((b: any) => !b.visible);
                if (hiddenButtons.length > 0) {
                    console.log(`  ❌ 发现 ${hiddenButtons.length} 个按钮在屏幕外！`);
                }
            } else {
                gameReport.analysis.controls = {
                    type: 'gesture',
                    note: '使用滑动手势控制'
                };
                console.log(`  ℹ️ 使用滑动手势控制`);
            }

            // 3. 分析布局问题
            const issues: string[] = [];
            
            // 检查虚拟键盘是否遮挡画布
            if (gameReport.analysis.canvas && gameReport.analysis.controls?.container) {
                const canvasBottom = gameReport.analysis.canvas.position.y + gameReport.analysis.canvas.position.height;
                const controlsTop = gameReport.analysis.controls.container.y;
                
                if (canvasBottom > controlsTop) {
                    issues.push('❌ 虚拟键盘遮挡游戏画布');
                    console.log(`  ❌ 虚拟键盘遮挡画布`);
                }
            }

            // 检查按钮是否太小
            if (gameReport.analysis.controls?.buttons) {
                const smallButtons = gameReport.analysis.controls.buttons.filter((b: any) => !b.touchFriendly);
                if (smallButtons.length > 0) {
                    issues.push(`⚠️ ${smallButtons.length} 个按钮小于44x44px`);
                }
            }

            gameReport.analysis.issues = issues;
            report.games.push(gameReport);

            // 截图
            await page.screenshot({
                path: gameReport.screenshot,
                fullPage: true
            });
        }

        // 保存报告为JSON
        const reportPath = 'test-results/visual-analysis-report.json';
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
        console.log(`\n📄 报告已保存: ${reportPath}`);

        // 生成人类可读的Markdown报告
        const mdReport = generateMarkdownReport(report);
        const mdPath = 'test-results/visual-analysis-report.md';
        fs.writeFileSync(mdPath, mdReport);
        console.log(`📄 Markdown报告: ${mdPath}`);
    });
});

function generateMarkdownReport(report: any): string {
    let md = `# 游戏UI视觉分析报告\n\n`;
    md += `**生成时间:** ${new Date(report.timestamp).toLocaleString('zh-CN')}\n`;
    md += `**测试设备:** ${report.viewport.width}x${report.viewport.height}px (iPhone SE)\n\n`;
    md += `---\n\n`;

    for (const game of report.games) {
        md += `## ${game.name}\n\n`;
        md += `**截图:** \`${game.screenshot}\`\n\n`;

        // 画布分析
        if (game.analysis.canvas) {
            const c = game.analysis.canvas;
            md += `### 游戏画布\n`;
            md += `- **尺寸:** ${c.position.width}x${c.position.height}px\n`;
            md += `- **位置:** (${c.position.x}, ${c.position.y})\n`;
            md += `- **完全可见:** ${c.inViewport ? '✅ 是' : '❌ 否'}\n\n`;
        }

        // 虚拟键盘分析
        if (game.analysis.controls) {
            if (game.analysis.controls.type === 'gesture') {
                md += `### 控制方式\n`;
                md += `${game.analysis.controls.note}\n\n`;
            } else {
                md += `### 虚拟键盘\n`;
                md += `- **按钮数量:** ${game.analysis.controls.count}\n`;
                md += `- **容器位置:** (${game.analysis.controls.container.x}, ${game.analysis.controls.container.y})\n\n`;

                if (game.analysis.controls.buttons.length > 0) {
                    md += `#### 按钮详情\n\n`;
                    md += `| # | 文字 | 尺寸 | 位置 | 可见 | 触摸友好 | 问题 |\n`;
                    md += `|---|------|------|------|------|----------|------|\n`;

                    for (const btn of game.analysis.controls.buttons) {
                        const size = `${btn.size.width}x${btn.size.height}`;
                        const pos = `(${Math.round(btn.position.x)}, ${Math.round(btn.position.y)})`;
                        const visible = btn.visible ? '✅' : '❌';
                        const touchFriendly = btn.touchFriendly ? '✅' : '❌';
                        const issues = btn.issues.length > 0 ? btn.issues.join(', ') : '-';
                        
                        md += `| ${btn.index + 1} | ${btn.text || '-'} | ${size} | ${pos} | ${visible} | ${touchFriendly} | ${issues} |\n`;
                    }
                    md += `\n`;
                }
            }
        }

        // 问题总结
        if (game.analysis.issues && game.analysis.issues.length > 0) {
            md += `### ⚠️ 发现的问题\n\n`;
            for (const issue of game.analysis.issues) {
                md += `- ${issue}\n`;
            }
            md += `\n`;
        } else {
            md += `### ✅ 无明显问题\n\n`;
        }

        md += `---\n\n`;
    }

    return md;
}
