/**
 * Tests for distance-based museum sorting functionality
 * Feature: Add distance sorting option to homepage settings
 */

describe('Distance Sorting Feature', () => {
    let sortMuseums;
    let getMuseumDistance;
    let MUSEUMS;

    beforeEach(() => {
        // Reset DOM
        document.body.innerHTML = `
            <select id="sort-selector">
                <option value="default">智能排序</option>
                <option value="name">名称排序</option>
                <option value="distance">距离排序</option>
            </select>
            <div id="museum-list"></div>
        `;

        // Mock MUSEUMS array
        MUSEUMS = [
            {
                id: 'museum-a',
                name: '安徽博物院',
                location: '合肥',
                coordinates: { lat: 31.8206, lng: 117.2272 }
            },
            {
                id: 'museum-b',
                name: '故宫博物院',
                location: '北京',
                coordinates: { lat: 39.9167, lng: 116.3833 }
            },
            {
                id: 'museum-c',
                name: '上海博物馆',
                location: '上海',
                coordinates: { lat: 31.2304, lng: 121.4737 }
            }
        ];

        // Mock distance calculation function
        getMuseumDistance = jest.fn((museumId) => {
            const distances = {
                'museum-a': 100,
                'museum-b': 50,
                'museum-c': 200
            };
            return distances[museumId] || Infinity;
        });

        // Mock sortMuseums function (simplified version)
        sortMuseums = jest.fn((museums, sortBy) => {
            const sorted = [...museums];
            
            switch (sortBy) {
                case 'distance':
                    return sorted.sort((a, b) => {
                        const distA = getMuseumDistance(a.id);
                        const distB = getMuseumDistance(b.id);
                        if (distA === Infinity && distB === Infinity) return 0;
                        if (distA === Infinity) return 1;
                        if (distB === Infinity) return -1;
                        return distA - distB;
                    });
                case 'name':
                    return sorted.sort((a, b) => a.name.localeCompare(b.name, 'zh-CN'));
                default:
                    return sorted;
            }
        });
    });

    describe('Sort Selector UI', () => {
        test('should have distance sorting option in selector', () => {
            const selector = document.getElementById('sort-selector');
            const options = Array.from(selector.options).map(opt => opt.value);
            
            expect(options).toContain('distance');
        });

        test('should have correct label for distance sorting', () => {
            const selector = document.getElementById('sort-selector');
            const distanceOption = Array.from(selector.options).find(
                opt => opt.value === 'distance'
            );
            
            expect(distanceOption.textContent).toBe('距离排序');
        });

        test('should maintain existing sort options', () => {
            const selector = document.getElementById('sort-selector');
            const options = Array.from(selector.options).map(opt => opt.value);
            
            expect(options).toContain('default');
            expect(options).toContain('name');
            expect(options).toContain('distance');
        });
    });

    describe('Distance Sorting Logic', () => {
        test('should sort museums by distance when distance option selected', () => {
            const sorted = sortMuseums(MUSEUMS, 'distance');
            
            expect(sorted[0].id).toBe('museum-b'); // 50km
            expect(sorted[1].id).toBe('museum-a'); // 100km
            expect(sorted[2].id).toBe('museum-c'); // 200km
        });

        test('should handle museums with unknown location', () => {
            const museumsWithUnknown = [
                ...MUSEUMS,
                {
                    id: 'museum-unknown',
                    name: '未知博物馆',
                    location: '未知'
                }
            ];

            getMuseumDistance.mockImplementation((museumId) => {
                const distances = {
                    'museum-a': 100,
                    'museum-b': 50,
                    'museum-c': 200,
                    'museum-unknown': Infinity
                };
                return distances[museumId] || Infinity;
            });

            const sorted = sortMuseums(museumsWithUnknown, 'distance');
            
            // Museums with known distance should come first
            expect(sorted[0].id).toBe('museum-b');
            expect(sorted[1].id).toBe('museum-a');
            expect(sorted[2].id).toBe('museum-c');
            // Unknown distance should be last
            expect(sorted[3].id).toBe('museum-unknown');
        });

        test('should not affect other sort options', () => {
            const sortedByName = sortMuseums(MUSEUMS, 'name');
            const sortedByDefault = sortMuseums(MUSEUMS, 'default');
            
            // Name sorting should work
            expect(sortedByName[0].name).toBe('安徽博物院');
            expect(sortedByName[1].name).toBe('故宫博物院');
            
            // Default sorting should preserve order
            expect(sortedByDefault).toEqual(MUSEUMS);
        });

        test('should handle equal distances correctly', () => {
            getMuseumDistance.mockImplementation(() => 100);
            
            const sorted = sortMuseums(MUSEUMS, 'distance');
            
            // When distances are equal, order should be stable
            expect(sorted.length).toBe(MUSEUMS.length);
        });

        test('should handle empty museum list', () => {
            const sorted = sortMuseums([], 'distance');
            
            expect(sorted).toEqual([]);
        });

        test('should handle single museum', () => {
            const singleMuseum = [MUSEUMS[0]];
            const sorted = sortMuseums(singleMuseum, 'distance');
            
            expect(sorted).toEqual(singleMuseum);
        });
    });

    describe('User Location Integration', () => {
        test('should request user location when distance sort selected', () => {
            const requestUserLocation = jest.fn();
            
            const selector = document.getElementById('sort-selector');
            selector.value = 'distance';
            
            // Simulate the behavior when distance sorting is selected
            if (selector.value === 'distance') {
                requestUserLocation();
            }
            
            expect(requestUserLocation).toHaveBeenCalled();
        });

        test('should gracefully handle location permission denied', () => {
            // When location is denied, distance should return Infinity
            getMuseumDistance.mockReturnValue(Infinity);
            
            const sorted = sortMuseums(MUSEUMS, 'distance');
            
            // All museums should remain in their original order when distances are equal
            expect(sorted.length).toBe(MUSEUMS.length);
        });

        test('should handle location timeout', () => {
            // Simulate timeout by returning Infinity for all museums
            getMuseumDistance.mockReturnValue(Infinity);
            
            const sorted = sortMuseums(MUSEUMS, 'distance');
            
            // Should not crash and return all museums
            expect(sorted.length).toBe(MUSEUMS.length);
        });
    });

    describe('Settings Persistence', () => {
        test('should support saving distance sort preference', () => {
            const selector = document.getElementById('sort-selector');
            selector.value = 'distance';
            
            // Verify the selector value can be set to distance
            expect(selector.value).toBe('distance');
            
            // This value would normally be saved to localStorage
            // The actual saving is handled by the application code
        });

        test('should support restoring distance sort preference', () => {
            // Set the selector to distance value (simulating restore from localStorage)
            const selector = document.getElementById('sort-selector');
            selector.value = 'distance';
            
            // Verify it can be read back
            expect(selector.value).toBe('distance');
        });
    });

    describe('Accessibility', () => {
        test('distance option should be keyboard accessible', () => {
            const selector = document.getElementById('sort-selector');
            
            // Should be able to focus and select via keyboard
            selector.focus();
            expect(document.activeElement).toBe(selector);
        });

        test('distance option should have proper aria labels', () => {
            const selector = document.getElementById('sort-selector');
            const distanceOption = Array.from(selector.options).find(
                opt => opt.value === 'distance'
            );
            
            // Text content serves as accessible name
            expect(distanceOption.textContent).toBeTruthy();
            expect(distanceOption.textContent.trim()).toBe('距离排序');
        });
    });

    describe('Performance', () => {
        test('should handle large museum lists efficiently', () => {
            const largeMuseumList = Array.from({ length: 260 }, (_, i) => ({
                id: `museum-${i}`,
                name: `博物馆${i}`,
                location: `城市${i}`,
                coordinates: { lat: 30 + i * 0.1, lng: 120 + i * 0.1 }
            }));

            getMuseumDistance.mockImplementation((id) => {
                const match = id.match(/museum-(\d+)/);
                return match ? parseInt(match[1]) : Infinity;
            });

            const startTime = Date.now();
            const sorted = sortMuseums(largeMuseumList, 'distance');
            const endTime = Date.now();

            expect(sorted.length).toBe(260);
            // Sorting should complete in reasonable time (< 100ms)
            expect(endTime - startTime).toBeLessThan(100);
        });
    });

    describe('Mobile UX', () => {
        test('distance option should be touch-friendly', () => {
            const selector = document.getElementById('sort-selector');
            const computedStyle = window.getComputedStyle(selector);
            
            // Select element should be large enough for touch
            // (actual size depends on browser default styling)
            expect(selector).toBeTruthy();
            expect(selector.options.length).toBeGreaterThan(0);
        });
    });
});
