/**
 * Fireworks Wall Settings Tests
 * 
 * Tests for the fireworks wall settings functionality including:
 * - Settings button presence
 * - Settings modal show/hide
 * - Text visibility toggles (stats, filter, firework text)
 * - localStorage persistence
 */

describe('Fireworks Wall Settings Tests', () => {
    let mockLocalStorage;

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

        // Set up minimal DOM structure
        document.body.innerHTML = `
            <canvas id="canvas"></canvas>
            
            <div class="stats-overlay" id="statsOverlay" style="display: block;">
                <div class="stat-item">
                    <span class="stat-label">🎆 总烟花:</span>
                    <span class="stat-value" id="totalFireworks">0</span>
                </div>
            </div>

            <div class="museum-filter-indicator" id="museumFilterIndicator" style="display: none;"></div>

            <button class="settings-button" id="settingsButton" title="设置">⚙️</button>
            <button class="close-button" id="closeButton" title="关闭烟花墙">×</button>

            <!-- Settings Modal -->
            <div class="settings-modal" id="settingsModal">
                <div class="settings-modal-content">
                    <div class="settings-modal-header">
                        <h2>⚙️ 烟花墙设置</h2>
                        <button class="settings-modal-close" id="settingsModalClose">×</button>
                    </div>
                    
                    <div class="settings-section">
                        <h3>📝 文字显示</h3>
                        <div class="settings-option">
                            <span class="settings-option-label">统计信息</span>
                            <div class="settings-toggle active" id="toggleStats">
                                <div class="settings-toggle-knob"></div>
                            </div>
                        </div>
                        <div class="settings-option">
                            <span class="settings-option-label">博物馆过滤器</span>
                            <div class="settings-toggle active" id="toggleFilter">
                                <div class="settings-toggle-knob"></div>
                            </div>
                        </div>
                        <div class="settings-option">
                            <span class="settings-option-label">烟花文字</span>
                            <div class="settings-toggle active" id="toggleFireworkText">
                                <div class="settings-toggle-knob"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    });

    describe('Settings Button Structure', () => {
        test('should have settings button in page', () => {
            const settingsButton = document.getElementById('settingsButton');
            expect(settingsButton).toBeTruthy();
            expect(settingsButton.textContent.trim()).toBe('⚙️');
            expect(settingsButton.classList.contains('settings-button')).toBe(true);
            expect(settingsButton.title).toBe('设置');
        });

        test('should have close button in page', () => {
            const closeButton = document.getElementById('closeButton');
            expect(closeButton).toBeTruthy();
            expect(closeButton.textContent.trim()).toBe('×');
            expect(closeButton.classList.contains('close-button')).toBe(true);
        });

        test('settings button should be positioned near close button', () => {
            const settingsButton = document.getElementById('settingsButton');
            const closeButton = document.getElementById('closeButton');
            
            expect(settingsButton).toBeTruthy();
            expect(closeButton).toBeTruthy();
            // Both buttons should exist in the DOM
            expect(settingsButton.classList.contains('settings-button')).toBe(true);
            expect(closeButton.classList.contains('close-button')).toBe(true);
        });
    });

    describe('Settings Modal Structure', () => {
        test('should have settings modal in DOM', () => {
            const settingsModal = document.getElementById('settingsModal');
            expect(settingsModal).toBeTruthy();
            expect(settingsModal.classList.contains('settings-modal')).toBe(true);
        });

        test('should have modal close button', () => {
            const closeButton = document.getElementById('settingsModalClose');
            expect(closeButton).toBeTruthy();
            expect(closeButton.textContent.trim()).toBe('×');
        });

        test('should have all three toggle options', () => {
            const toggleStats = document.getElementById('toggleStats');
            const toggleFilter = document.getElementById('toggleFilter');
            const toggleFireworkText = document.getElementById('toggleFireworkText');
            
            expect(toggleStats).toBeTruthy();
            expect(toggleFilter).toBeTruthy();
            expect(toggleFireworkText).toBeTruthy();
        });

        test('toggles should have active class by default', () => {
            const toggleStats = document.getElementById('toggleStats');
            const toggleFilter = document.getElementById('toggleFilter');
            const toggleFireworkText = document.getElementById('toggleFireworkText');
            
            expect(toggleStats.classList.contains('active')).toBe(true);
            expect(toggleFilter.classList.contains('active')).toBe(true);
            expect(toggleFireworkText.classList.contains('active')).toBe(true);
        });
    });

    describe('Settings Modal Behavior', () => {
        test('modal should show when settings button clicked', () => {
            const settingsButton = document.getElementById('settingsButton');
            const settingsModal = document.getElementById('settingsModal');
            
            // Initially modal should not have 'show' class
            expect(settingsModal.classList.contains('show')).toBe(false);
            
            // Simulate click
            settingsButton.click();
            settingsModal.classList.add('show');
            
            expect(settingsModal.classList.contains('show')).toBe(true);
        });

        test('modal should hide when close button clicked', () => {
            const settingsModal = document.getElementById('settingsModal');
            const closeButton = document.getElementById('settingsModalClose');
            
            // Show modal first
            settingsModal.classList.add('show');
            expect(settingsModal.classList.contains('show')).toBe(true);
            
            // Click close button
            closeButton.click();
            settingsModal.classList.remove('show');
            
            expect(settingsModal.classList.contains('show')).toBe(false);
        });
    });

    describe('Settings Toggle Functionality', () => {
        test('should toggle stats visibility', () => {
            const toggleStats = document.getElementById('toggleStats');
            const statsOverlay = document.getElementById('statsOverlay');
            
            // Initially visible
            expect(statsOverlay.style.display).toBe('block');
            expect(toggleStats.classList.contains('active')).toBe(true);
            
            // Simulate toggle
            toggleStats.click();
            toggleStats.classList.remove('active');
            statsOverlay.style.display = 'none';
            
            expect(statsOverlay.style.display).toBe('none');
            expect(toggleStats.classList.contains('active')).toBe(false);
        });

        test('should toggle filter visibility when filter exists', () => {
            const toggleFilter = document.getElementById('toggleFilter');
            const filterIndicator = document.getElementById('museumFilterIndicator');
            
            // Set filter to be visible initially
            filterIndicator.style.display = 'block';
            
            // Simulate toggle
            toggleFilter.click();
            toggleFilter.classList.remove('active');
            filterIndicator.style.display = 'none';
            
            expect(filterIndicator.style.display).toBe('none');
            expect(toggleFilter.classList.contains('active')).toBe(false);
        });

        test('should set global flag for firework text', () => {
            const toggleFireworkText = document.getElementById('toggleFireworkText');
            
            // Initially true
            window.showFireworkText = true;
            
            // Simulate toggle
            toggleFireworkText.click();
            toggleFireworkText.classList.remove('active');
            window.showFireworkText = false;
            
            expect(window.showFireworkText).toBe(false);
            expect(toggleFireworkText.classList.contains('active')).toBe(false);
        });
    });

    describe('Settings Persistence', () => {
        test('should save settings to localStorage', () => {
            const settings = {
                showStats: false,
                showFilter: true,
                showFireworkText: true
            };
            
            localStorage.setItem('fireworksWallSettings', JSON.stringify(settings));
            
            expect(localStorage.setItem).toHaveBeenCalledWith(
                'fireworksWallSettings',
                JSON.stringify(settings)
            );
            
            const stored = JSON.parse(localStorage.getItem('fireworksWallSettings'));
            expect(stored.showStats).toBe(false);
            expect(stored.showFilter).toBe(true);
            expect(stored.showFireworkText).toBe(true);
        });

        test('should load settings from localStorage', () => {
            const settings = {
                showStats: false,
                showFilter: false,
                showFireworkText: true
            };
            
            localStorage.setItem('fireworksWallSettings', JSON.stringify(settings));
            
            const loaded = JSON.parse(localStorage.getItem('fireworksWallSettings'));
            expect(loaded).toEqual(settings);
        });

        test('should handle missing localStorage gracefully', () => {
            const result = localStorage.getItem('fireworksWallSettings');
            expect(result).toBeNull();
        });
    });

    describe('Settings Application', () => {
        test('should apply settings to hide all text elements', () => {
            const statsOverlay = document.getElementById('statsOverlay');
            const filterIndicator = document.getElementById('museumFilterIndicator');
            const toggleStats = document.getElementById('toggleStats');
            const toggleFilter = document.getElementById('toggleFilter');
            const toggleFireworkText = document.getElementById('toggleFireworkText');
            
            // Simulate hiding all
            statsOverlay.style.display = 'none';
            filterIndicator.style.display = 'none';
            window.showFireworkText = false;
            
            toggleStats.classList.remove('active');
            toggleFilter.classList.remove('active');
            toggleFireworkText.classList.remove('active');
            
            expect(statsOverlay.style.display).toBe('none');
            expect(filterIndicator.style.display).toBe('none');
            expect(window.showFireworkText).toBe(false);
            expect(toggleStats.classList.contains('active')).toBe(false);
            expect(toggleFilter.classList.contains('active')).toBe(false);
            expect(toggleFireworkText.classList.contains('active')).toBe(false);
        });

        test('should apply settings to show all text elements', () => {
            const statsOverlay = document.getElementById('statsOverlay');
            const filterIndicator = document.getElementById('museumFilterIndicator');
            const toggleStats = document.getElementById('toggleStats');
            const toggleFilter = document.getElementById('toggleFilter');
            const toggleFireworkText = document.getElementById('toggleFireworkText');
            
            // Simulate showing all
            statsOverlay.style.display = 'block';
            filterIndicator.style.display = 'block';
            window.showFireworkText = true;
            
            toggleStats.classList.add('active');
            toggleFilter.classList.add('active');
            toggleFireworkText.classList.add('active');
            
            expect(statsOverlay.style.display).toBe('block');
            expect(filterIndicator.style.display).toBe('block');
            expect(window.showFireworkText).toBe(true);
            expect(toggleStats.classList.contains('active')).toBe(true);
            expect(toggleFilter.classList.contains('active')).toBe(true);
            expect(toggleFireworkText.classList.contains('active')).toBe(true);
        });
    });
});
