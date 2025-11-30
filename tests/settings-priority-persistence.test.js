/**
 * Tests for Settings Priority Persistence Bug Fix
 * 
 * Issue: 设置无效 - Settings were not persisting after page refresh
 * Root Cause: window.museumDataLoader was undefined because const declaration
 *             doesn't automatically add to window object
 * Fix: Explicitly assign museumDataLoader to window object
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

// Mock window object
global.window = global;

// Import MuseumDataLoader
const { MuseumDataLoader, museumDataLoader } = require('../museum-data-loader.js');

describe('Settings Priority Persistence Bug Fix', () => {
    beforeEach(() => {
        localStorage.clear();
    });
    
    afterEach(() => {
        localStorage.clear();
    });
    
    test('window.museumDataLoader should be defined', () => {
        // This is the critical fix - museumDataLoader must be on window object
        expect(typeof window.museumDataLoader).not.toBe('undefined');
        expect(window.museumDataLoader).toBeTruthy();
        expect(window.museumDataLoader instanceof MuseumDataLoader).toBe(true);
    });
    
    test('should save priority to localStorage', () => {
        const priority = ['tier2', 'tier1', 'tier3'];
        localStorage.setItem('museumDataTierPriority', JSON.stringify({ priority }));
        
        const stored = localStorage.getItem('museumDataTierPriority');
        expect(stored).toBeTruthy();
        
        const parsed = JSON.parse(stored);
        expect(parsed.priority).toEqual(priority);
    });
    
    test('should update loader instance when priority changes', () => {
        const newPriority = ['tier2', 'tier1', 'tier3'];
        
        // Simulate settings page save action
        localStorage.setItem('museumDataTierPriority', JSON.stringify({ priority: newPriority }));
        
        // Update loader instance (this is what the fix adds)
        if (window.museumDataLoader && typeof window.museumDataLoader.updatePrioritySettings === 'function') {
            window.museumDataLoader.updatePrioritySettings(newPriority);
        }
        
        // Verify loader instance matches localStorage
        const loaderPriority = window.museumDataLoader.getPrioritySettings();
        expect(loaderPriority).toEqual(newPriority);
    });
    
    test('should load priority from localStorage on page refresh', () => {
        // Save a custom priority
        const customPriority = ['tier3', 'tier1', 'tier2'];
        localStorage.setItem('museumDataTierPriority', JSON.stringify({ priority: customPriority }));
        
        // Simulate page refresh by creating new loader instance
        const newLoader = new MuseumDataLoader();
        
        // Verify the new instance loaded the correct priority
        expect(newLoader.tierPriority).toEqual(customPriority);
    });
    
    test('should persist settings through save/refresh cycle', () => {
        // Step 1: Change priority to dynamic data first
        const dynamicPriority = ['tier2', 'tier1', 'tier3'];
        localStorage.setItem('museumDataTierPriority', JSON.stringify({ priority: dynamicPriority }));
        window.museumDataLoader.updatePrioritySettings(dynamicPriority);
        
        // Step 2: Verify localStorage and loader match
        expect(JSON.parse(localStorage.getItem('museumDataTierPriority')).priority).toEqual(dynamicPriority);
        expect(window.museumDataLoader.getPrioritySettings()).toEqual(dynamicPriority);
        
        // Step 3: Simulate page refresh
        const refreshedLoader = new MuseumDataLoader();
        
        // Step 4: Verify priority persists after refresh
        expect(refreshedLoader.tierPriority).toEqual(dynamicPriority);
        
        // Step 5: Simulate settings page load() function
        const prioritySettings = localStorage.getItem('museumDataTierPriority');
        const parsed = JSON.parse(prioritySettings);
        const priorityValue = parsed.priority.join('-');
        
        // Step 6: Verify the dropdown would show correct value
        expect(priorityValue).toBe('tier2-tier1-tier3');
    });
    
    test('should handle all three priority options', () => {
        const testCases = [
            {
                name: '远程存储优先 (dynamic, new default)',
                priority: ['tier2', 'tier1', 'tier3'],
                value: 'tier2-tier1-tier3'
            },
            {
                name: '静态文件优先 (stable)',
                priority: ['tier1', 'tier2', 'tier3'],
                value: 'tier1-tier2-tier3'
            },
            {
                name: '内置数据优先 (offline)',
                priority: ['tier3', 'tier1', 'tier2'],
                value: 'tier3-tier1-tier2'
            }
        ];
        
        testCases.forEach(({ name, priority, value }) => {
            // Save priority
            localStorage.setItem('museumDataTierPriority', JSON.stringify({ priority }));
            
            // Update loader
            const loader = new MuseumDataLoader();
            
            // Verify
            expect(loader.tierPriority).toEqual(priority);
            expect(loader.getPrioritySettings().join('-')).toBe(value);
        });
    });
    
    test('should clear cache when priority changes', () => {
        // Initial state
        window.museumDataLoader.cache.set('test-museum', { id: 'test', name: 'Test' });
        expect(window.museumDataLoader.cache.size).toBeGreaterThan(0);
        
        // Change priority and clear cache (as settings page does)
        const newPriority = ['tier2', 'tier1', 'tier3'];
        window.museumDataLoader.updatePrioritySettings(newPriority);
        window.museumDataLoader.clearCache();
        
        // Verify cache is cleared
        expect(window.museumDataLoader.cache.size).toBe(0);
    });
});
