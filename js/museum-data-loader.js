/**
 * Museum Data Loader - KV Store + Browser Cache Architecture
 * 
 * Architecture: KV Store (AWS Lambda) + Browser Cache (localStorage)
 * 
 * Data Sources:
 * - Primary: KV Store (https://rlyhccdr2g.execute-api.us-west-2.amazonaws.com)
 * - Cache: Browser localStorage with 7-day expiration
 * - Listing: MUSEUMS_META array (lightweight metadata for homepage)
 * 
 * Design Philosophy:
 * - Single source of truth (KV Store) for always-fresh data
 * - Browser cache for offline support and performance
 * - No static JSON files as fallback (adds complexity, rarely used)
 * - Future: If AWS costs exceed free tier, consider static files + CDN
 * 
 * Why not static files?
 * - KV Store is fast enough with AWS Lambda (99.9% uptime)
 * - Browser cache handles offline scenarios
 * - Static files add maintenance overhead (sync, versioning)
 * - Cost-effective: Free tier covers current traffic volume
 */

class MuseumDataLoader {
    constructor() {
        this.cache = new Map(); // In-memory cache for current session
        this.kvStoreEndpoint = 'https://rlyhccdr2g.execute-api.us-west-2.amazonaws.com/default/keyValueStore';
        this.kvStoreKeyPrefix = 'museum-data-';
        this.cacheExpirationDays = 7; // localStorage cache expires after 7 days
        
        // Legacy compatibility: tierPriority for tests
        this.tierPriority = ['tier2'];
    }

    /**
     * Legacy method for backward compatibility with tests
     * @deprecated No longer used in simplified architecture
     */
    loadPrioritySettings() {
        // Silent no-op for compatibility
    }

    /**
     * Legacy method for backward compatibility with tests
     * @deprecated No longer used in simplified architecture
     */
    updatePrioritySettings(priority) {
        // Silent no-op for compatibility
    }

    /**
     * Legacy method for backward compatibility with tests
     * @deprecated No longer used in simplified architecture
     */
    getPrioritySettings() {
        return ['tier2']; // Always return KV Store only
    }

    /**
     * Legacy method: Load from Tier 1 (no longer used in production)
     * @deprecated Tier 1 static files removed in simplified architecture
     */
    async loadFromTier1(museumId) {
        return null; // Tier 1 removed in simplified architecture
    }

    /**
     * Legacy method: Load from Tier 2 (now integrated into loadMuseum)
     * @deprecated Use loadMuseum() instead in new code
     */
    async loadFromTier2(museumId) {
        return await this.loadFromKVStore(museumId);
    }

    /**
     * Legacy method: Load from Tier 3 (no longer used)
     * @deprecated museums-data.js not used at runtime
     */
    async loadFromTier3(museumId) {
        return null; // Tier 3 removed in simplified architecture
    }

    /**
     * Get cached data from localStorage with expiration check
     * @param {string} museumId - Museum identifier
     * @returns {Object|null} Cached data or null if expired/not found
     */
    getCachedFromStorage(museumId) {
        try {
            const cacheKey = `museum-cache-${museumId}`;
            const cached = localStorage.getItem(cacheKey);
            if (!cached) return null;

            const { data, timestamp } = JSON.parse(cached);
            const now = Date.now();
            const expirationMs = this.cacheExpirationDays * 24 * 60 * 60 * 1000;

            if (now - timestamp > expirationMs) {
                // Cache expired
                localStorage.removeItem(cacheKey);
                return null;
            }

            return data;
        } catch (error) {
            console.warn(`Error reading cache for ${museumId}:`, error);
            return null;
        }
    }

    /**
     * Save data to localStorage cache
     * @param {string} museumId - Museum identifier
     * @param {Object} data - Museum data to cache
     */
    setCachedToStorage(museumId, data) {
        try {
            const cacheKey = `museum-cache-${museumId}`;
            const cacheData = {
                data,
                timestamp: Date.now()
            };
            localStorage.setItem(cacheKey, JSON.stringify(cacheData));
        } catch (error) {
            console.warn(`Error caching ${museumId}:`, error);
        }
    }

    /**
     * Load museum data from KV Store
     * @param {string} museumId - Museum identifier
     * @returns {Promise<Object|null>} Museum data or null if not found
     */
    async loadFromKVStore(museumId) {
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
            console.log(`✓ Loaded museum ${museumId} from KV Store`);
            return data;
        } catch (error) {
            console.log(`✗ Failed to load ${museumId} from KV Store:`, error.message);
            return null;
        }
    }

    /**
     * Load museum data with cache strategy
     * @param {string} museumId - Museum identifier
     * @param {boolean} useCache - Whether to use cached data
     * @returns {Promise<Object|null>} Museum data or null if not found
     */
    async loadMuseum(museumId, useCache = true) {
        // Check in-memory cache first (fastest)
        if (useCache && this.cache.has(museumId)) {
            console.log(`↻ Loaded museum ${museumId} from memory cache`);
            return this.cache.get(museumId);
        }

        // Check localStorage cache (still fast, works offline)
        if (useCache) {
            const cachedData = this.getCachedFromStorage(museumId);
            if (cachedData) {
                console.log(`↻ Loaded museum ${museumId} from localStorage cache`);
                this.cache.set(museumId, cachedData); // Also set in memory
                return cachedData;
            }
        }

        // Load from KV Store (fresh data)
        const data = await this.loadFromKVStore(museumId);
        
        if (data) {
            // Cache the fresh data
            this.cache.set(museumId, data); // Memory cache
            this.setCachedToStorage(museumId, data); // localStorage cache
            return data;
        }

        // If network failed, try to use expired cache as last resort
        if (useCache) {
            try {
                const cacheKey = `museum-cache-${museumId}`;
                const cached = localStorage.getItem(cacheKey);
                if (cached) {
                    const { data: expiredData } = JSON.parse(cached);
                    console.warn(`⚠ Using expired cache for ${museumId} (network unavailable)`);
                    return expiredData;
                }
            } catch (error) {
                // Ignore error, will return null
            }
        }

        console.warn(`✗ Museum ${museumId} not available - please check network connection`);
        return null;
    }

    /**
     * Load all museums for listing (homepage display only)
     * 
     * This method uses the MUSEUMS_META array for the complete list.
     * It provides lightweight metadata efficiently for homepage display.
     * 
     * IMPORTANT: For detailed museum data (checklists, collections, etc.),
     * always use loadMuseum() which tries dynamic data first.
     * 
     * @returns {Array<Object>} Array of museum metadata (id, name, location, etc.)
     */
    async loadAllMuseums() {
        try {
            // Priority 1: Use MUSEUMS_META if available (lightweight, fast)
            if (typeof MUSEUMS_META !== 'undefined' && MUSEUMS_META.length > 0) {
                console.log('Loaded museums from MUSEUMS_META (optimized for homepage)');
                // MUSEUMS_META already contains: id, name, location, tags, image, hasCollections
                // This is sufficient for homepage listing and search
                return MUSEUMS_META;
            }
            
            // Fallback: Use MUSEUMS array if MUSEUMS_META is not available
            // This provides backward compatibility during migration
            if (typeof MUSEUMS !== 'undefined') {
                console.warn('MUSEUMS_META not found, using MUSEUMS array as fallback');
                // Return shallow copy with basic metadata only
                // Detailed data should be loaded via loadMuseum() for fresh dynamic content
                return MUSEUMS.map(m => ({
                    id: m.id,
                    name: m.name,
                    location: m.location,
                    description: m.description,
                    tags: m.tags,
                    image: m.image,
                    hasCollections: m.collections && m.collections.length > 0
                }));
            }
            
            console.error('Neither MUSEUMS_META nor MUSEUMS array found in global scope');
            return [];
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
     * Get museum image URL, falling back to KV Store when meta image is unavailable.
     * Caches the resolved URL in localStorage to avoid repeated KV Store requests.
     * @param {string} museumId - Museum identifier
     * @returns {Promise<string|null>} Image URL or null if not found
     */
    async getMuseumImageUrl(museumId) {
        const cacheKey = `museum-image-url-${museumId}`;

        // Check localStorage cache first
        try {
            const cached = localStorage.getItem(cacheKey);
            if (cached) {
                const { url, timestamp } = JSON.parse(cached);
                const expirationMs = this.cacheExpirationDays * 24 * 60 * 60 * 1000;
                if (Date.now() - timestamp < expirationMs) {
                    return url;
                }
                localStorage.removeItem(cacheKey);
            }
        } catch (error) {
            console.warn(`Error reading image URL cache for ${museumId}:`, error);
        }

        // Fetch from KV Store
        try {
            const data = await this.loadFromKVStore(museumId);
            if (data && data.image) {
                try {
                    localStorage.setItem(cacheKey, JSON.stringify({
                        url: data.image,
                        timestamp: Date.now()
                    }));
                } catch (error) {
                    console.warn(`Error caching image URL for ${museumId}:`, error);
                }
                return data.image;
            }
        } catch (error) {
            console.warn(`Error fetching image URL from KV Store for ${museumId}:`, error);
        }

        return null;
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
