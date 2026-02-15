/**
 * Dynamic Museum Creator
 * 
 * MVP Phase 2: Dynamic museum record creation
 * 
 * Features:
 * - Check if museum exists in KV Store
 * - Create museum record from official API data
 * - Initialize empty collections and checklists
 * - Support backward compatibility with existing museums
 * 
 * Architecture:
 * - KV Store is the single source of truth for user data
 * - Museums created on-demand when user opens them
 * - Official API data stored separately from user contributions
 */

class DynamicMuseumCreator {
  constructor() {
    this.kvStoreEndpoint = 'https://rlyhccdr2g.execute-api.us-west-2.amazonaws.com/default/keyValueStore';
    this.kvStoreKeyPrefix = 'museum-data-';
    this.checkingMuseum = false;
    this.creatingMuseum = false;
  }

  /**
   * Check if museum exists in KV Store
   * @param {string} museumId - Museum identifier
   * @returns {Promise<boolean>} True if museum exists
   */
  async checkMuseumInKVStore(museumId) {
    if (!museumId) {
      return false;
    }

    try {
      this.checkingMuseum = true;
      const key = this.kvStoreKeyPrefix + museumId;

      const response = await fetch(this.kvStoreEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'get',
          key: key,
          sortKey: 'museum'
        })
      });

      if (!response.ok) {
        console.warn(`[DynamicMuseumCreator] KV Store check failed: ${response.status}`);
        return false;
      }

      const data = await response.json();
      
      // KV Store returns empty object or error if key doesn't exist
      const exists = data && data.value && Object.keys(data.value).length > 0;
      
      console.log(`[DynamicMuseumCreator] Museum ${museumId} exists: ${exists}`);
      return exists;
    } catch (error) {
      console.error('[DynamicMuseumCreator] Error checking KV Store:', error);
      return false;
    } finally {
      this.checkingMuseum = false;
    }
  }

  /**
   * Create museum record from official API data
   * @param {Object} museumData - Museum data from official API or MUSEUMS_META
   * @returns {Promise<Object>} Created museum record or null if failed
   */
  async createMuseumFromOfficial(museumData) {
    if (!museumData || !museumData.id) {
      console.error('[DynamicMuseumCreator] Invalid museum data:', museumData);
      return null;
    }

    try {
      this.creatingMuseum = true;
      console.log(`[DynamicMuseumCreator] Creating museum record: ${museumData.id}`);

      // Build museum record structure
      const museumRecord = this.buildMuseumRecord(museumData);

      // Write to KV Store
      const success = await this.writeToKVStore(museumData.id, museumRecord);

      if (success) {
        console.log(`[DynamicMuseumCreator] Museum created successfully: ${museumData.id}`);
        return museumRecord;
      } else {
        console.error(`[DynamicMuseumCreator] Failed to create museum: ${museumData.id}`);
        return null;
      }
    } catch (error) {
      console.error('[DynamicMuseumCreator] Error creating museum:', error);
      return null;
    } finally {
      this.creatingMuseum = false;
    }
  }

  /**
   * Build museum record structure for KV Store
   * @param {Object} museumData - Museum data from official API
   * @returns {Object} Complete museum record
   */
  buildMuseumRecord(museumData) {
    const now = new Date().toISOString();

    return {
      id: museumData.id,
      
      // Official data from API (immutable)
      officialData: {
        name: museumData.name,
        location: museumData.location,
        province: museumData.province || museumData.location,
        level: museumData.level || '未知',
        category: museumData.category || museumData.type || '综合',
        originalSource: museumData.officialData || museumData
      },
      
      // User-contributed data (editable)
      userContributed: {
        description: museumData.description || '',
        tags: museumData.tags || [],
        image: museumData.image || '',
        submittedBy: null, // Will be set when user contributes
        submittedAt: null,
        lastModified: now
      },
      
      // Collections (镇馆之宝) - empty initially
      collections: [],
      
      // Checklists (参观清单) - empty initially, will be generated on-demand
      checklists: {
        parent: {
          '3-6': [],
          '7-12': [],
          '13-18': []
        },
        child: {
          '3-6': [],
          '7-12': [],
          '13-18': []
        }
      },
      
      // Visit statistics
      visitStats: {
        totalVisits: 0,
        lastVisited: null,
        createdAt: now,
        createdBy: 'system',
        creationSource: 'official-api'
      }
    };
  }

  /**
   * Write museum record to KV Store
   * @param {string} museumId - Museum identifier
   * @param {Object} museumRecord - Complete museum record
   * @returns {Promise<boolean>} True if write succeeded
   */
  async writeToKVStore(museumId, museumRecord) {
    try {
      const key = this.kvStoreKeyPrefix + museumId;

      const response = await fetch(this.kvStoreEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'set',
          key: key,
          sortKey: 'museum',
          value: museumRecord,
          expirationTime: 4866674732 // Year 2124 (effectively permanent)
        })
      });

      if (!response.ok) {
        console.error(`[DynamicMuseumCreator] KV Store write failed: ${response.status}`);
        return false;
      }

      const data = await response.json();
      return data && !data.error;
    } catch (error) {
      console.error('[DynamicMuseumCreator] Error writing to KV Store:', error);
      return false;
    }
  }

  /**
   * Get or create museum (main entry point)
   * @param {Object} museumData - Museum data (from search or MUSEUMS_META)
   * @returns {Promise<Object>} Museum record from KV Store
   */
  async getOrCreateMuseum(museumData) {
    if (!museumData || !museumData.id) {
      console.error('[DynamicMuseumCreator] Invalid museum data');
      return null;
    }

    // Check if museum exists in KV Store
    const exists = await this.checkMuseumInKVStore(museumData.id);

    if (exists) {
      // Museum exists, load from KV Store
      console.log(`[DynamicMuseumCreator] Museum ${museumData.id} exists, loading...`);
      return await this.loadFromKVStore(museumData.id);
    } else {
      // Museum doesn't exist, create it
      console.log(`[DynamicMuseumCreator] Museum ${museumData.id} not found, creating...`);
      return await this.createMuseumFromOfficial(museumData);
    }
  }

  /**
   * Load museum from KV Store
   * @param {string} museumId - Museum identifier
   * @returns {Promise<Object|null>} Museum record or null if not found
   */
  async loadFromKVStore(museumId) {
    try {
      const key = this.kvStoreKeyPrefix + museumId;

      const response = await fetch(this.kvStoreEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'get',
          key: key,
          sortKey: 'museum'
        })
      });

      if (!response.ok) {
        console.error(`[DynamicMuseumCreator] KV Store load failed: ${response.status}`);
        return null;
      }

      const data = await response.json();
      
      if (data && data.value && Object.keys(data.value).length > 0) {
        console.log(`[DynamicMuseumCreator] Loaded museum ${museumId} from KV Store`);
        return data.value;
      }

      return null;
    } catch (error) {
      console.error('[DynamicMuseumCreator] Error loading from KV Store:', error);
      return null;
    }
  }

  /**
   * Update museum visit statistics
   * @param {string} museumId - Museum identifier
   * @returns {Promise<boolean>} True if update succeeded
   */
  async updateVisitStats(museumId) {
    try {
      const museum = await this.loadFromKVStore(museumId);
      if (!museum) {
        console.warn(`[DynamicMuseumCreator] Cannot update visit stats, museum not found: ${museumId}`);
        return false;
      }

      // Update visit statistics
      museum.visitStats = museum.visitStats || {};
      museum.visitStats.totalVisits = (museum.visitStats.totalVisits || 0) + 1;
      museum.visitStats.lastVisited = new Date().toISOString();

      // Write back to KV Store
      return await this.writeToKVStore(museumId, museum);
    } catch (error) {
      console.error('[DynamicMuseumCreator] Error updating visit stats:', error);
      return false;
    }
  }
}

// Export for use in other modules
if (typeof window !== 'undefined') {
  window.DynamicMuseumCreator = DynamicMuseumCreator;
}
