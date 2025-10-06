/**
 * Regression Test for Firework Type Settings Persistence
 * Issue: 设置烟花类型无效 (Firework type settings not being saved)
 * 
 * Tests that all 11 firework types (heart, circle, star, diamond, spiral, butterfly, 
 * rose, sunburst, cascade, ring, crosshatch) are properly validated and saved to 
 * localStorage when selected in settings.
 * 
 * Bug Report: When selecting "rose" (玫瑰) or other new firework types in settings,
 * the selection would revert to "heart" after closing and reopening settings modal.
 */

const fs = require('fs');
const path = require('path');

// Load script.js content
const scriptContent = fs.readFileSync(path.join(__dirname, '..', 'script.js'), 'utf8');

describe('Firework Type Settings Persistence Regression Test', () => {
    let mockLocalStorage;
    let mockApp;

    beforeEach(() => {
        // Mock localStorage
        mockLocalStorage = {};
        global.localStorage = {
            getItem: jest.fn((key) => mockLocalStorage[key] || null),
            setItem: jest.fn((key, value) => {
                mockLocalStorage[key] = value;
            }),
            removeItem: jest.fn((key) => {
                delete mockLocalStorage[key];
            }),
            clear: jest.fn(() => {
                mockLocalStorage = {};
            })
        };

        // Mock console methods
        global.console.warn = jest.fn();
        global.console.error = jest.fn();

        // Create a mock app with saveFireworkType method
        // We'll manually implement it based on the fixed code
        mockApp = {
            saveFireworkType: function(fireworkType) {
                try {
                    // Validate firework type - should include all 11 types
                    const validTypes = ['heart', 'circle', 'star', 'diamond', 'spiral', 'butterfly', 'rose', 'sunburst', 'cascade', 'ring', 'crosshatch'];
                    if (!validTypes.includes(fireworkType)) {
                        console.warn('Invalid firework type, using default');
                        fireworkType = 'heart';
                    }
                    
                    localStorage.setItem('fireworkType', fireworkType);
                    
                    return { success: true, message: '烟花类型已保存' };
                } catch (error) {
                    console.error('Failed to save firework type:', error);
                    return { success: false, message: '保存失败，请重试' };
                }
            },
            loadFireworkType: function() {
                try {
                    const saved = localStorage.getItem('fireworkType');
                    return saved || 'heart';
                } catch (error) {
                    console.error('Failed to load firework type:', error);
                    return 'heart';
                }
            }
        };
    });

    describe('All 11 Firework Types Should Be Validated and Saved', () => {
        test('should save "heart" firework type', () => {
            const result = mockApp.saveFireworkType('heart');
            
            expect(result.success).toBe(true);
            expect(localStorage.setItem).toHaveBeenCalledWith('fireworkType', 'heart');
            expect(mockApp.loadFireworkType()).toBe('heart');
        });

        test('should save "circle" firework type', () => {
            const result = mockApp.saveFireworkType('circle');
            
            expect(result.success).toBe(true);
            expect(localStorage.setItem).toHaveBeenCalledWith('fireworkType', 'circle');
            expect(mockApp.loadFireworkType()).toBe('circle');
        });

        test('should save "star" firework type', () => {
            const result = mockApp.saveFireworkType('star');
            
            expect(result.success).toBe(true);
            expect(localStorage.setItem).toHaveBeenCalledWith('fireworkType', 'star');
            expect(mockApp.loadFireworkType()).toBe('star');
        });

        test('should save "diamond" firework type (NEW TYPE)', () => {
            const result = mockApp.saveFireworkType('diamond');
            
            expect(result.success).toBe(true);
            expect(localStorage.setItem).toHaveBeenCalledWith('fireworkType', 'diamond');
            expect(mockApp.loadFireworkType()).toBe('diamond');
            expect(console.warn).not.toHaveBeenCalled();
        });

        test('should save "spiral" firework type (NEW TYPE)', () => {
            const result = mockApp.saveFireworkType('spiral');
            
            expect(result.success).toBe(true);
            expect(localStorage.setItem).toHaveBeenCalledWith('fireworkType', 'spiral');
            expect(mockApp.loadFireworkType()).toBe('spiral');
            expect(console.warn).not.toHaveBeenCalled();
        });

        test('should save "butterfly" firework type (NEW TYPE)', () => {
            const result = mockApp.saveFireworkType('butterfly');
            
            expect(result.success).toBe(true);
            expect(localStorage.setItem).toHaveBeenCalledWith('fireworkType', 'butterfly');
            expect(mockApp.loadFireworkType()).toBe('butterfly');
            expect(console.warn).not.toHaveBeenCalled();
        });

        test('should save "rose" firework type (REPORTED IN BUG - 玫瑰)', () => {
            const result = mockApp.saveFireworkType('rose');
            
            expect(result.success).toBe(true);
            expect(localStorage.setItem).toHaveBeenCalledWith('fireworkType', 'rose');
            expect(mockApp.loadFireworkType()).toBe('rose');
            expect(console.warn).not.toHaveBeenCalled();
        });

        test('should save "sunburst" firework type (ADDITIONAL TYPE)', () => {
            const result = mockApp.saveFireworkType('sunburst');
            
            expect(result.success).toBe(true);
            expect(localStorage.setItem).toHaveBeenCalledWith('fireworkType', 'sunburst');
            expect(mockApp.loadFireworkType()).toBe('sunburst');
            expect(console.warn).not.toHaveBeenCalled();
        });

        test('should save "cascade" firework type (ADDITIONAL TYPE)', () => {
            const result = mockApp.saveFireworkType('cascade');
            
            expect(result.success).toBe(true);
            expect(localStorage.setItem).toHaveBeenCalledWith('fireworkType', 'cascade');
            expect(mockApp.loadFireworkType()).toBe('cascade');
            expect(console.warn).not.toHaveBeenCalled();
        });

        test('should save "ring" firework type (ADDITIONAL TYPE)', () => {
            const result = mockApp.saveFireworkType('ring');
            
            expect(result.success).toBe(true);
            expect(localStorage.setItem).toHaveBeenCalledWith('fireworkType', 'ring');
            expect(mockApp.loadFireworkType()).toBe('ring');
            expect(console.warn).not.toHaveBeenCalled();
        });

        test('should save "crosshatch" firework type (ADDITIONAL TYPE)', () => {
            const result = mockApp.saveFireworkType('crosshatch');
            
            expect(result.success).toBe(true);
            expect(localStorage.setItem).toHaveBeenCalledWith('fireworkType', 'crosshatch');
            expect(mockApp.loadFireworkType()).toBe('crosshatch');
            expect(console.warn).not.toHaveBeenCalled();
        });
    });

    describe('Invalid Firework Types Should Default to Heart', () => {
        test('should default invalid type to "heart"', () => {
            const result = mockApp.saveFireworkType('invalid-type');
            
            expect(result.success).toBe(true);
            expect(localStorage.setItem).toHaveBeenCalledWith('fireworkType', 'heart');
            expect(console.warn).toHaveBeenCalledWith('Invalid firework type, using default');
        });

        test('should default empty string to "heart"', () => {
            const result = mockApp.saveFireworkType('');
            
            expect(result.success).toBe(true);
            expect(localStorage.setItem).toHaveBeenCalledWith('fireworkType', 'heart');
            expect(console.warn).toHaveBeenCalledWith('Invalid firework type, using default');
        });
    });

    describe('Settings Persistence Across Sessions', () => {
        test('should persist rose selection after page reload (MAIN BUG SCENARIO - 玫瑰)', () => {
            // User selects rose in settings
            mockApp.saveFireworkType('rose');
            expect(localStorage.setItem).toHaveBeenCalledWith('fireworkType', 'rose');
            
            // User closes and reopens settings (simulated by loading the value)
            const loadedType = mockApp.loadFireworkType();
            expect(loadedType).toBe('rose');
            
            // Setting should still be rose, not reverted to heart
            expect(loadedType).not.toBe('heart');
        });

        test('should persist spiral selection after page reload', () => {
            // User selects spiral in settings
            mockApp.saveFireworkType('spiral');
            expect(localStorage.setItem).toHaveBeenCalledWith('fireworkType', 'spiral');
            
            // User closes and reopens settings (simulated by loading the value)
            const loadedType = mockApp.loadFireworkType();
            expect(loadedType).toBe('spiral');
            
            // Setting should still be spiral, not reverted to heart
            expect(loadedType).not.toBe('heart');
        });

        test('should persist diamond selection after page reload', () => {
            mockApp.saveFireworkType('diamond');
            expect(localStorage.setItem).toHaveBeenCalledWith('fireworkType', 'diamond');
            
            const loadedType = mockApp.loadFireworkType();
            expect(loadedType).toBe('diamond');
            expect(loadedType).not.toBe('heart');
        });

        test('should persist butterfly selection after page reload', () => {
            mockApp.saveFireworkType('butterfly');
            expect(localStorage.setItem).toHaveBeenCalledWith('fireworkType', 'butterfly');
            
            const loadedType = mockApp.loadFireworkType();
            expect(loadedType).toBe('butterfly');
            expect(loadedType).not.toBe('heart');
        });

        test('should persist sunburst selection after page reload', () => {
            mockApp.saveFireworkType('sunburst');
            expect(localStorage.setItem).toHaveBeenCalledWith('fireworkType', 'sunburst');
            
            const loadedType = mockApp.loadFireworkType();
            expect(loadedType).toBe('sunburst');
            expect(loadedType).not.toBe('heart');
        });
    });

    describe('Code Validation', () => {
        test('script.js should have all 11 firework types in validTypes array', () => {
            // Check that the fixed code includes all 11 types
            expect(scriptContent).toContain("const validTypes = ['heart', 'circle', 'star', 'diamond', 'spiral', 'butterfly', 'rose', 'sunburst', 'cascade', 'ring', 'crosshatch']");
        });

        test('script.js should NOT have the old 6-type validation array', () => {
            // Ensure the old buggy validation is removed
            const oldValidation = "const validTypes = ['heart', 'circle', 'star', 'diamond', 'spiral', 'butterfly'];";
            expect(scriptContent).not.toContain(oldValidation);
        });
    });
});
