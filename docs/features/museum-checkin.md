# Museum Check-in Page Documentation

## Overview

The `museum-checkin.html` page is a standalone, mobile-friendly interface designed for museum-specific check-ins via QR codes. It provides a child-focused experience that progressively introduces parents to deeper features.

## Purpose

This page addresses the requirement for museums to place QR codes on their "fireworks wall" that direct visitors to a focused, single-museum experience where:

1. **Children** can check-in and complete museum-specific tasks
2. **Parents** gradually discover parent preparation tasks
3. **Families** are guided toward the parent-child assessment feature

## Features

### 1. Progressive UX Design

The page implements a carefully designed progressive disclosure pattern:

- **First**: Children see colorful task cards and can complete them
- **Then**: After completing 1-2 tasks, a gentle hint about parent tasks appears
- **Finally**: Navigation options lead to the assessment feature

### 2. Task Display

- **Grid Layout**: Responsive card-based layout (2 columns on mobile, 4+ on desktop)
- **Visual Icons**: Each task displays an emoji icon extracted from task content
- **Completion Tracking**: Completed tasks show a checkmark badge and gradient background
- **Progress Bar**: Visual progress indicator showing completed/total tasks

### 3. Task Completion

When a child completes a task:
1. Fireworks celebration animation plays
2. Progress bar updates
3. Task card gets completion styling
4. Data is saved to both local and remote storage
5. Parent hint may appear (progressive UX)

### 4. Data Persistence

**Local Storage**:
- Key format: `museumCheckin_{museumId}_{ageGroup}`
- Stores array of completed task indices
- Persists across page reloads

**Remote Storage**:
- Uploads firework events to KV store
- Includes: museum info, task content, timestamp
- Enables shared fireworks wall across users

### 5. Edit Mode

Museum staff can enable edit mode via URL parameter `?edit=true`:
- **Add New Tasks**: Plus button to add tasks via prompt
- **Task Format**: `🎯 Task Name: Task Description`
- **Remote Save**: Tasks saved to KV store for persistence
- **Visual Indicator**: Shows "编辑模式" badge at top

## URL Parameters

The page supports several URL parameters for flexible configuration:

```
museum-checkin.html?museum=forbidden-city&age=7-12&edit=false
```

### Parameters

| Parameter | Required | Default | Description |
|-----------|----------|---------|-------------|
| `museum` | No | `forbidden-city` | Museum ID to display |
| `age` | No | `7-12` | Age group for tasks (`3-6`, `7-12`, `13-18`) |
| `edit` | No | `false` | Enable edit mode for museum staff |
| `pilot` | No | — | Marks an invited co-creation cohort; public access remains unchanged |
| `pilotSession` | No | — | Anonymous pilot-session identifier passed from `pilot.html` |
| `format` | No | `family` | Controlled activity-format context for pilot evidence |
| `group` | No | `2-3` | Controlled approximate group-size band for pilot evidence |
| `duration` | No | `60-90` | Controlled expected visit-duration band for pilot evidence |

See [Invited Pilot Flow](invited-pilot.md) for the invitation page, privacy contract, and funnel signals.

## Navigation

The page provides several navigation options through the menu:

1. **View Parent Tasks**: Links to main app with parent tasks tab
2. **Assessment**: Links to parent-child relationship assessment
3. **Fireworks Wall**: Links to fireworks wall filtered for this museum
4. **Back to Home**: Returns to main application

## Usage Examples

### For Museums

**QR Code Setup**:
1. Generate QR code linking to: `https://museumcheck.cn/museum-checkin.html?museum=YOUR_MUSEUM_ID`
2. Place QR code on museum's physical fireworks wall display
3. Visitors scan and immediately see tasks for your museum

**Staff Editing**:
1. Access with edit parameter: `?museum=YOUR_MUSEUM_ID&edit=true`
2. Click "+" button to add new tasks
3. Enter task in format: `🎯 Task Name: Task Description`
4. Tasks automatically saved to remote storage

### For Visitors

**Child Experience**:
1. Scan QR code at museum
2. See colorful task cards
3. Complete tasks and celebrate with fireworks
4. Track progress with progress bar

**Parent Discovery**:
1. After child completes 1-2 tasks
2. Parent hint appears in task detail modal
3. Click link to discover parent preparation tasks
4. Gradually introduced to assessment feature

## Embedding

The page is designed to be embeddable in museum websites:

```html
<iframe 
    src="https://museumcheck.cn/museum-checkin.html?museum=YOUR_MUSEUM_ID&age=7-12" 
    width="100%" 
    height="800px" 
    frameborder="0"
    style="border-radius: 10px;">
</iframe>
```

**Benefits for Museums**:
- Increase engagement with official website
- Drive traffic to museum's digital platforms
- Provide value-added service for families
- Collect usage data (through museum's analytics)

## Technical Architecture

### Dependencies

- `museums-data.js`: Museum data and task content
- `firework.js`: Fireworks animation library

### Remote Storage

**API Endpoint**: AWS Lambda KV Store
```javascript
API_ENDPOINT: 'https://rlyhccdr2g.execute-api.us-west-2.amazonaws.com/default/keyValueStore'
```

**Keys**:
- Fireworks: `museumcheck-firework`
- Check-in tasks: `museumcheck-checkin-{museumId}_{ageGroup}`

### Data Flow

```
User Action → Local State Update → UI Re-render
     ↓                ↓
  Remote Upload    Local Storage Save
     ↓                ↓
  KV Store      Browser Storage
```

## Styling

### Color Scheme

- **Background**: Light blue gradient (`#a8d8ea` → `#5ab4d1`)
- **Cards**: White with shadow
- **Completed**: Gradient (`#a8edea` → `#fed6e3`)
- **Primary Button**: Purple gradient (`#667eea` → `#764ba2`)
- **Parent Hint**: Warm gradient (`#ffecd2` → `#fcb69f`)

### Responsive Design

- **Mobile (< 768px)**: 2-column grid
- **Tablet/Desktop**: 4+ column grid
- **Touch-friendly**: 44px minimum button size
- **Smooth animations**: 0.3s transitions

## Integration with Main App

The check-in page integrates seamlessly with the main application:

1. **Museum Context**: Passes museum ID via URL parameter
2. **Parent Tasks**: Links to main app with specific museum and parent tab
3. **Assessment**: Direct link to assessment feature
4. **Fireworks**: Filtered fireworks wall for this museum
5. **Progress Sync**: Shared localStorage keys (future enhancement)

## Future Enhancements

Potential improvements for future versions:

1. **Image Support**: Display task-specific images from URLs
2. **Audio Guide**: Text-to-speech for tasks
3. **AR Features**: Camera-based task verification
4. **Social Sharing**: Share completed tasks to social media
5. **Leaderboards**: Compare progress with other visitors
6. **Badges/Rewards**: Unlock special rewards for completion
7. **Multi-language**: Support for English, Japanese, Korean
8. **Offline Mode**: Service worker for offline functionality

## Troubleshooting

### Common Issues

**Tasks not loading**:
- Check museum ID is valid
- Verify museums-data.js is loaded
- Check browser console for errors

**Progress not saving**:
- Check localStorage is enabled
- Verify browser privacy settings
- Check for incognito mode

**Fireworks not showing**:
- Check firework.js is loaded
- Verify canvas support in browser
- Check for ad blockers

**Remote upload failing**:
- Check network connectivity
- Verify API endpoint is accessible
- Check CORS settings

## Accessibility

The page follows accessibility best practices:

- **Semantic HTML**: Proper heading hierarchy
- **ARIA Labels**: Screen reader support
- **Keyboard Navigation**: Full keyboard support
- **Touch Targets**: Minimum 44px size
- **Color Contrast**: WCAG AA compliant
- **Focus Indicators**: Visible focus states

## Performance

**Optimization techniques**:
- Minimal external dependencies
- CSS animations (GPU accelerated)
- Efficient DOM updates
- Lazy loading of images
- Debounced event handlers

**Metrics**:
- **First Contentful Paint**: < 1s
- **Time to Interactive**: < 2s
- **Bundle Size**: < 30KB (HTML+CSS+JS)

## Security

**Considerations**:
- No sensitive data stored locally
- HTTPS required for remote storage
- XSS protection through DOM methods
- CORS enabled for API endpoints
- Input sanitization for edit mode

## Browser Support

**Minimum versions**:
- Chrome 90+
- Safari 14+
- Firefox 88+
- Edge 90+

**Features used**:
- ES6+ JavaScript
- CSS Grid
- CSS Custom Properties
- Fetch API
- Local Storage

## License

Same license as main MuseumCheck application (MIT).
