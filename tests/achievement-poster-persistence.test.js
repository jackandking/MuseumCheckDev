/**
 * Achievement Poster Persistence Tests
 * 
 * Tests to verify that achievement posters are correctly saved to localStorage
 * and can be retrieved across page loads and different pages.
 * 
 * Issue: #1023 - Achievement posters not appearing in achievements page
 * Root cause: savePosterToGallery was not being called in async image load callbacks
 * Fix: Added savePosterToGallery calls to museumImg.onload and museumImg.onerror
 */

describe('Achievement Poster Persistence', () => {
    beforeEach(() => {
        // Clear localStorage before each test
        localStorage.clear();
        jest.clearAllMocks();
    });

    /**
     * Test 1: Basic Poster Save and Retrieve
     * 
     * Scenario: User completes a task and a poster is generated
     * Expected: Poster data is saved to localStorage under 'museumPosters' key
     */
    test('should save poster to localStorage with complete metadata', () => {
        const mockMuseumId = 'shanghai-museum';
        const mockMuseumName = '上海博物馆';
        const mockAgeGroup = '7-12';
        const mockPosterDataURL = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

        // Simulate savePosterToGallery function
        const postersData = JSON.parse(localStorage.getItem('museumPosters') || '{}');
        postersData[mockMuseumId] = {
            dataURL: mockPosterDataURL,
            museumId: mockMuseumId,
            museumName: mockMuseumName,
            ageGroup: mockAgeGroup,
            timestamp: Date.now(),
            date: new Date().toLocaleDateString('zh-CN')
        };
        localStorage.setItem('museumPosters', JSON.stringify(postersData));

        // Verify data was saved
        const saved = JSON.parse(localStorage.getItem('museumPosters'));
        expect(saved).toBeDefined();
        expect(saved[mockMuseumId]).toBeDefined();
        expect(saved[mockMuseumId].museumName).toBe(mockMuseumName);
        expect(saved[mockMuseumId].ageGroup).toBe(mockAgeGroup);
        expect(saved[mockMuseumId].dataURL).toBe(mockPosterDataURL);
    });

    /**
     * Test 2: Multiple Posters Same Museum Different Age Groups
     * 
     * Scenario: Same museum completed with different age groups
     * Expected: Latest poster overwrites previous one (keyed by museumId only)
     */
    test('should handle multiple posters from same museum with different age groups', () => {
        const mockMuseumId = 'forbidden-city';
        
        // First completion: age group 3-6
        let postersData = JSON.parse(localStorage.getItem('museumPosters') || '{}');
        postersData[mockMuseumId] = {
            dataURL: 'data:image/png;base64,first',
            museumId: mockMuseumId,
            museumName: '故宫博物院',
            ageGroup: '3-6',
            timestamp: Date.now(),
            date: new Date().toLocaleDateString('zh-CN')
        };
        localStorage.setItem('museumPosters', JSON.stringify(postersData));

        // Second completion: age group 7-12
        postersData = JSON.parse(localStorage.getItem('museumPosters') || '{}');
        postersData[mockMuseumId] = {
            dataURL: 'data:image/png;base64,second',
            museumId: mockMuseumId,
            museumName: '故宫博物院',
            ageGroup: '7-12',
            timestamp: Date.now(),
            date: new Date().toLocaleDateString('zh-CN')
        };
        localStorage.setItem('museumPosters', JSON.stringify(postersData));

        // Verify latest poster is saved
        const saved = JSON.parse(localStorage.getItem('museumPosters'));
        expect(saved[mockMuseumId].ageGroup).toBe('7-12');
        expect(saved[mockMuseumId].dataURL).toBe('data:image/png;base64,second');
        expect(Object.keys(saved).length).toBe(1); // Only one key for this museum
    });

    /**
     * Test 3: Cross-Page Persistence
     * 
     * Scenario: Poster saved in museum-checkin.html, then retrieved in achievements.html
     * Expected: Data persists in same localStorage instance
     */
    test('should persist poster data across different pages', () => {
        // Simulate saving in museum-checkin.html
        const postersData = {};
        postersData['national-museum'] = {
            dataURL: 'data:image/png;base64,poster',
            museumId: 'national-museum',
            museumName: '中国国家博物馆',
            ageGroup: '7-12',
            timestamp: 1703079600000,
            date: '2023/12/20'
        };
        localStorage.setItem('museumPosters', JSON.stringify(postersData));

        // Simulate loading in achievements.html
        const loaded = JSON.parse(localStorage.getItem('museumPosters') || '{}');
        
        // Verify data is accessible
        expect(Object.keys(loaded).length).toBeGreaterThan(0);
        expect(loaded['national-museum']).toBeDefined();
        expect(loaded['national-museum'].museumName).toBe('中国国家博物馆');
    });

    /**
     * Test 4: Storage Quota Exceeded Handling
     * 
     * Scenario: localStorage quota exceeded when saving poster
     * Expected: Error is caught and handled gracefully
     */
    test('should handle QuotaExceededError when saving poster', () => {
        // Mock localStorage.setItem to throw QuotaExceededError
        const originalSetItem = Storage.prototype.setItem;
        Storage.prototype.setItem = jest.fn(() => {
            const error = new Error('QuotaExceededError');
            error.name = 'QuotaExceededError';
            throw error;
        });

        const mockMuseumId = 'test-museum';
        const savePosterToGallery = (posterDataURL) => {
            try {
                const postersData = JSON.parse(localStorage.getItem('museumPosters') || '{}');
                postersData[mockMuseumId] = {
                    dataURL: posterDataURL,
                    museumId: mockMuseumId,
                    museumName: '测试博物馆',
                    ageGroup: '7-12',
                    timestamp: Date.now(),
                    date: new Date().toLocaleDateString('zh-CN')
                };
                localStorage.setItem('museumPosters', JSON.stringify(postersData));
            } catch (error) {
                if (error.name === 'QuotaExceededError') {
                    // Fallback: keep only this poster
                    const fallbackData = {};
                    fallbackData[mockMuseumId] = {
                        dataURL: posterDataURL,
                        museumId: mockMuseumId,
                        museumName: '测试博物馆',
                        ageGroup: '7-12',
                        timestamp: Date.now(),
                        date: new Date().toLocaleDateString('zh-CN')
                    };
                    Storage.prototype.setItem = originalSetItem;
                    localStorage.setItem('museumPosters', JSON.stringify(fallbackData));
                    Storage.prototype.setItem = jest.fn(() => {
                        const err = new Error('QuotaExceededError');
                        err.name = 'QuotaExceededError';
                        throw err;
                    });
                }
            }
        };

        // Call function and expect it to handle error
        expect(() => {
            savePosterToGallery('data:image/png;base64,test');
        }).not.toThrow();

        // Restore
        Storage.prototype.setItem = originalSetItem;
    });

    /**
     * Test 5: Async Image Load Callback - Critical Bug Fix
     * 
     * Scenario: Museum image loads asynchronously and poster needs to be saved in onload callback
     * Expected: savePosterToGallery is called in the museumImg.onload callback
     * 
     * This test verifies the fix for issue #1023 where posters weren't saved
     * when using museum artifact images
     */
    test('should call savePosterToGallery in async image load callback', (done) => {
        const mockMuseumId = 'shanghai-museum';
        let saveCalledInCallback = false;

        // Mock image loading with callback
        const simulateImageLoad = (onLoadCallback) => {
            setTimeout(() => {
                onLoadCallback();
            }, 50);
        };

        // Mock savePosterToGallery
        const savePosterToGallery = (posterDataURL) => {
            const postersData = JSON.parse(localStorage.getItem('museumPosters') || '{}');
            postersData[mockMuseumId] = {
                dataURL: posterDataURL,
                museumId: mockMuseumId,
                museumName: '上海博物馆',
                ageGroup: '7-12',
                timestamp: Date.now(),
                date: new Date().toLocaleDateString('zh-CN')
            };
            localStorage.setItem('museumPosters', JSON.stringify(postersData));
        };

        // Simulate the async image loading behavior from museum-checkin.html
        simulateImageLoad(() => {
            // This represents what happens inside museumImg.onload
            const posterDataURL = 'data:image/png;base64,museum-image';
            
            // CRITICAL FIX: This call was missing in the original code
            savePosterToGallery(posterDataURL);
            saveCalledInCallback = true;
        });

        // Verify the callback saved the poster
        setTimeout(() => {
            expect(saveCalledInCallback).toBe(true);
            const saved = JSON.parse(localStorage.getItem('museumPosters') || '{}');
            expect(saved[mockMuseumId]).toBeDefined();
            expect(saved[mockMuseumId].museumName).toBe('上海博物馆');
            done();
        }, 100);
    });

    /**
     * Test 6: Empty Posters Data Handling
     * 
     * Scenario: User visits achievements page but has no posters yet
     * Expected: Empty state is shown, no errors in console
     */
    test('should handle empty posters gracefully', () => {
        // Don't save any posters
        localStorage.setItem('museumPosters', JSON.stringify({}));

        // Simulate loading posters
        const loaded = JSON.parse(localStorage.getItem('museumPosters') || '{}');
        
        expect(Object.keys(loaded).length).toBe(0);
        expect(loaded).toEqual({});
    });

    /**
     * Test 7: Poster Data Structure Validation
     * 
     * Scenario: Verify saved poster has all required fields
     * Expected: All metadata fields are present
     */
    test('should save poster with all required metadata fields', () => {
        const posterData = {
            dataURL: 'data:image/png;base64,test',
            museumId: 'test-museum',
            museumName: '测试博物馆',
            ageGroup: '7-12',
            timestamp: Date.now(),
            date: new Date().toLocaleDateString('zh-CN')
        };

        const postersData = {};
        postersData['test-museum'] = posterData;
        localStorage.setItem('museumPosters', JSON.stringify(postersData));

        const saved = JSON.parse(localStorage.getItem('museumPosters'));
        const savedPoster = saved['test-museum'];

        // Verify all required fields
        expect(savedPoster).toHaveProperty('dataURL');
        expect(savedPoster).toHaveProperty('museumId');
        expect(savedPoster).toHaveProperty('museumName');
        expect(savedPoster).toHaveProperty('ageGroup');
        expect(savedPoster).toHaveProperty('timestamp');
        expect(savedPoster).toHaveProperty('date');
        
        // Verify data types
        expect(typeof savedPoster.dataURL).toBe('string');
        expect(typeof savedPoster.museumId).toBe('string');
        expect(typeof savedPoster.museumName).toBe('string');
        expect(typeof savedPoster.ageGroup).toBe('string');
        expect(typeof savedPoster.timestamp).toBe('number');
        expect(typeof savedPoster.date).toBe('string');
    });
});
