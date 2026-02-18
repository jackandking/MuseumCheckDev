/**
 * Official Museum Search Integration
 * 
 * MVP Phase 1: Homepage search integration with Letmetry /museum/search API
 * 
 * Features:
 * - Search official Chinese museum database via Letmetry API
 * - Cache search results in localStorage (1 hour TTL)
 * - Dynamic museum card generation
 * - Check KV Store for existing user data
 * 
 * Architecture:
 * - No meta storage (MySQL or museums-meta.json)
 * - Direct API search for always-fresh data
 * - KV Store created dynamically when user opens museum
 */

class OfficialMuseumSearch {
  constructor() {
    this.apiEndpoint = 'https://letmetry.cloud/museum/search';
    this.cacheKeyPrefix = 'museum-search-cache-';
    this.cacheTTL = 60 * 60 * 1000; // 1 hour in milliseconds
    this.maxCacheSize = 50; // Maximum number of cached searches
    this.searching = false;
  }

  /**
   * Search official museum database
   * @param {string} query - Search query
   * @returns {Promise<Object>} Search results with museums array
   */
  async search(query) {
    if (!query || typeof query !== 'string') {
      return { success: false, museums: [], error: 'Invalid query' };
    }

    const trimmedQuery = query.trim();
    if (trimmedQuery.length === 0) {
      return { success: true, museums: [], cached: false };
    }

    // Check cache first
    const cached = this.getCachedSearch(trimmedQuery);
    if (cached) {
      console.log(`[OfficialMuseumSearch] Cache hit for query: "${trimmedQuery}"`);
      return { ...cached, cached: true };
    }

    this.searching = true;
    try {
      console.log(`[OfficialMuseumSearch] Searching API for: "${trimmedQuery}"`);
      
      const response = await fetch(this.apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ museumName: trimmedQuery })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (!data.success) {
        return {
          success: false,
          museums: [],
          error: data.error || 'Search failed',
          cached: false
        };
      }

      // Transform API results to museum cards format
      const museums = await this.transformSearchResults(data.museums || []);

      const result = {
        success: true,
        museums,
        count: museums.length,
        totalResults: data.count || museums.length,
        cached: false
      };

      // Cache the results
      this.cacheSearch(trimmedQuery, result);

      return result;
    } catch (error) {
      console.error('[OfficialMuseumSearch] Search error:', error);
      return {
        success: false,
        museums: [],
        error: error.message,
        cached: false
      };
    } finally {
      this.searching = false;
    }
  }

  /**
   * Transform API search results to museum card format
   * @param {Array} apiResults - Raw API results
   * @returns {Promise<Array>} Transformed museum cards
   */
  async transformSearchResults(apiResults) {
    const museums = await Promise.all(
      apiResults.map(async (museum) => {
        const museumId = this.generateMuseumId(museum.name, museum.location);
        
        return {
          id: museumId,
          name: museum.name || '未知博物馆',
          location: museum.location || '未知',
          province: museum.province || museum.location,
          level: museum.level || '未知',
          category: museum.category || museum.type || '综合',
          tags: this.extractTags(museum),
          image: museum.image || this.getDefaultImage(museum),
          hasCollections: false, // Will be checked dynamically if needed
          officialData: museum, // Store original API data
          source: 'official-api'
        };
      })
    );

    return museums;
  }

  /**
   * Generate museum ID from name and location (pinyin)
   * @param {string} name - Museum name
   * @param {string} location - Museum location
   * @returns {string} Generated museum ID
   */
  generateMuseumId(name, location) {
    // For MVP, use a simple slug-based ID
    // Future: Use pinyin library for proper conversion
    const cleanName = (name || '').replace(/[^\u4e00-\u9fa5\w]/g, '');
    const cleanLocation = (location || '').replace(/[^\u4e00-\u9fa5\w]/g, '');
    
    // Simple hash-based ID for Chinese characters
    const hash = this.simpleHash(cleanName + cleanLocation);
    // Use cleanLocation (which is guaranteed to be a string) instead of location
    const locationPrefix = cleanLocation.slice(0, 2) || 'xx';
    return `museum-${locationPrefix}-${hash}`.toLowerCase();
  }

  /**
   * Simple hash function for generating IDs
   * @param {string} str - String to hash
   * @returns {string} Hash string
   */
  simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Extract tags from museum data
   * @param {Object} museum - Museum data from API
   * @returns {Array<string>} Extracted tags
   */
  extractTags(museum) {
    const tags = [];
    
    // Add category as tag
    if (museum.category || museum.type) {
      tags.push(museum.category || museum.type);
    }
    
    // Add level as tag
    if (museum.level) {
      tags.push(museum.level);
    }
    
    // Add location as tag
    if (museum.location) {
      tags.push(museum.location);
    }
    
    return tags;
  }

  /**
   * Get default placeholder image for museum
   * @param {Object} museum - Museum data
   * @returns {string} Image URL
   */
  getDefaultImage(museum) {
    // Return a placeholder image based on category
    return 'https://via.placeholder.com/400x300?text=' + encodeURIComponent(museum.name || '博物馆');
  }

  /**
   * Get cached search results
   * @param {string} query - Search query
   * @returns {Object|null} Cached results or null if expired/not found
   */
  getCachedSearch(query) {
    try {
      const cacheKey = this.cacheKeyPrefix + query;
      const cached = localStorage.getItem(cacheKey);
      if (!cached) return null;

      const { data, timestamp } = JSON.parse(cached);
      const now = Date.now();

      if (now - timestamp > this.cacheTTL) {
        // Cache expired
        localStorage.removeItem(cacheKey);
        return null;
      }

      return data;
    } catch (error) {
      console.warn('[OfficialMuseumSearch] Cache read error:', error);
      return null;
    }
  }

  /**
   * Cache search results
   * @param {string} query - Search query
   * @param {Object} results - Search results to cache
   */
  cacheSearch(query, results) {
    try {
      const cacheKey = this.cacheKeyPrefix + query;
      const cacheEntry = {
        data: results,
        timestamp: Date.now()
      };

      localStorage.setItem(cacheKey, JSON.stringify(cacheEntry));

      // Manage cache size
      this.cleanOldCache();
    } catch (error) {
      console.warn('[OfficialMuseumSearch] Cache write error:', error);
    }
  }

  /**
   * Clean old cache entries to maintain max cache size
   */
  cleanOldCache() {
    try {
      const cacheKeys = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(this.cacheKeyPrefix)) {
          const cached = localStorage.getItem(key);
          if (cached) {
            const { timestamp } = JSON.parse(cached);
            cacheKeys.push({ key, timestamp });
          }
        }
      }

      // Sort by timestamp (oldest first)
      cacheKeys.sort((a, b) => a.timestamp - b.timestamp);

      // Remove oldest entries if exceeding max size
      while (cacheKeys.length > this.maxCacheSize) {
        const oldestKey = cacheKeys.shift();
        localStorage.removeItem(oldestKey.key);
      }
    } catch (error) {
      console.warn('[OfficialMuseumSearch] Cache cleanup error:', error);
    }
  }

  /**
   * Clear all search cache
   */
  clearCache() {
    try {
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(this.cacheKeyPrefix)) {
          keysToRemove.push(key);
        }
      }

      keysToRemove.forEach(key => localStorage.removeItem(key));
      console.log(`[OfficialMuseumSearch] Cleared ${keysToRemove.length} cache entries`);
    } catch (error) {
      console.warn('[OfficialMuseumSearch] Cache clear error:', error);
    }
  }
}

// Export for use in other modules
if (typeof window !== 'undefined') {
  window.OfficialMuseumSearch = OfficialMuseumSearch;
}
