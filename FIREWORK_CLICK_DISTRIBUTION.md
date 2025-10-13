# Firework Click-to-Launch Distribution Feature

## Overview
This document describes the implementation of remote distribution for click-launched fireworks on the fireworks wall, making them visible to all users just like task check-in fireworks.

## Problem Statement
Previously, when users clicked on the fireworks wall to launch fireworks, those fireworks were only displayed locally and not shared with other users. This was inconsistent with task check-in fireworks which are uploaded to remote storage and distributed to all users.

## Solution
Added remote storage upload functionality for click-launched fireworks, ensuring they are:
1. Saved to localStorage for persistence
2. Uploaded to remote storage for distribution
3. Visible to all users accessing the fireworks wall

## Implementation Details

### Key Changes in `fireworks-wall.html`

#### 1. Upload Function
```javascript
function uploadClickFireworkToRemote(fireworkData) {
    const API_ENDPOINT = 'https://rlyhccdr2g.execute-api.us-west-2.amazonaws.com/default/keyValueStore';
    const FIREWORK_KEY = 'museumcheck-firework';
    
    fetch(API_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            key: FIREWORK_KEY,
            sortKey: fireworkData.id,
            value: JSON.stringify(fireworkData),
            ttl: 3600
        })
    })
    .then(response => response.json())
    .then(data => console.log('Click firework uploaded successfully:', data))
    .catch(error => console.error('Error uploading click firework:', error));
}
```

#### 2. Firework Data Structure
```javascript
const fireworkData = {
    id: `click-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    museumId: filterMuseumId || null,
    museumName: filterMuseumName || null,
    taskContent: displayText,
    taskName: displayText,
    childNickname: childNickname,
    timestamp: Date.now(),
    fireworkType: fireworkType,
    isClickLaunched: true  // Distinguishes from task completion fireworks
};
```

#### 3. Storage and Upload Flow
1. User clicks on canvas
2. Create firework animation locally
3. Generate firework data structure
4. Save to localStorage (`museumCheckFireworks`)
5. Upload to remote storage (AWS KV store)
6. Remote storage distributes to all users

### Data Format Comparison

**Task Check-in Firework:**
```javascript
{
    id: `${museumId}-${timestamp}-${random}`,
    museumId: string,
    museumName: string,
    taskContent: string,
    taskName: string,
    childNickname: string,
    timestamp: number,
    ageGroup: string
}
```

**Click-launched Firework:**
```javascript
{
    id: `click-${timestamp}-${random}`,
    museumId: string|null,
    museumName: string|null,
    taskContent: string,
    taskName: string,
    childNickname: string,
    timestamp: number,
    fireworkType: string,
    isClickLaunched: true
}
```

**Key Differences:**
- Click fireworks use `click-` ID prefix
- Click fireworks include `fireworkType` (heart, star, circle, etc.)
- Click fireworks include `isClickLaunched` flag
- Click fireworks don't include `ageGroup` (context-independent)
- Museum fields can be null for total fireworks wall

### Display Text Logic

**Total Fireworks Wall** (no museum filter):
```javascript
displayText = `大家好，我是${childNickname}`;
// Example: "大家好，我是小明"
```

**Museum-specific Wall** (with museum filter):
```javascript
displayText = `${childNickname}打卡${filterMuseumName}`;
// Example: "小明打卡故宫博物院"
```

## Testing

### Unit Tests Added
Location: `tests/fireworks-wall-click.test.js`

**Test Categories:**
1. Display Text Generation (4 tests)
2. Context Detection (3 tests)
3. Multiple Combinations (2 tests)
4. Throttling Logic (3 tests)
5. **Firework Data Structure** (3 new tests)
6. **Local Storage Operations** (2 new tests)
7. **Remote Upload Payload** (1 new test)

**Test Results:**
- Total: 19 tests pass
- New: 7 tests added
- Coverage: Firework data structure, localStorage ops, remote upload

### Manual Testing Checklist
- [ ] Open fireworks wall (http://localhost:8000/fireworks-wall.html)
- [ ] Click on canvas to launch firework
- [ ] Verify firework launches with correct display text
- [ ] Check browser DevTools > Network for POST request to AWS endpoint
- [ ] Verify localStorage contains new entry in `museumCheckFireworks`
- [ ] Open second browser/tab to same URL
- [ ] Wait for periodic download (10 seconds)
- [ ] Verify click-launched firework appears on second instance

## Remote Storage Configuration

**API Endpoint:**
```
https://rlyhccdr2g.execute-api.us-west-2.amazonaws.com/default/keyValueStore
```

**Storage Key:**
```
museumcheck-firework
```

**TTL:**
- 3600 seconds (1 hour)
- Fireworks expire after 1 hour to prevent storage bloat

**Download Interval:**
- 10 seconds (fireworks-wall.html)
- Automatic periodic sync for all users

## Future Enhancements

Potential improvements:
1. Add real-time WebSocket updates instead of polling
2. Implement firework replay/history feature
3. Add moderation/filtering for inappropriate content
4. Track firework statistics (most popular types, busiest museums)
5. Add user profiles with firework launch history

## Compatibility

**Browsers:**
- Chrome/Chromium ✓
- Firefox ✓
- Safari ✓
- Edge ✓

**Storage:**
- localStorage (required)
- Remote AWS KV store (required for distribution)

**Dependencies:**
- None (vanilla JavaScript)

## Troubleshooting

**Fireworks not appearing on other clients:**
1. Check network tab for successful POST request
2. Verify localStorage has data: `localStorage.getItem('museumCheckFireworks')`
3. Wait for download interval (10 seconds)
4. Check for CORS errors in console

**Upload failures:**
1. Verify internet connection
2. Check AWS endpoint availability
3. Review browser console for errors
4. Confirm API key is correct

**localStorage quota exceeded:**
1. Clear old firework data
2. Implement automatic cleanup for old entries
3. Consider indexedDB for larger storage

## References

- Original issue: 点击的烟花 (Click-launched fireworks distribution)
- Related file: `museum-checkin.html` (task completion fireworks)
- Test file: `tests/fireworks-wall-click.test.js`
- PR: [Link will be added by GitHub]

## Version History

- **v2.1.3**: Initial implementation of click-launched firework distribution
