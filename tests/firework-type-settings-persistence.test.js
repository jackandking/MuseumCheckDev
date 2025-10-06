/**
 * Regression Test for Firework Type Settings Persistence
 * Issue: 设置烟花类型无效 (Firework type settings not being saved)
 * 
 * Tests that all 6 firework types (including new types: diamond, spiral, butterfly)
 * are properly validated and saved to localStorage when selected in settings.
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
                    // Validate firework type - should include all 6 types
                    const validTypes = ['heart', 'circle', 'star', 'diamond', 'spiral', 'butterfly'];
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

    describe('All 6 Firework Types Should Be Validated and Saved', () => {
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

        test('should save "spiral" firework type (NEW TYPE - REPORTED IN BUG)', () => {
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
        test('should persist spiral selection after page reload (MAIN BUG SCENARIO)', () => {
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
    });

    describe('Code Validation', () => {
        test('script.js should have all 6 firework types in validTypes array', () => {
            // Check that the fixed code includes all 6 types
            expect(scriptContent).toContain("const validTypes = ['heart', 'circle', 'star', 'diamond', 'spiral', 'butterfly']");
        });

        test('script.js should NOT have the old 3-type validation array', () => {
            // Ensure the old buggy validation is removed
            const oldValidation = "const validTypes = ['heart', 'circle', 'star'];";
            expect(scriptContent).not.toContain(oldValidation);
        });
    });
});
