# MuseumCheck Debug Mode Documentation

## Overview

Debug Mode provides developers and testers with a comprehensive suite of debugging and testing tools available across all public pages of MuseumCheck. It includes:

- **VConsole Integration** - Mobile-friendly debugging console
- **Performance Monitoring** - Real-time performance metrics display
- **localStorage Inspector** - View and analyze local storage data
- **Network Logger** - Track fetch/XHR requests
- **Error Tracker** - Centralized error and promise rejection logging

## Activation

### Method 1: URL Parameter (Recommended)

Add `?debug=true` or `?debug=1` to any public page URL:

```
https://museumcheck.cn/?debug=true
https://localhost:8000/index.html?debug=1
https://museumcheck.cn/museum-checkin.html?debug=true
https://museumcheck.cn/quiz/session.html?debug=true
```

Debug mode will **persist** in localStorage after first activation via URL parameter.

### Method 2: localStorage (Persistent)

Set the localStorage flag manually in browser console:

```javascript
localStorage.setItem('mc_debug', '1');
location.reload();
```

To disable:
```javascript
localStorage.removeItem('mc_debug');
location.reload();
```

### Method 3: Programmatic Control

Control debug mode at runtime via the global API:

```javascript
// Enable debug mode
window.MC_debug.enable();

// Disable debug mode
window.MC_debug.disable();

// Check if debug mode is enabled
const isDebug = window.MC_debugMode.isEnabled();
console.log('Debug enabled:', isDebug);
```

## Global API Reference

### `window.MC_debug`

User control API for enabling/disabling debug mode.

```javascript
// Enable debug mode - loads VConsole and shows control panel
window.MC_debug.enable();

// Disable debug mode - unloads VConsole and hides panel
window.MC_debug.disable();
```

### `window.MC_debugMode`

Core debug mode API with structured methods.

#### `isEnabled([verbose])`

Check if debug mode is currently enabled.

```javascript
// Simple check
const enabled = window.MC_debugMode.isEnabled();

// Verbose mode - logs detailed status
window.MC_debugMode.isEnabled(true);
// Output: [MC_debugMode] Status check: { viaWindow: true, viaParam: false, viaStored: true, result: true }
```

#### `logStatus(context)`

Log debug mode status with optional context information.

```javascript
window.MC_debugMode.logStatus('page-initialization');
// Output: [MC_debugMode] Status for context: page-initialization { enabled: true }
```

#### `testFeatures`

Access to modular test features - each can be enabled/disabled independently.

```javascript
const features = window.MC_debugMode.testFeatures;

// Performance Monitor
features.performanceMonitor.enable();
features.performanceMonitor.disable();

// localStorage Inspector
features.localStorageInspector.enable();
features.localStorageInspector.view();
features.localStorageInspector.clear('keyPattern');

// Network Logger
features.networkLogger.enable();
features.networkLogger.disable();

// Error Tracker
features.errorTracker.enable();
features.errorTracker.disable();
features.errorTracker.getErrors();
features.errorTracker.clearErrors();
```

## Debug Features

### 1. VConsole Integration

When debug mode is activated, VConsole is automatically loaded from CDN:

```
https://cdn.jsdelivr.net/npm/vconsole@3.9.0/dist/vconsole.min.js
```

**What it provides:**
- Console log viewing on mobile devices
- Network request inspection
- DOM inspection
- Storage inspection
- Performance monitoring

**Access:**
- Mobile: Visible panel at bottom of screen
- Desktop: Browser DevTools preferred, VConsole optional

### 2. Performance Monitor

Real-time display of page performance metrics.

```javascript
// Enable from control panel or programmatically
window.MC_debugMode.testFeatures.performanceMonitor.enable();
```

**Displays:**
- Total page load time (from fetch start to load end)
- DOM content loaded time
- Current memory heap usage
- Number of localStorage keys

**Visual:** Floating green overlay in top-right corner

### 3. localStorage Inspector

Inspect and manage browser local storage data.

```javascript
// View all localStorage data
window.MC_debugMode.testFeatures.localStorageInspector.view();
// Output: Console table showing all key-value pairs

// Clear items matching a pattern
window.MC_debugMode.testFeatures.localStorageInspector.clear('museum');
// Clears: visitedMuseums, museumChecklists, etc.
```

**Use cases:**
- Verify data persistence after page reload
- Check museum visit records
- Monitor achievement data
- Debug localStorage quota issues

### 4. Network Logger

Intercept and log all fetch/XHR network requests.

```javascript
// Enable network logging
window.MC_debugMode.testFeatures.networkLogger.enable();

// All fetch requests now logged to console
const response = await fetch('https://api.example.com/data');
// Logs: [MC_debug] 🌐 Fetch: https://api.example.com/data
// Logs: [MC_debug] 🌐 Response: https://api.example.com/data 200
```

**Use cases:**
- Debug API integration issues
- Verify request parameters
- Monitor response status codes
- Track network performance

### 5. Error Tracker

Centralized capture and logging of errors and promise rejections.

```javascript
// Enable error tracking
window.MC_debugMode.testFeatures.errorTracker.enable();

// Automatically captures:
// - Uncaught errors
// - Unhandled promise rejections
// - Script errors

// Retrieve captured errors
const errors = window.MC_debugMode.testFeatures.errorTracker.getErrors();
console.table(errors);

// Clear error log
window.MC_debugMode.testFeatures.errorTracker.clearErrors();
```

**Captured information:**
- Error message
- File name and line number
- Column number
- Stack trace (promise rejections)
- Timestamp

## Control Panel UI

When debug mode is active, a floating control panel appears in the bottom-right corner:

```
┌─────────────────────────────┐
│ 🔧 Debug Tools            × │
├─────────────────────────────┤
│ ☑ Performance Monitor       │
│ ☐ localStorage Inspector    │
│ ☐ Network Logger            │
│ ☐ Error Tracker             │
├─────────────────────────────┤
│   Disable Debug Mode        │
└─────────────────────────────┘
```

**Features:**
- Toggle each test feature independently
- All changes take effect immediately
- Panel can be closed (Ⅹ button)
- Disable all mode with single button click

## Console Commands

Quick reference for common console operations in debug mode:

```javascript
// Check debug status
window.MC_debugMode.isEnabled(true);

// Enable/disable features quickly
window.MC_debugMode.testFeatures.performanceMonitor.enable();
window.MC_debugMode.testFeatures.localStorageInspector.view();

// View all debug API
console.log(window.MC_debugMode);
console.log(window.MC_debug);

// Clear all debug data
window.MC_debugMode.testFeatures.localStorageInspector.clear('mc_');
window.MC_debugMode.testFeatures.errorTracker.clearErrors();
```

## Common Use Cases

### Use Case 1: Debug Data Persistence

```javascript
// 1. Enable debug mode: ?debug=true
// 2. Open app and perform action (e.g., mark museum visited)
// 3. In console:
window.MC_debugMode.testFeatures.localStorageInspector.view();
// 4. Refresh page
// 5. Verify data persists:
window.MC_debugMode.testFeatures.localStorageInspector.view();
```

### Use Case 2: Monitor API Calls

```javascript
// 1. Enable debug mode
// 2. Enable network logger:
window.MC_debugMode.testFeatures.networkLogger.enable();
// 3. Perform user actions that trigger API calls
// 4. Check console for all network activity
// 5. Verify request parameters and response status
```

### Use Case 3: Track JavaScript Errors

```javascript
// 1. Enable debug mode
// 2. Enable error tracker:
window.MC_debugMode.testFeatures.errorTracker.enable();
// 3. Use app and reproduce error scenario
// 4. View captured errors:
window.MC_debugMode.testFeatures.errorTracker.getErrors()
// 5. Review error details (message, file, line, etc.)
```

### Use Case 4: Performance Analysis

```javascript
// 1. Enable debug mode
// 2. Enable performance monitor:
window.MC_debugMode.testFeatures.performanceMonitor.enable();
// 3. Monitor real-time metrics
// 4. Check VConsole for network waterfall charts
// 5. Identify bottlenecks
```

## Available Pages

Debug mode is available on all public-facing pages:

### Main Pages
- Homepage: `/index.html`
- Simplified intro: `/simple.html`
- Museum check-in: `/museum-checkin.html`
- Treasures catalog: `/treasures.html`
- User settings: `/settings.html`
- Fireworks celebration: `/fireworks.html`
- Fireworks wall: `/fireworks-wall.html`
- Event timeline: `/event-wall.html`
- Achievements: `/achievements.html`
- Community achievements: `/everyone-achievements.html`

### Quiz Pages
- Quiz selection: `/quiz/index.html?debug=true`
- Quiz session: `/quiz/session.html?debug=true`
- Quiz results: `/quiz/result.html?debug=true`
- Review wrong answers: `/quiz/wrong-questions.html?debug=true`

### Survey Pages
- Various survey features in `/survey/*/index.html` directories

**Note:** Admin pages (`admin.html`, `admin-fireworks.html`, etc.) use separate authentication (`?admin=1`) but can also use debug mode if combined: `?admin=1&debug=true`

## Architecture

### Design Decisions

1. **Central Script Location** - `js/debug-mode.js` serves as the single source of truth for debug functionality
2. **Early Head Loading** - Script loads in `<head>` before other app logic to ensure availability
3. **Non-Intrusive** - Debug features only activate when explicitly requested via URL, localStorage, or API
4. **Modular Test Features** - Each feature (performance, storage, network, errors) can be toggled independently
5. **Backward Compatible** - Maintains existing `window.__MC_DEBUG` flag for compatibility

### Script Loading

Debug-mode.js is automatically loaded on all public pages:

```html
<!-- Root pages -->
<script src="js/debug-mode.js"></script>

<!-- Quiz pages -->
<script src="../js/debug-mode.js"></script>

<!-- Survey pages -->
<script src="../../js/debug-mode.js"></script>
```

### VConsole CDN

When debug mode activates, VConsole is loaded asynchronously:

```
https://cdn.jsdelivr.net/npm/vconsole@3.9.0/dist/vconsole.min.js
```

If CDN is unavailable, a warning is logged but the app continues normally.

## Troubleshooting

### Debug mode not activating

**Problem:** `?debug=true` doesn't enable debug mode

**Solutions:**
1. Check if JavaScript is enabled in browser
2. Verify URL parameter is correctly formatted: `?debug=true` (not `?debug=1` alone may fail)
3. Check browser console for errors
4. Try manual localStorage method: `localStorage.setItem('mc_debug', '1')`
5. Verify `js/debug-mode.js` file exists and loads (check Network tab)

### VConsole not appearing

**Problem:** Debug mode is on but VConsole doesn't show

**Solutions:**
1. Check browser console for errors loading VConsole script
2. Verify internet connection (CDN must be accessible)
3. Try refreshing page after enabling debug
4. If on desktop, use browser DevTools instead (F12)
5. Check localStorage: `localStorage.getItem('mc_debug')` should return '1'

### Test features not working

**Problem:** Performance monitor, network logger, or other features don't activate

**Solutions:**
1. Verify debug mode is enabled: `window.MC_debugMode.isEnabled()`
2. Check if feature has dependencies loaded
3. Verify no script errors in console
4. Try enabling feature via console directly:
   ```javascript
   window.MC_debugMode.testFeatures.performanceMonitor.enable();
   ```
5. Check browser console for feature-specific error messages

### localStorage Inspector shows no data

**Problem:** localStorage appears empty in debug inspector

**Solutions:**
1. Verify app has actually saved data
2. Check if using private/incognito mode (may isolate storage)
3. Verify correct domain (localhost vs production)
4. Try force-saving data:
   ```javascript
   localStorage.setItem('test-key', 'test-value');
   window.MC_debugMode.testFeatures.localStorageInspector.view();
   ```

## Performance Impact

**When debug mode is disabled:**
- Zero performance impact - debug script loads but does nothing

**When debug mode is enabled:**
- Initial: ~2KB extra script loaded (debug-mode.js)
- VConsole: ~100KB CDN file loaded (async, non-blocking)
- Test features: Minimal overhead, only active when explicitly enabled

**Recommendations:**
- Use debug mode only in development/testing
- On production, debug mode requires manual activation (not auto-enabled)
- Disable test features when not actively debugging

## Best Practices

1. **Enable before diagnosing** - Always enable appropriate test features before investigating issues

2. **Use console API** - Programmatically control features for automated testing:
   ```javascript
   window.MC_debugMode.testFeatures.errorTracker.enable();
   // ... run tests ...
   const errors = window.MC_debugMode.testFeatures.errorTracker.getErrors();
   ```

3. **Clear data between tests** - Reset localStorage and error logs:
   ```javascript
   window.MC_debugMode.testFeatures.localStorageInspector.clear('');
   window.MC_debugMode.testFeatures.errorTracker.clearErrors();
   ```

4. **Document findings** - Keep detailed notes of debug sessions:
   ```
   Debug Session: 2026-01-13
   Page: /quiz/session.html?debug=true
   Features Enabled: Network Logger, Error Tracker
   Findings: API call to letmetry.cloud/mysql/query took 2.3s
   ```

5. **Disable before committing** - Ensure debug mode is disabled in production URLs

## Contributing

To extend debug mode with new features:

1. Edit `js/debug-mode.js`
2. Add new feature to `testFeatures` object
3. Implement `enable()` and `disable()` methods
4. Update control panel UI section with new checkbox
5. Document feature in this guide
6. Test on multiple pages

Example new feature template:

```javascript
myNewFeature: {
  enabled: false,
  
  enable() {
    if (this.enabled) return;
    this.enabled = true;
    console.info('[MC_debug] My new feature enabled');
    // Implementation here
  },
  
  disable() {
    if (!this.enabled) return;
    this.enabled = false;
    console.info('[MC_debug] My new feature disabled');
    // Cleanup here
  }
}
```

## Version History

### v2.0.0 (2026-01-13)
- ✅ Centralized debug system architecture
- ✅ Enhanced VConsole integration
- ✅ Performance monitoring display
- ✅ localStorage inspector with clear functionality
- ✅ Network request logging
- ✅ Error and rejection tracking
- ✅ Interactive control panel UI
- ✅ Deployed to all public pages

### v1.0.0 (Previous)
- Basic URL parameter detection
- localStorage persistence
- Simple VConsole loading

## Support

For issues or questions about debug mode:

1. Check the Troubleshooting section above
2. Review console error messages
3. Verify debug-mode.js loads successfully
4. Check browser compatibility (modern browsers required)
5. Consult the Common Use Cases section for examples
