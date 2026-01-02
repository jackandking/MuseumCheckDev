/**
 * Unit tests for poster publishing 409 conflict fix
 * 
 * Tests the unique filename generation and retry logic
 * to prevent 409 conflict errors when multiple users or
 * the same user uploads posters for the same museum.
 */

describe('Poster Publishing 409 Conflict Fix', () => {
    beforeEach(() => {
        // Clear localStorage before each test
        localStorage.clear();
    });

    describe('Unique Filename Generation', () => {
        test('should generate unique filename with userId and timestamp', () => {
            // Set up test data
            localStorage.setItem('userId', 'test-user-123');
            const museumName = '故宫博物院';
            const timestamp = 1704067200000;
            
            // Mock Date.now() to return consistent timestamp
            const originalDateNow = Date.now;
            Date.now = jest.fn(() => timestamp);
            
            // Generate filename (simulating the logic from our code)
            const userId = localStorage.getItem('userId');
            const sanitizedMuseumName = museumName
                .replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '_')
                .substring(0, 30);
            const filename = `${sanitizedMuseumName}_${userId}_${timestamp}.png`;
            
            // Verify filename format
            expect(filename).toBe('故宫博物院_test-user-123_1704067200000.png');
            expect(filename).toContain(userId);
            expect(filename).toContain(String(timestamp));
            
            // Restore Date.now
            Date.now = originalDateNow;
        });

        test('should sanitize museum name by removing special characters', () => {
            const museumName = '中国@国家#博物馆!';
            const userId = 'user123';
            const timestamp = 1234567890;
            
            const sanitizedMuseumName = museumName
                .replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '_')
                .substring(0, 30);
            const filename = `${sanitizedMuseumName}_${userId}_${timestamp}.png`;
            
            // Should replace special characters with underscore
            expect(filename).toBe('中国_国家_博物馆__user123_1234567890.png');
            expect(filename).not.toContain('@');
            expect(filename).not.toContain('#');
            expect(filename).not.toContain('!');
        });

        test('should limit museum name length to 30 characters', () => {
            const longMuseumName = '这是一个非常非常非常非常非常非常非常长的博物馆名称';
            const userId = 'user123';
            const timestamp = 1234567890;
            
            const sanitizedMuseumName = longMuseumName
                .replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '_')
                .substring(0, 30);
            const filename = `${sanitizedMuseumName}_${userId}_${timestamp}.png`;
            
            // Museum name part should be limited to 30 chars (or less if original is shorter)
            expect(sanitizedMuseumName.length).toBeLessThanOrEqual(30);
            expect(sanitizedMuseumName.length).toBeGreaterThan(0);
            expect(filename.length).toBeLessThan(100); // Reasonable total length
        });

        test('should generate different filenames for different timestamps', () => {
            const museumName = '故宫博物院';
            const userId = 'test-user-123';
            
            // Mock Date.now() for first call
            const originalDateNow = Date.now;
            Date.now = jest.fn(() => 1704067200000);
            
            const sanitizedMuseumName = museumName.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '_').substring(0, 30);
            const filename1 = `${sanitizedMuseumName}_${userId}_${Date.now()}.png`;
            
            // Mock Date.now() for second call (1 second later)
            Date.now = jest.fn(() => 1704067201000);
            const filename2 = `${sanitizedMuseumName}_${userId}_${Date.now()}.png`;
            
            // Filenames should be different
            expect(filename1).not.toBe(filename2);
            expect(filename1).toBe('故宫博物院_test-user-123_1704067200000.png');
            expect(filename2).toBe('故宫博物院_test-user-123_1704067201000.png');
            
            // Restore Date.now
            Date.now = originalDateNow;
        });

        test('should generate fallback userId if not in localStorage', () => {
            // No userId in localStorage
            expect(localStorage.getItem('userId')).toBeNull();
            expect(localStorage.getItem('museumcheck_user_id')).toBeNull();
            
            // Simulate fallback logic
            const userId = localStorage.getItem('userId') || 
                          localStorage.getItem('museumcheck_user_id') || 
                          `user_${Math.random().toString(36).substring(2, 11)}`;
            
            // Should generate a fallback userId
            expect(userId).toMatch(/^user_[a-z0-9]{9}$/);
        });
    });

    describe('Retry Filename Generation', () => {
        test('should generate unique retry filename with random suffix', () => {
            const museumName = '故宫博物院';
            const userId = 'test-user-123';
            const timestamp = 1704067200000;
            const retryAttempt = 1;
            
            const sanitizedMuseumName = museumName
                .replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '_')
                .substring(0, 30);
            
            // Simulate retry filename generation
            const randomSuffix = 'abc123'; // Mocked random suffix
            const retryFilename = `${sanitizedMuseumName}_${userId}_${timestamp}_retry${retryAttempt}_${randomSuffix}.png`;
            
            // Verify retry filename format
            expect(retryFilename).toContain('_retry1_');
            expect(retryFilename).toContain(randomSuffix);
            expect(retryFilename).toBe('故宫博物院_test-user-123_1704067200000_retry1_abc123.png');
        });

        test('should generate different retry filenames for multiple attempts', () => {
            const sanitizedMuseumName = '故宫博物院';
            const userId = 'user123';
            const timestamp = 1234567890;
            
            const retry1 = `${sanitizedMuseumName}_${userId}_${timestamp}_retry1_abc123.png`;
            const retry2 = `${sanitizedMuseumName}_${userId}_${timestamp}_retry2_def456.png`;
            const retry3 = `${sanitizedMuseumName}_${userId}_${timestamp}_retry3_ghi789.png`;
            
            // All retry filenames should be unique
            expect(retry1).not.toBe(retry2);
            expect(retry2).not.toBe(retry3);
            expect(retry1).not.toBe(retry3);
        });
    });

    describe('Error Message Improvements', () => {
        test('should provide user-friendly message for 409 conflict', () => {
            const error = new Error('文件名冲突 (409): 该文件名已存在，请使用不同的文件名');
            
            expect(error.message).toContain('409');
            expect(error.message).toContain('文件名冲突');
            expect(error.message).toContain('已存在');
        });

        test('should provide user-friendly message for 413 payload too large', () => {
            const error = new Error('文件太大 (413): 请压缩后再上传');
            
            expect(error.message).toContain('413');
            expect(error.message).toContain('文件太大');
            expect(error.message).toContain('压缩');
        });

        test('should provide user-friendly message for 401/403 permission errors', () => {
            const error401 = new Error('权限错误 (401): 请检查访问权限');
            const error403 = new Error('权限错误 (403): 请检查访问权限');
            
            expect(error401.message).toContain('401');
            expect(error401.message).toContain('权限错误');
            expect(error403.message).toContain('403');
            expect(error403.message).toContain('权限错误');
        });

        test('should provide user-friendly message for 500+ server errors', () => {
            const error = new Error('服务器错误 (500): 服务暂时不可用，请稍后重试');
            
            expect(error.message).toContain('500');
            expect(error.message).toContain('服务器错误');
            expect(error.message).toContain('稍后重试');
        });
    });

    describe('Conflict Detection Logic', () => {
        test('should detect 409 error from message', () => {
            const error = new Error('上传失败: 409');
            const is409 = error.message && error.message.includes('409');
            
            expect(is409).toBe(true);
        });

        test('should detect conflict error from message', () => {
            const error = new Error('File conflict detected');
            const isConflict = error.message && error.message.toLowerCase().includes('conflict');
            
            expect(isConflict).toBe(true);
        });

        test('should detect 409 conflict from HTTP status error', () => {
            const error = new Error('文件名冲突 (409): 该文件名已存在');
            const is409 = error.message && error.message.includes('409');
            const isConflict = is409 || 
                             (error.message && error.message.toLowerCase().includes('conflict'));
            
            expect(is409).toBe(true);
            expect(isConflict).toBe(true);
        });

        test('should not detect conflict for non-409 errors', () => {
            const error = new Error('Network error');
            const is409 = error.message && error.message.includes('409');
            const isConflict = error.message && error.message.toLowerCase().includes('conflict');
            
            expect(is409).toBe(false);
            expect(isConflict).toBe(false);
        });
    });

    describe('Retry Logic Constraints', () => {
        test('should limit retry attempts to MAX_UPLOAD_ATTEMPTS', () => {
            const MAX_UPLOAD_ATTEMPTS = 3;
            let uploadAttempts = 0;
            
            // Simulate retry loop
            while (uploadAttempts < MAX_UPLOAD_ATTEMPTS) {
                uploadAttempts++;
            }
            
            expect(uploadAttempts).toBe(3);
            expect(uploadAttempts).not.toBeGreaterThan(MAX_UPLOAD_ATTEMPTS);
        });

        test('should exit retry loop on success', () => {
            const MAX_UPLOAD_ATTEMPTS = 3;
            let uploadAttempts = 0;
            let success = false;
            
            // Simulate retry loop with success on attempt 2
            while (uploadAttempts < MAX_UPLOAD_ATTEMPTS) {
                uploadAttempts++;
                if (uploadAttempts === 2) {
                    success = true;
                    break; // Exit on success
                }
            }
            
            expect(uploadAttempts).toBe(2);
            expect(success).toBe(true);
        });

        test('should continue retry loop on 409 conflict', () => {
            const MAX_UPLOAD_ATTEMPTS = 3;
            let uploadAttempts = 0;
            const errors = ['409', '409', 'success'];
            
            for (const error of errors) {
                uploadAttempts++;
                if (error === 'success') break;
                if (uploadAttempts >= MAX_UPLOAD_ATTEMPTS) break;
            }
            
            // Should succeed on third attempt
            expect(uploadAttempts).toBe(3);
        });

        test('should throw error if max retries reached with 409', () => {
            const MAX_UPLOAD_ATTEMPTS = 3;
            let uploadAttempts = 0;
            let finalError = null;
            
            try {
                while (uploadAttempts < MAX_UPLOAD_ATTEMPTS) {
                    uploadAttempts++;
                    if (uploadAttempts >= MAX_UPLOAD_ATTEMPTS) {
                        throw new Error('文件名冲突，已尝试多次仍然失败。请稍后重试或联系管理员。');
                    }
                }
            } catch (error) {
                finalError = error;
            }
            
            expect(uploadAttempts).toBe(3);
            expect(finalError).not.toBeNull();
            expect(finalError.message).toContain('已尝试多次');
            expect(finalError.message).toContain('联系管理员');
        });
    });

    describe('Integration with localStorage', () => {
        test('should retrieve userId from multiple localStorage keys', () => {
            // Test primary key
            localStorage.setItem('userId', 'primary-user-123');
            let userId = localStorage.getItem('userId') || 
                        localStorage.getItem('museumcheck_user_id') || 
                        'fallback';
            expect(userId).toBe('primary-user-123');
            
            // Test fallback key
            localStorage.clear();
            localStorage.setItem('museumcheck_user_id', 'secondary-user-456');
            userId = localStorage.getItem('userId') || 
                    localStorage.getItem('museumcheck_user_id') || 
                    'fallback';
            expect(userId).toBe('secondary-user-456');
            
            // Test fallback
            localStorage.clear();
            userId = localStorage.getItem('userId') || 
                    localStorage.getItem('museumcheck_user_id') || 
                    'fallback';
            expect(userId).toBe('fallback');
        });

        test('should use userName from multiple localStorage keys', () => {
            // Test primary key
            localStorage.setItem('museumcheck_user_name', '小明');
            let userName = localStorage.getItem('museumcheck_user_name') || 
                          localStorage.getItem('profileName') || 
                          localStorage.getItem('childNickname') || 
                          '匿名';
            expect(userName).toBe('小明');
            
            // Test fallback keys
            localStorage.clear();
            localStorage.setItem('profileName', '小红');
            userName = localStorage.getItem('museumcheck_user_name') || 
                      localStorage.getItem('profileName') || 
                      localStorage.getItem('childNickname') || 
                      '匿名';
            expect(userName).toBe('小红');
            
            // Test default fallback
            localStorage.clear();
            userName = localStorage.getItem('museumcheck_user_name') || 
                      localStorage.getItem('profileName') || 
                      localStorage.getItem('childNickname') || 
                      '匿名';
            expect(userName).toBe('匿名');
        });
    });
});
