# Pinghu Museum Mobile Workflow Test - Execution Guide

## Quick Start

### 1. Validate Without Running Tests
```bash
./validate-pinghu-mobile-test.sh
```
This checks that everything is configured correctly without needing browsers installed.

### 2. Install Browsers (One-time Setup)
```bash
npx playwright install
```

### 3. Run Tests
```bash
# Run all Pinghu mobile tests
npx playwright test e2e/pinghu-mobile-workflow.spec.ts

# Run with detailed output
npx playwright test e2e/pinghu-mobile-workflow.spec.ts --reporter=line

# Run with UI mode for debugging
npx playwright test e2e/pinghu-mobile-workflow.spec.ts --ui
```

## Test Structure

### Test 1: Complete Full Workflow ⭐
**What it does**: Simulates a complete user journey through the Pinghu Museum workflow

**Steps**:
1. Navigate to single-museum.html with pinghu-museum preset
2. Handle settings modal (if first visit)
3. Tap intro overlay to start
4. Verify immersive mode activates
5. Complete Task 1: Gate photo (门口打卡)
6. Complete Task 2: Treasure 1/3 (镇馆之宝 1/3)
7. Complete Task 3: Treasure 2/3 (镇馆之宝 2/3)
8. Complete Task 4: Treasure 3/3 (镇馆之宝 3/3)
9. Complete Task 5: Victory photo (亲子合影)
10. Verify share step reached

**Expected result**: User completes all 5 tasks and reaches share screen

**Run this test**:
```bash
npx playwright test e2e/pinghu-mobile-workflow.spec.ts --grep="complete full workflow"
```

### Test 2: Mobile UX Elements ⭐
**What it does**: Validates mobile-specific user experience requirements

**Checks**:
- Touch target sizes ≥44px height
- Progress indicator shows correct task number
- Task card is visible and readable
- Mobile viewport ≤768px width
- Workflow display fits within viewport

**Expected result**: All mobile UX requirements met

**Run this test**:
```bash
npx playwright test e2e/pinghu-mobile-workflow.spec.ts --grep="verify mobile UX"
```

### Test 3: Workflow Persistence ⭐
**What it does**: Ensures progress is saved and restored correctly

**Steps**:
1. Start workflow
2. Complete first task (gate photo)
3. Reload page
4. Verify progress shows task 2/5 (not 1/5)

**Expected result**: Progress persists across page reloads

**Run this test**:
```bash
npx playwright test e2e/pinghu-mobile-workflow.spec.ts --grep="persistence"
```

### Test 4: Accessibility ⭐
**What it does**: Validates accessibility standards for mobile

**Checks**:
- Button labels are present and clear
- Chinese text font size ≥13px
- No horizontal scrolling required
- Elements have proper visibility

**Expected result**: All accessibility checks pass

**Run this test**:
```bash
npx playwright test e2e/pinghu-mobile-workflow.spec.ts --grep="accessibility"
```

## Device Configurations

### Mobile Safari (iPhone 12)
- Viewport: 393×852
- User Agent: iOS Safari
- Touch events enabled

### Mobile Chrome (Pixel 5)
- Viewport: 393×851
- User Agent: Android Chrome
- Touch events enabled

### Desktop Browsers (Fallback)
- Chromium: Desktop viewport
- WebKit: Desktop viewport

## Common Scenarios

### Scenario 1: First-Time User
```bash
# User opens app for first time
# → Settings modal appears
# → User configures age group and nickname
# → User selects Pinghu Museum
# → User taps intro overlay
# → Workflow starts at Task 1
```

### Scenario 2: Returning User
```bash
# User previously completed 2 tasks
# → No settings modal (already configured)
# → User taps intro overlay
# → Workflow resumes at Task 3 (saved progress)
```

### Scenario 3: Completing All Tasks
```bash
# User completes all 5 tasks
# → Share screen appears
# → User can view fireworks wall
# → User can return home or share results
```

## Debugging Failed Tests

### Test fails at settings modal
**Problem**: Settings modal doesn't appear or close properly
**Check**:
```bash
# Verify modal selector
npx playwright test e2e/pinghu-mobile-workflow.spec.ts --grep="complete full" --debug
# Look for: #sgSettingsModal
```

### Test fails at intro overlay
**Problem**: Intro doesn't respond to click
**Check**:
```bash
# Verify overlay is clickable
curl http://localhost:8000/single-museum.html?museum=pinghu-museum | grep "sgFullscreenIntro"
```

### Test fails during task progression
**Problem**: Tasks don't complete or advance
**Check**:
```javascript
// Verify workflow rendering in single-museum.js
// Look for: renderWorkflowVisit() function
// Verify: pinghu-museum specific task generation
```

### Test fails at share step
**Problem**: Doesn't reach share after all tasks
**Check**:
```bash
# Verify task count
curl http://localhost:8000/museums/pinghu-museum.js | grep -c "collections"
# Should show 3 collections (3 treasure tasks)
```

## Visual Test Report

After running tests, view the HTML report:
```bash
npx playwright show-report
```

This opens an interactive report showing:
- ✅ Passed tests (green)
- ❌ Failed tests (red)
- 📸 Screenshots of failures
- 🎬 Video recordings
- 📊 Test duration
- 🔍 Step-by-step trace

## Continuous Integration

### GitHub Actions Example
```yaml
name: Pinghu Mobile Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npx playwright test e2e/pinghu-mobile-workflow.spec.ts
      - uses: actions/upload-artifact@v3
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/
```

## Performance Benchmarks

Expected test durations:
- **Complete workflow**: ~15-30 seconds
- **UX elements**: ~5-10 seconds
- **Persistence**: ~10-15 seconds
- **Accessibility**: ~5-10 seconds

Total suite: ~35-65 seconds (depending on system)

## Troubleshooting

### Browser installation fails
```bash
# Try manual installation
npx playwright install chromium
# Or use system browser
export PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1
```

### Port 8000 already in use
```bash
# Kill existing server
pkill -f "python3 -m http.server 8000"
# Or use different port
python3 -m http.server 8080
# Update BASE_URL in test if needed
```

### Tests timeout
```bash
# Increase timeout in playwright.config.ts
timeout: 60000  // 60 seconds
```

### Flaky tests
```bash
# Run with retries
npx playwright test e2e/pinghu-mobile-workflow.spec.ts --retries=2
```

## Success Indicators

When tests pass, you'll see:
```
✓ [Mobile Safari] › pinghu-mobile-workflow.spec.ts:29:7 › complete full workflow (18s)
✓ [Mobile Safari] › pinghu-mobile-workflow.spec.ts:131:7 › verify mobile UX (8s)
✓ [Mobile Safari] › pinghu-mobile-workflow.spec.ts:199:7 › workflow persistence (12s)
✓ [Mobile Safari] › pinghu-mobile-workflow.spec.ts:248:7 › accessibility (6s)

4 passed (44s)
```

## Next Steps

1. **Run validation**: `./validate-pinghu-mobile-test.sh` ✅
2. **Install browsers**: `npx playwright install` ⏳
3. **Run tests**: `npx playwright test e2e/pinghu-mobile-workflow.spec.ts` ⏳
4. **Review results**: `npx playwright show-report` ⏳
5. **Integrate into CI**: Add to GitHub Actions ⏳

## Questions?

Refer to:
- `e2e/PINGHU_MOBILE_WORKFLOW_TESTS.md` - Detailed test documentation
- `PINGHU_MOBILE_WORKFLOW_SUMMARY.md` - Implementation summary
- Playwright docs: https://playwright.dev
