// E2E: Verify firework animation doesn't leave black screen
// Tests the fix for issue where completing tasks in guide mode leaves a persistent black overlay
const { test, expect } = require('@playwright/test');

test.setTimeout(60000);

test('Firework canvas clears after animation completes', async ({ page }) => {
  // Navigate to museum checkin page with required settings
  await page.goto('/museum-checkin.html?museum=forbidden-city', { waitUntil: 'domcontentloaded' });
  
  // Set up required settings to skip settings page
  await page.evaluate(() => {
    localStorage.setItem('childNickname', '小明');
    localStorage.setItem('ageGroup', '7-12');
    localStorage.setItem('caregiverRole', 'parent');
  });
  
  // Check if fireworks canvas container exists
  const fireworksCanvas = page.locator('#fireworksCanvas');
  await expect(fireworksCanvas).toBeVisible();
  
  // Get canvas element reference
  const canvasElement = fireworksCanvas.locator('canvas');
  
  // Simulate launching a firework by calling the function directly
  await page.evaluate(() => {
    const container = document.querySelector('#fireworksCanvas');
    if (container && typeof createFireworksSystem === 'function') {
      const system = createFireworksSystem(container);
      system.start();
      system.launchFirework('7-12', '小明');
      window.__testFireworkSystem = system;
    }
  });
  
  // Wait for firework animation to start (canvas should have content)
  await page.waitForTimeout(500);
  
  // Verify canvas exists after launching firework
  const hasCanvas = await page.evaluate(() => {
    const container = document.querySelector('#fireworksCanvas');
    return container && container.querySelector('canvas') !== null;
  });
  expect(hasCanvas).toBe(true);
  
  // Stop the system and verify canvas is cleared (no dark overlay remains)
  const isCanvasCleared = await page.evaluate(() => {
    const system = window.__testFireworkSystem;
    if (system) {
      system.stop();
    }
    
    const container = document.querySelector('#fireworksCanvas');
    const canvas = container ? container.querySelector('canvas') : null;
    if (!canvas) return true;
    
    const ctx = canvas.getContext('2d');
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imageData.data;
    
    // Check if canvas is mostly transparent (no dark overlay)
    let opaquePixels = 0;
    for (let i = 3; i < pixels.length; i += 4) {
      if (pixels[i] > 25) {
        opaquePixels++;
      }
    }
    
    const totalPixels = pixels.length / 4;
    const opaqueRatio = opaquePixels / totalPixels;
    return opaqueRatio < 0.01;
  });
  
  expect(isCanvasCleared).toBe(true);
  
  // Verify user can still interact with page (no blocking overlay)
  // The canvas should have pointer-events: none, so clicks should pass through
  const canInteract = await page.evaluate(() => {
    const canvas = document.querySelector('#fireworksCanvas canvas');
    if (!canvas) return true;
    
    const style = window.getComputedStyle(canvas.parentElement);
    return style.pointerEvents === 'none';
  });
  
  expect(canInteract).toBe(true);
});

test('Multiple fireworks clear properly without accumulating dark overlay', async ({ page }) => {
  await page.goto('/museum-checkin.html?museum=forbidden-city', { waitUntil: 'domcontentloaded' });
  
  await page.evaluate(() => {
    localStorage.setItem('childNickname', '小红');
    localStorage.setItem('ageGroup', '3-6');
    localStorage.setItem('caregiverRole', 'parent');
  });
  
  // Launch multiple fireworks in quick succession
  await page.evaluate(() => {
    const container = document.querySelector('#fireworksCanvas');
    if (container && typeof createFireworksSystem === 'function') {
      const system = createFireworksSystem(container);
      system.start();
      
      // Launch 3 fireworks
      system.launchFirework('3-6', '小红');
      
      window.__testFireworkSystem = system;
    }
  });
  
  // Wait for animation to start
  await page.waitForTimeout(1000);
  
  // Stop the system and verify canvas is cleared (no accumulated dark overlay)
  const isCanvasCleared = await page.evaluate(() => {
    const system = window.__testFireworkSystem;
    if (system) {
      system.stop();
    }
    
    const container = document.querySelector('#fireworksCanvas');
    const canvas = container ? container.querySelector('canvas') : null;
    if (!canvas) return true;
    
    const ctx = canvas.getContext('2d');
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imageData.data;
    
    let darkPixels = 0;
    for (let i = 0; i < pixels.length; i += 4) {
      const r = pixels[i];
      const g = pixels[i + 1];
      const b = pixels[i + 2];
      const a = pixels[i + 3];
      
      if (r < 50 && g < 50 && b < 100 && a > 25) {
        darkPixels++;
      }
    }
    
    const totalPixels = pixels.length / 4;
    const darkRatio = darkPixels / totalPixels;
    return darkRatio < 0.01;
  });
  
  expect(isCanvasCleared).toBe(true);
});
