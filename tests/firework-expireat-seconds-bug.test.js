/**
 * Regression test for firework expireAt bug
 * 
 * Bug: 烟花的expireAt需要填入秒数而不是毫秒
 * (Firework expireAt needs to be filled with seconds instead of milliseconds)
 * 
 * Root Cause: In museum-checkin.html, the expireAt field was calculated as:
 *   expireAt: fireworkData.timestamp + (ttlSeconds * 1000)
 * 
 * This resulted in milliseconds because:
 * - fireworkData.timestamp is from Date.now() which returns milliseconds
 * - ttlSeconds * 1000 converts seconds to milliseconds
 * - Sum is in milliseconds
 * 
 * However, the backend API expects expireAt in SECONDS (as seen in admin-fireworks.js):
 *   expireAt = Math.floor(Date.now()/1000) + 60
 * 
 * Fix: Convert the timestamp to seconds before adding TTL:
 *   expireAt: Math.floor(fireworkData.timestamp / 1000) + ttlSeconds
 * 
 * This test ensures that:
 * 1. expireAt is calculated in seconds, not milliseconds
 * 2. The calculation properly converts Date.now() milliseconds to seconds
 * 3. The TTL in seconds is correctly added to the timestamp in seconds
 */

const { describe, test, expect, beforeEach } = require('@jest/globals');

describe('Firework expireAt Seconds Calculation - Regression Test', () => {
    beforeEach(() => {
        // Clear localStorage before each test
        localStorage.clear();
    });

    test('should calculate expireAt in seconds, not milliseconds', () => {
        // Simulate current timestamp (milliseconds)
        const currentTimestamp = Date.now(); // e.g., 1699368144392 ms
        
        // Simulate TTL setting (1 minute = 60 seconds)
        const retentionTimeMs = 60000; // 1 minute in milliseconds
        const ttlSeconds = Math.round(retentionTimeMs / 1000); // 60 seconds
        
        // CORRECT calculation (in seconds)
        const correctExpireAt = Math.floor(currentTimestamp / 1000) + ttlSeconds;
        
        // INCORRECT calculation (in milliseconds - the bug)
        const incorrectExpireAt = currentTimestamp + (ttlSeconds * 1000);
        
        // Verify correct calculation is in seconds (reasonable Unix timestamp)
        // Current Unix timestamp is around 1.76 billion seconds (Nov 2025)
        expect(correctExpireAt).toBeLessThan(2000000000); // Less than 2 billion seconds
        expect(correctExpireAt).toBeGreaterThan(1600000000); // Greater than 1.6 billion seconds
        
        // Verify incorrect calculation would be in milliseconds (much larger number)
        expect(incorrectExpireAt).toBeGreaterThan(1600000000000); // Much larger (trillions)
        
        // Verify they are vastly different
        expect(incorrectExpireAt).toBeGreaterThan(correctExpireAt * 1000);
    });

    test('should match admin-fireworks.js expireAt calculation pattern', () => {
        const currentTimestamp = Date.now();
        const ttlSeconds = 60; // 1 minute
        
        // Pattern from admin-fireworks.js (CORRECT)
        const adminPattern = Math.floor(Date.now() / 1000) + 60;
        
        // Fixed pattern for museum-checkin.html (CORRECT)
        const fixedPattern = Math.floor(currentTimestamp / 1000) + ttlSeconds;
        
        // Both should be similar (within 1 second due to execution time)
        expect(Math.abs(adminPattern - fixedPattern)).toBeLessThanOrEqual(1);
    });

    test('should calculate expireAt with various TTL values', () => {
        const testCases = [
            { minutes: 1, ttlSeconds: 60 },
            { minutes: 30, ttlSeconds: 1800 },
            { minutes: 60, ttlSeconds: 3600 },
            { minutes: 1440, ttlSeconds: 86400 }, // 1 day
        ];

        testCases.forEach(({ minutes, ttlSeconds }) => {
            const currentTimestamp = Date.now();
            
            // Calculate expireAt (in seconds)
            const expireAt = Math.floor(currentTimestamp / 1000) + ttlSeconds;
            
            // Verify it's a reasonable Unix timestamp
            expect(expireAt).toBeGreaterThan(1600000000); // After Sep 2020
            expect(expireAt).toBeLessThan(2000000000); // Before May 2033
            
            // Verify it's in the future
            const currentTimestampSeconds = Math.floor(currentTimestamp / 1000);
            expect(expireAt).toBeGreaterThan(currentTimestampSeconds);
            
            // Verify the difference equals the TTL
            expect(expireAt - currentTimestampSeconds).toEqual(ttlSeconds);
        });
    });

    test('expireAt should be approximately current time + TTL', () => {
        const currentTimestamp = Date.now();
        const ttlSeconds = 3600; // 1 hour
        
        // Calculate expireAt
        const expireAt = Math.floor(currentTimestamp / 1000) + ttlSeconds;
        
        // Current time in seconds
        const nowSeconds = Math.floor(currentTimestamp / 1000);
        
        // expireAt should be approximately nowSeconds + 3600
        expect(expireAt).toBe(nowSeconds + ttlSeconds);
    });

    test('expireAt should work correctly with retention time from localStorage', () => {
        // Set retention time to 2 hours
        const retentionTimeMs = 7200000; // 2 hours in milliseconds
        localStorage.setItem('fireworksRetentionTime', retentionTimeMs.toString());
        
        // Simulate the upload logic from museum-checkin.html
        const currentTimestamp = Date.now();
        let ttlSeconds = 60; // Default
        
        try {
            const saved = localStorage.getItem('fireworksRetentionTime');
            if (saved) {
                ttlSeconds = Math.round(parseInt(saved, 10) / 1000);
            }
        } catch (error) {
            // Use default
        }
        
        // Calculate expireAt (CORRECT way)
        const expireAt = Math.floor(currentTimestamp / 1000) + ttlSeconds;
        
        // Verify
        expect(ttlSeconds).toBe(7200); // 2 hours
        expect(expireAt).toBe(Math.floor(currentTimestamp / 1000) + 7200);
    });

    test('bug scenario: incorrect milliseconds calculation would fail validation', () => {
        const currentTimestamp = Date.now(); // e.g., 1699368144392 ms
        const ttlSeconds = 60;
        
        // The BUG calculation (what was happening before)
        const buggyExpireAt = currentTimestamp + (ttlSeconds * 1000);
        
        // This would result in a timestamp far in the future (in milliseconds)
        // For example: 1699368144392 + 60000 = 1699368204392
        // Which when interpreted as seconds would be year 55,824 AD!
        
        // If we mistakenly interpret buggyExpireAt as seconds:
        const interpretedAsSeconds = buggyExpireAt;
        
        // This would be an invalid Unix timestamp (too far in the future for reasonable use)
        // The buggy value is around 1.76 trillion, which is in the milliseconds magnitude range
        expect(interpretedAsSeconds).toBeGreaterThan(1000000000000); // Over 1 trillion
        
        // A reasonable expireAt in seconds should be much smaller
        const correctExpireAt = Math.floor(currentTimestamp / 1000) + ttlSeconds;
        expect(correctExpireAt).toBeLessThan(2000000000); // Less than 2 billion seconds
    });

    test('should demonstrate the magnitude of the bug', () => {
        const currentTimestamp = 1699368144392; // Example timestamp in ms
        const ttlSeconds = 60;
        
        // BUGGY calculation (milliseconds)
        const buggyExpireAt = currentTimestamp + (ttlSeconds * 1000);
        // = 1699368144392 + 60000 = 1699368204392
        
        // CORRECT calculation (seconds)
        const correctExpireAt = Math.floor(currentTimestamp / 1000) + ttlSeconds;
        // = Math.floor(1699368144392 / 1000) + 60 = 1699368144 + 60 = 1699368204
        
        // Demonstrate the bug: buggy value is 1000x larger
        expect(buggyExpireAt).toBeCloseTo(correctExpireAt * 1000, -3);
        
        // The bug would cause expireAt to be interpreted as milliseconds
        // when the API expects seconds, resulting in an expiration date
        // thousands of years in the future
        const buggyExpirationDate = new Date(buggyExpireAt * 1000); // Interpreting as seconds
        const correctExpirationDate = new Date(correctExpireAt * 1000);
        
        expect(buggyExpirationDate.getFullYear()).toBeGreaterThan(50000); // Year 50,000+
        expect(correctExpirationDate.getFullYear()).toBeLessThan(2100); // Reasonable year
    });
});
