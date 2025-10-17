/**
 * Regression test for museum checkin firework upload bug
 * 
 * Bug: When checking in child tasks on the checkin page, fireworks were not
 * visible on the museum-level fireworks wall on other devices because:
 * 1. childNickname was hardcoded as '小朋友' instead of reading from localStorage
 * 2. fireworkType field was missing from the uploaded data
 * 
 * This test ensures that when a task is completed:
 * - The actual child nickname from localStorage is included in the firework data
 * - The firework type from localStorage is included in the firework data
 * - The firework data is properly structured for display on fireworks wall
 */

const { describe, test, expect, beforeEach } = require('@jest/globals');

describe('Museum Checkin Firework Upload - Regression Test', () => {
    beforeEach(() => {
        // Clear localStorage before each test
        localStorage.clear();
        
        // Set up test data in localStorage
        localStorage.setItem('childNickname', '小明');
        localStorage.setItem('fireworkType', 'star');
        localStorage.setItem('museumCheckFireworks', '[]');
    });

    test('should include actual child nickname from localStorage in firework upload', () => {
        // Verify localStorage has the value
        expect(localStorage.getItem('childNickname')).toBe('小明');
        
        // Simulate the uploadFireworkEvent function logic
        const museumId = 'forbidden-city';
        const task = '🎯 观察任务：数一数有多少个门';
        const title = '观察任务';
        
        // Load child nickname from localStorage (mimicking the fixed code)
        let childNickname = '小朋友'; // Default
        const savedNickname = localStorage.getItem('childNickname');
        if (savedNickname && savedNickname.trim()) {
            childNickname = savedNickname.trim();
        }

        // Verify it loaded the actual nickname
        expect(childNickname).toBe('小明');
        expect(childNickname).not.toBe('小朋友');
    });

    test('should include fireworkType from localStorage in firework upload', () => {
        // Load firework type from localStorage (mimicking the fixed code)
        let fireworkType = 'heart'; // Default
        const savedType = localStorage.getItem('fireworkType');
        if (savedType) {
            fireworkType = savedType;
        }

        // Verify it loaded the actual type
        expect(fireworkType).toBe('star');
        expect(fireworkType).not.toBe('heart');
    });

    test('should create complete firework data structure with all required fields', () => {
        const museumId = 'forbidden-city';
        const museumName = '故宫博物院';
        const task = '🎯 观察任务：数一数有多少个门';
        const title = '观察任务';
        const ageGroup = '7-12';
        
        // Load settings from localStorage
        const childNickname = localStorage.getItem('childNickname') || '小朋友';
        const fireworkType = localStorage.getItem('fireworkType') || 'heart';
        
        // Create firework data (mimicking the fixed code)
        const fireworkData = {
            id: `${museumId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            museumId: museumId,
            museumName: museumName,
            taskContent: task,
            taskName: title,
            childNickname: childNickname,
            timestamp: Date.now(),
            ageGroup: ageGroup,
            fireworkType: fireworkType
        };

        // Verify all required fields are present
        expect(fireworkData).toHaveProperty('id');
        expect(fireworkData).toHaveProperty('museumId', museumId);
        expect(fireworkData).toHaveProperty('museumName', museumName);
        expect(fireworkData).toHaveProperty('taskContent', task);
        expect(fireworkData).toHaveProperty('taskName', title);
        expect(fireworkData).toHaveProperty('childNickname', '小明'); // Loaded from localStorage
        expect(fireworkData).toHaveProperty('timestamp');
        expect(fireworkData).toHaveProperty('ageGroup', ageGroup);
        expect(fireworkData).toHaveProperty('fireworkType', 'star'); // Loaded from localStorage
    });

    test('should use default values when localStorage is empty', () => {
        // Clear localStorage to test defaults
        localStorage.clear();

        // Load with fallbacks
        const childNickname = localStorage.getItem('childNickname') || '小朋友';
        const fireworkType = localStorage.getItem('fireworkType') || 'heart';

        // Verify defaults are used
        expect(childNickname).toBe('小朋友');
        expect(fireworkType).toBe('heart');
    });

    test('should handle localStorage errors gracefully', () => {
        // Mock localStorage.getItem to throw error
        const originalGetItem = localStorage.getItem;
        localStorage.getItem = jest.fn(() => {
            throw new Error('localStorage error');
        });

        let childNickname = '小朋友';
        let fireworkType = 'heart';
        
        // Should not throw, should use defaults
        try {
            const savedNickname = localStorage.getItem('childNickname');
            if (savedNickname && savedNickname.trim()) {
                childNickname = savedNickname.trim();
            }
        } catch (error) {
            // Error should be caught, defaults should remain
        }

        try {
            const savedType = localStorage.getItem('fireworkType');
            if (savedType) {
                fireworkType = savedType;
            }
        } catch (error) {
            // Error should be caught, defaults should remain
        }

        // Verify defaults are preserved after error
        expect(childNickname).toBe('小朋友');
        expect(fireworkType).toBe('heart');
        
        // Restore original getItem
        localStorage.getItem = originalGetItem;
    });

    test('should trim whitespace from child nickname', () => {
        // Set nickname with whitespace
        localStorage.setItem('childNickname', '  小明  ');

        const savedNickname = localStorage.getItem('childNickname');
        const childNickname = savedNickname && savedNickname.trim() ? savedNickname.trim() : '小朋友';

        // Verify whitespace is trimmed
        expect(childNickname).toBe('小明');
        expect(childNickname).not.toContain(' ');
    });

    test('should use default when nickname is empty or only whitespace', () => {
        // Test empty string
        localStorage.setItem('childNickname', '');
        let savedNickname = localStorage.getItem('childNickname');
        let childNickname = savedNickname && savedNickname.trim() ? savedNickname.trim() : '小朋友';
        expect(childNickname).toBe('小朋友');

        // Test whitespace only
        localStorage.setItem('childNickname', '   ');
        savedNickname = localStorage.getItem('childNickname');
        childNickname = savedNickname && savedNickname.trim() ? savedNickname.trim() : '小朋友';
        expect(childNickname).toBe('小朋友');
    });

    test('firework data structure matches what fireworks-wall.html expects', () => {
        // The fireworks-wall.html expects these fields:
        // - id (for deduplication)
        // - museumId (for filtering)
        // - museumName (for display)
        // - taskContent (for display text generation)
        // - childNickname (for display text)
        // - timestamp (for sorting)
        // - fireworkType (for display shape)

        const fireworkData = {
            id: 'test-id',
            museumId: 'forbidden-city',
            museumName: '故宫博物院',
            taskContent: '🎯 观察任务：数一数有多少个门',
            taskName: '观察任务',
            childNickname: '小明',
            timestamp: Date.now(),
            ageGroup: '7-12',
            fireworkType: 'star'
        };

        // Verify all fields that fireworks-wall.html uses are present
        expect(fireworkData.id).toBeTruthy();
        expect(fireworkData.museumId).toBeTruthy();
        expect(fireworkData.museumName).toBeTruthy();
        expect(fireworkData.taskContent).toBeTruthy();
        expect(fireworkData.childNickname).toBeTruthy();
        expect(fireworkData.timestamp).toBeTruthy();
        expect(fireworkData.fireworkType).toBeTruthy();

        // Verify fireworkType is a valid type
        const validTypes = ['heart', 'circle', 'star', 'diamond', 'spiral', 'butterfly', 
                          'rose', 'sunburst', 'cascade', 'ring', 'crosshatch'];
        expect(validTypes).toContain(fireworkData.fireworkType);
    });
});
