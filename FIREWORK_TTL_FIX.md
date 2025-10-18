# Firework TTL Fix - Cross-Device Visibility Issue

## Issue Summary

**Problem**: When completing child tasks on the check-in page for Zhaoyuan Hengli Watch Museum (招远恒利钟表博物馆), fireworks only appeared on the local fireworks wall. Other devices did not see the related fireworks.

**Original Issue**: 招远恒利钟表博物馆的checkin页面完成孩子任务触发的烟花只在本地烟花墙起作用。其他设备没有看到相关烟花

## Root Cause

The TTL (time-to-live) for uploaded fireworks was set to **3600 seconds (1 hour)** in:
- `museum-checkin.html` (line 897)
- `fireworks-wall.html` (line 1540)
- `script.js` REMOTE_STORAGE_CONFIG constant

This caused fireworks to expire after 1 hour and be deleted from remote storage. When other devices accessed the fireworks wall after this period, the fireworks were no longer available for download.

### Why This Was a Problem

1. **Museum visits typically last 1-3 hours**: Families spending time at a museum would upload fireworks at various times during their visit
2. **Delayed viewing**: Other family members or devices that checked the fireworks wall after 1 hour would not see the completed tasks
3. **Cross-device synchronization failure**: The short TTL meant fireworks didn't persist long enough for reliable cross-device visibility
4. **User expectation mismatch**: Users expected their achievements to be visible throughout the day, not just for 1 hour

## Solution

Increased TTL from **3600 seconds (1 hour)** to **86400 seconds (24 hours)**.

### Why 24 Hours?

- **Same-day visibility**: All fireworks from a museum visit remain visible throughout the day
- **Family coordination**: Parents and children on different devices can see each other's progress
- **Reasonable persistence**: Long enough for practical use without causing excessive storage bloat
- **Daily refresh**: Fireworks from previous days are cleaned up, keeping storage manageable

## Changes Made

### 1. museum-checkin.html (Line 897)

**Before:**
```javascript
ttl: 3600
```

**After:**
```javascript
ttl: 86400  // 24 hours - long enough for same-day visibility across devices
```

### 2. fireworks-wall.html (Line 1540)

**Before:**
```javascript
ttl: 3600
```

**After:**
```javascript
ttl: 86400  // 24 hours - long enough for same-day visibility across devices
```

### 3. script.js (REMOTE_STORAGE_CONFIG)

**Before:**
```javascript
FIREWORK_EXPIRATION: 3600, // 1 hour in seconds
```

**After:**
```javascript
FIREWORK_EXPIRATION: 86400, // 24 hours in seconds - long enough for same-day visibility across devices
```

## Testing

### Unit Tests Added

Created comprehensive regression test: `tests/firework-ttl-regression.test.js`

**Test Coverage** (8 tests):
1. ✅ Firework TTL should be 24 hours, not 1 hour
2. ✅ museum-checkin.html should upload fireworks with 24-hour TTL
3. ✅ fireworks-wall.html click fireworks should upload with 24-hour TTL
4. ✅ REMOTE_STORAGE_CONFIG.FIREWORK_EXPIRATION should be 24 hours
5. ✅ 24-hour TTL provides same-day visibility across devices
6. ✅ TTL calculation is consistent across all firework uploads
7. ✅ Firework upload includes all required fields for cross-device visibility
8. ✅ Validates TTL is in seconds, not milliseconds

**Test Results:**
```
PASS tests/firework-ttl-regression.test.js
  ✓ All 8 tests passing
```

### Updated Existing Tests

Modified `tests/fireworks-wall-click.test.js` to expect the new TTL value:
```javascript
expect(apiPayload.ttl).toBe(86400);  // Updated from 3600
```

## Impact Analysis

### Before Fix
- ⏱️ Fireworks expired after 1 hour
- ❌ Other devices couldn't see fireworks uploaded more than 1 hour ago
- ❌ Museum visits longer than 1 hour had incomplete firework history
- ❌ Families on different devices had inconsistent views

### After Fix
- ⏱️ Fireworks persist for 24 hours
- ✅ All same-day fireworks visible across all devices
- ✅ Complete museum visit history available throughout the day
- ✅ Consistent cross-device experience

## Use Case Scenarios

### Scenario 1: Family Museum Visit
**Before Fix:**
- 10:00 AM - Child completes first task, firework uploaded (TTL: expires at 11:00 AM)
- 11:30 AM - Parent checks fireworks wall → **Cannot see 10:00 AM firework** ❌
- Result: Incomplete achievement tracking

**After Fix:**
- 10:00 AM - Child completes first task, firework uploaded (TTL: expires at 10:00 AM next day)
- 11:30 AM - Parent checks fireworks wall → **Sees 10:00 AM firework** ✅
- 2:00 PM - Another family member checks → **Sees all fireworks** ✅
- Result: Complete achievement tracking

### Scenario 2: Multiple Devices
**Before Fix:**
- Device A uploads firework at 1:00 PM (expires at 2:00 PM)
- Device B checks at 3:00 PM → **Firework already expired** ❌
- Result: Cross-device synchronization failure

**After Fix:**
- Device A uploads firework at 1:00 PM (expires at 1:00 PM next day)
- Device B checks at 3:00 PM → **Firework still available** ✅
- Device C checks at 8:00 PM → **Firework still available** ✅
- Result: Reliable cross-device synchronization

### Scenario 3: Zhaoyuan Hengli Watch Museum (招远恒利钟表博物馆)
**Before Fix (The Reported Bug):**
- Complete child task on check-in page
- Firework uploaded with 1-hour TTL
- Other devices accessing after 1 hour see nothing
- Museum-specific fireworks wall appears empty to other visitors

**After Fix:**
- Complete child task on check-in page
- Firework uploaded with 24-hour TTL
- Other devices can see fireworks throughout the entire day
- Museum-specific fireworks wall shows all same-day achievements

## Storage Considerations

### Storage Calculation
**Estimated firework data size**: ~500 bytes per firework
**Average daily fireworks**: ~1000 fireworks/day (estimate)
**Daily storage**: 1000 × 500 bytes = 500 KB

**Before Fix (1 hour TTL):**
- Maximum concurrent storage: ~42 fireworks (~21 KB)
- Very frequent cleanup but poor user experience

**After Fix (24 hour TTL):**
- Maximum concurrent storage: ~1000 fireworks (~500 KB)
- Daily cleanup, balanced user experience and storage efficiency

### AWS Lambda/DynamoDB Impact
- Storage increase is minimal (KB range)
- AWS TTL-based deletion handles cleanup automatically
- No manual intervention required
- Cost impact: Negligible (well within free tier)

## Verification Checklist

- [x] Code changes implemented in all three files
- [x] Unit tests created and passing (8 new tests)
- [x] Existing tests updated and passing
- [x] Documentation updated (FIREWORK_CLICK_DISTRIBUTION.md)
- [x] TTL values consistent across codebase
- [x] Comments added explaining the 24-hour choice
- [x] Manual testing completed with local server verification
- [x] Changes verified in served HTML pages (TTL confirmed as 86400)
- [ ] Production deployment verification (requires deployment to production)

## Future Considerations

### Potential Improvements
1. **Configurable TTL**: Allow users to choose firework retention period (1 day, 3 days, 1 week)
2. **Premium features**: Longer TTL for premium users
3. **Archive feature**: Save favorite fireworks permanently to localStorage
4. **Analytics**: Track firework view patterns to optimize TTL further

### Monitoring
Monitor the following metrics after deployment:
- Storage usage trends
- Firework visibility success rate
- User engagement with fireworks wall
- Cross-device synchronization latency

## Related Issues

- Original issue: 招远恒利钟表博物馆的checkin页面完成孩子任务触发的烟花只在本地烟花墙起作用
- Related feature: Click-launched fireworks (uses same TTL)
- Related file: FIREWORK_CLICK_DISTRIBUTION.md

## Version History

- **v2.1.3**: Initial 1-hour TTL implementation
- **Current PR**: Fix to 24-hour TTL for cross-device visibility

## Conclusion

This fix ensures that fireworks uploaded from the museum check-in page (specifically for 招远恒利钟表博物馆 and all other museums) remain visible across all devices throughout the day, providing a consistent and reliable user experience for families visiting museums together.
