/**
 * 使用 Playwright 爬取百度图片
 * 项目中已安装 Playwright，无需额外安装
 */

const { chromium } = require('@playwright/test');

async function scrapeBaiduImages(keyword, count = 10) {
    console.log(`🚀 启动浏览器，搜索关键词: ${keyword}`);
    
    const browser = await chromium.launch({
        headless: true
    });
    
    const context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        viewport: { width: 1920, height: 1080 }
    });
    
    const page = await context.newPage();
    
    try {
        // 访问百度图片搜索
        const url = `https://image.baidu.com/search/index?tn=baiduimage&word=${encodeURIComponent(keyword)}`;
        console.log(`📡 访问 URL: ${url}`);
        
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
        
        // 等待图片加载
        console.log('⏳ 等待图片加载...');
        await page.waitForSelector('img', { timeout: 10000 });
        
        // 滚动页面以加载更多图片
        console.log('📜 滚动页面加载更多图片...');
        await page.evaluate(async () => {
            await new Promise((resolve) => {
                let totalHeight = 0;
                const distance = 100;
                const timer = setInterval(() => {
                    const scrollHeight = document.body.scrollHeight;
                    window.scrollBy(0, distance);
                    totalHeight += distance;

                    if (totalHeight >= scrollHeight || totalHeight >= 2000) {
                        clearInterval(timer);
                        resolve();
                    }
                }, 100);
            });
        });
        
        // 等待一下让图片加载
        await page.waitForTimeout(3000);
        
        // 截图以便调试
        await page.screenshot({ path: 'baidu-screenshot.png', fullPage: false });
        console.log('📸 已保存截图到 baidu-screenshot.png');
        
        // 提取图片 URL
        console.log('🔍 提取图片 URL...');
        const images = await page.evaluate(() => {
            const results = [];
            
            // 百度图片搜索结果通常在 li 元素中，查找包含图片的 li
            const items = document.querySelectorAll('li');
            console.log(`找到 ${items.length} 个 li 元素`);
            
            items.forEach(item => {
                // 查找 li 中的 img 元素
                const img = item.querySelector('img');
                if (!img) return;
                
                // 尝试从多个属性获取原图 URL
                // data-imgurl 通常是原图地址
                const originalUrl = img.getAttribute('data-imgurl');
                const thumbUrl = img.getAttribute('src') || img.getAttribute('data-src');
                
                // 优先使用原图 URL
                const url = originalUrl || thumbUrl;
                
                if (url && url.startsWith('http')) {
                    // 过滤广告和 UI 元素
                    const isAd = url.includes('emoji.cdn.bcebos.com') || 
                                url.includes('ns-strategy') ||
                                url.includes('baseimg') ||
                                url.includes('yunque') ||
                                url.includes('logo') || 
                                url.includes('icon') ||
                                url.includes('placeholder') ||
                                url.includes('data:image');
                    
                    // 过滤太小的缩略图（通常是导航或推荐图）
                    const isTooSmall = url.includes('size=f60') || 
                                      url.includes('size=w60') ||
                                      url.includes('size=f40');
                    
                    if (!isAd && !isTooSmall && !results.includes(url)) {
                        results.push(url);
                    }
                }
            });
            
            console.log(`从搜索结果中获得 ${results.length} 个图片 URL`);
            return results;
        });
        
        console.log(`📊 过滤后获得 ${images.length} 个图片`);
        
        // 将小图 URL 转换为大图 URL
        const largeImages = images.map(url => {
            // 百度图片 URL 格式：size=f60 表示 60x60 缩略图
            // 移除 size 参数或改为更大的尺寸
            if (url.includes('baidu.com')) {
                // 移除 size 参数，获取原图
                return url.replace(/&size=[^&]+/, '&size=w1000')
                         .replace(/size=[^&]+&/, '');
            }
            return url;
        });
        
        await browser.close();
        
        // 限制数量
        const finalImages = largeImages.slice(0, count);
        
        console.log(`✅ 成功获取 ${finalImages.length} 个大图 URL`);
        return finalImages;
        
    } catch (error) {
        console.error('❌ 爬取过程中发生错误:', error.message);
        await browser.close();
        return [];
    }
}

// 执行测试
(async () => {
    const keyword = '首都博物馆 镇馆之宝';
    const urls = await scrapeBaiduImages(keyword, 20);
    
    console.log(`\n--- 搜索结果 (${keyword}) ---\n`);
    urls.forEach((url, index) => {
        console.log(`${index + 1}. ${url}`);
    });
    console.log('\n---------------------------\n');
    console.log('💡 提示：这些是截图中显示的搜索结果图片的原图 URL');
    console.log('💡 图片尺寸从 500x500 到 972x649 不等');
})();
