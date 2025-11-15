/**
 * Wikimedia Commons Image Search Library
 * Browser-compatible version for searching museum and treasure photos
 * 
 * Usage:
 *   const searcher = new WikimediaImageSearch();
 *   const results = await searcher.searchMuseumPhotos('故宫博物院');
 *   const treasureResults = await searcher.searchTreasurePhotos('故宫博物院', '清明上河图');
 */

class WikimediaImageSearch {
  constructor() {
    this.apiEndpoint = 'https://commons.wikimedia.org/w/api.php';
    this.defaultImageCount = 10;
  }

  /**
   * Search Wikimedia Commons for images
   * @param {string} query - Search query
   * @param {number} limit - Number of results to return
   * @returns {Promise<Array>} - Array of image results
   */
  async searchWikimediaImages(query, limit = this.defaultImageCount) {
    const params = new URLSearchParams({
      action: 'query',
      format: 'json',
      generator: 'search',
      gsrnamespace: '6', // File namespace
      gsrsearch: query,
      gsrlimit: limit.toString(),
      prop: 'imageinfo|info',
      iiprop: 'url|size|mime',
      iiurlwidth: '800',
      inprop: 'url',
      origin: '*' // Enable CORS
    });

    try {
      const response = await fetch(`${this.apiEndpoint}?${params.toString()}`, {
        headers: {
          'User-Agent': 'MuseumCheck/1.0 (Museum Image Search Tool)'
        }
      });

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }

      const result = await response.json();
      const pages = result.query?.pages || {};
      
      return Object.values(pages)
        .filter(page => page.imageinfo && page.imageinfo.length > 0)
        .map(page => ({
          title: page.title,
          url: page.imageinfo[0].url,
          thumbUrl: page.imageinfo[0].thumburl || page.imageinfo[0].url,
          width: page.imageinfo[0].width,
          height: page.imageinfo[0].height,
          pageUrl: page.fullurl || `https://commons.wikimedia.org/wiki/${encodeURIComponent(page.title)}`,
          mime: page.imageinfo[0].mime
        }));
    } catch (error) {
      console.error('Wikimedia search error:', error);
      throw new Error(`搜索失败: ${error.message}`);
    }
  }

  /**
   * Search for museum building photos
   * @param {string} museumName - Name of the museum
   * @returns {Promise<Array>} - Array of image objects
   */
  async searchMuseumPhotos(museumName) {
    console.log(`搜索博物馆照片: ${museumName}`);
    
    // Try multiple query variations for better results
    const queries = [
      `${museumName}`,
      `${museumName} building`,
      `${museumName} exterior`,
    ];
    
    // Add English fallback for major museums
    const englishNames = {
      '故宫博物院': 'Forbidden City Beijing',
      '中国国家博物馆': 'National Museum of China',
      '上海博物馆': 'Shanghai Museum',
      '秦始皇帝陵博物院': 'Terracotta Army Museum',
      '南京博物院': 'Nanjing Museum'
    };
    
    if (englishNames[museumName]) {
      queries.push(englishNames[museumName]);
    }
    
    let allResults = [];
    
    for (const query of queries) {
      try {
        console.log(`  尝试查询: "${query}"`);
        const results = await this.searchWikimediaImages(query, 5);
        allResults = allResults.concat(results);
        
        if (results.length > 0) {
          console.log(`  ✅ 找到 ${results.length} 个结果`);
        }
        
        // Small delay to be nice to the API
        await this.delay(500);
      } catch (error) {
        console.log(`  ⚠️  查询失败: ${error.message}`);
      }
    }
    
    // Remove duplicates by URL
    const uniqueResults = Array.from(
      new Map(allResults.map(img => [img.url, img])).values()
    );
    
    console.log(`✅ 共找到 ${uniqueResults.length} 个独特结果`);
    
    return uniqueResults.slice(0, 10).map((img, index) => ({
      index: index + 1,
      url: img.url,
      thumbnailUrl: img.thumbUrl,
      name: img.title.replace('File:', ''),
      hostPageUrl: img.pageUrl,
      width: img.width,
      height: img.height,
      mime: img.mime
    }));
  }

  /**
   * Search for treasure/collection photos
   * @param {string} museumName - Name of the museum (optional, for context)
   * @param {string} treasureName - Name of the treasure
   * @returns {Promise<Array>} - Array of image objects
   */
  async searchTreasurePhotos(museumName, treasureName) {
    console.log(`搜索文物照片: ${treasureName}`);
    
    // Try multiple query variations
    const queries = [
      `${treasureName}`,
      `${treasureName} ${museumName}`,
      `${treasureName} painting`,
      `${treasureName} artifact`
    ];
    
    // Add English translations for common treasures
    const englishQueries = {
      '清明上河图': 'Along the River During Qingming Festival',
      '太和殿金漆雕龙宝座': 'Imperial Throne Hall of Supreme Harmony',
      '翠玉白菜': 'Jadeite Cabbage',
      '后母戊鼎': 'Simuwu Ding',
      '大克鼎': 'Da Ke Ding',
      '越王勾践剑': 'Sword of Goujian'
    };
    
    if (englishQueries[treasureName]) {
      queries.push(englishQueries[treasureName]);
    }
    
    let allResults = [];
    
    for (const query of queries) {
      try {
        console.log(`  尝试查询: "${query}"`);
        const results = await this.searchWikimediaImages(query, 5);
        allResults = allResults.concat(results);
        
        if (results.length > 0) {
          console.log(`  ✅ 找到 ${results.length} 个结果`);
        }
        
        // Small delay to be nice to the API
        await this.delay(500);
      } catch (error) {
        console.log(`  ⚠️  查询失败: ${error.message}`);
      }
    }
    
    // Remove duplicates by URL
    const uniqueResults = Array.from(
      new Map(allResults.map(img => [img.url, img])).values()
    );
    
    console.log(`✅ 共找到 ${uniqueResults.length} 个独特结果`);
    
    return uniqueResults.slice(0, 10).map((img, index) => ({
      index: index + 1,
      url: img.url,
      thumbnailUrl: img.thumbUrl,
      name: img.title.replace('File:', ''),
      hostPageUrl: img.pageUrl,
      width: img.width,
      height: img.height,
      mime: img.mime
    }));
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
  window.WikimediaImageSearch = WikimediaImageSearch;
}

// Also export for Node.js if needed
if (typeof module !== 'undefined' && module.exports) {
  module.exports = WikimediaImageSearch;
}
