/**
 * Baidu Image Search Library
 * Browser-compatible version for searching museum and treasure photos
 * Uses CORS proxy to fetch Baidu image search results
 * 
 * Usage:
 *   const searcher = new BaiduImageSearch();
 *   const results = await searcher.searchMuseumPhotos('故宫博物院');
 *   const treasureResults = await searcher.searchTreasurePhotos('故宫博物院', '清明上河图');
 */

class BaiduImageSearch {
  constructor() {
    // Multiple CORS proxies as fallback options
    this.corsProxies = [
      'https://api.allorigins.win/raw?url=',
      'https://corsproxy.io/?',
      'https://api.codetabs.com/v1/proxy?quest='
    ];
    this.currentProxyIndex = 0;
    this.defaultImageCount = 10;
  }

  /**
   * Get current CORS proxy URL
   * @returns {string} - CORS proxy URL prefix
   */
  getCurrentProxy() {
    return this.corsProxies[this.currentProxyIndex];
  }

  /**
   * Try next CORS proxy
   * @returns {boolean} - Whether there's another proxy available
   */
  tryNextProxy() {
    this.currentProxyIndex++;
    return this.currentProxyIndex < this.corsProxies.length;
  }

  /**
   * Reset proxy index to start from the first one
   */
  resetProxy() {
    this.currentProxyIndex = 0;
  }

  /**
   * Search Baidu Images with CORS proxy
   * @param {string} query - Search query
   * @param {number} limit - Number of results to return
   * @returns {Promise<Array>} - Array of image results
   */
  async searchBaiduImages(query, limit = this.defaultImageCount) {
    this.resetProxy();
    
    // Build Baidu image search URL
    // Request double the limit because some results may be filtered out as ads/placeholders
    const requestCount = limit * 2;
    const baiduUrl = `https://image.baidu.com/search/acjson?tn=resultjson_com&word=${encodeURIComponent(query)}&pn=0&rn=${requestCount}&face=0`;
    
    while (true) {
      const proxy = this.getCurrentProxy();
      const proxyUrl = proxy + encodeURIComponent(baiduUrl);
      
      console.log(`🔍 尝试通过代理搜索百度图片: ${proxy.substring(0, 30)}...`);
      
      try {
        const response = await fetch(proxyUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'application/json, text/plain, */*'
          }
        });

        if (!response.ok) {
          throw new Error(`HTTP error: ${response.status}`);
        }

        const text = await response.text();
        
        // Try to parse as JSON
        let data;
        try {
          data = JSON.parse(text);
        } catch (e) {
          // If JSON parsing fails, try to extract image URLs from HTML
          console.log('⚠️ JSON解析失败，尝试从HTML提取图片');
          return this.extractImagesFromHtml(text, limit);
        }

        // Parse Baidu's JSON response
        const images = this.parseBaiduJsonResponse(data, limit);
        
        if (images.length > 0) {
          console.log(`✅ 从百度找到 ${images.length} 个图片`);
          return images;
        }
        
        throw new Error('No images found in response');
        
      } catch (error) {
        console.warn(`⚠️ 代理 ${this.currentProxyIndex + 1} 失败: ${error.message}`);
        
        if (!this.tryNextProxy()) {
          console.error('❌ 所有CORS代理都失败了');
          throw new Error('无法获取百度图片搜索结果，请尝试点击"去百度搜索"手动查找');
        }
      }
    }
  }

  /**
   * Parse Baidu's JSON response format
   * @param {Object} data - JSON response from Baidu
   * @param {number} limit - Maximum number of results
   * @returns {Array} - Parsed image results
   */
  parseBaiduJsonResponse(data, limit) {
    const results = [];
    
    // Handle various Baidu response formats
    const items = data.data || data.imgs || data.results || [];
    
    for (const item of items) {
      if (results.length >= limit) break;
      
      // Try different field names for the image URL
      const imageUrl = item.objURL || item.thumbURL || item.middleURL || item.hoverURL || item.replaceUrl?.[0]?.ObjURL;
      const thumbUrl = item.thumbURL || item.middleURL || imageUrl;
      
      if (!imageUrl || !imageUrl.startsWith('http')) continue;
      
      // Filter out known ad/placeholder images
      if (this.isAdImage(imageUrl)) continue;
      
      results.push({
        url: imageUrl,
        thumbnailUrl: thumbUrl,
        name: item.fromPageTitleEnc || item.fromPageTitle || item.di || '百度图片',
        width: item.width || 0,
        height: item.height || 0,
        hostPageUrl: item.fromURLEnc || item.fromURL || '',
        source: 'baidu'
      });
    }
    
    return results;
  }

  /**
   * Extract images from HTML response (fallback method)
   * @param {string} html - HTML response text
   * @param {number} limit - Maximum number of results
   * @returns {Array} - Extracted image results
   */
  extractImagesFromHtml(html, limit) {
    const results = [];
    
    // Try to find image URLs in the HTML
    // Look for patterns like data-imgurl="..." or objURL":"..."
    const patterns = [
      /data-imgurl="([^"]+)"/g,
      /"objURL":"([^"]+)"/g,
      /"thumbURL":"([^"]+)"/g,
      /"middleURL":"([^"]+)"/g
    ];
    
    const foundUrls = new Set();
    
    for (const pattern of patterns) {
      let match;
      while ((match = pattern.exec(html)) !== null && results.length < limit) {
        const url = match[1];
        
        if (!url || !url.startsWith('http') || foundUrls.has(url)) continue;
        if (this.isAdImage(url)) continue;
        
        foundUrls.add(url);
        
        results.push({
          url: url,
          thumbnailUrl: url,
          name: '百度图片结果',
          width: 0,
          height: 0,
          hostPageUrl: '',
          source: 'baidu-html'
        });
      }
    }
    
    return results;
  }

  /**
   * Check if URL is an ad or placeholder image
   * Filters out common Baidu UI elements and low-quality thumbnails
   * @param {string} url - Image URL
   * @returns {boolean} - Whether it's an ad image
   */
  isAdImage(url) {
    // Patterns to filter out non-content images from Baidu search results:
    // - emoji.cdn.bcebos.com: Baidu emoji CDN
    // - ns-strategy: Baidu strategy/ad images
    // - baseimg: Base UI elements
    // - yunque: Baidu cloud service images
    // - logo/icon/placeholder: Generic UI elements
    // - data:image: Inline data URLs (usually small icons)
    // - size=f60/w60/f40: Very small thumbnails (60px or 40px)
    const adPatterns = [
      'emoji.cdn.bcebos.com',
      'ns-strategy',
      'baseimg',
      'yunque',
      'logo',
      'icon',
      'placeholder',
      'data:image',
      'size=f60',
      'size=w60',
      'size=f40'
    ];
    
    return adPatterns.some(pattern => url.includes(pattern));
  }

  /**
   * Search for museum building photos
   * @param {string} museumName - Name of the museum
   * @returns {Promise<Array>} - Array of image objects
   */
  async searchMuseumPhotos(museumName) {
    console.log(`🏛️ 百度搜索博物馆照片: ${museumName}`);
    
    // Optimized search query for museum buildings
    const query = `${museumName} 博物馆 外观 建筑`;
    
    try {
      const results = await this.searchBaiduImages(query, this.defaultImageCount);
      
      return results.map((img, index) => ({
        index: index + 1,
        url: img.url,
        thumbnailUrl: img.thumbnailUrl,
        name: img.name,
        hostPageUrl: img.hostPageUrl,
        width: img.width,
        height: img.height,
        source: 'baidu'
      }));
    } catch (error) {
      console.error('百度博物馆图片搜索失败:', error);
      throw error;
    }
  }

  /**
   * Search for treasure/collection photos
   * @param {string} museumName - Name of the museum (optional, for context)
   * @param {string} treasureName - Name of the treasure
   * @returns {Promise<Array>} - Array of image objects
   */
  async searchTreasurePhotos(museumName, treasureName) {
    console.log(`🎨 百度搜索文物照片: ${treasureName}`);
    
    // Optimized search query for treasures
    const query = museumName 
      ? `${treasureName} ${museumName} 文物 高清`
      : `${treasureName} 文物 高清`;
    
    try {
      const results = await this.searchBaiduImages(query, this.defaultImageCount);
      
      return results.map((img, index) => ({
        index: index + 1,
        url: img.url,
        thumbnailUrl: img.thumbnailUrl,
        name: img.name,
        hostPageUrl: img.hostPageUrl,
        width: img.width,
        height: img.height,
        source: 'baidu'
      }));
    } catch (error) {
      console.error('百度文物图片搜索失败:', error);
      throw error;
    }
  }

  /**
   * Helper function to delay execution
   * @param {number} ms - Milliseconds to delay
   * @returns {Promise<void>}
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Make it available globally for browser usage
if (typeof window !== 'undefined') {
  window.BaiduImageSearch = BaiduImageSearch;
}

// Also export for Node.js if needed
if (typeof module !== 'undefined' && module.exports) {
  module.exports = BaiduImageSearch;
}
