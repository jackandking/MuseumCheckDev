# Quick Start: Museum Image Search Tool

## 🚀 Get Started in 3 Steps

### Step 1: Try the Demo (No Setup Required)

```bash
node tools/search-museum-images-demo.js "故宫博物院" "清明上河图"
```

This shows you how the tool works using mock data. No API key needed!

### Step 2: Get a Free Bing API Key (5 minutes)

1. Visit https://azure.microsoft.com/en-us/free/
2. Sign up for free Azure account
3. Create a Bing Search v7 resource (Free tier: 1,000 searches/month)
4. Copy your API key from "Keys and Endpoint"

### Step 3: Use the Real Tool

```bash
# Set your API key
export BING_SEARCH_API_KEY=your_api_key_here

# Search for images
node tools/search-museum-images.js "故宫博物院" "清明上河图"
```

## 📖 Common Use Cases

### Find Museum Building Photo
```bash
node tools/search-museum-images.js "上海博物馆"
```

### Find Treasure Photo
```bash
node tools/search-museum-images.js "中国国家博物馆" "后母戊鼎"
```

### Find Both
```bash
node tools/search-museum-images.js "秦始皇帝陵博物院" "兵马俑"
```

## 💡 What You'll Get

The tool returns:
- ✅ 5 museum building photos (exterior, architecture)
- ✅ 5 treasure photos (high quality, cultural artifacts)
- ✅ Image URLs ready to copy
- ✅ Thumbnails, dimensions, and source info

## 📝 Using the Results

1. Copy the image URL you like
2. Verify it works: `node tools/verify-treasure-images.js <url>`
3. Add to museum data in `museums-data.js`:
   ```javascript
   {
       id: 'museum-id',
       name: '博物馆名称',
       image: 'COPIED_URL_HERE',
       collections: [
           {
               name: '宝物名称',
               imageUrl: 'COPIED_URL_HERE'
           }
       ]
   }
   ```
4. Validate: `npm run validate-data`

## 🎯 Search Tips

- Use official museum names in Chinese
- For treasures, use common names (e.g., "清明上河图" not "Along the River During Qingming Festival")
- The tool automatically adds keywords like "博物馆外观", "建筑", "文物", "高清"
- Results are filtered for photos only with safe search enabled

## 🔧 Troubleshooting

**"API key not set"** → Run `export BING_SEARCH_API_KEY=your_key`

**"No results found"** → Try simpler search terms or different names

**"Request timeout"** → Check internet connection, try again

## 📚 Full Documentation

- **Complete Guide**: `tools/MUSEUM_IMAGE_SEARCH.md`
- **Tool README**: `tools/README.md`
- **Copilot Instructions**: `.github/copilot-instructions.md`

## 🆘 Need Help?

1. Check `tools/MUSEUM_IMAGE_SEARCH.md` for detailed docs
2. Run the demo to understand the output format
3. Review examples in the documentation
4. Open an issue if you find bugs

---

**Ready to start?** Run the demo now:
```bash
node tools/search-museum-images-demo.js "故宫博物院" "清明上河图"
```
