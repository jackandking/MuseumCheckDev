// TreasuresAdapter: loads museum treasure data using tiered loader (Tier2 -> Tier1) and emits events
class TreasuresAdapter {
  constructor(museumDataLoader, eventBus) {
    if (!museumDataLoader) {
      throw new Error('museumDataLoader is required for TreasuresAdapter');
    }
    
    this.loader = museumDataLoader;
    this.eventBus = eventBus;
    this.museums = [];
    this.treasuresData = [];
  }

  /**
   * Initialize adapter by loading all museums with meta priority
   * @returns {Promise<Array>} Array of museums with treasure information
   */
  async init() {
    try {
      // Get museum list (ids, names, locations). Prefer MUSEUMS_META via loader.
      const metaList = await this.loader.loadAllMuseums();
      if (!metaList || metaList.length === 0) {
        console.warn('[TreasuresAdapter] No museum metadata available');
        this.treasuresData = [];
        return this.treasuresData;
      }

      // Load full details for each museum (Tier2 -> Tier1)
      const detailPromises = metaList.map(async (meta) => {
        const full = await this.loader.loadMuseum(meta.id);
        // Fallback to meta if full not available, with minimal shape
        return full || {
          id: meta.id,
          name: meta.name,
          location: meta.location,
          description: meta.description || '',
          image: meta.image,
          collections: [],
          checklists: null
        };
      });

      const fullMuseums = (await Promise.all(detailPromises)).filter(Boolean);
      this.museums = fullMuseums;

      // Extract treasure information from full museum data
      this.treasuresData = this.extractTreasureData(fullMuseums);

      console.log(`[TreasuresAdapter] Loaded ${this.treasuresData.length} museums with treasure information`);

      // Emit event for UI updates
      if (this.eventBus) {
        this.eventBus.emit('treasures:loaded', {
          count: this.treasuresData.length,
          museums: this.treasuresData
        });
      }

      return this.treasuresData;
    } catch (error) {
      console.error('[TreasuresAdapter] Failed to initialize:', error);
      // Return empty array as fallback
      this.treasuresData = [];
      return [];
    }
  }

  /**
   * Extract treasure information from museums data
   * @param {Array} museums - Array of museum objects
   * @returns {Array} Array of treasure data objects
   */
  extractTreasureData(museums) {
    const treasuresData = [];
    
    museums.forEach(museum => {
      const treasureInfo = {
        id: museum.id,
        name: museum.name,
        location: museum.location,
        description: museum.description,
        image: museum.image,
        collections: museum.collections || [],
        treasures: {
          simple: [],    // 3-6 age group
          detailed: [],  // 7-12 age group  
          academic: []   // 13-18 age group
        }
      };
      
      // Extract treasure mentions from checklists
      let hasTreasures = false;
      
      if (museum.checklists && museum.checklists.parent) {
        ['3-6', '7-12', '13-18'].forEach(ageGroup => {
          const items = museum.checklists.parent[ageGroup] || [];
          items.forEach(item => {
            if (item.includes('镇馆之宝')) {
              hasTreasures = true;
              if (ageGroup === '3-6') {
                treasureInfo.treasures.simple.push(item);
              } else if (ageGroup === '7-12') {
                treasureInfo.treasures.detailed.push(item);
              } else if (ageGroup === '13-18') {
                treasureInfo.treasures.academic.push(item);
              }
            }
          });
        });
      }
      
      if (museum.checklists && museum.checklists.child) {
        ['3-6', '7-12', '13-18'].forEach(ageGroup => {
          const items = museum.checklists.child[ageGroup] || [];
          items.forEach(item => {
            if (item.includes('镇馆之宝')) {
              hasTreasures = true;
              if (ageGroup === '3-6') {
                treasureInfo.treasures.simple.push(item);
              } else if (ageGroup === '7-12') {
                treasureInfo.treasures.detailed.push(item);
              } else if (ageGroup === '13-18') {
                treasureInfo.treasures.academic.push(item);
              }
            }
          });
        });
      }
      
      // Include museums that have treasures or collections
      if (hasTreasures || treasureInfo.collections.length > 0) {
        treasuresData.push(treasureInfo);
      }
    });
    
    return treasuresData;
  }

  /**
   * Get all treasures data
   * @returns {Array} Array of treasure data objects
   */
  getTreasuresData() {
    return this.treasuresData;
  }

  /**
   * Get treasures filtered by region
   * @param {string} region - Region to filter by ('all', 'Beijing', etc)
   * @returns {Array} Filtered treasure data
   */
  filterByRegion(region) {
    if (region === 'all') {
      return this.treasuresData;
    }
    
    const majorCities = ['北京', '上海', '西安', '南京'];
    
    return this.treasuresData.filter(museum => {
      if (region === '其他') {
        return !majorCities.includes(museum.location);
      }
      return museum.location === region;
    });
  }

  /**
   * Search treasures by keyword
   * @param {string} keyword - Search keyword
   * @returns {Array} Filtered treasure data
   */
  search(keyword) {
    if (!keyword || keyword.trim() === '') {
      return this.treasuresData;
    }
    
    const searchLower = keyword.toLowerCase();
    
    return this.treasuresData.filter(museum => {
      const name = (museum.name || '').toLowerCase();
      const location = (museum.location || '').toLowerCase();
      const description = (museum.description || '').toLowerCase();
      const treasuresStr = JSON.stringify(museum.treasures || {}).toLowerCase();
      return name.includes(searchLower) ||
             location.includes(searchLower) ||
             description.includes(searchLower) ||
             treasuresStr.includes(searchLower);
    });
  }

  /**
   * Get statistics
   * @returns {Object} Statistics object
   */
  getStats() {
    const totalMuseums = this.treasuresData.length;
    const totalTreasures = this.treasuresData.reduce((sum, museum) => {
      return sum + museum.treasures.simple.length + 
             museum.treasures.detailed.length + 
             museum.treasures.academic.length;
    }, 0);
    const totalCollections = this.treasuresData.reduce((sum, museum) => {
      return sum + (museum.collections ? museum.collections.length : 0);
    }, 0);
    
    return {
      totalMuseums,
      totalTreasures,
      totalCollections,
      totalItems: totalTreasures + totalCollections
    };
  }
}

// Export for both browser and Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = TreasuresAdapter;
}
