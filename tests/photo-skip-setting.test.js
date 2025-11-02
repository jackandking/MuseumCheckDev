/**
 * @jest-environment jsdom
 * 
 * Test photo skip setting functionality for workflow tasks
 * Ensures users can configure whether photos are required or optional
 */

const fs = require('fs');
const path = require('path');

describe('Photo Skip Setting', () => {
  let htmlContent;
  let scriptContent;

  beforeAll(() => {
    // Load single-museum.html
    const htmlPath = path.join(__dirname, '..', 'single-museum.html');
    htmlContent = fs.readFileSync(htmlPath, 'utf8');
    
    // Load single-museum.js
    const scriptPath = path.join(__dirname, '..', 'single-museum.js');
    scriptContent = fs.readFileSync(scriptPath, 'utf8');
  });

  describe('Settings UI', () => {
    test('settings modal includes photoRequired dropdown', () => {
      expect(htmlContent).toContain('id="sgPhotoRequired"');
      expect(htmlContent).toContain('拍照要求');
    });

    test('photoRequired dropdown has optional and required options', () => {
      expect(htmlContent).toContain('可选（默认）- 可点击"完成"跳过拍照');
      expect(htmlContent).toContain('必须 - 需要拍照才能进入下一步');
    });

    test('optional is the default value', () => {
      // Check that the first option (optional) is listed first
      const photoReqMatch = htmlContent.match(/<select id="sgPhotoRequired">([\s\S]*?)<\/select>/);
      expect(photoReqMatch).toBeTruthy();
      const selectContent = photoReqMatch[1];
      const optionalIndex = selectContent.indexOf('value="optional"');
      const requiredIndex = selectContent.indexOf('value="required"');
      expect(optionalIndex).toBeLessThan(requiredIndex);
    });
  });

  describe('JavaScript Implementation', () => {
    test('isPhotoRequired helper function exists', () => {
      expect(scriptContent).toContain('function isPhotoRequired()');
    });

    test('isPhotoRequired defaults to false (optional)', () => {
      // Verify the default return value is false
      expect(scriptContent).toMatch(/function isPhotoRequired\(\)\s*\{[\s\S]*?return false;[\s\S]*?}/);
    });

    test('isPhotoRequired checks localStorage for photoRequired setting', () => {
      const funcMatch = scriptContent.match(/function isPhotoRequired\(\)\s*\{[\s\S]*?\}/);
      expect(funcMatch).toBeTruthy();
      expect(funcMatch[0]).toContain("localStorage.getItem('photoRequired')");
      expect(funcMatch[0]).toContain("=== 'required'");
    });

    test('photoRequired setting is saved to localStorage', () => {
      // Check that saveSettingsImmediate saves photoRequired
      expect(scriptContent).toContain("const photoReqSel = $('#sgPhotoRequired')");
      expect(scriptContent).toMatch(/if\s*\(\s*photoReqSel\s*\)\s*localStorage\.setItem\s*\(\s*['"]photoRequired['"]/);
    });

    test('photoRequired setting is loaded from localStorage', () => {
      // Check that initSettingsUI loads photoRequired
      expect(scriptContent).toMatch(/const pr = localStorage\.getItem\s*\(\s*['"]photoRequired['"]\s*\)/);
      expect(scriptContent).toMatch(/if\s*\(\s*photoReqSel\s*\)\s*photoReqSel\.value = pr/);
    });

    test('photoRequired setting has change event listener', () => {
      // Check that changes to photoRequired are saved immediately
      expect(scriptContent).toMatch(/if\s*\(\s*photoReqSel\s*\)\s*photoReqSel\.addEventListener\s*\(\s*['"]change['"]/);
    });
  });

  describe('Skip Button Rendering', () => {
    test('skip button is added for photo tasks when photoRequired is false', () => {
      // Check for skip button creation
      expect(scriptContent).toContain('完成（跳过拍照）');
    });

    test('skip button is conditionally rendered based on isPhotoRequired', () => {
      // Check that skip button is only added when !isPhotoRequired()
      expect(scriptContent).toMatch(/if\s*\(\s*!isPhotoRequired\(\s*\)\s*\)\s*\{[\s\S]*?完成（跳过拍照）/);
    });

    test('skip button has onclick handler to complete task without photo', () => {
      const skipButtonMatch = scriptContent.match(/完成（跳过拍照）[\s\S]{0,500}onclick/);
      expect(skipButtonMatch).toBeTruthy();
    });

    test('skip button advances to next task', () => {
      // The skip button now calls completeWorkflowTask which handles advancing
      const skipSectionMatch = scriptContent.match(/完成（跳过拍照）[\s\S]{0,800}completeWorkflowTask/);
      expect(skipSectionMatch).toBeTruthy();
    });

    test('skip button marks task as completed', () => {
      // The skip button now calls completeWorkflowTask which marks tasks complete
      // Verify completeWorkflowTask function exists and marks tasks complete
      expect(scriptContent).toContain('function completeWorkflowTask');
      expect(scriptContent).toMatch(/function completeWorkflowTask[\s\S]{0,400}state\.completedVisit\[idx\]\s*=\s*true/);
    });

    test('skip button shows success toast', () => {
      // Find the skip button section and verify it shows toast
      const skipSectionMatch = scriptContent.match(/完成（跳过拍照）[\s\S]{0,800}showToast\(/);
      expect(skipSectionMatch).toBeTruthy();
    });
  });

  describe('Photo Task Behavior', () => {
    test('photo tasks still have camera input button', () => {
      // Verify camera input is not removed
      expect(scriptContent).toContain("input.type = 'file'");
      expect(scriptContent).toContain("input.accept = 'image/*'");
    });

    test('photo upload still works when skip button is present', () => {
      // Verify handlePhotoInput is still called
      expect(scriptContent).toMatch(/handlePhotoInput\s*\(/);
      expect(scriptContent).toMatch(/addEventListener\s*\(\s*['"]change['"]\s*,\s*async\s*\(\s*e\s*\)\s*=>/);
    });

    test('retake button still exists for photo tasks', () => {
      // Verify retake functionality is preserved
      expect(scriptContent).toContain('🔄 重新拍照');
    });
  });

  describe('Default Values', () => {
    test('photoRequired defaults to optional in saveSettingsImmediate', () => {
      // Check that the default value when saving is 'optional'
      expect(scriptContent).toMatch(/localStorage\.setItem\s*\(\s*['"]photoRequired['"]\s*,\s*photoReqSel\.value\s*\|\|\s*['"]optional['"]/);
    });

    test('photoRequired defaults to optional in initSettingsUI', () => {
      // Check that the default value when loading is 'optional'
      expect(scriptContent).toMatch(/localStorage\.getItem\s*\(\s*['"]photoRequired['"]\s*\)\s*\|\|\s*['"]optional['"]/);
    });
  });
});
