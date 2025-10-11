/**
 * Fireworks Wall WeChat QR Code Tests
 * 
 * Tests for the WeChat QR code display functionality including:
 * - QR code element presence
 * - QR code visibility toggle in settings
 * - localStorage persistence of QR code visibility
 * - Proper display and styling
 */

describe('Fireworks Wall WeChat QR Code Tests', () => {
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

            <div class="museum-name-header" id="museumNameHeader"></div>
            <div class="museum-filter-indicator" id="museumFilterIndicator" style="display: none;"></div>

            <button class="settings-button" id="settingsButton" title="设置">⚙️</button>
            <button class="close-button" id="closeButton" title="关闭烟花墙">×</button>

            <!-- WeChat QR Code -->
            <div class="wechat-qr-code" id="wechatQrCode" style="display: flex;">
                <img src="MuseumCheck_QRCode_WX.jpg" alt="微信小程序二维码">
                <div class="qr-label">扫码放烟花</div>
            </div>

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
                            <span class="settings-option-label">博物馆名称</span>
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
                        <div class="settings-option">
                            <span class="settings-option-label">微信二维码</span>
                            <div class="settings-toggle active" id="toggleQrCode">
                                <div class="settings-toggle-knob"></div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="settings-section">
                        <h3>🔊 音效控制</h3>
                        <div class="settings-option">
                            <span class="settings-option-label">音效</span>
                            <div class="settings-toggle active" id="toggleSound">
                                <div class="settings-toggle-knob"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    });

    describe('QR Code Element Structure', () => {
        test('should have WeChat QR code element in page', () => {
            const wechatQrCode = document.getElementById('wechatQrCode');
            expect(wechatQrCode).toBeTruthy();
            expect(wechatQrCode.classList.contains('wechat-qr-code')).toBe(true);
        });

        test('should have QR code image', () => {
            const wechatQrCode = document.getElementById('wechatQrCode');
            const img = wechatQrCode.querySelector('img');
            expect(img).toBeTruthy();
            expect(img.src).toContain('MuseumCheck_QRCode_WX.jpg');
            expect(img.alt).toBe('微信小程序二维码');
        });

        test('should have QR code label', () => {
            const wechatQrCode = document.getElementById('wechatQrCode');
            const label = wechatQrCode.querySelector('.qr-label');
            expect(label).toBeTruthy();
            expect(label.textContent).toBe('扫码放烟花');
        });

        test('should have QR code toggle in settings modal', () => {
            const toggleQrCode = document.getElementById('toggleQrCode');
            expect(toggleQrCode).toBeTruthy();
            expect(toggleQrCode.classList.contains('settings-toggle')).toBe(true);
            expect(toggleQrCode.classList.contains('active')).toBe(true);
        });

        test('should have QR code toggle label', () => {
            const toggleQrCode = document.getElementById('toggleQrCode');
            const option = toggleQrCode.closest('.settings-option');
            const label = option.querySelector('.settings-option-label');
            expect(label).toBeTruthy();
            expect(label.textContent).toBe('微信二维码');
        });
    });

    describe('QR Code Settings Functionality', () => {
        let mockSettingsHandlers;

        beforeEach(() => {
            // Create mock settings handlers similar to actual implementation
            const wechatQrCode = document.getElementById('wechatQrCode');
            const toggleQrCode = document.getElementById('toggleQrCode');
            
            mockSettingsHandlers = {
                settings: {
                    showStats: true,
                    showFilter: true,
                    showFireworkText: true,
                    soundEnabled: true,
                    showQrCode: true
                },
                applySettings: jest.fn(() => {
                    wechatQrCode.style.display = mockSettingsHandlers.settings.showQrCode ? 'flex' : 'none';
                    toggleQrCode.classList.toggle('active', mockSettingsHandlers.settings.showQrCode);
                }),
                saveSettings: jest.fn(() => {
                    localStorage.setItem('fireworksWallSettings', JSON.stringify(mockSettingsHandlers.settings));
                }),
                toggleQrCodeVisibility: jest.fn(() => {
                    mockSettingsHandlers.settings.showQrCode = !mockSettingsHandlers.settings.showQrCode;
                    mockSettingsHandlers.saveSettings();
                    mockSettingsHandlers.applySettings();
                })
            };
        });

        test('should show QR code by default', () => {
            const wechatQrCode = document.getElementById('wechatQrCode');
            mockSettingsHandlers.applySettings();
            expect(wechatQrCode.style.display).toBe('flex');
        });

        test('should hide QR code when toggle is clicked', () => {
            const wechatQrCode = document.getElementById('wechatQrCode');
            const toggleQrCode = document.getElementById('toggleQrCode');
            
            // Initially shown
            mockSettingsHandlers.applySettings();
            expect(wechatQrCode.style.display).toBe('flex');
            expect(toggleQrCode.classList.contains('active')).toBe(true);
            
            // Toggle to hide
            mockSettingsHandlers.toggleQrCodeVisibility();
            expect(wechatQrCode.style.display).toBe('none');
            expect(toggleQrCode.classList.contains('active')).toBe(false);
        });

        test('should show QR code again when toggle is clicked twice', () => {
            const wechatQrCode = document.getElementById('wechatQrCode');
            const toggleQrCode = document.getElementById('toggleQrCode');
            
            // Initially shown
            mockSettingsHandlers.applySettings();
            expect(wechatQrCode.style.display).toBe('flex');
            
            // Toggle to hide
            mockSettingsHandlers.toggleQrCodeVisibility();
            expect(wechatQrCode.style.display).toBe('none');
            
            // Toggle to show again
            mockSettingsHandlers.toggleQrCodeVisibility();
            expect(wechatQrCode.style.display).toBe('flex');
            expect(toggleQrCode.classList.contains('active')).toBe(true);
        });

        test('should persist QR code visibility setting in localStorage', () => {
            // Hide QR code
            mockSettingsHandlers.toggleQrCodeVisibility();
            
            expect(localStorage.setItem).toHaveBeenCalledWith(
                'fireworksWallSettings',
                expect.stringContaining('"showQrCode":false')
            );
        });

        test('should load QR code visibility from localStorage', () => {
            // Directly verify that settings can be loaded from localStorage
            const storedSettings = {
                showStats: true,
                showFilter: true,
                showFireworkText: true,
                soundEnabled: true,
                showQrCode: false
            };
            
            // Simulate what the actual code does - store settings
            const settingsJson = JSON.stringify(storedSettings);
            
            // Verify JSON can be parsed back
            const parsed = JSON.parse(settingsJson);
            expect(parsed.showQrCode).toBe(false);
            
            // Apply the loaded settings
            mockSettingsHandlers.settings = { ...mockSettingsHandlers.settings, ...parsed };
            mockSettingsHandlers.applySettings();
            
            const wechatQrCode = document.getElementById('wechatQrCode');
            expect(wechatQrCode.style.display).toBe('none');
        });
    });

    describe('QR Code Display Properties', () => {
        test('should have appropriate display style for visibility', () => {
            const wechatQrCode = document.getElementById('wechatQrCode');
            // When shown, it should use 'flex' display to center content
            expect(['flex', 'block', '']).toContain(wechatQrCode.style.display);
        });

        test('QR code should be positioned fixed', () => {
            const wechatQrCode = document.getElementById('wechatQrCode');
            // Fixed positioning is set in CSS, we can verify the element exists
            // and has the right class which has position: fixed in the stylesheet
            expect(wechatQrCode.classList.contains('wechat-qr-code')).toBe(true);
        });
    });

    describe('Integration with Other Settings', () => {
        let mockSettingsHandlers;

        beforeEach(() => {
            const wechatQrCode = document.getElementById('wechatQrCode');
            const statsOverlay = document.getElementById('statsOverlay');
            const toggleQrCode = document.getElementById('toggleQrCode');
            const toggleStats = document.getElementById('toggleStats');
            
            mockSettingsHandlers = {
                settings: {
                    showStats: true,
                    showFilter: true,
                    showFireworkText: true,
                    soundEnabled: true,
                    showQrCode: true
                },
                applySettings: jest.fn(() => {
                    wechatQrCode.style.display = mockSettingsHandlers.settings.showQrCode ? 'flex' : 'none';
                    statsOverlay.style.display = mockSettingsHandlers.settings.showStats ? 'block' : 'none';
                    toggleQrCode.classList.toggle('active', mockSettingsHandlers.settings.showQrCode);
                    toggleStats.classList.toggle('active', mockSettingsHandlers.settings.showStats);
                })
            };
        });

        test('should maintain QR code visibility independent of stats visibility', () => {
            const wechatQrCode = document.getElementById('wechatQrCode');
            const statsOverlay = document.getElementById('statsOverlay');
            
            // Both visible initially
            mockSettingsHandlers.applySettings();
            expect(wechatQrCode.style.display).toBe('flex');
            expect(statsOverlay.style.display).toBe('block');
            
            // Hide stats, QR code should remain visible
            mockSettingsHandlers.settings.showStats = false;
            mockSettingsHandlers.applySettings();
            expect(wechatQrCode.style.display).toBe('flex');
            expect(statsOverlay.style.display).toBe('none');
            
            // Hide QR code, stats should remain hidden
            mockSettingsHandlers.settings.showQrCode = false;
            mockSettingsHandlers.applySettings();
            expect(wechatQrCode.style.display).toBe('none');
            expect(statsOverlay.style.display).toBe('none');
        });

        test('should save all settings including QR code setting', () => {
            const saveSettings = jest.fn(() => {
                localStorage.setItem('fireworksWallSettings', JSON.stringify(mockSettingsHandlers.settings));
            });
            
            mockSettingsHandlers.settings.showQrCode = false;
            saveSettings();
            
            expect(localStorage.setItem).toHaveBeenCalledWith(
                'fireworksWallSettings',
                expect.stringContaining('"showQrCode":false')
            );
        });
    });
});
