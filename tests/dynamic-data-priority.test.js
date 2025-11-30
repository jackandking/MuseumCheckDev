/**
 * Tests for Dynamic Data Priority Feature
 * 
 * This test suite verifies that the museum data loader correctly respects
 * the user's tier priority settings when loading museum data.
 */

const { describe, test, expect, beforeEach, afterEach } = require('@jest/globals');

// Mock localStorage
const localStorageMock = (() => {
    let store = {};
    return {
        getItem: (key) => store[key] || null,
        setItem: (key, value) => {
            store[key] = value.toString();
        },
        removeItem: (key) => {
            delete store[key];
        },
        clear: () => {
            store = {};
        }
    };
})();

global.localStorage = localStorageMock;

// Mock fetch
global.fetch = jest.fn();

// Import MuseumDataLoader
const { MuseumDataLoader } = require('../museum-data-loader.js');

describe('Dynamic Data Priority Feature', () => {
    let loader;
    
    beforeEach(() => {
        // Clear localStorage before each test
        localStorage.clear();
        
        // Reset fetch mock
        global.fetch.mockClear();
        
        // Create a new loader instance
        loader = new MuseumDataLoader();
    });
    
    afterEach(() => {
        localStorage.clear();
    });
    
    describe('Priority Settings', () => {
        test('should use default priority when no settings exist', () => {
            expect(loader.tierPriority).toEqual(['tier2', 'tier1', 'tier3']);
        });
        
        test('should load custom priority from localStorage', () => {
            const customPriority = ['tier2', 'tier1', 'tier3'];
            localStorage.setItem('museumDataTierPriority', JSON.stringify({ 
                priority: customPriority 
            }));
            
            const newLoader = new MuseumDataLoader();
            expect(newLoader.tierPriority).toEqual(customPriority);
        });
        
        test('should update priority settings', () => {
            const newPriority = ['tier3', 'tier1', 'tier2'];
            loader.updatePrioritySettings(newPriority);
            
            expect(loader.tierPriority).toEqual(newPriority);
            
            const saved = JSON.parse(localStorage.getItem('museumDataTierPriority'));
            expect(saved.priority).toEqual(newPriority);
        });
        
        test('should handle malformed priority settings gracefully', () => {
            localStorage.setItem('museumDataTierPriority', 'invalid json');
            
            const newLoader = new MuseumDataLoader();
            expect(newLoader.tierPriority).toEqual(['tier2', 'tier1', 'tier3']);
        });
    });
    
    describe('Museum Loading with Priority', () => {
        const mockMuseumId = 'beijing-capital-museum';
        const mockTier1Data = {
            id: mockMuseumId,
            name: '首都博物馆',
            image: 'https://tier1.example.com/capital-museum.jpg',
            source: 'tier1'
        };
        const mockTier2Data = {
            id: mockMuseumId,
            name: '首都博物馆',
            image: 'https://tier2.example.com/capital-museum-updated.jpg',
            source: 'tier2'
        };
        const mockTier3Data = {
            id: mockMuseumId,
            name: '首都博物馆',
            image: 'https://tier3.example.com/capital-museum-builtin.jpg',
            source: 'tier3'
        };
        
        beforeEach(() => {
            // Mock global MUSEUMS array for tier3
            global.MUSEUMS = [mockTier3Data];
        });
        
        test('should load from tier1 when priority is tier1-tier2-tier3', async () => {
            loader.updatePrioritySettings(['tier1', 'tier2', 'tier3']);
            
            // Mock tier1 fetch success
            global.fetch.mockImplementationOnce(() => 
                Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve(mockTier1Data)
                })
            );
            
            const result = await loader.loadMuseum(mockMuseumId, false);
            
            expect(result.source).toBe('tier1');
            expect(result.image).toBe(mockTier1Data.image);
        });
        
        test('should load from tier2 when tier1 fails and priority is tier1-tier2-tier3', async () => {
            loader.updatePrioritySettings(['tier1', 'tier2', 'tier3']);
            
            // Mock tier1 fetch failure
            global.fetch.mockImplementationOnce(() => 
                Promise.resolve({ ok: false })
            );
            
            // Mock tier2 fetch success
            global.fetch.mockImplementationOnce(() => 
                Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve({
                        value: JSON.stringify(mockTier2Data)
                    })
                })
            );
            
            const result = await loader.loadMuseum(mockMuseumId, false);
            
            expect(result.source).toBe('tier2');
            expect(result.image).toBe(mockTier2Data.image);
        });
        
        test('should load from tier2 first when priority is tier2-tier1-tier3', async () => {
            loader.updatePrioritySettings(['tier2', 'tier1', 'tier3']);
            
            // Mock tier2 fetch success
            global.fetch.mockImplementationOnce(() => 
                Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve({
                        value: JSON.stringify(mockTier2Data)
                    })
                })
            );
            
            const result = await loader.loadMuseum(mockMuseumId, false);
            
            expect(result.source).toBe('tier2');
            expect(result.image).toBe(mockTier2Data.image);
            
            // Tier1 should not be called
            expect(global.fetch).toHaveBeenCalledTimes(1);
        });
        
        test('should fallback to tier3 when all other tiers fail', async () => {
            loader.updatePrioritySettings(['tier1', 'tier2', 'tier3']);
            
            // Mock tier1 fetch failure
            global.fetch.mockImplementationOnce(() => 
                Promise.resolve({ ok: false })
            );
            
            // Mock tier2 fetch failure
            global.fetch.mockImplementationOnce(() => 
                Promise.resolve({ ok: false })
            );
            
            const result = await loader.loadMuseum(mockMuseumId, false);
            
            expect(result.source).toBe('tier3');
            expect(result.image).toBe(mockTier3Data.image);
        });
        
        test('should use cache when enabled', async () => {
            // With tier2 first, mock KV store format
            // First load (no cache)
            global.fetch.mockImplementationOnce(() => 
                Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve({
                        value: JSON.stringify(mockTier2Data)
                    })
                })
            );
            
            const result1 = await loader.loadMuseum(mockMuseumId, true);
            expect(result1.source).toBe('tier2');
            
            // Second load (should use cache)
            const result2 = await loader.loadMuseum(mockMuseumId, true);
            expect(result2.source).toBe('tier2');
            
            // Fetch should only be called once (first load)
            expect(global.fetch).toHaveBeenCalledTimes(1);
        });
        
        test('should bypass cache when useCache is false', async () => {
            // With tier2 first, mock KV store format
            // First load
            global.fetch.mockImplementationOnce(() => 
                Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve({
                        value: JSON.stringify(mockTier2Data)
                    })
                })
            );
            
            await loader.loadMuseum(mockMuseumId, false);
            
            // Second load with cache disabled
            global.fetch.mockImplementationOnce(() => 
                Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve({
                        value: JSON.stringify(mockTier2Data)
                    })
                })
            );
            
            await loader.loadMuseum(mockMuseumId, false);
            
            // Fetch should be called twice
            expect(global.fetch).toHaveBeenCalledTimes(2);
        });
    });
    
    describe('Cache Management', () => {
        test('should clear specific museum cache', async () => {
            const museumId = 'test-museum';
            
            // With tier2 first, mock KV store format
            // Load and cache a museum
            global.fetch.mockImplementationOnce(() => 
                Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve({
                        value: JSON.stringify({ id: museumId, name: 'Test' })
                    })
                })
            );
            
            await loader.loadMuseum(museumId, true);
            
            // Verify it's cached
            expect(loader.cache.has(museumId)).toBe(true);
            
            // Clear cache for this museum
            loader.clearCache(museumId);
            
            // Verify it's removed
            expect(loader.cache.has(museumId)).toBe(false);
        });
        
        test('should clear all cache', async () => {
            // With tier2 first, mock KV store format
            // Load multiple museums
            global.fetch.mockImplementation(() => 
                Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve({
                        value: JSON.stringify({ id: 'test', name: 'Test' })
                    })
                })
            );
            
            await loader.loadMuseum('museum1', true);
            await loader.loadMuseum('museum2', true);
            
            expect(loader.cache.size).toBe(2);
            
            // Clear all cache
            loader.clearCache();
            
            expect(loader.cache.size).toBe(0);
        });
    });
    
    describe('Settings Page Integration', () => {
        test('should save priority settings from settings page format', () => {
            // Simulate settings page saving priority
            const priorityValue = 'tier2-tier1-tier3';
            const priority = priorityValue.split('-');
            localStorage.setItem('museumDataTierPriority', JSON.stringify({ priority }));
            
            // Create new loader (simulates page reload)
            const newLoader = new MuseumDataLoader();
            
            expect(newLoader.tierPriority).toEqual(['tier2', 'tier1', 'tier3']);
        });
        
        test('should handle offline-first priority', () => {
            const priorityValue = 'tier3-tier1-tier2';
            const priority = priorityValue.split('-');
            localStorage.setItem('museumDataTierPriority', JSON.stringify({ priority }));
            
            const newLoader = new MuseumDataLoader();
            
            expect(newLoader.tierPriority).toEqual(['tier3', 'tier1', 'tier2']);
        });
    });
});
