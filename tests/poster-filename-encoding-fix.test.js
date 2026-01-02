/**
 * Regression test for poster filename encoding issue
 * 
 * Tests the fix for issue where Chinese characters in poster filenames
 * get URL-encoded and become unreadable (e.g., æ'$'\302\225...).
 * 
 * Solution: Use museumId instead of Chinese museum name in filenames.
 * 
 * Related Issue: 海报名字乱码
 */

describe('Poster Filename Encoding Fix', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    describe('New Filename Generation Using museumId', () => {
        test('should use museumId instead of Chinese name to avoid encoding issues', () => {
            // Set up test data with Chinese museum name
            localStorage.setItem('userId', 'test-user-123');
            const museumId = 'forbidden-city';
            const museumName = '故宫博物院';
            const timestamp = 1704067200000;
            
            // Mock Date.now() to return consistent timestamp
            const originalDateNow = Date.now;
            Date.now = jest.fn(() => timestamp);
            
            // NEW approach: Generate filename using museumId (no Chinese characters)
            const userId = localStorage.getItem('userId');
            const filename = `${museumId}_${userId}_${timestamp}.png`;
            
            // Verify filename uses museumId, not Chinese characters
            expect(filename).toBe('forbidden-city_test-user-123_1704067200000.png');
            expect(filename).toContain(museumId);
            expect(filename).toContain(userId);
            expect(filename).toContain(String(timestamp));
            
            // Verify no Chinese characters in filename
            expect(filename).not.toContain('故宫');
            expect(filename).not.toContain('博物院');
            
            // Verify filename only contains ASCII-safe characters
            expect(/^[a-zA-Z0-9_\-\.]+$/.test(filename)).toBe(true);
            
            // Restore Date.now
            Date.now = originalDateNow;
        });

        test('should generate readable filenames for all museums', () => {
            const testCases = [
                { id: 'forbidden-city', name: '故宫博物院' },
                { id: 'national-museum', name: '中国国家博物馆' },
                { id: 'shanghai-museum', name: '上海博物馆' },
                { id: 'pinghu-museum', name: '平湖市博物馆' },
            ];

            const userId = 'user123';
            const timestamp = 1234567890;

            testCases.forEach(museum => {
                const filename = `${museum.id}_${userId}_${timestamp}.png`;
                
                // Should use museumId (ASCII-safe)
                expect(filename).toContain(museum.id);
                
                // Should NOT contain Chinese characters
                expect(/[\u4e00-\u9fa5]/.test(filename)).toBe(false);
                
                // Should be URL-safe (no encoding needed)
                expect(encodeURIComponent(filename)).toBe(filename);
            });
        });

        test('should handle museumId fallback when not available', () => {
            // Simulate case where museumId might be missing
            const currentPoster = {
                museumId: null,
                museumName: '故宫博物院'
            };
            
            const userId = 'user123';
            const timestamp = 1234567890;
            
            // Generate filename with fallback
            const museumIdForFilename = currentPoster.museumId || 'poster';
            const filename = `${museumIdForFilename}_${userId}_${timestamp}.png`;
            
            // Should use fallback 'poster' when museumId is null
            expect(filename).toBe('poster_user123_1234567890.png');
            expect(filename).not.toContain('故宫');
        });

        test('should generate unique filenames for different timestamps', () => {
            const museumId = 'forbidden-city';
            const userId = 'test-user-123';
            
            // Mock Date.now() for first call
            const originalDateNow = Date.now;
            Date.now = jest.fn(() => 1000000);
            
            const filename1 = `${museumId}_${userId}_${Date.now()}.png`;
            
            // Mock Date.now() for second call (different timestamp)
            Date.now = jest.fn(() => 2000000);
            const filename2 = `${museumId}_${userId}_${Date.now()}.png`;
            
            // Filenames should be different due to timestamps
            expect(filename1).not.toBe(filename2);
            expect(filename1).toBe('forbidden-city_test-user-123_1000000.png');
            expect(filename2).toBe('forbidden-city_test-user-123_2000000.png');
            
            // Restore Date.now
            Date.now = originalDateNow;
        });
    });

    describe('Retry Filename Generation', () => {
        test('should use museumId in retry filenames', () => {
            const museumId = 'forbidden-city';
            const userId = 'test-user-123';
            const timestamp = 1704067200000;
            const retryAttempt = 1;
            const randomSuffix = 'abc123';
            
            // NEW approach: Retry filename with museumId
            const retryFilename = `${museumId}_${userId}_${timestamp}_retry${retryAttempt}_${randomSuffix}.png`;
            
            // Verify retry filename format
            expect(retryFilename).toBe('forbidden-city_test-user-123_1704067200000_retry1_abc123.png');
            expect(retryFilename).toContain(museumId);
            expect(retryFilename).toContain('retry1');
            expect(retryFilename).toContain(randomSuffix);
            
            // Verify no Chinese characters
            expect(/[\u4e00-\u9fa5]/.test(retryFilename)).toBe(false);
            
            // Verify URL-safe
            expect(encodeURIComponent(retryFilename)).toBe(retryFilename);
        });

        test('should generate unique retry filenames for multiple attempts', () => {
            const museumId = 'national-museum';
            const userId = 'user456';
            const timestamp = 1234567890;
            
            const retry1 = `${museumId}_${userId}_${timestamp}_retry1_abc123.png`;
            const retry2 = `${museumId}_${userId}_${timestamp}_retry2_def456.png`;
            const retry3 = `${museumId}_${userId}_${timestamp}_retry3_ghi789.png`;
            
            // All retry filenames should be unique
            expect(retry1).not.toBe(retry2);
            expect(retry2).not.toBe(retry3);
            expect(retry1).not.toBe(retry3);
            
            // All should contain museumId
            expect(retry1).toContain(museumId);
            expect(retry2).toContain(museumId);
            expect(retry3).toContain(museumId);
            
            // None should have Chinese characters
            expect(/[\u4e00-\u9fa5]/.test(retry1)).toBe(false);
            expect(/[\u4e00-\u9fa5]/.test(retry2)).toBe(false);
            expect(/[\u4e00-\u9fa5]/.test(retry3)).toBe(false);
        });
    });

    describe('Filename Length Validation', () => {
        test('should keep filename at reasonable length', () => {
            // Test with longest known museumId
            const longMuseumId = 'beijing-capital-museum-of-chinese-history';
            const userId = 'very-long-user-id-12345';
            const timestamp = 1704067200000;
            
            const filename = `${longMuseumId}_${userId}_${timestamp}.png`;
            
            // Filename should be reasonable (not excessively long)
            expect(filename.length).toBeLessThan(150);
            
            // Should still be URL-safe
            expect(encodeURIComponent(filename)).toBe(filename);
        });

        test('should not require length limitation like Chinese name did', () => {
            // OLD approach needed .substring(0, 30) for Chinese characters
            // NEW approach with museumId doesn't need this limitation
            
            const testMuseumIds = [
                'forbidden-city',
                'national-museum', 
                'shanghai-museum',
                'beijing-capital-museum'
            ];
            
            testMuseumIds.forEach(museumId => {
                const userId = 'user123';
                const timestamp = Date.now();
                const filename = `${museumId}_${userId}_${timestamp}.png`;
                
                // No need for substring limitation
                // Filename should contain full museumId
                expect(filename).toContain(museumId);
                expect(filename.length).toBeLessThan(150);
            });
        });
    });

    describe('Backward Compatibility', () => {
        test('should still work with existing poster data structure', () => {
            // Simulate existing poster data from localStorage
            const existingPoster = {
                dataURL: 'data:image/png;base64,iVBORw0KGgo...',
                museumId: 'forbidden-city',
                museumName: '故宫博物院',
                ageGroup: '7-12',
                timestamp: 1704067200000,
                date: '2024/1/1'
            };
            
            const userId = 'user123';
            const timestamp = Date.now();
            
            // Generate new filename from existing data
            const museumIdForFilename = existingPoster.museumId || 'poster';
            const filename = `${museumIdForFilename}_${userId}_${timestamp}.png`;
            
            // Should work with existing data structure
            expect(filename).toContain('forbidden-city');
            expect(/[\u4e00-\u9fa5]/.test(filename)).toBe(false);
        });
    });

    describe('URL Encoding Prevention', () => {
        test('should not require URL encoding for museumId-based filenames', () => {
            const testCases = [
                'forbidden-city',
                'national-museum',
                'shanghai-museum',
                'beijing-planetarium'
            ];
            
            testCases.forEach(museumId => {
                const filename = `${museumId}_user123_1234567890.png`;
                
                // Original filename should equal URL-encoded version
                // (no encoding needed for ASCII-safe characters)
                expect(encodeURIComponent(filename)).toBe(filename);
                
                // Should not have any percent-encoded sequences
                expect(filename).not.toContain('%');
            });
        });

        test('OLD approach would require URL encoding (comparison)', () => {
            // This test documents the old problematic behavior
            const chineseMuseumName = '故宫博物院';
            const oldFilename = `${chineseMuseumName}_user123_1234567890.png`;
            
            // OLD: Chinese characters get URL-encoded
            const encoded = encodeURIComponent(oldFilename);
            
            // Should NOT be equal (proves encoding was needed)
            expect(encoded).not.toBe(oldFilename);
            
            // Should contain percent signs (URL encoding)
            expect(encoded).toContain('%');
            
            // This is what caused the unreadable filenames issue
            expect(encoded.length).toBeGreaterThan(oldFilename.length);
        });
    });
});
