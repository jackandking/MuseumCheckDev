/**
 * @jest-environment jsdom
 * 
 * Test photo retry functionality for workflow tasks
 * Ensures users can retry photo uploads when they fail (especially memory errors)
 */

const fs = require('fs');
const path = require('path');

describe('Photo Retry Functionality', () => {
  let scriptContent;

  beforeAll(() => {
    // Load single-museum.js
    const scriptPath = path.join(__dirname, '..', 'single-museum.js');
    scriptContent = fs.readFileSync(scriptPath, 'utf8');
  });

  test('handlePhotoInput detects memory errors and shows retryable error', () => {
    // Verify the code contains memory error detection
    expect(scriptContent).toContain('isMemoryRelatedError');
    expect(scriptContent).toContain('QuotaExceededError');
    expect(scriptContent).toContain('NS_ERROR_OUT_OF_MEMORY');
  });

  test('showRetryableError function exists and provides clear retry guidance', () => {
    // Verify the function exists
    expect(scriptContent).toContain('function showRetryableError');
    expect(scriptContent).toContain('💡 提示：点击上方拍照按钮重试');
  });

  test('photo input handler clears input value on failure for retry', () => {
    // Verify input value is cleared on failure to allow selecting same file again
    expect(scriptContent).toMatch(/if\s*\(\s*!success\s*\)\s*\{[\s\S]*?input\.value\s*=\s*['"]['"];/);
  });

  test('photo input handler adds error styling on failure', () => {
    // Verify input field gets error styling to highlight retry opportunity
    expect(scriptContent).toContain("input.style.border = '3px dashed #ef4444'");
    expect(scriptContent).toContain("input.style.backgroundColor = '#fef2f2'");
  });

  test('photo input handler resets styling before processing', () => {
    // Verify input field styling is reset on new attempt
    expect(scriptContent).toContain("input.style.border = '3px dashed #2e7cf6'");
    expect(scriptContent).toContain("input.style.backgroundColor = '#f0f7ff'");
  });

  test('error messages distinguish memory errors from other failures', () => {
    // Verify specific memory error message
    expect(scriptContent).toContain('内存不足 😅 请重新拍照试试');
    // Verify generic error message still exists
    expect(scriptContent).toContain('照片加载失败，请重试 ⚠️');
  });

  test('photo handler does not advance to next step on failure', () => {
    // Verify that when success is false, the function returns early
    // without marking task complete or advancing step
    const handlerMatch = scriptContent.match(/addEventListener\s*\(\s*['"]change['"]\s*,\s*async\s*\(\s*e\s*\)\s*=>\s*\{[\s\S]*?\}\s*\);/g);
    expect(handlerMatch).toBeTruthy();
    expect(handlerMatch.length).toBeGreaterThan(0);
    
    // Check that handlers have early return on failure
    handlerMatch.forEach(handler => {
      if (handler.includes('handlePhotoInput')) {
        expect(handler).toMatch(/if\s*\(\s*!success\s*\)[\s\S]*?return;/);
      }
    });
  });

  test('compression errors are caught and handled gracefully', () => {
    // Verify compression errors are caught within the loop
    expect(scriptContent).toMatch(/catch\s*\(\s*compressErr\s*\)/);
    // Verify memory errors within compression are detected using helper function
    expect(scriptContent).toMatch(/catch\s*\(\s*compressErr\s*\)[\s\S]*?isMemoryRelatedError/);
  });
});
