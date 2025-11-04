# Pinghu Museum v3 E2E Test Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                         │
│                     PINGHU MUSEUM V3 E2E TEST FLOW                      │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘


┌───────────────────┐
│   START TEST      │
│   Navigate to     │
│   single-museum   │
│   ?museum=        │
│   pinghu-museum   │
└────────┬──────────┘
         │
         ▼
┌───────────────────┐
│  STEP 1:          │◄───────────────┐
│  Settings Modal?  │                │
│  (First time)     │                │
└────────┬──────────┘                │
         │                           │
         │ YES                       │ NO (Already configured)
         │                           │
         ▼                           │
┌───────────────────┐                │
│  Configure        │                │
│  Settings         │                │
│  - Select Museum  │                │
│  - Save Settings  │                │
└────────┬──────────┘                │
         │                           │
         └───────────────────────────┘
         │
         ▼
┌───────────────────┐
│  STEP 2:          │
│  Intro Overlay    │
│  - Display        │
│    Museum Name    │
│  - Click to       │
│    Dismiss        │
└────────┬──────────┘
         │
         ▼
┌───────────────────┐
│  STEP 3:          │
│  Immersive Mode   │
│  - Activated      │
│  - Full Screen    │
└────────┬──────────┘
         │
         ▼
┌───────────────────┐
│  STEP 4:          │
│  Visit Step       │
│  (Pinghu skips    │
│   prep/enroute)   │
└────────┬──────────┘
         │
         ▼
╔═══════════════════╗
║  STEP 5:          ║
║  Workflow Tasks   ║
║  Loop (5 tasks)   ║
╚═══════════════════╝
         │
         │  ┌──────────────────────────────────┐
         │  │                                  │
         └─►│  Task 1: Gate Photo              │
            │  📸 Upload photo                 │
            │  Progress: 1/5                   │
            └──────────┬───────────────────────┘
                       │
                       ▼
            ┌──────────────────────────────────┐
            │  Task 2: First Treasure          │
            │  🏺 镇馆之宝 1/3                  │
            │  Upload photo                    │
            │  Progress: 2/5                   │
            └──────────┬───────────────────────┘
                       │
                       ▼
            ┌──────────────────────────────────┐
            │  Task 3: Second Treasure         │
            │  🏺 镇馆之宝 2/3                  │
            │  Upload photo                    │
            │  Progress: 3/5                   │
            └──────────┬───────────────────────┘
                       │
                       ▼
            ┌──────────────────────────────────┐
            │  Task 4: Third Treasure          │
            │  🏺 镇馆之宝 3/3                  │
            │  Upload photo                    │
            │  Progress: 4/5                   │
            └──────────┬───────────────────────┘
                       │
                       ▼
            ┌──────────────────────────────────┐
            │  Task 5: Victory Photo           │
            │  📸 亲子合影                      │
            │  Upload photo                    │
            │  Progress: 5/5 ✓                 │
            └──────────┬───────────────────────┘
                       │
         ┌─────────────┘
         │
         ▼
┌───────────────────┐
│  STEP 6:          │
│  Share Step       │
│  - Poster         │
│    Generation     │
│  - Canvas Created │
└────────┬──────────┘
         │
         ▼
┌───────────────────┐
│  STEP 7:          │
│  Poster Display   │
│  - Preview Image  │
│  - PNG Data URL   │
│  - Museum Name    │
└────────┬──────────┘
         │
         ▼
┌───────────────────┐
│  STEP 8:          │
│  Download Poster  │
│  - Click Save     │
│  - Trigger Event  │
│  - Verify File    │
└────────┬──────────┘
         │
         ▼
┌───────────────────┐
│  STEP 9:          │
│  Share Functions  │
│  - Share Button   │
│  - Fireworks Link │
└────────┬──────────┘
         │
         ▼
┌───────────────────┐
│  STEP 10:         │
│  Close Workflow   │
│  - Click Close    │
│  OR               │
│  - Press ESC      │
└────────┬──────────┘
         │
         ▼
┌───────────────────┐
│  STEP 11:         │
│  Exit Immersive   │
│  - Return to Main │
│  - Verify URL     │
└────────┬──────────┘
         │
         ▼
┌───────────────────┐
│   TEST COMPLETE   │
│      ✓ PASS       │
└───────────────────┘


╔═══════════════════════════════════════════════════════════════════════╗
║                        ADDITIONAL TEST SCENARIOS                      ║
╚═══════════════════════════════════════════════════════════════════════╝

┌─────────────────────────┐      ┌─────────────────────────┐
│  MOBILE TEST            │      │  PERSISTENCE TEST       │
│  - Mobile Viewport      │      │  - Complete 2 Tasks     │
│  - Responsive Poster    │      │  - Reload Page          │
│  - Touch Buttons (44px) │      │  - Verify Progress      │
│  - Poster Fits Screen   │      │  - Continue from Task 3 │
└─────────────────────────┘      └─────────────────────────┘


╔═══════════════════════════════════════════════════════════════════════╗
║                        VERIFICATION POINTS                            ║
╚═══════════════════════════════════════════════════════════════════════╝

✓ Museum name displayed correctly
✓ Progress indicator updates (1/5 → 2/5 → ... → 5/5)
✓ All tasks can be completed
✓ Poster canvas created
✓ Poster preview shows image
✓ Poster has valid PNG data URL
✓ Save button triggers download
✓ Share button visible
✓ Fireworks link present
✓ Close button exits workflow
✓ Immersive mode deactivated
✓ Mobile responsive design
✓ Touch targets ≥ 44px
✓ localStorage persistence


╔═══════════════════════════════════════════════════════════════════════╗
║                        TEST CONFIGURATION                             ║
╚═══════════════════════════════════════════════════════════════════════╝

Browsers:        Chromium, WebKit, Mobile Safari, Mobile Chrome
Total Tests:     3 scenarios × 4 browsers = 12 test runs
Test File:       e2e/pinghu-v3-complete.spec.ts
Lines of Code:   375 lines
Documentation:   286 lines (PINGHU_V3_COMPLETE_TEST.md)
Summary:         283 lines (PINGHU_V3_TEST_SUMMARY.md)


╔═══════════════════════════════════════════════════════════════════════╗
║                           RUN COMMANDS                                ║
╚═══════════════════════════════════════════════════════════════════════╝

# Run all tests
npx playwright test e2e/pinghu-v3-complete.spec.ts

# Run specific test
npx playwright test -g "complete workflow"

# Run with UI
npx playwright test e2e/pinghu-v3-complete.spec.ts --ui

# Debug mode
npx playwright test e2e/pinghu-v3-complete.spec.ts --headed --debug
