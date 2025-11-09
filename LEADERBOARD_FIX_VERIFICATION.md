# Leaderboard API Parameter Bug - Manual Verification Guide

## Bug Summary
**Issue**: After checking in 3 museums on mobile, the leaderboard shows one related record, but the admin leaderboard management page shows empty data.

**Root Cause**: The API calls were using `ttl` parameter instead of `expireAt` parameter, causing data not to be properly stored in the remote storage.

**Fix**: Changed `ttl` to `expireAt` in:
- `script.js` line 3447: `submitScore()` function
- `admin-leaderboard.js` line 69: `updateEntry()` function

## Manual Verification Steps

### Prerequisites
1. Have access to the MuseumCheck application
2. Have access to the admin leaderboard page (requires `?admin=1` URL parameter)
3. Clear any existing leaderboard data for a clean test

### Test Scenario 1: User Check-in Flow

1. **Open the main application**
   - URL: http://localhost:8000 (or production URL)
   
2. **Set a nickname**
   - Click on settings
   - Set nickname to "测试用户"
   - Save settings

3. **Check in 3 museums**
   - Visit the main page
   - Click on 3 different museum cards
   - Mark each as visited (打卡)
   
4. **View the leaderboard**
   - Click the leaderboard button (🏅 排行榜)
   - Verify you see your entry:
     - Nickname: "测试用户"
     - Visit count: "3个博物馆"
     - Rank position displayed (or "-" if no other users)

5. **Open browser DevTools**
   - Press F12
   - Go to Network tab
   - Click refresh on leaderboard
   - Find the POST request to the API
   - Inspect the request payload
   - **Verify**: The request contains `expireAt` parameter (NOT `ttl`)

### Test Scenario 2: Admin Page Verification

1. **Open the admin leaderboard page**
   - URL: http://localhost:8000/admin-leaderboard.html?admin=1
   
2. **Check the leaderboard data**
   - Click "🔄 重新加载数据" button
   - **Expected Result**: 
     - Total user count shows 1 (or more if multiple users)
     - Your entry is visible in the table
     - Shows correct nickname: "测试用户"
     - Shows correct visit count: 3
     - Data status shows "正常" (green tag)

3. **Verify in browser DevTools**
   - Network tab should show GET request to API
   - Response should contain `items` array with your entry
   - Each item should have `expireAt` timestamp
   - **Before the fix**: This would be empty
   - **After the fix**: This should contain data

### Test Scenario 3: Admin Edit Function

1. **On the admin page, edit an entry**
   - Click "✏️ 编辑" button on any entry
   - Change the nickname to "编辑测试"
   - Change visit count to 5
   - Confirm the changes

2. **Verify in DevTools**
   - Find the POST request for the update
   - Inspect request payload
   - **Verify**: Contains `expireAt` parameter (NOT `ttl`)

3. **Reload the admin page**
   - Click "🔄 重新加载数据"
   - **Expected**: Changes are persisted and visible

### Test Scenario 4: Cross-verification

1. **After admin edit, check main app**
   - Return to main application
   - Open leaderboard
   - **Expected**: See updated data (nickname and count)

2. **Clear cache and test**
   - Clear browser cache
   - Reload both main app and admin page
   - **Expected**: Data persists across page reloads

## Expected Behavior After Fix

### ✅ Correct Behavior
- User check-ins appear in the leaderboard
- Admin page shows all leaderboard entries
- Data persists across page reloads
- API calls use `expireAt` parameter
- Edit operations in admin page work correctly

### ❌ Before Fix (Bug Behavior)
- User check-ins submitted but not visible in admin page
- Admin page shows "暂无排行榜数据"
- API calls used `ttl` parameter (incorrect)
- Data not properly stored in remote storage

## API Request Inspection

### Correct Request Format (After Fix)
```json
{
  "key": "museumcheck-leaderboard",
  "sortKey": "user-<userId>",
  "value": "{\"userId\":\"...\",\"nickname\":\"...\",\"visitedCount\":3,\"lastUpdate\":...}",
  "expireAt": 4866674732
}
```

### Incorrect Request Format (Before Fix)
```json
{
  "key": "museumcheck-leaderboard",
  "sortKey": "user-<userId>",
  "value": "{\"userId\":\"...\",\"nickname\":\"...\",\"visitedCount\":3,\"lastUpdate\":...}",
  "ttl": 4866674732  ← WRONG PARAMETER NAME
}
```

## Automated Test Coverage

The fix includes comprehensive automated tests in `tests/leaderboard-api-parameter.test.js`:

1. **Test 1**: Verifies `submitScore()` uses `expireAt` parameter
2. **Test 2**: Verifies admin `updateEntry()` uses `expireAt` parameter
3. **Test 3**: End-to-end scenario testing data persistence

Run tests with:
```bash
npm test -- tests/leaderboard-api-parameter.test.js
```

Expected output: All 3 tests pass ✅

## Troubleshooting

### If admin page still shows empty:
1. Check browser console for errors
2. Verify network requests use `expireAt` (not `ttl`)
3. Clear browser cache and localStorage
4. Re-submit check-ins from main app
5. Check API endpoint is accessible

### If leaderboard doesn't update:
1. Wait a few seconds for API sync
2. Click refresh button on leaderboard
3. Check browser console for errors
4. Verify localStorage contains `visitedMuseums` data

## Conclusion

This fix ensures that leaderboard data is properly stored with the correct `expireAt` parameter, making it visible and manageable in both the user-facing leaderboard and the admin management page.
