# Pinghu Museum Mobile Workflow E2E Test

## Overview
This test suite (`pinghu-mobile-workflow.spec.ts`) validates the complete mobile user experience for the Pinghu Museum (平湖博物馆) workflow in the MuseumCheck application.

## Test Coverage

### 1. Complete Full Workflow Test
**Purpose**: Verify the end-to-end workflow from start to completion on mobile devices.

**Flow**:
1. Navigate to single-museum.html with Pinghu Museum preset
2. Handle first-time settings modal (if present)
3. Interact with intro overlay to start workflow
4. Verify immersive mode activation
5. Complete all 5 workflow tasks:
   - Task 1: Gate photo (门口打卡)
   - Task 2-4: Three collection treasure photos (镇馆之宝 1/3, 2/3, 3/3)
   - Task 5: Victory photo with pose suggestions (亲子合影)
6. Verify share step is reached

**Devices Tested**: iPhone 12, Pixel 5, Desktop browsers

### 2. Mobile UX Elements Test
**Purpose**: Validate mobile-specific user experience requirements.

**Checks**:
- Touch target sizes (≥44px height)
- Progress indicator visibility and accuracy
- Task card readability
- Mobile layout responsiveness (viewport ≤768px)
- Workflow display fits within mobile viewport

### 3. Workflow Persistence Test
**Purpose**: Ensure progress is saved and restored correctly on mobile.

**Flow**:
1. Start workflow and complete first task
2. Reload page
3. Verify progress is restored (user should be on task 2)

### 4. Accessibility Test
**Purpose**: Validate accessibility standards on mobile devices.

**Checks**:
- Button labels and text content
- Chinese text font size (≥13px on mobile)
- Element visibility
- No horizontal scrolling required

## Pinghu Museum Workflow Specifics

### Simplified Flow
Unlike other museums, Pinghu Museum has a simplified workflow that:
- **Skips** preparation step
- **Skips** enroute step  
- Goes **directly to visit** step with 5 tasks

### Workflow: "镇馆之宝探索" (Treasure Hunt)
- **Total Tasks**: 5
- **Structure**:
  1. Entrance photo (parent task)
  2-4. Three collection photos (child tasks with treasure images)
  5. Victory photo with pose suggestions (parent + child task)

## Running the Tests

### Run all Pinghu mobile workflow tests:
```bash
npx playwright test e2e/pinghu-mobile-workflow.spec.ts
```

### Run on specific mobile device:
```bash
# iPhone 12 (Mobile Safari)
npx playwright test e2e/pinghu-mobile-workflow.spec.ts --project="Mobile Safari"

# Pixel 5 (Mobile Chrome)
npx playwright test e2e/pinghu-mobile-workflow.spec.ts --project="Mobile Chrome"
```

### Run specific test:
```bash
npx playwright test e2e/pinghu-mobile-workflow.spec.ts --grep="complete full workflow"
```

### Run with UI mode (for debugging):
```bash
npx playwright test e2e/pinghu-mobile-workflow.spec.ts --ui
```

## Mobile UX Best Practices Validated

### Touch Targets
- All interactive elements meet minimum 44x44px touch target size
- Adequate spacing between clickable elements

### Typography
- Chinese text renders with appropriate font sizes (≥13px on mobile)
- Font family supports Chinese characters properly

### Layout
- Content fits within mobile viewport (no horizontal scroll)
- Responsive design adapts to different screen sizes
- Elements stack vertically on narrow screens

### Performance
- Fast initial load
- Smooth transitions between tasks
- Progress saves efficiently to localStorage

## Test Data

### Test Image
Tests use `MuseumCheck_logo.jpg` from the repository root as a placeholder for photo uploads.

### Museum ID
- `pinghu-museum`

### Museum Name
- `平湖博物馆`

### Workflow Name
- `镇馆之宝探索`

## Known Behaviors

1. **Settings Modal**: May appear on first visit or when no previous settings exist. Test handles this gracefully.

2. **Intro Overlay**: Always appears when starting a new museum visit. User must tap to proceed.

3. **Immersive Mode**: Adds `sg-immersive` class to `<html>` element for fullscreen experience.

4. **Direct to Visit**: Pinghu Museum uniquely skips prep and enroute steps.

5. **Auto-Progress**: After completing photo tasks, workflow may auto-advance to next task.

## Troubleshooting

### Test Fails at Settings Modal
- Check if `#sgSettingsModal` visibility detection is working
- Verify `#sgSettingsSave` button is clickable
- Ensure museum picker has `pinghu-museum` option

### Test Fails at Intro Overlay
- Check if `#sgFullscreenIntro` is visible with proper timeout
- Verify overlay click handler is registered
- Ensure overlay properly hides after click

### Test Fails During Task Progression
- Check if `#sgWorkflowVisit` renders properly
- Verify file input accepts image uploads
- Check task state management in `single-museum.js`
- Ensure progress tracking updates correctly

### Test Fails at Share Step
- Verify all 5 tasks were completed
- Check if `#step-share` becomes visible after last task
- Ensure workflow completion triggers share step transition

## Future Enhancements

1. **Screenshot Validation**: Add visual regression testing for mobile layouts
2. **Network Conditions**: Test under slow 3G conditions
3. **Offline Mode**: Validate behavior when offline
4. **Orientation Changes**: Test portrait and landscape modes
5. **Touch Gestures**: Add swipe gesture testing if applicable
6. **Real Device Testing**: Run on actual mobile devices via BrowserStack or similar

## Related Files

- `/e2e/pinghu-mobile-workflow.spec.ts` - This test file
- `/single-museum.html` - Main workflow page
- `/single-museum.js` - Workflow logic and state management
- `/museums/pinghu-museum.js` - Pinghu Museum data
- `/playwright.config.ts` - Test configuration
- `/e2e/pinghu-museum-checkin.spec.ts` - Related checkin page tests
- `/e2e/v3-immersive.spec.ts` - Similar immersive workflow test for Forbidden City
