# Version Management Guide

## Overview

The MuseumCheck application uses a centralized version management system to ensure consistency across all version displays and reduce manual maintenance errors.

## How It Works

### Centralized Version Source
All version information is stored in the `RECENT_CHANGES` constant in `script.js`:

```javascript
const RECENT_CHANGES = {
    version: "2.1.0",
    lastUpdate: "2024-12-19",
    changes: [
        // Version history entries...
    ]
};
```

### Automatic UI Updates
The JavaScript automatically updates all version displays from this central source:

- **Version badge** in the header: Updates on page load via `initializeUpdates()`
- **Updates modal** content: Updates when modal is opened via `renderUpdates()`
- **Current version** and **last updated** fields: Both sourced from `RECENT_CHANGES`

### No Hardcoded Versions
The HTML contains only placeholder values that get replaced by JavaScript:
- `v0.0.0` - Placeholder version (replaced dynamically)
- `...` - Placeholder date (replaced dynamically)

## How to Update Version

### Step 1: Edit script.js
Update the `RECENT_CHANGES` object:

```javascript
const RECENT_CHANGES = {
    version: "2.1.1",  // ← Update this
    lastUpdate: "2024-12-20",  // ← Update this
    changes: [
        {
            date: "2024-12-20",  // ← Add new entry
            version: "2.1.1", 
            title: "Your update title",
            description: "Description of what changed",
            type: "feature" // or "improvement" or "bugfix"
        },
        // ... existing entries
    ]
};
```

### Step 2: Validate Changes
Run the validation script to ensure consistency:

```bash
node validate-version.js
```

### Step 3: Test Locally
1. Start the development server: `python3 -m http.server 8000`
2. Open http://localhost:8000
3. Verify the version badge shows the correct version
4. Click the "最新更新" button to open the updates modal
5. Confirm all version information displays correctly

## Validation Script

The `validate-version.js` script helps ensure version consistency:

- ✅ Validates that version info is centralized in `script.js`
- ⚠️ Warns about any hardcoded versions in HTML files
- 📝 Provides guidance on updating versions
- 🔍 Checks for consistency issues

## Benefits of This System

1. **Single Source of Truth**: All version info comes from one location
2. **No Manual HTML Updates**: JavaScript handles all UI updates automatically
3. **Consistency Guaranteed**: Impossible to have mismatched versions
4. **Easy Validation**: Script catches inconsistencies automatically
5. **Developer Friendly**: Clear process for version updates

## Troubleshooting

### Version Not Updating
If the version doesn't appear updated:
1. Check browser console for JavaScript errors
2. Clear browser cache (Ctrl+F5)
3. Verify `RECENT_CHANGES` object syntax is correct
4. Run `validate-version.js` to check for issues

### Hardcoded Version Warning
If the validation script warns about hardcoded versions:
1. Replace hardcoded version with placeholder (e.g., `v0.0.0`)
2. Ensure JavaScript properly updates the element via `document.getElementById()`
3. Re-run validation script to confirm fix

## Files Involved

- **script.js**: Contains `RECENT_CHANGES` object (source of truth)
- **index.html**: Contains placeholder elements updated by JavaScript
- **validate-version.js**: Validation script for consistency checking
- **VERSION_MANAGEMENT.md**: This documentation file