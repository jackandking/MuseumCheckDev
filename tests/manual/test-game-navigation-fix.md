# Manual Test Plan: Game Navigation Fix

## Test Objective
Verify that all games properly return to the correct museum after completion, not always to Forbidden City.

## Prerequisites
1. Start local server: `python3 -m http.server 8000`
2. Open browser to http://localhost:8000
3. Have browser DevTools open (Console tab) to see logs

## Test Scenarios

### Scenario 1: Snake Game Navigation (Previously Broken)
**Steps:**
1. Navigate to any museum except Forbidden City (e.g., 中国国家博物馆)
2. Click on a task to trigger game selection
3. Select "贪食蛇" (Snake game)
4. Play game briefly (can intentionally die quickly)
5. Click "继续游览 →" button on game over screen

**Expected Result:**
- Should return to 中国国家博物馆 checkin page
- URL should be: `/museum-checkin.html?id=national-museum-china` (or similar)
- NOT `/museum-checkin.html?id=forbidden-city`

**Verification in Console:**
- Look for: `[Snake] Returning to checkin page with museumId: national-museum-china`
- Should NOT see: `museumId: forbidden-city`

### Scenario 2: Space Invaders Navigation (Previously Broken)
**Steps:**
1. Navigate to Shanghai Museum (上海博物馆)
2. Trigger game selection
3. Select "太空入侵者" (Space Invaders)
4. Complete or exit game
5. Click "继续游览 →"

**Expected Result:**
- Returns to Shanghai Museum checkin page
- URL contains correct museum ID
- NOT Forbidden City

### Scenario 3: Tank Battle Navigation (Previously Broken)
**Steps:**
1. Navigate to any museum (e.g., 陕西历史博物馆)
2. Play Tank Battle game
3. Click "继续游览 →" after game

**Expected Result:**
- Returns to original museum
- Correct museum ID in URL

### Scenario 4: Maze Game Navigation (Already Working)
**Steps:**
1. Navigate to any museum
2. Play Maze game
3. Click "继续游览 →"

**Expected Result:**
- Should still work correctly (no regression)
- Returns to correct museum

## Mobile Testing
**Additional Tests:**
1. Open browser DevTools
2. Toggle Device Toolbar (Ctrl+Shift+M or Cmd+Shift+M)
3. Select mobile device (e.g., iPhone 12)
4. Repeat Scenarios 1-4
5. Verify games work on mobile viewport
6. Verify navigation works correctly on mobile

## Verification Checklist
- [ ] All 4 games tested on desktop viewport
- [ ] All 4 games tested on mobile viewport  
- [ ] Each game returns to correct museum (not Forbidden City)
- [ ] GameContextManager logs show correct museum ID
- [ ] No console errors during navigation
- [ ] URL parameters are correct after navigation

## Test Data - Museum IDs
Use these for testing:
- Forbidden City: `forbidden-city` (故宫博物院)
- National Museum: `national-museum-china` (中国国家博物馆)
- Shanghai Museum: `shanghai-museum` (上海博物馆)
- Shaanxi History: `shaanxi-history-museum` (陕西历史博物馆)

## Known Issue (Before Fix)
Without the fix, these games always returned to:
- URL: `/museum-checkin.html?id=forbidden-city`
- Because `window.GameContextManager` was undefined
- Fallback: `const museumId = context?.museumId || 'forbidden-city'`

## After Fix
With the fix, games should return to original museum:
- URL: `/museum-checkin.html?id=<original-museum-id>`
- Because `window.GameContextManager` is now loaded
- Context contains correct `museumId`
