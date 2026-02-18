/**
 * HomepageAdapter
 * 负责主页博物馆列表的数据加载与事件管理
 * 
 * 设计原则：
 * - 使用 OfficialMuseumSearch 进行动态API搜索
 * - 通过 DataManager 和 museum-data-loader 实现数据访问
 * - 详细数据按需加载（KV Store）
 * - 支持搜索、过滤、排序等功能
 * - 发布事件供其他模块订阅
 */

// Error message constants for consistency (internal identifiers, not user-facing text)
const ERROR_MESSAGES = {
  SEARCH_SERVICE_UNAVAILABLE: 'Search service unavailable',
  SEARCH_FAILED: 'Search failed',
  SEARCH_ERROR: 'Search error occurred'
};

class HomepageAdapter {
  constructor({ dataManager, eventBus, museumDataLoader } = {}) {
    // 核心依赖
    this.dataManager = dataManager || (typeof DataManager !== 'undefined' ? DataManager.getInstance() : null);
    this.eventBus = eventBus || (typeof EventBus !== 'undefined' ? EventBus.getInstance() : null);
    this.museumDataLoader = museumDataLoader || (typeof window !== 'undefined' ? window.museumDataLoader : null);
    
    // Initialize OfficialMuseumSearch for API-based searching
    this.officialSearch = typeof OfficialMuseumSearch !== 'undefined' ? new OfficialMuseumSearch() : null;
    
    // 状态管理
    this.initialized = false;
    this.museums = [];
    this.filteredMuseums = [];
    this.currentFilters = {
      searchText: '',
      location: '',
      tags: [],
      hasCollections: false
    };
    this.sortBy = 'default';
    this.isSearching = false;
  }

  /**
   * 初始化适配器
   * @returns {Promise<boolean>}
   */
  async init() {
    if (this.initialized) {
      console.log('HomepageAdapter already initialized');
      return true;
    }

    // 验证依赖
    if (!this.museumDataLoader) {
      console.error('HomepageAdapter: museum-data-loader is required');
      return false;
    }

    try {
      // No longer loading museums from meta - will use API search instead
      this.museums = [];
      this.filteredMuseums = [];
      
      console.log('HomepageAdapter initialized (museums will be loaded via API search)');
      
      // 发布初始化完成事件
      if (this.eventBus) {
        this.eventBus.emit('homepage:museums:loaded', {
          count: 0,
          source: 'api-search-ready'
        });
      }
      
      this.initialized = true;
      return true;
    } catch (error) {
      console.error('HomepageAdapter initialization failed:', error);
      return false;
    }
  }

  /**
   * 获取所有博物馆列表（元数据）
   * @returns {Array<Object>}
   */
  getAllMuseums() {
    return [...this.museums];
  }

  /**
   * 获取过滤后的博物馆列表
   * @returns {Array<Object>}
   */
  getFilteredMuseums() {
    return [...this.filteredMuseums];
  }

  /**
   * 加载单个博物馆的详细数据
   * @param {string} museumId
   * @param {Object} options
   * @returns {Promise<Object|null>}
   */
  async loadMuseumDetails(museumId, options = {}) {
    if (!this.initialized) {
      await this.init();
    }

    try {
      // 使用 museum-data-loader 的 Tier 2 → Tier 1 策略
      const museum = await this.museumDataLoader.loadMuseum(museumId, options.useCache !== false);
      
      if (museum) {
        // 发布事件
        if (this.eventBus) {
          this.eventBus.emit('homepage:museum:loaded', {
            museumId,
            source: options.source || 'dynamic-first'
          });
        }
      }
      
      return museum;
    } catch (error) {
      console.error(`Error loading museum details for ${museumId}:`, error);
      return null;
    }
  }

  /**
   * 搜索博物馆（使用官方API）
   * @param {string} searchText - 搜索关键词
   * @returns {Promise<void>}
   */
  async search(searchText) {
    this.currentFilters.searchText = searchText.trim();
    
    // If empty search, clear results
    if (!this.currentFilters.searchText) {
      this.museums = [];
      this.filteredMuseums = [];
      this.lastSearchError = null;
      
      if (this.eventBus) {
        this.eventBus.emit('homepage:search', {
          searchText: '',
          resultCount: 0,
          source: 'cleared'
        });
      }
      return;
    }
    
    // Use OfficialMuseumSearch for API-based search
    if (!this.officialSearch) {
      console.warn('OfficialMuseumSearch not available, cannot perform search');
      this.lastSearchError = ERROR_MESSAGES.SEARCH_SERVICE_UNAVAILABLE;
      return;
    }
    
    try {
      this.isSearching = true;
      this.lastSearchError = null;
      console.log(`[HomepageAdapter] Searching via API: "${this.currentFilters.searchText}"`);
      
      const result = await this.officialSearch.search(this.currentFilters.searchText);
      
      if (result.success) {
        this.museums = result.museums || [];
        this.applyFilters();
        
        console.log(`[HomepageAdapter] Found ${this.filteredMuseums.length} museums from API`);
        
        // 发布搜索事件
        if (this.eventBus) {
          this.eventBus.emit('homepage:search', {
            searchText: this.currentFilters.searchText,
            resultCount: this.filteredMuseums.length,
            source: result.cached ? 'cached' : 'api',
            totalResults: result.totalResults,
            error: null
          });
        }
      } else {
        console.error('[HomepageAdapter] Search failed:', result.error);
        this.museums = [];
        this.filteredMuseums = [];
        this.lastSearchError = result.error || ERROR_MESSAGES.SEARCH_FAILED;
        
        // Emit error event
        if (this.eventBus) {
          this.eventBus.emit('homepage:search', {
            searchText: this.currentFilters.searchText,
            resultCount: 0,
            source: 'api',
            error: this.lastSearchError
          });
        }
      }
    } catch (error) {
      console.error('[HomepageAdapter] Search error:', error);
      this.museums = [];
      this.filteredMuseums = [];
      this.lastSearchError = error.message || ERROR_MESSAGES.SEARCH_ERROR;
      
      // Emit error event
      if (this.eventBus) {
        this.eventBus.emit('homepage:search', {
          searchText: this.currentFilters.searchText,
          resultCount: 0,
          source: 'api',
          error: this.lastSearchError
        });
      }
    } finally {
      this.isSearching = false;
    }
  }

  /**
   * 按地区过滤
   * @param {string} location - 地区名称
   */
  filterByLocation(location) {
    this.currentFilters.location = location;
    this.applyFilters();
    
    if (this.eventBus) {
      this.eventBus.emit('homepage:filter:location', {
        location,
        resultCount: this.filteredMuseums.length
      });
    }
  }

  /**
   * 按标签过滤
   * @param {Array<string>} tags - 标签数组
   */
  filterByTags(tags) {
    this.currentFilters.tags = tags || [];
    this.applyFilters();
    
    if (this.eventBus) {
      this.eventBus.emit('homepage:filter:tags', {
        tags,
        resultCount: this.filteredMuseums.length
      });
    }
  }

  /**
   * 只显示有藏品的博物馆
   * @param {boolean} hasCollections
   */
  filterByCollections(hasCollections) {
    this.currentFilters.hasCollections = hasCollections;
    this.applyFilters();
    
    if (this.eventBus) {
      this.eventBus.emit('homepage:filter:collections', {
        hasCollections,
        resultCount: this.filteredMuseums.length
      });
    }
  }

  /**
   * 应用所有过滤条件
   * Note: Now only applies client-side filters after API search results are received
   */
  applyFilters() {
    let filtered = [...this.museums];

    // 搜索文本过滤 - Already done by API, but keep for client-side refinement
    // (This filter is redundant when using API search, but kept for compatibility)
    
    // 地区过滤
    if (this.currentFilters.location) {
      filtered = filtered.filter(m => m.location === this.currentFilters.location);
    }

    // 标签过滤
    if (this.currentFilters.tags.length > 0) {
      filtered = filtered.filter(m => 
        m.tags && this.currentFilters.tags.some(tag => m.tags.includes(tag))
      );
    }

    // 藏品过滤
    if (this.currentFilters.hasCollections) {
      filtered = filtered.filter(m => m.hasCollections === true);
    }

    this.filteredMuseums = filtered;
    this.sort(this.sortBy);
  }

  /**
   * 清空所有过滤条件
   */
  clearFilters() {
    this.currentFilters = {
      searchText: '',
      location: '',
      tags: [],
      hasCollections: false
    };
    this.filteredMuseums = [...this.museums];
    this.sort(this.sortBy);
    
    if (this.eventBus) {
      this.eventBus.emit('homepage:filters:cleared', {
        resultCount: this.filteredMuseums.length
      });
    }
  }

  /**
   * 排序博物馆列表
   * @param {string} sortBy - 排序方式 ('default', 'name', 'location', 'visited', 'distance')
   */
  sort(sortBy) {
    this.sortBy = sortBy;

    switch (sortBy) {
      case 'name':
        this.filteredMuseums.sort((a, b) => a.name.localeCompare(b.name, 'zh-CN'));
        break;
      
      case 'location':
        this.filteredMuseums.sort((a, b) => a.location.localeCompare(b.location, 'zh-CN'));
        break;
      
      case 'visited':
        // 需要从 localStorage 读取访问记录
        this.sortByVisitedStatus();
        break;
      
      case 'distance':
        // 需要地理位置信息，暂不实现
        console.warn('Distance-based sorting not implemented yet');
        break;
      
      case 'default':
      default:
        // 综合排序：收藏 → 有烟花 → 未参观 → 距离近
        this.sortByDefaultStrategy();
        break;
    }
    
    if (this.eventBus) {
      this.eventBus.emit('homepage:sorted', { sortBy });
    }
  }

  /**
   * 默认排序策略
   */
  sortByDefaultStrategy() {
    this.filteredMuseums = this.sortMuseumsArray(this.filteredMuseums, 'default');
  }

  /**
   * 排序任意博物馆数组（核心排序逻辑，唯一来源）
   * @param {Array<Object>} museums - 要排序的博物馆数组
   * @param {string} sortBy - 排序方式 ('default', 'name', 'location')
   * @returns {Array<Object>} 排序后的数组
   */
  sortMuseumsArray(museums, sortBy = 'default') {
    const sorted = [...museums];
    const recentVisits = this.getRecentVisits();

    if (sortBy === 'default') {
      sorted.sort((a, b) => {
        // 1. 最近访问的在前
        const aTime = recentVisits[a.id] || 0;
        const bTime = recentVisits[b.id] || 0;
        if (aTime !== bTime) return bTime - aTime;

        // 2. 按名称排序
        return a.name.localeCompare(b.name, 'zh-CN');
      });
    } else if (sortBy === 'name') {
      sorted.sort((a, b) => a.name.localeCompare(b.name, 'zh-CN'));
    } else if (sortBy === 'location') {
      sorted.sort((a, b) => {
        const locCompare = (a.location || '').localeCompare(b.location || '', 'zh-CN');
        if (locCompare !== 0) return locCompare;
        return a.name.localeCompare(b.name, 'zh-CN');
      });
    }

    return sorted;
  }

  /**
   * 按访问状态排序
   */
  sortByVisitedStatus() {
    const visited = this.getVisitedMuseums();
    
    this.filteredMuseums.sort((a, b) => {
      const aVisited = visited.includes(a.id);
      const bVisited = visited.includes(b.id);
      
      // 未访问的在前
      if (aVisited !== bVisited) return aVisited ? 1 : -1;
      
      // 同类按名称排序
      return a.name.localeCompare(b.name, 'zh-CN');
    });
  }

  /**
   * 获取已访问的博物馆列表
   * @returns {Array<string>}
   */
  getVisitedMuseums() {
    try {
      const visited = localStorage.getItem('visitedMuseums');
      return visited ? JSON.parse(visited) : [];
    } catch (error) {
      console.error('Error reading visitedMuseums:', error);
      return [];
    }
  }

  /**
   * 获取最近访问记录（博物馆ID -> 访问时间戳）
   * @returns {Object<string, number>}
   */
  getRecentVisits() {
    try {
      const meta = localStorage.getItem('visitedMuseumsMeta');
      return meta ? JSON.parse(meta) : {};
    } catch (error) {
      console.error('Error reading visitedMuseumsMeta:', error);
      return {};
    }
  }

  /**
   * 获取收藏的博物馆列表
   * @returns {Array<string>}
   */
  getFavoriteMuseums() {
    try {
      const favorites = localStorage.getItem('favoriteMuseums');
      return favorites ? JSON.parse(favorites) : [];
    } catch (error) {
      console.error('Error reading favoriteMuseums:', error);
      return [];
    }
  }

  /**
   * 获取有烟花记录的博物馆列表
   * @returns {Array<string>}
   */
  getMuseumsWithFireworks() {
    try {
      const fireworks = localStorage.getItem('fireworksData');
      if (!fireworks) return [];
      
      const data = JSON.parse(fireworks);
      // 提取唯一的博物馆ID
      const museumIds = [...new Set(data.map(f => f.museumId).filter(Boolean))];
      return museumIds;
    } catch (error) {
      console.error('Error reading fireworksData:', error);
      return [];
    }
  }

  /**
   * 获取统计信息
   * @returns {Object}
   */
  getStatistics() {
    const visited = this.getVisitedMuseums();
    const total = this.museums.length;
    const percentage = total > 0 ? ((visited.length / total) * 100).toFixed(1) : '0.0';

    return {
      total,
      visited: visited.length,
      percentage,
      filtered: this.filteredMuseums.length
    };
  }
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = HomepageAdapter;
}

if (typeof window !== 'undefined') {
  window.HomepageAdapter = HomepageAdapter;
}
