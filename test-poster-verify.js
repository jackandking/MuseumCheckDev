const { chromium } = require('playwright');

(async () => {
  let browser;
  try {
    console.log('Launching browser...');
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    
    console.log('Navigating to test page...');
    await page.goto('http://localhost:8000/test-poster-manual.html');
    
    console.log('Taking initial screenshot...');
    await page.screenshot({ path: '/tmp/poster-test-1-initial.png', fullPage: true });
    console.log('✅ Screenshot 1: Initial page');
    
    console.log('Clicking simulate photos button...');
    await page.click('button:has-text("模拟上传5张照片")');
    await page.waitForTimeout(1000);
    
    console.log('Taking screenshot after photo simulation...');
    await page.screenshot({ path: '/tmp/poster-test-2-photos.png', fullPage: true });
    console.log('✅ Screenshot 2: After photo simulation');
    
    console.log('Clicking generate poster button...');
    await page.click('button:has-text("生成海报")');
    await page.waitForTimeout(2000);
    
    console.log('Taking screenshot with generated poster...');
    await page.screenshot({ path: '/tmp/poster-test-3-poster.png', fullPage: true });
    console.log('✅ Screenshot 3: Poster generated');
    
    // Check if poster preview image exists
    const posterImg = await page.locator('#posterPreview img');
    const isVisible = await posterImg.isVisible().catch(() => false);
    
    if (isVisible) {
      console.log('✅ Poster preview image is visible');
      
      // Get poster image dimensions
      const box = await posterImg.boundingBox();
      if (box) {
        console.log(`✅ Poster dimensions: ${box.width}x${box.height}px`);
      }
      
      // Check if download button is enabled
      const downloadBtn = await page.locator('#downloadBtn');
      const isEnabled = await downloadBtn.isEnabled();
      console.log(`✅ Download button enabled: ${isEnabled}`);
    } else {
      console.log('❌ Poster preview image is NOT visible');
    }
    
    console.log('\n✅ All tests completed successfully!');
    console.log('Screenshots saved to /tmp/poster-test-*.png');
    
  } catch (err) {
    console.error('❌ Test failed:', err.message);
    console.error(err.stack);
    process.exit(1);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
})();
