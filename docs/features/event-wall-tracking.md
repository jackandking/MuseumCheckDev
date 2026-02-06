# Event Wall Tracking Feature

## Overview

This document describes the event wall tracking feature that records user activities to provide visibility into how users interact with the MuseumCheck application.

## Feature Description

The event wall tracks three types of user activities:

### 1. 博物馆访问 (Museum Visits)
Records when users view museum details.

**Trigger:** When a user opens a museum modal or details page

**Event Data:**
- **Type:** `visit`
- **Title:** 访问博物馆 (Visit Museum)
- **Description:** 查看 {博物馆名称} 的详细信息 (View details of {museum name})
- **Parameters:**
  - `museumId`: Unique identifier of the museum
  - `museumName`: Display name of the museum

**Implementation:** `js/script.js` - `openMuseumModal()` method

### 2. 搜索活动 (Search Activities)
Records search queries performed by users.

**Trigger:** When a user searches with 2 or more characters

**Event Data:**
- **Type:** `search`
- **Title:** 搜索博物馆 (Search Museum)
- **Description:** 搜索关键字：{查询内容} (Search keyword: {query})
- **Parameters:**
  - `query`: The search query string
  - `resultsCount`: Number of search results returned

**Implementation:** `js/script.js` - Search event handler in `EventHandlers.handleSearch`

### 3. 页面访问 (Page Views)
Records page navigation events.

**Trigger:** When a page finishes loading (on `init()` completion)

**Event Data:**
- **Type:** `page_view`
- **Title:** 访问页面 (Visit Page)
- **Description:** 访问 {页面名称} (Visit {page name})
- **Parameters:**
  - `pageName`: Chinese display name of the page
  - `pageUrl`: Full URL of the page

**Page Name Mapping:**
| File Name | Chinese Name |
|-----------|--------------|
| index.html | 首页 |
| event-wall.html | 事件墙 |
| fireworks-wall.html | 烟花墙 |
| fireworks.html | 烟花 |
| achievements.html | 成就 |
| leaderboard.html | 排行榜 |
| treasures.html | 宝藏 |
| museum-checkin.html | 博物馆签到 |
| everyone-achievements.html | 全民成就 |

**Implementation:** `js/script.js` - `init()` method and `getPageName()` helper

## Event Wall Display

### Filter Buttons

The event wall page (`event-wall.html`) includes filter buttons for all event types:

- **全部** (All) - Show all events
- **博物馆参观** (🏛️ Museum Visits) - Green theme
- **搜索活动** (🔍 Search Activities) - Yellow theme
- **页面访问** (📄 Page Views) - Light blue theme
- **任务完成** (Task Completion)
- **清单完成** (Checklist Completion)
- **成就解锁** (Achievement Unlocked)
- **亲子测评** (Parent-Child Assessment)

### Event Type Styling

Each event type has distinct visual styling:

```css
/* Museum Visits */
.event-type.visit {
    background: #e8f5e9;
    color: #2e7d32;
}

/* Search Activities */
.event-type.search {
    background: #fff9c4;
    color: #f57f17;
}

/* Page Views */
.event-type.page_view {
    background: #e1f5fe;
    color: #0277bd;
}
```

## Event Data Flow

```
User Action
    ↓
EventWallService.recordEvent()
    ↓
Add to pending events queue
    ↓
Batch events (max 10 or 2-second delay)
    ↓
Send to KV Store (AWS Lambda)
    ↓
Store with 24-hour TTL
    ↓
Display in Event Wall
```

## Technical Details

### EventWallService API

The `EventWallService` class handles event recording:

```javascript
// General event recording
recordEvent(eventType, title, description, parameters)

// Convenience methods (existing)
trackMuseumVisit(museumId, museumName)
trackChecklistComplete(museumId, museumName, checklistType, itemCount)
trackTaskComplete(museumId, museumName, checklistType, taskDescription, ageGroup)
trackAchievementUnlock(achievementId, achievementName)
trackAssessmentComplete(museumId, museumName, score, totalScore)
```

### Event Structure

All events follow this structure:

```javascript
{
    id: "event-{timestamp}-{random}",
    eventType: "visit" | "search" | "page_view" | "task" | "checklist" | "achievement" | "assessment",
    eventName: "访问博物馆" | "搜索博物馆" | "访问页面" | ...,
    title: "Event title",
    description: "Event description",
    parameters: {
        // Event-specific parameters
    },
    userId: "user-id-from-localStorage",
    childNickname: "用户昵称 or 小淘气",
    timestamp: 1234567890123,
    version: "1.0"
}
```

### Storage

Events are stored in AWS DynamoDB via AWS Lambda API:

- **Endpoint:** `https://rlyhccdr2g.execute-api.us-west-2.amazonaws.com/default/keyValueStore`
- **Key:** `museumcheck-events`
- **Sort Key:** Event ID (unique per event)
- **TTL:** 24 hours (86400 seconds)

### Batching Strategy

Events are batched for efficient network usage:

- **Batch Size:** Up to 10 events
- **Delay:** 2 seconds after last event
- **Retry:** Failed events are re-queued

## User Privacy

- Events include user ID and nickname but no personally identifiable information
- Events expire after 24 hours
- Users can see all events on the event wall page (public activity feed)

## Future Enhancements

Potential improvements for the event wall:

1. **Real-time Updates:** WebSocket connection for live event streaming
2. **Advanced Filtering:** Filter by date range, user, museum
3. **Event Analytics:** Aggregated statistics and visualizations
4. **Export Functionality:** Download event history as CSV/JSON
5. **Event Details Modal:** Click on event to see full details
6. **User Activity Timeline:** Personal activity history per user

## Testing

Comprehensive test suite available in `tests/event-wall-tracking.test.js`:

- Museum visit tracking tests
- Search activity tracking tests
- Page view tracking tests
- Event display configuration tests
- Event batching tests

Run tests with:
```bash
npm test -- tests/event-wall-tracking.test.js
```

## Validation

Validation script to verify implementation:

```bash
node /tmp/validate-implementation.js
```

This checks:
- ✅ Museum visit tracking code exists
- ✅ Search tracking code exists
- ✅ Page view tracking code exists
- ✅ Page name helper function exists
- ✅ Event wall filter buttons exist
- ✅ Event type icons configured
- ✅ Event type labels configured
- ✅ CSS styles for event types exist

## Related Files

- `js/script.js` - Main tracking implementation
- `js/event-wall-service.js` - Event recording service
- `event-wall.html` - Event wall display page
- `tests/event-wall-tracking.test.js` - Test suite

## References

- [Issue #XXX](https://github.com/jackandking/MuseumCheck/issues/XXX) - Original feature request
- [EventWallService Documentation](../api/event-wall-service.md)
- [KV Store API Documentation](../api/kv-store.md)
