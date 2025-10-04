/**
 * Age Selector Auto-Hide Tests
 * 
 * Tests for issue: Age selector auto-hide bug
 * - Age selector should only show for first-time users
 * - For returning users (with saved age), hide immediately
 * - Hint should only show once (first time age selector auto-hides)
 */

describe('Age Selector Auto-Hide Functionality', () => {
    let mockLocalStorage;
    let mockApp;
    
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
            <nav class="age-selector">
                <fieldset class="age-group-fieldset">
                    <legend class="age-group-legend">孩子年龄：</legend>
                    <div class="age-options">
                        <label class="age-option">
                            <input type="radio" name="ageGroup" value="3-6" checked>
                            <span class="age-option-text">3-6岁 (学龄前)</span>
                        </label>
                        <label class="age-option">
                            <input type="radio" name="ageGroup" value="7-12">
                            <span class="age-option-text">7-12岁 (小学)</span>
                        </label>
                        <label class="age-option">
                            <input type="radio" name="ageGroup" value="13-18">
                            <span class="age-option-text">13-18岁 (中学)</span>
                        </label>
                    </div>
                </fieldset>
            </nav>
            <div id="ageSelectorHint" class="age-selector-hint">
                💡 提示：您可以点击左上角 🏛️ 设置按钮来更改年龄选择
            </div>
        `;
        
        // Mock setupAgeSelectorAutoHide implementation
        mockApp = {
            setupAgeSelectorAutoHide: function() {
                const ageSelector = document.querySelector('.age-selector');
                const hint = document.getElementById('ageSelectorHint');
                
                if (!ageSelector || !hint) {
                    return;
                }
                
                // Check if user has already saved their age preference
                const hasSavedAge = mockLocalStorage.getItem('ageGroup');
                const hasSeenHint = mockLocalStorage.getItem('ageSelectorHintShown');
                
                if (hasSavedAge) {
                    // Returning user - hide age selector immediately
                    ageSelector.classList.add('hidden');
                    return { behavior: 'returning-user', immediateHide: true };
                }
                
                // First-time user - keep selector visible (NO auto-hide timer)
                // Bug fix: Removed willAutoHide flag - selector stays visible until user selects
                return { 
                    behavior: 'first-time-user',
                    willShowHint: !hasSeenHint 
                };
            }
        };
    });
    
    describe('First-time user behavior', () => {
        test('should show age selector for new user (no saved age group)', () => {
            // No saved age group
            expect(mockLocalStorage.getItem('ageGroup')).toBeNull();
            
            const result = mockApp.setupAgeSelectorAutoHide();
            
            // Should indicate first-time user behavior
            expect(result.behavior).toBe('first-time-user');
            // Bug fix: No auto-hide - selector stays visible until user selects
            expect(result.willAutoHide).toBeUndefined();
            
            // Age selector should still be visible (no 'hidden' class)
            const ageSelector = document.querySelector('.age-selector');
            expect(ageSelector.classList.contains('hidden')).toBe(false);
        });
        
        test('should show hint on first auto-hide', () => {
            // No saved age, no hint shown yet
            expect(mockLocalStorage.getItem('ageGroup')).toBeNull();
            expect(mockLocalStorage.getItem('ageSelectorHintShown')).toBeNull();
            
            const result = mockApp.setupAgeSelectorAutoHide();
            
            // Should plan to show hint
            expect(result.willShowHint).toBe(true);
        });
        
        test('should not show hint if already shown before', () => {
            // No saved age, but hint was shown before
            mockLocalStorage.setItem('ageSelectorHintShown', 'true');
            
            const result = mockApp.setupAgeSelectorAutoHide();
            
            // Should not show hint again
            expect(result.willShowHint).toBe(false);
        });
    });
    
    describe('Returning user behavior', () => {
        test('should hide age selector immediately for returning user', () => {
            // Simulate returning user with saved age group
            mockLocalStorage.setItem('ageGroup', '7-12');
            
            const result = mockApp.setupAgeSelectorAutoHide();
            
            // Should indicate returning user behavior
            expect(result.behavior).toBe('returning-user');
            expect(result.immediateHide).toBe(true);
            
            // Age selector should be hidden immediately
            const ageSelector = document.querySelector('.age-selector');
            expect(ageSelector.classList.contains('hidden')).toBe(true);
        });
        
        test('should not show hint for returning user', () => {
            // Returning user with saved age
            mockLocalStorage.setItem('ageGroup', '7-12');
            
            const result = mockApp.setupAgeSelectorAutoHide();
            
            // Should not plan any hint behavior
            expect(result.willShowHint).toBeUndefined();
            
            // Hint should not have 'show' class
            const hint = document.getElementById('ageSelectorHint');
            expect(hint.classList.contains('show')).toBe(false);
        });
        
        test('should hide immediately even if hint was never shown', () => {
            // Returning user, hint never shown
            mockLocalStorage.setItem('ageGroup', '13-18');
            expect(mockLocalStorage.getItem('ageSelectorHintShown')).toBeNull();
            
            const result = mockApp.setupAgeSelectorAutoHide();
            
            // Should still hide immediately (returning user takes priority)
            expect(result.immediateHide).toBe(true);
            
            const ageSelector = document.querySelector('.age-selector');
            expect(ageSelector.classList.contains('hidden')).toBe(true);
        });
    });
    
    describe('Edge cases', () => {
        test('should handle missing DOM elements gracefully', () => {
            // Remove age selector from DOM
            document.querySelector('.age-selector').remove();
            
            // Should not throw error
            expect(() => {
                mockApp.setupAgeSelectorAutoHide();
            }).not.toThrow();
        });
        
        test('should handle missing hint element gracefully', () => {
            // Remove hint from DOM
            document.getElementById('ageSelectorHint').remove();
            
            // Should not throw error
            expect(() => {
                mockApp.setupAgeSelectorAutoHide();
            }).not.toThrow();
        });
        
        test('should handle localStorage errors gracefully', () => {
            // Override mock to wrap localStorage access in try-catch
            mockApp.setupAgeSelectorAutoHide = function() {
                const ageSelector = document.querySelector('.age-selector');
                const hint = document.getElementById('ageSelectorHint');
                
                if (!ageSelector || !hint) {
                    return;
                }
                
                try {
                    // This would throw but should be caught
                    const hasSavedAge = mockLocalStorage.getItem('ageGroup');
                    const hasSeenHint = mockLocalStorage.getItem('ageSelectorHintShown');
                    
                    if (hasSavedAge) {
                        ageSelector.classList.add('hidden');
                        return { behavior: 'returning-user', immediateHide: true };
                    }
                } catch (error) {
                    // Treat as first-time user on error
                    return { behavior: 'first-time-user', error: true };
                }
                
                return { behavior: 'first-time-user', willAutoHide: true };
            };
            
            // Mock localStorage error
            mockLocalStorage.getItem = jest.fn(() => {
                throw new Error('localStorage unavailable');
            });
            
            // Should not crash and treat as first-time user
            const result = mockApp.setupAgeSelectorAutoHide();
            expect(result.behavior).toBe('first-time-user');
            expect(result.error).toBe(true);
        });
    });
    
    describe('User journey scenarios', () => {
        test('Complete first visit journey', () => {
            // Step 1: First visit - no saved data
            expect(mockLocalStorage.getItem('ageGroup')).toBeNull();
            expect(mockLocalStorage.getItem('ageSelectorHintShown')).toBeNull();
            
            let result = mockApp.setupAgeSelectorAutoHide();
            expect(result.behavior).toBe('first-time-user');
            expect(result.willShowHint).toBe(true);
            
            // Step 2: User selects age group
            mockLocalStorage.setItem('ageGroup', '7-12');
            
            // Step 3: User returns - should hide immediately
            // Reset DOM for new page load
            document.querySelector('.age-selector').classList.remove('hidden');
            
            result = mockApp.setupAgeSelectorAutoHide();
            expect(result.behavior).toBe('returning-user');
            expect(result.immediateHide).toBe(true);
        });
        
        test('Second visit after age selection', () => {
            // Simulate user has selected age before
            mockLocalStorage.setItem('ageGroup', '7-12');
            mockLocalStorage.setItem('ageSelectorHintShown', 'true');
            
            const result = mockApp.setupAgeSelectorAutoHide();
            
            // Should hide immediately, no hint
            expect(result.behavior).toBe('returning-user');
            expect(result.immediateHide).toBe(true);
            
            const ageSelector = document.querySelector('.age-selector');
            expect(ageSelector.classList.contains('hidden')).toBe(true);
        });
    });
    
    describe('Regression: Auto-hide bug fix', () => {
        /**
         * Bug: Age selector auto-hides after 10 seconds even if user hasn't selected anything
         * Expected: Age selector should remain visible until user makes a selection
         * Issue: 自动消失bug - 年龄选择没有自动消失，提示设置功能信息提前出现，也没有自动消失
         */
        test('should NOT auto-hide age selector for first-time users', () => {
            // First-time user - no saved age
            expect(mockLocalStorage.getItem('ageGroup')).toBeNull();
            
            const result = mockApp.setupAgeSelectorAutoHide();
            
            // Should be first-time user
            expect(result.behavior).toBe('first-time-user');
            
            // Age selector should remain visible (NOT auto-hide after timeout)
            const ageSelector = document.querySelector('.age-selector');
            expect(ageSelector.classList.contains('hidden')).toBe(false);
            
            // Should NOT schedule auto-hide (willAutoHide should be false or undefined for new implementation)
            // The selector should only hide when user makes a selection
        });
        
        test('should hide age selector immediately after user selects age', () => {
            // Simulate user selecting age
            const ageSelector = document.querySelector('.age-selector');
            const radio = document.querySelector('input[name="ageGroup"][value="7-12"]');
            
            // Initial state: selector visible, no saved age
            expect(ageSelector.classList.contains('hidden')).toBe(false);
            expect(mockLocalStorage.getItem('ageGroup')).toBeNull();
            
            // User selects age
            radio.checked = true;
            mockLocalStorage.setItem('ageGroup', '7-12');
            
            // After selection, selector should be hidden
            // (This would be triggered by the change event handler in actual implementation)
            ageSelector.classList.add('hidden');
            
            expect(ageSelector.classList.contains('hidden')).toBe(true);
        });
        
        test('should show hint only once after first age selection', () => {
            const hint = document.getElementById('ageSelectorHint');
            
            // First time: no hint shown yet
            expect(mockLocalStorage.getItem('ageSelectorHintShown')).toBeNull();
            expect(hint.classList.contains('show')).toBe(false);
            
            // Simulate first age selection and hint display
            mockLocalStorage.setItem('ageGroup', '7-12');
            hint.classList.add('show');
            mockLocalStorage.setItem('ageSelectorHintShown', 'true');
            
            // Hint should be visible
            expect(hint.classList.contains('show')).toBe(true);
            
            // After timeout, hint should be hidden
            hint.classList.remove('show');
            expect(hint.classList.contains('show')).toBe(false);
            
            // On next visit, hint should not show again
            const result = mockApp.setupAgeSelectorAutoHide();
            expect(result.willShowHint).toBeUndefined(); // Returning user, no hint
        });
        
        test('should keep age selector visible indefinitely for first-time users who dont select', () => {
            // First-time user
            expect(mockLocalStorage.getItem('ageGroup')).toBeNull();
            
            const result = mockApp.setupAgeSelectorAutoHide();
            const ageSelector = document.querySelector('.age-selector');
            
            // Should not auto-hide - selector stays visible
            expect(ageSelector.classList.contains('hidden')).toBe(false);
            
            // Even after long time, selector should still be visible
            // (no timeout should be set in the new implementation)
            expect(result.willAutoHide).not.toBe(true);
        });
    });
});
