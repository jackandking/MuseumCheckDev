# Museum Data Quality Tools

This directory contains tools to ensure systematic data quality in the MuseumCheck application.

## Tools Overview

### search-museum-images.js

**Bing Image Search tool for finding museum and treasure photos.**

This tool uses the Bing Image Search API to find high-quality photos of museums and their treasures (镇馆之宝), returning image URLs that can be added to the museum data.

**Prerequisites:**
- Bing Search API key from Azure Cognitive Services
- Set environment variable: `BING_SEARCH_API_KEY=your_api_key`

**Usage:**
```bash
# Search for museum building photos
node tools/search-museum-images.js "故宫博物院"

# Search for both museum and treasure photos
node tools/search-museum-images.js "故宫博物院" "清明上河图"

# More examples
node tools/search-museum-images.js "中国国家博物馆" "后母戊鼎"
node tools/search-museum-images.js "上海博物馆" "大克鼎"
```

**Output:**
Returns a formatted list of image URLs with metadata:
- Full image URL (for `image` and `imageUrl` fields)
- Thumbnail URL
- Image dimensions and file size
- Source page URL

**Demo Version:**
For testing without an API key, use the demo version:
```bash
node tools/search-museum-images-demo.js "故宫博物院" "清明上河图"
```

**Workflow:**
1. Run the search tool to find image URLs
2. Review results and select appropriate images
3. Copy URLs to museum data structure
4. Use `verify-treasure-images.js` to validate URLs are accessible

### validate-museum-data.js

Comprehensive museum data validation tool that checks for:
- Duplicate museum names and IDs
- Missing required fields  
- Invalid checklist structures
- Data integrity issues

**Usage:**
```bash
# From repository root
node tools/validate-museum-data.js

# Or using npm script
npm run validate-data
```

**Output:**
- ✅ Success: Exits with code 0 if data is valid
- ❌ Issues: Exits with code 1 and detailed error report if problems found

### verify-treasure-images.js

Verifies that image URLs in museum data are accessible and valid.

**Usage:**
```bash
node tools/verify-treasure-images.js <image-url>
```

## Integration with Development Workflow

### For Copilot
These tools are integrated into the Copilot instructions to ensure systematic issue detection:

1. **Pre-change validation**: Must run before any museum data changes
2. **Issue reporting**: Comprehensive problems must be reported to user
3. **Systematic fixes**: Address root causes, not individual symptoms

### For Developers
Include data validation in your workflow:

```bash
# Before making changes
npm run validate-data

# Run data quality tests
npm run test:data-quality

# Full test suite
npm test
```

## Current Data Quality Status

As of the last analysis (see `.github/copilot-instructions.md` for details):
- **302 total museums** (expected: ~300)
- **40 duplicate names** (e.g., "广东省博物馆" appears twice)  
- **24 duplicate IDs** (e.g., "guangdong-museum" used twice)
- **9 missing field errors** (3 museums with undefined names)

## Systematic Issues vs Individual Fixes

### ❌ Wrong Approach (Previous)
- Found "首都博物馆" duplicate
- Fixed only that specific case
- Ignored 40+ other duplicates  
- No comprehensive analysis

### ✅ Correct Approach (Required)
- Run comprehensive validation first
- Identify ALL systematic issues
- Report complete scope to user
- Get guidance on systematic vs individual fix
- Address root causes, not symptoms

## Tool Development

### Adding New Validations
To add new data quality checks:

1. Update `tools/validate-museum-data.js`
2. Add corresponding test in `tests/data-quality.test.js`
3. Update this README with new validation details

### Test Integration
Data quality validation is integrated with the testing framework:

```bash
# Run only data quality tests
npm run test:data-quality

# Include in CI/CD pipeline
npm test  # Includes data quality tests
```

## Error Codes and Exit Status

- **Exit 0**: All data validation passed
- **Exit 1**: Data quality issues detected (see output for details)

The tools are designed to fail fast and provide actionable feedback for systematic data quality issues.