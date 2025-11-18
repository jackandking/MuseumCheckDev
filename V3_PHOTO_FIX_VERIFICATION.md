# V3 Photo Fix - Verification Guide

## Overview

This document provides verification steps for the v3 photo fix that ensures Tier 1/2 enriched data is used instead of Tier 3 fallback data.

## What Was Fixed

### Issue
v3 was displaying incorrect museum building photos and treasure (镇馆之宝) photos because it used Tier 3 (museums-data.js) fallback data instead of Tier 1 (static JSON files) or Tier 2 (KV store) enriched data.

### Solution
1. **Museum cards** now lazy-load Tier 1/2 images using Intersection Observer
2. **Treasure workflows** are regenerated after loading enriched museum data
3. **Workflow tasks** use enriched collection imageUrls from Tier 1/2

## Verification Steps

### Step 1: Test Museum Card Images

1. Open http://localhost:8000/single-museum.html
2. Observe the museum cards in the selection view
3. Check browser console for log messages:
   - `"Loaded enriched data for {museum-id} from museum data loader"`
   - `"Updated card image for {museum-id} from Tier 1/2"`

**Expected Behavior:**
- Cards initially show Tier 3 images (fast render)
- When cards become visible, Tier 1/2 images are loaded
- Console shows "Updated card image" for museums with different images

### Step 2: Test Treasure Workflow Generation

1. Click on a museum card (e.g., 故宫博物院)
2. Check browser console for:
   - `"Loaded enriched data for forbidden-city from museum data loader"`
   - `"Regenerating treasure hunt workflow for forbidden-city with enriched data"`
   - `"Updated treasure-discovery workflow with 3 treasures"`

**Expected Behavior:**
- Enriched data is loaded from Tier 1/2
- Treasure hunt workflow is regenerated
- Workflow tasks have correct imageUrls from enriched collections

### Step 3: Test Treasure Photos in Workflow

1. After selecting a museum, click "开始探险" (Start Adventure)
2. Navigate through the workflow tasks
3. Verify treasure photos display correctly with reference images

**Expected Behavior:**
- Treasure tasks show images from Tier 1 collections
- Images are from correct sources (e.g., Wikimedia Commons)
- Images match the treasure descriptions

### Step 4: Compare Tier 1 vs Tier 3 Data

Run the verification script:
```bash
node test-v3-photo-fix.js
```

**Expected Output:**
```
✅ All Tier 1 files have proper structure
Found {N} differences between Tier 1 and Tier 3
✅ FIX IS NEEDED AND IMPLEMENTED
```

### Step 5: Visual Verification

Open the test page:
```bash
open http://localhost:8000/test-v3-photo-fix.html
```

Click "Run All Tests" and verify:
- ✅ Museum data loader exists
- ✅ Tier 1 static files load successfully
- ✅ Museum cards show updated images
- ✅ Treasure workflows have correct imageUrls

## Test Museums

The following museums have Tier 1 data for testing:

1. **故宫博物院** (forbidden-city)
   - 3 treasures with images
   - Museum building image from Tier 1

2. **中国国家博物馆** (national-museum)
   - 3 treasures with images
   - Museum building image from Tier 1

3. **上海博物馆** (shanghai-museum)
   - 3 treasures with images
   - Museum AND treasure images differ from Tier 3 ⚠️

4. **首都博物馆** (beijing-capital-museum)
   - 4 treasures with images
   - Museum building image from Tier 1

## Known Differences

### Shanghai Museum (上海博物馆)
- **Museum Image:**
  - Tier 3: `https://eb118-file.cdn.bcebos.com/upload/...`
  - Tier 1: `https://upload.wikimedia.org/wikipedia/commons/...`

- **Treasure Images:**
  - 大克鼎: Different Wikimedia URLs
  - 商鞅方升: Different Wikimedia URLs
  - 《淳化阁帖》: Different Wikimedia URLs

This proves the fix is necessary and working correctly.

## Browser Console Verification

Open browser DevTools (F12) → Console and look for:

### Good Signs ✅
```
Loaded enriched data for {museum-id} from museum data loader
Regenerating treasure hunt workflow for {museum-id} with enriched data
Updated treasure-discovery workflow with {N} treasures
Updated card image for {museum-id} from Tier 1/2
```

### Fallback Signs ℹ️ (Normal)
```
Using fallback data for {museum-id} from MUSEUMS array
Museum {museum-id} not found in Tier 1
```

These indicate Tier 1/2 data is unavailable and Tier 3 fallback is used - this is expected and correct behavior.

### Error Signs ❌
```
Failed to load enriched data for {museum-id}
Failed to regenerate treasure hunt workflow
```

These should NOT appear - if they do, there's an error.

## Performance Notes

- **Lazy Loading:** Museum card images load only when visible (Intersection Observer)
- **Caching:** Museum data loader caches Tier 1/2 data to avoid repeated fetches
- **Graceful Degradation:** Falls back to Tier 3 when Tier 1/2 unavailable

## Troubleshooting

### Issue: No images update
**Check:**
1. Browser supports Intersection Observer (all modern browsers)
2. Network tab shows `/museums/{museum-id}.json` requests
3. Console shows "Updated card image" logs

### Issue: Workflows not regenerated
**Check:**
1. Console shows "Loaded enriched data" log
2. `window.TreasureWorkflowGenerator` exists
3. Enriched data has different collections than original

### Issue: Test page doesn't load
**Check:**
1. HTTP server is running: `python3 -m http.server 8000`
2. Museums-data.js is loaded correctly
3. Museum-data-loader.js is loaded correctly

## Success Criteria

The fix is working correctly if:

1. ✅ Museum cards show Tier 1/2 images when available
2. ✅ Treasure workflows use Tier 1/2 collection imageUrls
3. ✅ Console shows enriched data loading logs
4. ✅ Test script confirms Tier 1 vs Tier 3 differences
5. ✅ No errors in browser console
6. ✅ Graceful fallback to Tier 3 when Tier 1/2 unavailable

All criteria should be met for the fix to be considered complete.
