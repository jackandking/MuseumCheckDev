/**
 * Museum Data Loader - 3-Tier Data Management System
 * 
 * Tier 1: Individual museum static JSON files (/museums/{museum-id}.json)
 * Tier 2: KV store dynamic data (remote storage for dev/debug)
 * Tier 3: Consolidated museums-data.js (fallback)
 * 
 * Priority: Tier 1 → Tier 2 → Tier 3 (configurable)
 */

class MuseumDataLoader {
    constructor() {
        this.cache = new Map();
        this.kvStoreEndpoint = 'https://rlyhccdr2g.execute-api.us-west-2.amazonaws.com/default/keyValueStore';
        this.kvStoreKeyPrefix = 'museum-data-';
        
        // Load tier priority from settings
        this.loadPrioritySettings();
    }

    /**
     * Load tier priority settings from localStorage
     */
    loadPrioritySettings() {
        try {
            const settings = localStorage.getItem('museumDataTierPriority');
            if (settings) {
                const parsed = JSON.parse(settings);
                this.tierPriority = parsed.priority || ['tier1', 'tier2', 'tier3'];
            } else {
                // Default priority: Tier 1 → Tier 2 → Tier 3
                this.tierPriority = ['tier1', 'tier2', 'tier3'];
            }
        } catch (error) {
            console.warn('Error loading tier priority settings:', error);
            this.tierPriority = ['tier1', 'tier2', 'tier3'];
        }
    }

    /**
     * Update tier priority settings
     * @param {Array<string>} priority - Array of tier names in priority order
     */
    updatePrioritySettings(priority) {
        try {
            this.tierPriority = priority;
            localStorage.setItem('museumDataTierPriority', JSON.stringify({ priority }));
            console.log('Museum data tier priority updated:', priority);
        } catch (error) {
            console.error('Error updating tier priority settings:', error);
        }
    }

    /**
     * Get current tier priority settings
     * @returns {Array<string>} Current priority order
     */
    getPrioritySettings() {
        return [...this.tierPriority];
    }

    /**
     * Load museum data from Tier 1 (individual static file)
     * @param {string} museumId - Museum identifier
     * @returns {Promise<Object|null>} Museum data or null if not found
     */
    async loadFromTier1(museumId) {
        try {
            const response = await fetch(`museums/${museumId}.json`);
            if (!response.ok) {
                return null;
            }
            const data = await response.json();
            console.log(`Loaded museum ${museumId} from Tier 1 (static file)`);
            return data;
        } catch (error) {
            console.log(`Museum ${museumId} not found in Tier 1:`, error.message);
            return null;
        }
    }

    /**
     * Load museum data from Tier 2 (KV store)
     * @param {string} museumId - Museum identifier
     * @returns {Promise<Object|null>} Museum data or null if not found
     */
    async loadFromTier2(museumId) {
        try {
            const key = `${this.kvStoreKeyPrefix}${museumId}`;
            const sortKey = 'museum';
            const url = `${this.kvStoreEndpoint}?key=${encodeURIComponent(key)}&sortKey=${encodeURIComponent(sortKey)}`;
            
            const response = await fetch(url, { method: 'GET' });
            if (!response.ok) {
                return null;
            }
            
            const result = await response.json();
            if (!result || !result.value) {
                return null;
            }
            
            const data = JSON.parse(result.value);
            console.log(`Loaded museum ${museumId} from Tier 2 (KV store)`);
            return data;
        } catch (error) {
            console.log(`Museum ${museumId} not found in Tier 2:`, error.message);
            return null;
        }
    }

    /**
     * Load museum data from Tier 3 (consolidated MUSEUMS array)
     * @param {string} museumId - Museum identifier
     * @returns {Promise<Object|null>} Museum data or null if not found
     */
    async loadFromTier3(museumId) {
        try {
            // MUSEUMS array should be available globally
            if (typeof MUSEUMS === 'undefined') {
                console.error('MUSEUMS array not found in global scope');
                return null;
            }
            
            const museum = MUSEUMS.find(m => m.id === museumId);
            if (museum) {
                console.log(`Loaded museum ${museumId} from Tier 3 (MUSEUMS array)`);
                return museum;
            }
            return null;
        } catch (error) {
            console.error(`Error loading museum ${museumId} from Tier 3:`, error);
            return null;
        }
    }

    /**
     * Load museum data following tier priority
     * @param {string} museumId - Museum identifier
     * @param {boolean} useCache - Whether to use cached data
     * @returns {Promise<Object|null>} Museum data or null if not found
     */
    async loadMuseum(museumId, useCache = true) {
        // Check cache first
        if (useCache && this.cache.has(museumId)) {
            console.log(`Loaded museum ${museumId} from cache`);
            return this.cache.get(museumId);
        }

        // Try loading from tiers in priority order
        for (const tier of this.tierPriority) {
            let data = null;
            
            switch (tier) {
                case 'tier1':
                    data = await this.loadFromTier1(museumId);
                    break;
                case 'tier2':
                    data = await this.loadFromTier2(museumId);
                    break;
                case 'tier3':
                    data = await this.loadFromTier3(museumId);
                    break;
            }

            if (data) {
                // Cache the result
                this.cache.set(museumId, data);
                return data;
            }
        }

        console.warn(`Museum ${museumId} not found in any tier`);
        return null;
    }

    /**
     * Load all museums (returns list from Tier 3 by default for performance)
     * Individual museums can be loaded on-demand using loadMuseum()
     * @returns {Array<Object>} Array of museum metadata
     */
    async loadAllMuseums() {
        try {
            // For listing purposes, use Tier 3 (MUSEUMS array)
            // This provides the complete list efficiently
            if (typeof MUSEUMS === 'undefined') {
                console.error('MUSEUMS array not found in global scope');
                return [];
            }
            
            // Return shallow copy to prevent mutations
            // Include collections field to allow dynamic V3 navigation button check
            return MUSEUMS.map(m => ({
                id: m.id,
                name: m.name,
                location: m.location,
                description: m.description,
                tags: m.tags,
                image: m.image,
                collections: m.collections  // Include collections for V3 navigation check
            }));
        } catch (error) {
            console.error('Error loading all museums:', error);
            return [];
        }
    }

    /**
     * Clear cached museum data
     * @param {string} museumId - Optional museum ID to clear specific cache
     */
    clearCache(museumId = null) {
        if (museumId) {
            this.cache.delete(museumId);
            console.log(`Cleared cache for museum: ${museumId}`);
        } else {
            this.cache.clear();
            console.log('Cleared all museum data cache');
        }
    }

    /**
     * Save museum data to KV store (Tier 2)
     * @param {string} museumId - Museum identifier
     * @param {Object} data - Museum data object
     * @param {number} expireAt - Expiration timestamp (optional)
     * @returns {Promise<boolean>} Success status
     */
    async saveToKVStore(museumId, data, expireAt = 4866674732) {
        try {
            const key = `${this.kvStoreKeyPrefix}${museumId}`;
            const value = JSON.stringify(data);
            
            const response = await fetch(this.kvStoreEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    key,
                    sortKey: 'museum',
                    value,
                    expireAt
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            console.log(`Saved museum ${museumId} to KV store`);
            
            // Clear cache for this museum
            this.clearCache(museumId);
            
            return true;
        } catch (error) {
            console.error(`Error saving museum ${museumId} to KV store:`, error);
            return false;
        }
    }

    /**
     * Delete museum data from KV store (Tier 2)
     * @param {string} museumId - Museum identifier
     * @returns {Promise<boolean>} Success status
     */
    async deleteFromKVStore(museumId) {
        try {
            const key = `${this.kvStoreKeyPrefix}${museumId}`;
            
            // Note: The KV store API might need a DELETE endpoint
            // For now, we'll set an empty value with immediate expiration
            const response = await fetch(this.kvStoreEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    key,
                    sortKey: 'museum',
                    value: JSON.stringify({}),
                    expireAt: Math.floor(Date.now() / 1000) // Expire immediately
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            console.log(`Deleted museum ${museumId} from KV store`);
            
            // Clear cache for this museum
            this.clearCache(museumId);
            
            return true;
        } catch (error) {
            console.error(`Error deleting museum ${museumId} from KV store:`, error);
            return false;
        }
    }

    /**
     * List all museums in KV store
     * @returns {Promise<Array<Object>>} Array of museum metadata from KV store
     */
    async listKVStoreMuseums() {
        try {
            // Note: This assumes the KV store supports listing by key prefix
            // The actual implementation may vary based on API capabilities
            const url = `${this.kvStoreEndpoint}?key=${encodeURIComponent(this.kvStoreKeyPrefix)}`;
            
            const response = await fetch(url, { method: 'GET' });
            if (!response.ok) {
                return [];
            }
            
            const result = await response.json();
            // Parse and return the results based on actual API response format
            // This is a placeholder and may need adjustment
            return result || [];
        } catch (error) {
            console.error('Error listing KV store museums:', error);
            return [];
        }
    }
}

// Create and export global instance
const museumDataLoader = new MuseumDataLoader();

// Make available on window object for browser usage
if (typeof window !== 'undefined') {
    window.museumDataLoader = museumDataLoader;
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { MuseumDataLoader, museumDataLoader };
}
