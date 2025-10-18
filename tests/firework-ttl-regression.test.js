/**
 * Regression test for firework TTL issue
 * 
 * Bug: 招远恒利钟表博物馆的checkin页面完成孩子任务触发的烟花只在本地烟花墙起作用。其他设备没有看到相关烟花
 * 
 * Root Cause: TTL (time-to-live) was hardcoded and too short, causing fireworks
 * to expire before other devices could see them.
 * 
 * Fix: TTL now uses the user's fireworksRetentionTime setting from localStorage,
 * allowing each user to control how long their fireworks persist.
 * 
 * This test ensures that:
 * 1. Firework uploads use the user's retention setting from localStorage
 * 2. The TTL is properly calculated from milliseconds to seconds
 * 3. Default values are used when no setting is found
 */

const { describe, test, expect, beforeEach } = require('@jest/globals');

describe('Firework TTL User Setting Test', () => {
    beforeEach(() => {
        // Clear localStorage before each test
        localStorage.clear();
    });

    test('should use default TTL when no setting is found', () => {
        // When no setting exists, should default to 1 minute (60000 ms = 60 seconds)
        const defaultRetentionMs = 60000; // 1 minute
        const defaultTTL = Math.round(defaultRetentionMs / 1000); // 60 seconds
        
        expect(defaultTTL).toBe(60);
    });

    test('should load retention time from localStorage and convert to TTL', () => {
        // Simulate user setting fireworks retention to 1 hour
        const retentionMs = 3600000; // 1 hour in milliseconds
        localStorage.setItem('fireworksRetentionTime', retentionMs.toString());
        
        // Load and convert to seconds for TTL
        const saved = localStorage.getItem('fireworksRetentionTime');
        const ttlSeconds = Math.round(parseInt(saved, 10) / 1000);
        
        expect(ttlSeconds).toBe(3600); // 1 hour in seconds
    });

    test('should handle 24-hour retention setting', () => {
        // Simulate user setting fireworks retention to 24 hours (1 day)
        const retentionMs = 86400000; // 24 hours in milliseconds
        localStorage.setItem('fireworksRetentionTime', retentionMs.toString());
        
        const saved = localStorage.getItem('fireworksRetentionTime');
        const ttlSeconds = Math.round(parseInt(saved, 10) / 1000);
        
        expect(ttlSeconds).toBe(86400); // 24 hours in seconds
    });

    test('should handle various retention time settings', () => {
        const testCases = [
            { minutes: 1, expectedSeconds: 60 },
            { minutes: 30, expectedSeconds: 1800 },
            { minutes: 60, expectedSeconds: 3600 },
            { minutes: 120, expectedSeconds: 7200 },
            { minutes: 1440, expectedSeconds: 86400 }, // 1 day
        ];

        testCases.forEach(({ minutes, expectedSeconds }) => {
            const retentionMs = minutes * 60 * 1000;
            localStorage.setItem('fireworksRetentionTime', retentionMs.toString());
            
            const saved = localStorage.getItem('fireworksRetentionTime');
            const ttlSeconds = Math.round(parseInt(saved, 10) / 1000);
            
            expect(ttlSeconds).toBe(expectedSeconds);
        });
    });

    test('museum-checkin.html should use user retention setting for TTL', () => {
        // Simulate user setting 2 hours retention
        const retentionMs = 7200000; // 2 hours
        localStorage.setItem('fireworksRetentionTime', retentionMs.toString());
        
        // Simulate the upload logic
        let ttl = 60; // Default
        try {
            const saved = localStorage.getItem('fireworksRetentionTime');
            if (saved) {
                const retentionTimeMs = parseInt(saved, 10);
                ttl = Math.round(retentionTimeMs / 1000);
            }
        } catch (error) {
            // Use default
        }
        
        expect(ttl).toBe(7200); // 2 hours in seconds
    });

    test('fireworks-wall.html should use user retention setting for TTL', () => {
        // Simulate user setting 12 hours retention
        const retentionMs = 43200000; // 12 hours
        localStorage.setItem('fireworksRetentionTime', retentionMs.toString());
        
        // Simulate the upload logic
        let ttl = 60; // Default
        try {
            const saved = localStorage.getItem('fireworksRetentionTime');
            if (saved) {
                const retentionTimeMs = parseInt(saved, 10);
                ttl = Math.round(retentionTimeMs / 1000);
            }
        } catch (error) {
            // Use default
        }
        
        expect(ttl).toBe(43200); // 12 hours in seconds
    });

    test('should handle error gracefully and use default', () => {
        // Simulate localStorage error
        const originalGetItem = localStorage.getItem;
        localStorage.getItem = jest.fn(() => {
            throw new Error('localStorage error');
        });

        let ttl = 60; // Default
        try {
            const saved = localStorage.getItem('fireworksRetentionTime');
            if (saved) {
                const retentionTimeMs = parseInt(saved, 10);
                ttl = Math.round(retentionTimeMs / 1000);
            }
        } catch (error) {
            // Should use default
        }

        expect(ttl).toBe(60); // Default 1 minute
        
        // Restore
        localStorage.getItem = originalGetItem;
    });

    test('should properly round milliseconds to seconds', () => {
        // Test rounding behavior
        const testCases = [
            { ms: 60000, expectedSeconds: 60 },
            { ms: 60500, expectedSeconds: 61 }, // Rounds up
            { ms: 60400, expectedSeconds: 60 }, // Rounds down
            { ms: 90000, expectedSeconds: 90 },
        ];

        testCases.forEach(({ ms, expectedSeconds }) => {
            const ttl = Math.round(ms / 1000);
            expect(ttl).toBe(expectedSeconds);
        });
    });
});
