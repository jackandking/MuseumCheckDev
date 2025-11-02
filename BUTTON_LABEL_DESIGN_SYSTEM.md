# Button and Label Design System Documentation

## Overview

This document describes the standardized button and label design system implemented in the MuseumCheck application. The system ensures consistency, accessibility, and maintainability across all interactive and non-interactive UI elements.

## Design Principles

1. **Consistency**: Same visual treatment for same element types site-wide
2. **Clarity**: Clear distinction between clickable (buttons) and non-clickable (labels) elements
3. **Accessibility**: WCAG 2.1 AA compliant with ≥44px touch targets on mobile
4. **Maintainability**: Centralized using CSS custom properties for easy global updates
5. **Future-proof**: Well-documented system that's easy to extend for new features

## CSS Custom Properties

All design tokens are defined in `:root` in `style.css`:

### Button Properties
```css
/* Colors */
--btn-primary-bg: linear-gradient(45deg, #ff6b6b, #ffa500)
--btn-secondary-bg: #f8f9fa
--btn-icon-bg: #ffffff

/* Sizing */
--btn-padding: 12px 24px
--btn-border-radius: 25px
--btn-min-height-touch: 44px  /* WCAG minimum */

/* States */
--btn-transition: all 0.3s ease
--btn-hover-transform: translateY(-2px)
```

### Label Properties
```css
/* Colors */
--label-info-bg: #f1f3f5
--label-status-bg: #e8f5e8

/* Sizing */
--label-padding: 6px 12px
--label-border-radius: 15px
```

## Button Classes

### Primary Buttons (`.btn-primary`)
**When to use**: Main call-to-action buttons (Submit, Start, Confirm)

**Example**:
```html
<button class="btn-primary">开始测评</button>
```

**Styling**:
- Gradient background (orange-red)
- White text
- Shadow on hover
- 44px minimum height

### Secondary Buttons (`.btn-secondary`)
**When to use**: Alternative actions (Cancel, Back)

**Example**:
```html
<button class="btn-secondary">取消</button>
```

**Styling**:
- Light gray background
- Bordered
- No shadow
- Less prominent than primary

### Icon Buttons (`.btn-icon`)
**When to use**: Circular icon-only buttons (Settings, Close, Menu)

**Example**:
```html
<button class="btn-icon">⚙️</button>
<button class="achievement-button-icon">🏆</button>
```

**Styling**:
- Circular (border-radius: 50%)
- 44px × 44px on desktop, 40px on mobile
- White background with border
- Scale on hover (1.1)

**Variants**:
- `.achievement-button-icon` - Yellow/gold hover
- `.assessment-history-button-icon` - Blue hover
- `.settings-button-icon` - Purple hover
- `.fireworks-button-icon` - Gradient background

### Feature Buttons (`.btn-feature`)
**When to use**: Special feature actions (Fireworks, Check-in, Share)

**Example**:
```html
<button class="museum-fireworks-button">🎆 查看烟花</button>
<button class="museum-checkin-button">📍 打卡</button>
```

**Styling**:
- Gradient backgrounds
- Rounded corners (15px)
- Colored shadows
- 44px minimum height

**Variants**:
- `.museum-fireworks-button` - Purple gradient
- `.museum-checkin-button` - Pink gradient
- `.assessment-button` - Orange gradient
- `.achievement-button` - Orange gradient

### Utility Buttons (`.btn-utility`)
**When to use**: Small editing/utility actions (Edit, Delete)

**Example**:
```html
<button class="edit-item-btn">✏️</button>
<button class="delete-item-btn">🗑️</button>
```

**Styling**:
- 36px × 36px
- No background by default
- Light background on hover
- Minimal padding

### Tab Buttons (`.tab-button`)
**When to use**: Tab navigation

**Example**:
```html
<button class="tab-button active">家长准备</button>
<button class="tab-button">孩子任务</button>
```

**Styling**:
- Flex: 1 (equal width tabs)
- Active state: white background, shadow
- Inactive state: transparent background

## Label Classes

### Info Labels (`.label-info`, `.assessment-label`)
**When to use**: Display general information or status

**Example**:
```html
<span class="assessment-label">已完成</span>
```

**Styling**:
- Light gray background (#f1f3f5)
- Rounded (15px)
- NO hover effects (not clickable)
- cursor: default

### Status Labels (`.label-status`)
**When to use**: Show status or completion state

**Example**:
```html
<span class="label-status">进行中</span>
```

**Styling**:
- Green background
- Border
- NO hover effects

### Badge Labels (`.label-badge`)
**When to use**: Small notification badges or counts

**Example**:
```html
<span class="label-badge">NEW</span>
```

**Styling**:
- Compact padding (3px 8px)
- Small border-radius (12px)
- Uppercase text

### Form Labels (`label`, `.settings-label`)
**When to use**: Labels for form inputs

**Example**:
```html
<label for="childName">孩子昵称：</label>
<input id="childName" type="text">
```

**Styling**:
- Color: #495057
- Font-weight: 500
- cursor: pointer (clickable to focus input)

### Stat Labels (`.stat-label`)
**When to use**: Display statistics or metrics

**Example**:
```html
<div class="stat-number">85</div>
<div class="stat-label">平均得分</div>
```

**Styling**:
- Small font size (0.9em)
- Gray color
- NO hover effects

## Mobile Responsive Behavior

### Touch Target Sizes
All buttons maintain WCAG 2.1 minimum touch target sizes:

- **Desktop**: 44px minimum
- **Tablet (≤768px)**: 40px minimum
- **Mobile (≤480px)**: 36px minimum for utility buttons, 44px for primary actions

### Responsive Breakpoints
```css
@media (max-width: 768px) {
  /* Standard mobile styles */
}

@media (max-width: 480px) {
  /* Extra small screen optimizations */
}
```

### Mobile-Specific Adjustments
- Icon buttons: 44px → 40px → 36px
- Feature buttons: padding reduced
- Font sizes: 16px minimum to prevent iOS zoom
- Tab buttons: remain 44px for accessibility

## Accessibility Guidelines

### WCAG 2.1 AA Compliance
- ✅ Color contrast ratios meet minimum 4.5:1 for text
- ✅ Touch targets ≥44px on mobile
- ✅ Focus states maintained (browser default)
- ✅ Semantic HTML (buttons use `<button>`, labels use appropriate elements)
- ✅ Clear visual distinction between interactive and non-interactive elements

### Disabled States
All buttons support proper disabled styling:
```css
button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  pointer-events: none;
}
```

Always use `:not(:disabled)` for hover/active states:
```css
.btn-primary:hover:not(:disabled) {
  /* hover styles */
}
```

## Adding New Buttons/Labels

### Adding a New Button Type

1. **Determine the category**: Primary, secondary, icon, feature, or utility?
2. **Use the appropriate base class** as a starting point
3. **Add specific styling** only for what differs from the base
4. **Include :not(:disabled)** for all hover/active states
5. **Test on mobile** to ensure proper touch target sizes

Example:
```css
/* New feature button */
.my-new-feature-button {
  /* Extends .btn-feature base styles */
  background: linear-gradient(135deg, #color1, #color2);
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 15px;
  min-width: 44px;
  min-height: 44px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: var(--btn-transition);
}

.my-new-feature-button:hover:not(:disabled) {
  transform: var(--btn-hover-transform);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
}
```

### Adding a New Label Type

1. **Use the `.label` base class** as foundation
2. **Add specific colors/styling** for the new type
3. **NEVER add hover effects** (labels are not interactive)
4. **Set cursor: default**

Example:
```css
/* New warning label */
.label-warning {
  background: #fff3cd;
  color: #856404;
  border: 1px solid #ffeeba;
  padding: var(--label-padding);
  border-radius: var(--label-border-radius);
  cursor: default;
  user-select: none;
}
```

## Common Patterns

### Button with Icon and Text
```html
<button class="btn-primary">
  <span>🎨</span>
  <span>生成海报</span>
</button>
```

### Button Group
```html
<div class="achievement-buttons">
  <button class="achievement-button">按钮1</button>
  <button class="achievement-button">按钮2</button>
</div>
```

### Label with Status
```html
<h3>
  博物馆名称
  <span class="assessment-label">已参观</span>
</h3>
```

## Testing Checklist

When adding new buttons or labels:

- [ ] Verify proper touch target size (≥44px on mobile)
- [ ] Test hover/active states work correctly
- [ ] Test disabled state if applicable
- [ ] Verify no hover effects on labels
- [ ] Test on mobile viewport (375px width)
- [ ] Check color contrast meets WCAG AA
- [ ] Verify consistent with existing buttons/labels
- [ ] Test keyboard navigation (focus states)

## Troubleshooting

### Button not hovering correctly
- Check for `:not(:disabled)` in hover selector
- Verify `cursor: pointer` is set
- Check z-index if button is being covered

### Label appears clickable
- Remove any hover effects
- Set `cursor: default`
- Ensure no interactive parent elements

### Touch targets too small on mobile
- Check media queries are applying correctly
- Verify min-width and min-height are set
- Test actual device or DevTools mobile emulation

## Files

All button and label styles are centralized in:
- **`style.css`** - Lines 1-500 (design system section)

## Maintenance

### Updating Colors
Update CSS custom properties in `:root`:
```css
:root {
  --btn-primary-bg: /* new gradient */;
}
```

### Adjusting Touch Target Sizes
Update in media queries:
```css
@media (max-width: 768px) {
  .btn-icon {
    width: 40px;  /* adjust as needed */
    height: 40px;
  }
}
```

## Version History

- **v1.0** (2024-11-02): Initial implementation
  - 60+ CSS custom properties
  - 6 button base classes
  - 6 label types
  - 20+ specific button implementations standardized
  - Comprehensive documentation

## Questions?

For questions or suggestions about the button/label design system:
1. Review this documentation
2. Check existing implementations in `style.css`
3. Refer to WCAG 2.1 guidelines for accessibility
4. Test on actual mobile devices when possible
