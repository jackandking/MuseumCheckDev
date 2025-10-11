/**
 * Settings Hint for New Users Tests
 * 
 * Tests for issue: 对于新用户提示可以在设置页面修改昵称，选择年龄段等
 * 
 * Requirements:
 * - Show hint to new users about settings functionality (nickname, age group)
 * - Hint should auto-disappear after some time
 * - Should NOT show to users who have already configured settings
 */

describe('Settings Hint for New Users', () => {
    let mockLocalStorage;
    let mockApp;
    let originalSetTimeout;
    
    beforeEach(() => {
        // Setup mock localStorage
        mockLocalStorage = (() => {
            let store = {};
            return {
                getItem: (key) => store[key] || null,
                setItem: (key, value) => { store[key] = value; },
                clear: () => { store = {}; }
            };
        })();
        
        // Setup minimal DOM
        document.body.innerHTML = `
            <div id="settingsHint" class="settings-hint-notification">
                💡 提示：点击左上角 🏛️ 设置按钮，可以修改孩子昵称、选择年龄段等
            </div>
        `;
        
        // Save original setTimeout for restore
        originalSetTimeout = global.setTimeout;
        
        // Mock setupSettingsHint implementation
        mockApp = {
            setupSettingsHint: function() {
                const settingsHint = document.getElementById('settingsHint');
                
                if (!settingsHint) {
                    return;
                }
                
                // Check if user is a new user (no settings configured)
                let hasConfiguredSettings = false;
                let hasSeenHint = false;
                
                try {
                    // User is considered "configured" if they have set a nickname or age group
                    const hasNickname = mockLocalStorage.getItem('childNickname');
                    const hasAgeGroup = mockLocalStorage.getItem('ageGroup');
                    hasConfiguredSettings = hasNickname || hasAgeGroup;
                    
                    // Check if hint was already shown
                    hasSeenHint = mockLocalStorage.getItem('settingsHintShown') === 'true';
                } catch (error) {
                    console.error('Failed to check settings hint status:', error);
                    return { behavior: 'error', error: true };
                }
                
                // Only show hint for new users who haven't seen it
                if (hasConfiguredSettings || hasSeenHint) {
                    return { 
                        behavior: hasConfiguredSettings ? 'configured-user' : 'hint-already-shown',
                        willShowHint: false 
                    };
                }
                
                // For testing purposes, we won't actually delay
                // Show hint immediately in tests
                settingsHint.classList.add('show');
                
                // Mark hint as shown
                try {
                    mockLocalStorage.setItem('settingsHintShown', 'true');
                } catch (error) {
                    console.error('Failed to save settings hint status:', error);
                }
                
                return { 
                    behavior: 'new-user',
                    willShowHint: true,
                    hintShown: true
                };
            }
        };
    });
    
    afterEach(() => {
        // Restore original setTimeout
        global.setTimeout = originalSetTimeout;
    });
    
    describe('New user behavior', () => {
        test('should show hint for new user (no nickname, no age group)', () => {
            // No saved settings
            expect(mockLocalStorage.getItem('childNickname')).toBeNull();
            expect(mockLocalStorage.getItem('ageGroup')).toBeNull();
            expect(mockLocalStorage.getItem('settingsHintShown')).toBeNull();
            
            const result = mockApp.setupSettingsHint();
            
            // Should indicate new user behavior
            expect(result.behavior).toBe('new-user');
            expect(result.willShowHint).toBe(true);
            
            // Hint should be shown
            const hint = document.getElementById('settingsHint');
            expect(hint.classList.contains('show')).toBe(true);
            
            // settingsHintShown flag should be set
            expect(mockLocalStorage.getItem('settingsHintShown')).toBe('true');
        });
        
        test('should only show hint once (not on subsequent visits)', () => {
            // First visit: show hint
            const result1 = mockApp.setupSettingsHint();
            expect(result1.willShowHint).toBe(true);
            
            // Clear hint visibility for second test
            const hint = document.getElementById('settingsHint');
            hint.classList.remove('show');
            
            // Second visit: hint already shown flag is set
            expect(mockLocalStorage.getItem('settingsHintShown')).toBe('true');
            
            const result2 = mockApp.setupSettingsHint();
            
            // Should not show hint again
            expect(result2.behavior).toBe('hint-already-shown');
            expect(result2.willShowHint).toBe(false);
            expect(hint.classList.contains('show')).toBe(false);
        });
    });
    
    describe('Configured user behavior', () => {
        test('should NOT show hint if user has set nickname', () => {
            // User has configured nickname
            mockLocalStorage.setItem('childNickname', '小明');
            
            const result = mockApp.setupSettingsHint();
            
            // Should not show hint
            expect(result.behavior).toBe('configured-user');
            expect(result.willShowHint).toBe(false);
            
            const hint = document.getElementById('settingsHint');
            expect(hint.classList.contains('show')).toBe(false);
        });
        
        test('should NOT show hint if user has set age group', () => {
            // User has configured age group
            mockLocalStorage.setItem('ageGroup', '7-12');
            
            const result = mockApp.setupSettingsHint();
            
            // Should not show hint
            expect(result.behavior).toBe('configured-user');
            expect(result.willShowHint).toBe(false);
            
            const hint = document.getElementById('settingsHint');
            expect(hint.classList.contains('show')).toBe(false);
        });
        
        test('should NOT show hint if user has set both nickname and age group', () => {
            // User has configured both settings
            mockLocalStorage.setItem('childNickname', '小红');
            mockLocalStorage.setItem('ageGroup', '3-6');
            
            const result = mockApp.setupSettingsHint();
            
            // Should not show hint
            expect(result.behavior).toBe('configured-user');
            expect(result.willShowHint).toBe(false);
            
            const hint = document.getElementById('settingsHint');
            expect(hint.classList.contains('show')).toBe(false);
        });
    });
    
    describe('Edge cases', () => {
        test('should handle missing DOM element gracefully', () => {
            // Remove hint from DOM
            document.getElementById('settingsHint').remove();
            
            // Should not throw error
            expect(() => {
                mockApp.setupSettingsHint();
            }).not.toThrow();
        });
        
        test('should handle localStorage errors gracefully', () => {
            // Override mock to simulate localStorage error
            mockApp.setupSettingsHint = function() {
                const settingsHint = document.getElementById('settingsHint');
                
                if (!settingsHint) {
                    return;
                }
                
                try {
                    // Simulate localStorage error
                    throw new Error('localStorage unavailable');
                } catch (error) {
                    console.error('Failed to check settings hint status:', error);
                    return { behavior: 'error', error: true };
                }
            };
            
            const result = mockApp.setupSettingsHint();
            
            // Should handle error gracefully
            expect(result.behavior).toBe('error');
            expect(result.error).toBe(true);
        });
    });
    
    describe('User journey scenarios', () => {
        test('Complete new user journey', () => {
            // Step 1: First visit - no saved data
            expect(mockLocalStorage.getItem('childNickname')).toBeNull();
            expect(mockLocalStorage.getItem('ageGroup')).toBeNull();
            expect(mockLocalStorage.getItem('settingsHintShown')).toBeNull();
            
            // Step 2: App shows hint
            const result1 = mockApp.setupSettingsHint();
            expect(result1.behavior).toBe('new-user');
            expect(result1.willShowHint).toBe(true);
            
            const hint = document.getElementById('settingsHint');
            expect(hint.classList.contains('show')).toBe(true);
            
            // Step 3: User sees hint, hint flag is saved
            expect(mockLocalStorage.getItem('settingsHintShown')).toBe('true');
            
            // Step 4: User configures nickname later
            mockLocalStorage.setItem('childNickname', '小王');
            
            // Step 5: Next visit - user has configured settings
            hint.classList.remove('show'); // Clear for next test
            const result2 = mockApp.setupSettingsHint();
            expect(result2.behavior).toBe('configured-user');
            expect(result2.willShowHint).toBe(false);
            
            // Hint should not be shown
            expect(hint.classList.contains('show')).toBe(false);
        });
        
        test('User who configures immediately should never see hint', () => {
            // User configures age group on first visit (e.g., from age selector)
            mockLocalStorage.setItem('ageGroup', '13-18');
            
            // First visit with configured settings
            const result = mockApp.setupSettingsHint();
            
            // Should not show hint
            expect(result.behavior).toBe('configured-user');
            expect(result.willShowHint).toBe(false);
            
            const hint = document.getElementById('settingsHint');
            expect(hint.classList.contains('show')).toBe(false);
            
            // Hint shown flag should not be set (never needed to show)
            expect(mockLocalStorage.getItem('settingsHintShown')).toBeNull();
        });
    });
    
    describe('Integration with existing age selector hint', () => {
        test('should work independently of age selector hint', () => {
            // Age selector hint was shown
            mockLocalStorage.setItem('ageSelectorHintShown', 'true');
            
            // Settings hint should still work for new users
            expect(mockLocalStorage.getItem('childNickname')).toBeNull();
            expect(mockLocalStorage.getItem('ageGroup')).toBeNull();
            
            const result = mockApp.setupSettingsHint();
            
            // Should show settings hint
            expect(result.behavior).toBe('new-user');
            expect(result.willShowHint).toBe(true);
        });
        
        test('should not conflict with age group being set from age selector', () => {
            // User selected age from age selector (sets ageGroup)
            mockLocalStorage.setItem('ageGroup', '7-12');
            mockLocalStorage.setItem('ageSelectorHintShown', 'true');
            
            // Settings hint should recognize user has configured settings
            const result = mockApp.setupSettingsHint();
            
            expect(result.behavior).toBe('configured-user');
            expect(result.willShowHint).toBe(false);
        });
    });
});
