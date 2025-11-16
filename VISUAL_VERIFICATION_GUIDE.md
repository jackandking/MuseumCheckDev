# Dynamic Data Priority Fix - Visual Verification Guide

## Testing Steps for Visual Verification

### Step 1: Check Settings Page
URL: `http://localhost:8000/settings.html` or `https://museumcheck.cn/settings.html`

**What to verify:**
- [ ] Data priority dropdown shows three options:
  - "静态文件 → 远程存储 → 内置数据（推荐）"
  - "远程存储 → 静态文件 → 内置数据（开发调试）"
  - "内置数据 → 静态文件 → 远程存储（离线优先）"
- [ ] Clicking "保存" shows "设置已保存" alert
- [ ] Priority is saved to localStorage
- [ ] Cache is cleared after saving

**How to verify:**
1. Open browser DevTools (F12)
2. Go to Console tab
3. Type: `localStorage.getItem('museumDataTierPriority')`
4. Should show: `{"priority":["tier1","tier2","tier3"]}` or similar
5. Change priority and save
6. Console should show: "Museum data cache cleared due to priority change"

### Step 2: Test Manual Test Page
URL: `http://localhost:8000/test-dynamic-data-priority.html`

**What to verify:**
- [ ] Page loads successfully
- [ ] "Check Current Priority" button shows current settings
- [ ] "Change Data Priority" dropdown works
- [ ] "Load Museum" button loads museum data and shows image
- [ ] "Upload to KV Store" button accepts test image URL

**Expected behavior:**
1. Click "Check Current Priority" → Shows "tier1-tier2-tier3"
2. Select museum "首都博物馆" and click "Load Museum"
3. Should show museum name, location, and image
4. Note the image URL (this is from Tier 1 or Tier 3)
5. Enter a test image URL and click "Upload to KV Store"
6. Change priority to "Remote Storage → Static Files → Built-in"
7. Click "Clear Cache"
8. Click "Load Museum (No Cache)" again
9. Should now show the test image URL (from Tier 2/KV store)

### Step 3: Test in Main Application
URL: `http://localhost:8000/index.html` or `https://museumcheck.cn/`

**Scenario A: Default Priority (Static Files First)**
1. [ ] Open settings, verify priority is "静态文件 → 远程存储 → 内置数据"
2. [ ] Click on any museum card (e.g., 首都博物馆)
3. [ ] Modal opens showing museum image
4. [ ] Image should be from static files or built-in data

**Scenario B: KV Store Priority (Development Mode)**
1. [ ] Go to museum-data-manager.html
2. [ ] Load a museum (e.g., beijing-capital-museum)
3. [ ] Change the image URL to a test URL
4. [ ] Upload to KV store
5. [ ] Go back to settings
6. [ ] Change priority to "远程存储 → 静态文件 → 内置数据"
7. [ ] Click "保存"
8. [ ] Go to main page
9. [ ] Click on the museum you updated
10. [ ] Modal should show your updated image from KV store ✅

**Scenario C: Offline Mode**
1. [ ] Open settings
2. [ ] Change priority to "内置数据 → 静态文件 → 远程存储"
3. [ ] Save
4. [ ] Open browser DevTools → Network tab
5. [ ] Set to "Offline" mode
6. [ ] Click on a museum
7. [ ] Should still work using built-in data

### Step 4: Verify Cache Behavior

**Test cache clearing:**
1. Open DevTools Console
2. Type: `window.museumDataLoader.cache.size`
3. Should show 0 if cache is empty
4. Load a museum in test page with cache enabled
5. Check cache size again - should be > 0
6. Click "Clear Cache" button
7. Check cache size - should be 0 again

**Test priority change clears cache:**
1. Load a museum (creates cache)
2. Check cache: `window.museumDataLoader.cache.size` > 0
3. Go to settings
4. Change priority
5. Click "保存"
6. Check cache again: should be 0

### Step 5: Browser DevTools Verification

**Console checks:**
```javascript
// Check priority settings
localStorage.getItem('museumDataTierPriority')
// Should show: {"priority":["tier1","tier2","tier3"]} or similar

// Check loader exists
window.museumDataLoader
// Should show: MuseumDataLoader object

// Check current priority
window.museumDataLoader.getPrioritySettings()
// Should show: ["tier1", "tier2", "tier3"]

// Test loading a museum
window.museumDataLoader.loadMuseum('beijing-capital-museum', false)
  .then(m => console.log('Loaded:', m.name, 'Image:', m.image))
// Should show museum name and image URL
```

**Network tab checks:**
When loading a museum:
- With tier1 first: Should see request to `/museums/beijing-capital-museum.json`
- With tier2 first: Should see request to KV store API
- With tier3 first: No network requests (uses built-in data)

### Step 6: End-to-End Test Scenario

**Complete workflow:**
1. ✅ Start with default settings (tier1-tier2-tier3)
2. ✅ Open 首都博物馆, note the image
3. ✅ Go to museum-data-manager.html
4. ✅ Load 首都博物馆 data
5. ✅ Change image to: `https://upload.wikimedia.org/wikipedia/commons/thumb/1/1e/Capital_Museum_Beijing.jpg/800px-Capital_Museum_Beijing.jpg`
6. ✅ Upload to KV store
7. ✅ Verify upload success message
8. ✅ Go to settings
9. ✅ Change priority to "远程存储 → 静态文件 → 内置数据"
10. ✅ Save and verify cache cleared message
11. ✅ Go back to main page
12. ✅ Click 首都博物馆 again
13. ✅ Verify modal shows the NEW image from KV store
14. ✅ Change priority back to default
15. ✅ Save
16. ✅ Click museum again
17. ✅ Verify modal shows ORIGINAL image

## Expected Console Messages

### When opening museum modal with dynamic priority:
```
Loaded museum beijing-capital-museum from Tier 2 (KV store)
```
or
```
Museum beijing-capital-museum not found in Tier 2: ...
Loaded museum beijing-capital-museum from Tier 1 (static file)
```
or
```
Loaded museum beijing-capital-museum from Tier 3 (MUSEUMS array)
```

### When saving settings:
```
Museum data tier priority updated: ["tier2", "tier1", "tier3"]
Museum data cache cleared due to priority change
```

### When clearing cache:
```
Cleared all museum data cache
```

## Troubleshooting

### If images don't update:
1. Check cache was cleared: `window.museumDataLoader.cache.size` should be 0
2. Check priority is correct: `window.museumDataLoader.getPrioritySettings()`
3. Check localStorage: `localStorage.getItem('museumDataTierPriority')`
4. Try hard refresh: Ctrl+Shift+R (or Cmd+Shift+R on Mac)
5. Check browser console for errors

### If KV store upload fails:
1. Check network connection
2. Check browser console for error messages
3. Verify KV store endpoint is accessible
4. Try with a different image URL

### If priority doesn't save:
1. Check localStorage quota not exceeded
2. Check browser console for errors
3. Try different browser
4. Clear localStorage and try again: `localStorage.clear()`

## Success Criteria

The fix is successful if:
- ✅ All 14 unit tests pass
- ✅ Manual test page loads and all features work
- ✅ Settings page saves priority correctly
- ✅ Cache is cleared when priority changes
- ✅ Museums load from correct tier based on priority
- ✅ KV store updates appear when tier2 is prioritized
- ✅ Static data appears when tier1 is prioritized
- ✅ No JavaScript errors in console
- ✅ No regressions in existing functionality

## Screenshots to Take

For documentation, capture these screens:

1. **Settings page** - showing data priority dropdown
2. **Test page** - after loading museum with current priority
3. **Test page** - after uploading test data to KV store
4. **Test page** - after changing priority and reloading (showing new image)
5. **Main app** - museum modal with KV store image
6. **Main app** - same museum modal after reverting to static priority
7. **DevTools Console** - showing successful priority change and cache clear
8. **DevTools Network** - showing tier1 JSON file request
9. **DevTools Network** - showing tier2 KV store API request
10. **Museum data manager** - showing successful upload confirmation
