# Museum Image Search Tool

This tool helps you find high-quality photos of museums and their treasures (镇馆之宝) using the Bing Image Search API.

## Overview

When adding new museums or updating existing museum data, you need photos for:
- **Museum buildings** (`image` field): Exterior or iconic views of the museum
- **Treasures/Collections** (`collections[].imageUrl` field): Photos of important artifacts

This tool automates the search process using Bing's Image Search API.

## Prerequisites

### Bing Search API Key

You need a Bing Search API key from Azure Cognitive Services:

1. **Sign up for Azure**: https://azure.microsoft.com/en-us/free/
2. **Create a Bing Search resource**:
   - Go to Azure Portal: https://portal.azure.com
   - Click "Create a resource"
   - Search for "Bing Search v7"
   - Create the resource (Free tier available: 1,000 transactions/month)
3. **Get your API key**:
   - Navigate to your Bing Search resource
   - Go to "Keys and Endpoint"
   - Copy "KEY 1" or "KEY 2"
4. **Set environment variable**:
   ```bash
   export BING_SEARCH_API_KEY=your_api_key_here
   ```

## Installation

No installation required - the tool uses Node.js built-in modules only.

## Usage

### Basic Usage

```bash
# Search for museum building photos
node tools/search-museum-images.js "故宫博物院"

# Search for both museum and treasure photos
node tools/search-museum-images.js "故宫博物院" "清明上河图"
```

### More Examples

```bash
# National Museum of China with Si Mu Wu Ding treasure
node tools/search-museum-images.js "中国国家博物馆" "后母戊鼎"

# Shanghai Museum with Da Ke Ding
node tools/search-museum-images.js "上海博物馆" "大克鼎"

# Terracotta Army Museum
node tools/search-museum-images.js "秦始皇帝陵博物院" "兵马俑"
```

### Demo Mode (No API Key)

For testing without an API key:

```bash
node tools/search-museum-images-demo.js "故宫博物院" "清明上河图"
```

This returns mock data to demonstrate the tool's functionality.

## Output Format

The tool returns formatted results with:

```
================================================================================
📸 Museum Building Photos - 故宫博物院
================================================================================

[1] 故宫博物院 外观 - 建筑摄影
    URL: https://example.com/museum-photo.jpg
    Thumbnail: https://example.com/museum-thumb.jpg
    Size: 1920x1080
    Source: https://example.com/source-page

[2] 故宫博物院 正门 - 高清照片
    URL: https://example.com/museum-photo-2.jpg
    ...
================================================================================
```

## Workflow

### Complete workflow for adding museum photos:

1. **Search for images**:
   ```bash
   node tools/search-museum-images.js "博物馆名称" "镇馆之宝名称"
   ```

2. **Review results**: The tool shows multiple options with metadata

3. **Select appropriate images**:
   - Choose high-quality, clear photos
   - Prefer public domain or Creative Commons images
   - Verify images are representative
   - Check appropriate resolution (800x600 minimum)

4. **Copy URLs**: Note the URLs you want to use

5. **Verify URLs work**:
   ```bash
   node tools/verify-treasure-images.js https://example.com/image.jpg
   ```

6. **Add to museum data** in `museums-data.js`:
   ```javascript
   {
       id: 'museum-id',
       name: '博物馆名称',
       image: 'URL_FROM_SEARCH',  // Museum building
       collections: [
           {
               name: '镇馆之宝',
               imageUrl: 'URL_FROM_SEARCH',  // Treasure photo
               description: '...'
           }
       ]
   }
   ```

7. **Validate data**:
   ```bash
   npm run validate-data
   ```

## Search Strategy

The tool uses optimized search queries:

### For Museum Buildings
- Query: `{museum_name} 博物馆外观 建筑`
- Focuses on: Exterior views, architectural features
- Returns: 5 top results

### For Treasures
- Query: `{treasure_name} {museum_name} 文物 高清`
- Focuses on: High-quality artifact photos
- Returns: 5 top results

### Search Parameters
- **Image Type**: Photo (excludes clipart, line art)
- **Safe Search**: Strict
- **Aspect Ratio**: All
- **Result Count**: 5 (configurable)

## Best Practices

### Image Selection
- ✅ Use Wikimedia Commons images when available
- ✅ Verify licensing (public domain preferred)
- ✅ Choose high resolution (800x600+)
- ✅ Select clear, well-lit photos
- ✅ Ensure images are representative

### Image Quality
- **Minimum resolution**: 800x600 pixels
- **Preferred format**: JPEG or PNG
- **File size**: Reasonable (< 500KB for web)
- **Clarity**: Sharp, not blurry

### Licensing Considerations
- Always check image licenses
- Prefer:
  - Public domain
  - Creative Commons (CC0, CC BY)
  - Wikimedia Commons
- Avoid:
  - Copyrighted stock photos
  - Watermarked images
  - Images with unclear licensing

## Troubleshooting

### Error: BING_SEARCH_API_KEY not set
```bash
# Set the environment variable
export BING_SEARCH_API_KEY=your_key_here

# Or set it inline
BING_SEARCH_API_KEY=your_key node tools/search-museum-images.js "故宫博物院"
```

### Error: Invalid API key
- Verify your API key is correct
- Check if your Azure subscription is active
- Ensure the Bing Search resource is properly configured

### Error: Request timeout
- Check your internet connection
- Try again after a few seconds
- Verify Bing API service status

### No results found
- Try different search terms
- Simplify the museum/treasure name
- Try searching in English: `node tools/search-museum-images.js "Forbidden City"`

## API Limits

**Free Tier** (Bing Search v7):
- 1,000 transactions/month
- 3 queries/second

**Paid Tiers**: See Azure pricing for higher limits

## Related Tools

- **verify-treasure-images.js**: Verify image URLs are accessible
- **validate-museum-data.js**: Validate complete museum data structure

## Examples

### Example 1: Forbidden City
```bash
$ node tools/search-museum-images.js "故宫博物院" "清明上河图"

🏛️  Bing Image Search Tool for Museums
================================================================================
Museum: 故宫博物院
Treasure: 清明上河图
================================================================================

🔍 Searching for museum photos...
✅ Found 5 results

[Results displayed...]

🔍 Searching for treasure photos...
✅ Found 5 results

[Results displayed...]

✅ Search completed successfully!
```

### Example 2: National Museum
```bash
$ node tools/search-museum-images.js "中国国家博物馆"

🏛️  Bing Image Search Tool for Museums
================================================================================
Museum: 中国国家博物馆
================================================================================

🔍 Searching for museum photos...
✅ Found 5 results

[Results displayed...]

✅ Search completed successfully!
   Museum photos found: 5
```

## Support

For issues or questions:
- Check this README first
- Review the main repository README
- Check Azure Bing Search documentation
- Open an issue in the repository

## License

MIT License - Same as the MuseumCheck project
