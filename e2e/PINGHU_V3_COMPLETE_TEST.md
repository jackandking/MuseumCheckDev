# Pinghu Museum v3 Complete Workflow E2E Test

## 测试概述 (Test Overview)

This end-to-end test suite provides comprehensive coverage of the Pinghu Museum (平湖博物馆) v3 workflow, from initial page load to poster download and workflow exit.

**Issue**: 平湖博物馆e2e测试 - 加入测试涵盖v3从第一步到最后海报下载，最后点击关闭按钮回主页面

**Test File**: `e2e/pinghu-v3-complete.spec.ts`

## 测试覆盖范围 (Test Coverage)

### 主测试流程 (Main Test Flow)

The primary test `complete workflow from start to poster download and close` covers:

1. **初始化 (Initialization)**
   - Navigate to `single-museum.html?museum=pinghu-museum`
   - Verify URL parameter correctly preselects Pinghu Museum

2. **设置处理 (Settings Handling)**
   - Handle first-time settings modal if present
   - Verify museum is pre-selected in picker
   - Save settings and proceed to workflow

3. **介绍页面 (Intro Overlay)**
   - Verify intro overlay displays museum name
   - Click to dismiss and start workflow
   - Confirm immersive mode is activated

4. **任务完成 (Task Completion)**
   - Verify visit step is active (Pinghu skips prep/enroute)
   - Complete all workflow tasks by:
     - Uploading test photos for photo tasks
     - Clicking confirm for confirm tasks
   - Progress through all 5 default tasks:
     - Task 1: Gate photo (门口打卡)
     - Task 2-4: Treasure hunts (镇馆之宝)
     - Task 5: Victory photo (亲子合影)

5. **海报生成 (Poster Generation)**
   - Verify share step is reached
   - Confirm poster canvas is created
   - Validate poster preview image is rendered
   - Check poster has valid data URL (PNG format)

6. **海报下载 (Poster Download)**
   - Verify save poster button is visible
   - Test download functionality
   - Confirm download event is triggered
   - Validate filename contains museum name

7. **分享功能 (Share Functionality)**
   - Verify share button is present
   - Check fireworks wall link exists

8. **退出流程 (Exit Flow)**
   - Click close/exit button to leave workflow
   - Verify return to main page or non-immersive mode
   - Test ESC key as alternative exit method

### 移动端测试 (Mobile Device Test)

The test `verify poster download on mobile device` covers:

- **Mobile viewport simulation** (375x667 - iPhone SE size)
- **Poster responsiveness** on mobile
- **Touch-friendly buttons** (≥44px height requirement)
- **Viewport fitting** (poster width ≤ screen width)
- **Complete workflow on mobile** with touch interactions

### 持久化测试 (Persistence Test)

The test `verify workflow persistence across page reload` covers:

- **Task progress persistence** in localStorage
- **State recovery** after page reload
- **Continuation from last position** (not restarting workflow)
- **Data integrity** across browser sessions

## 运行测试 (Running Tests)

### 前提条件 (Prerequisites)

```bash
# Install dependencies
npm install

# Install Playwright browsers
npx playwright install chromium
```

### 运行方式 (Execution)

```bash
# Run all Pinghu v3 complete tests
npx playwright test e2e/pinghu-v3-complete.spec.ts

# Run on specific browser
npx playwright test e2e/pinghu-v3-complete.spec.ts --project=chromium

# Run with UI mode for debugging
npx playwright test e2e/pinghu-v3-complete.spec.ts --ui

# Run specific test
npx playwright test e2e/pinghu-v3-complete.spec.ts -g "complete workflow"

# Run mobile test only
npx playwright test e2e/pinghu-v3-complete.spec.ts -g "mobile"

# Run persistence test only
npx playwright test e2e/pinghu-v3-complete.spec.ts -g "persistence"
```

### 调试模式 (Debug Mode)

```bash
# Run with headed browser (visible)
npx playwright test e2e/pinghu-v3-complete.spec.ts --headed

# Run with debug mode
npx playwright test e2e/pinghu-v3-complete.spec.ts --debug

# Generate trace for failed tests
npx playwright test e2e/pinghu-v3-complete.spec.ts --trace on
```

## 测试架构 (Test Architecture)

### 测试资源 (Test Resources)

- **Test image**: `MuseumCheck_logo.jpg` - Used as mock photo upload
- **Museum ID**: `pinghu-museum`
- **Base URL**: `http://localhost:8000`
- **Viewport sizes**:
  - Desktop: Default Playwright settings
  - Mobile: 375x667 (iPhone SE)

### 关键选择器 (Key Selectors)

```typescript
// Settings
'#sgSettingsModal'        // Settings modal
'#sgMuseumPicker'         // Museum picker dropdown
'#sgSettingsSave'         // Save settings button

// Intro
'#sgFullscreenIntro'      // Fullscreen intro overlay

// Workflow
'#step-visit'             // Visit step container
'#sgWorkflowVisit'        // Workflow visit section
'#sgCurrentTaskCard'      // Current task card
'#sgVisitProgress'        // Progress indicator (e.g., "1/5")

// Poster
'#step-share'             // Share step container
'#posterCanvas'           // Poster canvas element
'#posterPreview'          // Poster preview container
'#savePoster'             // Save/download button
'#sharePoster'            // Share button

// Navigation
'#sgCloseWorkflow'        // Close workflow button
'#sgExitImmersive'        // Exit immersive mode button
```

### 等待策略 (Wait Strategies)

The test uses multiple wait strategies:

1. **Timeout-based waits**: For modal/overlay visibility (3-10 seconds)
2. **Event-based waits**: For download events
3. **Fixed delays**: For state updates (500-2000ms)
4. **Conditional waits**: Using `.catch(() => false)` for optional elements

## 预期行为 (Expected Behavior)

### 成功标准 (Success Criteria)

✅ **All tests pass if:**

1. Settings modal appears (if first-time) and saves correctly
2. Intro overlay displays and dismisses
3. All workflow tasks complete successfully
4. Poster generates with valid PNG data URL
5. Save button triggers download event
6. Share button and fireworks link are visible
7. Close button exits workflow or ESC key works
8. Mobile tests show responsive design
9. Persistence test maintains state across reload

### 失败场景 (Failure Scenarios)

❌ **Tests may fail if:**

- HTTP server not running on port 8000
- Museum data missing or corrupted
- Poster generation fails (canvas issues)
- localStorage blocked by browser
- Download permissions denied
- Network issues during resource loading

## 维护指南 (Maintenance Guide)

### 更新测试 (Updating Tests)

When workflow changes:

1. **Update task count**: If tasks are added/removed, adjust `totalTasks` logic
2. **Update selectors**: If DOM structure changes, update selector strings
3. **Update timeouts**: If performance changes, adjust timeout values
4. **Update assertions**: If UI text changes, update `.toContainText()` checks

### 添加新测试 (Adding New Tests)

To add new test cases:

```typescript
test('new test case description', async ({ page }) => {
  // Navigate to museum
  await page.goto(`${BASE_URL}/single-museum.html?museum=${MUSEUM_ID}`);
  
  // Your test logic here
  
  // Assert expected behavior
  await expect(someElement).toBeVisible();
});
```

## 已知问题 (Known Issues)

1. **Download event**: May not trigger in all test environments (headless vs headed)
2. **Close button**: Implementation varies, test tries multiple methods
3. **Poster generation**: Requires time for canvas rendering (2 second wait)
4. **Browser installation**: Playwright browsers need separate installation step

## 相关文件 (Related Files)

- **Implementation**: `single-museum.js` - v3 workflow logic
- **Styles**: `style.css` - Immersive mode and poster styles
- **Data**: `museums-data.js` - Pinghu Museum data
- **Meta**: `museums-meta.js` - Museum metadata
- **Other tests**:
  - `e2e/pinghu-v3.spec.ts` - Basic v3 support test
  - `e2e/pinghu-mobile-workflow.spec.ts` - Mobile workflow test
  - `e2e/v3-immersive.spec.ts` - Forbidden City immersive test

## 测试报告 (Test Reports)

After running tests, view results:

```bash
# View HTML report
npx playwright show-report

# View trace for failed tests
npx playwright show-trace test-results/[test-name]/trace.zip
```

## 贡献 (Contributing)

When contributing to this test:

1. Follow existing test patterns and naming conventions
2. Add console.log() statements for debugging
3. Use descriptive test names and comments
4. Ensure tests are idempotent (can run multiple times)
5. Test on both desktop and mobile viewports
6. Verify localStorage cleanup between tests if needed

## 支持 (Support)

For issues with this test:

1. Check HTTP server is running: `npm run serve`
2. Verify Playwright browsers installed: `npx playwright install`
3. Run with `--headed` flag to see browser
4. Check test results in `test-results/` directory
5. View traces for failed tests

---

**Last Updated**: 2025-11-04  
**Author**: Copilot Agent  
**Issue Reference**: 平湖博物馆e2e测试
