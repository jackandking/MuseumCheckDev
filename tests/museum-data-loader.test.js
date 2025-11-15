/**
 * Unit tests for Museum Data Loader
 * Tests the 3-tier data management system
 */

const { describe, test, expect, beforeEach } = require('@jest/globals');

// Mock fetch globally
global.fetch = jest.fn();

// Mock localStorage
const localStorageMock = {
    data: {},
    getItem(key) {
        return this.data[key] || null;
    },
    setItem(key, value) {
        this.data[key] = value;
    },
    removeItem(key) {
        delete this.data[key];
    },
    clear() {
        this.data = {};
    }
};
global.localStorage = localStorageMock;

// Mock MUSEUMS array
global.MUSEUMS = [
    {
        id: 'forbidden-city',
        name: '故宫博物院',
        location: '北京',
        description: '世界上现存规模最大、保存最为完整的木质结构古建筑群',
        tags: ['历史', '建筑', '文物']
    },
    {
        id: 'national-museum',
        name: '中国国家博物馆',
        location: '北京',
        description: '综合性历史艺术博物馆',
        tags: ['历史', '文化', '艺术']
    }
];

// Load the module
const { MuseumDataLoader } = require('../museum-data-loader.js');

describe('MuseumDataLoader', () => {
    let loader;

    beforeEach(() => {
        // Reset mocks
        localStorageMock.clear();
        global.fetch.mockClear();
        
        // Create new loader instance
        loader = new MuseumDataLoader();
    });

    describe('Priority Settings', () => {
        test('should use default priority when no settings exist', () => {
            const priority = loader.getPrioritySettings();
            expect(priority).toEqual(['tier1', 'tier2', 'tier3']);
        });

        test('should load priority settings from localStorage', () => {
            localStorage.setItem('museumDataTierPriority', JSON.stringify({
                priority: ['tier2', 'tier1', 'tier3']
            }));
            
            const newLoader = new MuseumDataLoader();
            expect(newLoader.getPrioritySettings()).toEqual(['tier2', 'tier1', 'tier3']);
        });

        test('should update priority settings', () => {
            loader.updatePrioritySettings(['tier3', 'tier2', 'tier1']);
            
            expect(loader.getPrioritySettings()).toEqual(['tier3', 'tier2', 'tier1']);
            
            const saved = JSON.parse(localStorage.getItem('museumDataTierPriority'));
            expect(saved.priority).toEqual(['tier3', 'tier2', 'tier1']);
        });
    });

    describe('Tier 1 Loading (Static Files)', () => {
        test('should load museum from static JSON file', async () => {
            const mockData = {
                id: 'forbidden-city',
                name: '故宫博物院',
                location: '北京'
            };

            global.fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => mockData
            });

            const result = await loader.loadFromTier1('forbidden-city');
            
            expect(fetch).toHaveBeenCalledWith('/museums/forbidden-city.json');
            expect(result).toEqual(mockData);
        });

        test('should return null if file not found', async () => {
            global.fetch.mockResolvedValueOnce({
                ok: false,
                status: 404
            });

            const result = await loader.loadFromTier1('nonexistent');
            expect(result).toBeNull();
        });

        test('should handle fetch errors gracefully', async () => {
            global.fetch.mockRejectedValueOnce(new Error('Network error'));

            const result = await loader.loadFromTier1('forbidden-city');
            expect(result).toBeNull();
        });
    });

    describe('Tier 2 Loading (KV Store)', () => {
        test('should load museum from KV store', async () => {
            const mockData = {
                id: 'forbidden-city',
                name: '故宫博物院',
                location: '北京'
            };

            global.fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    value: JSON.stringify(mockData)
                })
            });

            const result = await loader.loadFromTier2('forbidden-city');
            
            expect(fetch).toHaveBeenCalled();
            expect(result).toEqual(mockData);
        });

        test('should return null if not in KV store', async () => {
            global.fetch.mockResolvedValueOnce({
                ok: false,
                status: 404
            });

            const result = await loader.loadFromTier2('nonexistent');
            expect(result).toBeNull();
        });

        test('should handle invalid JSON in KV store', async () => {
            global.fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    value: 'invalid json'
                })
            });

            const result = await loader.loadFromTier2('forbidden-city');
            expect(result).toBeNull();
        });
    });

    describe('Tier 3 Loading (MUSEUMS Array)', () => {
        test('should load museum from MUSEUMS array', async () => {
            const result = await loader.loadFromTier3('forbidden-city');
            
            expect(result).toBeDefined();
            expect(result.id).toBe('forbidden-city');
            expect(result.name).toBe('故宫博物院');
        });

        test('should return null if museum not in array', async () => {
            const result = await loader.loadFromTier3('nonexistent');
            expect(result).toBeNull();
        });
    });

    describe('Fallback Logic', () => {
        test('should try tiers in priority order', async () => {
            const mockData = { id: 'test', name: 'Test Museum' };
            
            // Tier 1 fails
            global.fetch.mockResolvedValueOnce({
                ok: false,
                status: 404
            });
            
            // Tier 2 succeeds
            global.fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ value: JSON.stringify(mockData) })
            });

            const result = await loader.loadMuseum('test', false);
            
            expect(fetch).toHaveBeenCalledTimes(2);
            expect(result).toEqual(mockData);
        });

        test('should fall back to Tier 3 if 1 and 2 fail', async () => {
            // Tier 1 fails
            global.fetch.mockResolvedValueOnce({
                ok: false,
                status: 404
            });
            
            // Tier 2 fails
            global.fetch.mockResolvedValueOnce({
                ok: false,
                status: 404
            });

            const result = await loader.loadMuseum('forbidden-city', false);
            
            expect(result).toBeDefined();
            expect(result.id).toBe('forbidden-city');
            expect(result.name).toBe('故宫博物院');
        });

        test('should return null if all tiers fail', async () => {
            // Tier 1 fails
            global.fetch.mockResolvedValueOnce({
                ok: false,
                status: 404
            });
            
            // Tier 2 fails
            global.fetch.mockResolvedValueOnce({
                ok: false,
                status: 404
            });

            const result = await loader.loadMuseum('nonexistent', false);
            expect(result).toBeNull();
        });

        test('should respect custom priority order', async () => {
            loader.updatePrioritySettings(['tier3', 'tier2', 'tier1']);
            
            const result = await loader.loadMuseum('forbidden-city', false);
            
            // Should load from Tier 3 first (no fetch calls)
            expect(fetch).not.toHaveBeenCalled();
            expect(result.id).toBe('forbidden-city');
        });
    });

    describe('Caching', () => {
        test('should cache loaded museum data', async () => {
            const mockData = { id: 'test', name: 'Test' };
            
            global.fetch.mockResolvedValue({
                ok: true,
                json: async () => mockData
            });

            // First load
            await loader.loadMuseum('test', false);
            
            // Second load (should use cache)
            const result = await loader.loadMuseum('test', true);
            
            expect(fetch).toHaveBeenCalledTimes(1); // Only once
            expect(result).toEqual(mockData);
        });

        test('should bypass cache when requested', async () => {
            const mockData = { id: 'test', name: 'Test' };
            
            global.fetch.mockResolvedValue({
                ok: true,
                json: async () => mockData
            });

            await loader.loadMuseum('test', false);
            await loader.loadMuseum('test', false); // Don't use cache
            
            expect(fetch).toHaveBeenCalledTimes(2);
        });

        test('should clear cache for specific museum', async () => {
            const mockData = { id: 'test', name: 'Test' };
            
            global.fetch.mockResolvedValue({
                ok: true,
                json: async () => mockData
            });

            await loader.loadMuseum('test', false);
            loader.clearCache('test');
            await loader.loadMuseum('test', true);
            
            expect(fetch).toHaveBeenCalledTimes(2);
        });
    });

    describe('KV Store Operations', () => {
        test('should save museum to KV store', async () => {
            const museumData = {
                id: 'test-museum',
                name: 'Test Museum',
                location: 'Test City'
            };

            global.fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ success: true })
            });

            const result = await loader.saveToKVStore('test-museum', museumData);
            
            expect(result).toBe(true);
            expect(fetch).toHaveBeenCalledWith(
                expect.any(String),
                expect.objectContaining({
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' }
                })
            );
        });

        test('should delete museum from KV store', async () => {
            global.fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ success: true })
            });

            const result = await loader.deleteFromKVStore('test-museum');
            
            expect(result).toBe(true);
            expect(fetch).toHaveBeenCalled();
        });

        test('should handle save errors gracefully', async () => {
            global.fetch.mockRejectedValueOnce(new Error('Network error'));

            const result = await loader.saveToKVStore('test', {});
            expect(result).toBe(false);
        });
    });

    describe('Load All Museums', () => {
        test('should load all museums from Tier 3', async () => {
            const museums = await loader.loadAllMuseums();
            
            expect(museums).toHaveLength(2);
            expect(museums[0].id).toBe('forbidden-city');
            expect(museums[1].id).toBe('national-museum');
        });

        test('should return metadata only', async () => {
            const museums = await loader.loadAllMuseums();
            
            // Should have basic fields
            expect(museums[0]).toHaveProperty('id');
            expect(museums[0]).toHaveProperty('name');
            expect(museums[0]).toHaveProperty('location');
            
            // Should not have full checklist data
            expect(museums[0]).not.toHaveProperty('checklists');
        });

        test('should handle missing MUSEUMS array', async () => {
            const originalMUSEUMS = global.MUSEUMS;
            delete global.MUSEUMS;
            
            const museums = await loader.loadAllMuseums();
            
            expect(museums).toEqual([]);
            
            global.MUSEUMS = originalMUSEUMS;
        });
    });
});
