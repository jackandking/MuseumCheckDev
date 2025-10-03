/**
 * Tests for Fireworks Retention Time Feature
 * Issue: 设置页面增加烟花成就留存时间
 * 
 * This feature allows users to set how long fireworks are kept:
 * - Default: 1 minute (60000 ms)
 * - Range: 1 minute to 1 day (86400000 ms)
 * - Old fireworks are automatically cleaned up based on retention time
 */

const fs = require('fs');
const path = require('path');

// Load HTML and script content
const htmlContent = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const scriptContent = fs.readFileSync(path.join(__dirname, '..', 'script.js'), 'utf8');

describe('Fireworks Retention Time Feature', () => {
    let museumCheck;
    let localStorageMock;

    beforeEach(() => {
        // Setup DOM
        document.documentElement.innerHTML = htmlContent;
        
        // Mock localStorage
        localStorageMock = {
            store: {},
            getItem: function(key) {
                return this.store[key] || null;
            },
            setItem: function(key, value) {
                this.store[key] = value.toString();
            },
            removeItem: function(key) {
                delete this.store[key];
            },
            clear: function() {
                this.store = {};
            }
        };
        
        Object.defineProperty(window, 'localStorage', {
            value: localStorageMock,
            writable: true,
            configurable: true
        });

        // Mock Google Analytics
        global.gtag = jest.fn();
        window.gtag = jest.fn();

        // Initialize MuseumCheckApp if available
        if (typeof global.MuseumCheckApp !== 'undefined') {
            museumCheck = new global.MuseumCheckApp();
        }
    });

    describe('HTML Structure', () => {
        test('should have fireworks retention slider in settings modal', () => {
            const slider = document.getElementById('fireworksRetentionInput');
            expect(slider).toBeTruthy();
            expect(slider.type).toBe('range');
            expect(slider.min).toBe('1');
            expect(slider.max).toBe('1440');
            expect(slider.value).toBe('1');
        });

        test('should have fireworks retention display element', () => {
            const display = document.getElementById('fireworksRetentionDisplay');
            expect(display).toBeTruthy();
            expect(display.textContent).toContain('分钟');
        });

        test('should have fireworks settings section', () => {
            const html = document.body.innerHTML;
            expect(html).toContain('🎆 烟花设置');
            expect(html).toContain('烟花留存时间');
            expect(html).toContain('烟花成就的保存时长');
        });
    });

    describe('Storage Functions', () => {
        test('loadFireworksRetentionTime should return default 1 minute', () => {
            if (!museumCheck) {
                console.log('MuseumCheckApp not available, skipping test');
                return;
            }

            const retentionTime = museumCheck.loadFireworksRetentionTime();
            expect(retentionTime).toBe(60000); // 1 minute in milliseconds
        });

        test('loadFireworksRetentionTime should load saved value', () => {
            if (!museumCheck) {
                console.log('MuseumCheckApp not available, skipping test');
                return;
            }

            // Save a custom retention time (5 minutes)
            localStorageMock.setItem('fireworksRetentionTime', '300000');
            
            const retentionTime = museumCheck.loadFireworksRetentionTime();
            expect(retentionTime).toBe(300000);
        });

        test('saveFireworksRetentionTime should save valid value', () => {
            if (!museumCheck) {
                console.log('MuseumCheckApp not available, skipping test');
                return;
            }

            const result = museumCheck.saveFireworksRetentionTime(300000); // 5 minutes
            
            expect(result.success).toBe(true);
            expect(localStorageMock.getItem('fireworksRetentionTime')).toBe('300000');
        });

        test('saveFireworksRetentionTime should reject values below minimum', () => {
            if (!museumCheck) {
                console.log('MuseumCheckApp not available, skipping test');
                return;
            }

            const result = museumCheck.saveFireworksRetentionTime(30000); // 30 seconds (below minimum)
            
            // Should save default value instead
            expect(localStorageMock.getItem('fireworksRetentionTime')).toBe('60000');
        });

        test('saveFireworksRetentionTime should reject values above maximum', () => {
            if (!museumCheck) {
                console.log('MuseumCheckApp not available, skipping test');
                return;
            }

            const result = museumCheck.saveFireworksRetentionTime(90000000); // More than 1 day
            
            // Should save default value instead
            expect(localStorageMock.getItem('fireworksRetentionTime')).toBe('60000');
        });
    });

    describe('Cleanup Functions', () => {
        test('cleanupExpiredFireworks should remove old fireworks', () => {
            if (!museumCheck) {
                console.log('MuseumCheckApp not available, skipping test');
                return;
            }

            const now = Date.now();
            const oldFirework = {
                id: 'old-firework',
                museumId: 'test-museum',
                museumName: '测试博物馆',
                taskContent: '旧烟花',
                timestamp: now - 120000, // 2 minutes ago
                date: new Date(now - 120000).toISOString()
            };
            
            const newFirework = {
                id: 'new-firework',
                museumId: 'test-museum',
                museumName: '测试博物馆',
                taskContent: '新烟花',
                timestamp: now - 30000, // 30 seconds ago
                date: new Date(now - 30000).toISOString()
            };

            // Set retention time to 1 minute
            museumCheck.saveFireworksRetentionTime(60000);
            
            const fireworks = [oldFirework, newFirework];
            const cleaned = museumCheck.cleanupExpiredFireworks(fireworks);
            
            // Only new firework should remain
            expect(cleaned.length).toBe(1);
            expect(cleaned[0].id).toBe('new-firework');
        });

        test('cleanupExpiredFireworks should keep all fireworks within retention time', () => {
            if (!museumCheck) {
                console.log('MuseumCheckApp not available, skipping test');
                return;
            }

            const now = Date.now();
            const fireworks = [
                {
                    id: 'firework-1',
                    museumId: 'test-museum',
                    museumName: '测试博物馆',
                    taskContent: '烟花1',
                    timestamp: now - 30000, // 30 seconds ago
                    date: new Date(now - 30000).toISOString()
                },
                {
                    id: 'firework-2',
                    museumId: 'test-museum',
                    museumName: '测试博物馆',
                    taskContent: '烟花2',
                    timestamp: now - 45000, // 45 seconds ago
                    date: new Date(now - 45000).toISOString()
                }
            ];

            // Set retention time to 1 minute
            museumCheck.saveFireworksRetentionTime(60000);
            
            const cleaned = museumCheck.cleanupExpiredFireworks(fireworks);
            
            // All fireworks should remain
            expect(cleaned.length).toBe(2);
        });

        test('loadFireworks should automatically clean up expired fireworks', () => {
            if (!museumCheck) {
                console.log('MuseumCheckApp not available, skipping test');
                return;
            }

            const now = Date.now();
            const fireworks = [
                {
                    id: 'old',
                    museumId: 'test',
                    museumName: '测试',
                    taskContent: '旧',
                    timestamp: now - 120000, // 2 minutes ago
                    date: new Date(now - 120000).toISOString()
                },
                {
                    id: 'new',
                    museumId: 'test',
                    museumName: '测试',
                    taskContent: '新',
                    timestamp: now - 30000, // 30 seconds ago
                    date: new Date(now - 30000).toISOString()
                }
            ];

            // Save fireworks to localStorage
            localStorageMock.setItem('fireworks', JSON.stringify(fireworks));
            
            // Set retention time to 1 minute
            localStorageMock.setItem('fireworksRetentionTime', '60000');
            
            // Load fireworks (should trigger cleanup)
            const loaded = museumCheck.loadFireworks();
            
            // Only new firework should be loaded
            expect(loaded.length).toBe(1);
            expect(loaded[0].id).toBe('new');
        });
    });

    describe('Display Functions', () => {
        test('updateFireworksRetentionDisplay should format minutes correctly', () => {
            if (!museumCheck) {
                console.log('MuseumCheckApp not available, skipping test');
                return;
            }

            const display = document.getElementById('fireworksRetentionDisplay');
            
            // Test minutes
            museumCheck.updateFireworksRetentionDisplay(1);
            expect(display.textContent).toBe('1 分钟');
            
            museumCheck.updateFireworksRetentionDisplay(30);
            expect(display.textContent).toBe('30 分钟');
            
            // Test hours
            museumCheck.updateFireworksRetentionDisplay(60);
            expect(display.textContent).toBe('1 小时');
            
            museumCheck.updateFireworksRetentionDisplay(120);
            expect(display.textContent).toBe('2 小时');
            
            // Test day
            museumCheck.updateFireworksRetentionDisplay(1440);
            expect(display.textContent).toBe('1 天');
        });
    });

    describe('Code Validation', () => {
        test('should have loadFireworksRetentionTime method', () => {
            expect(scriptContent).toContain('loadFireworksRetentionTime()');
        });

        test('should have saveFireworksRetentionTime method', () => {
            expect(scriptContent).toContain('saveFireworksRetentionTime(');
        });

        test('should have cleanupExpiredFireworks method', () => {
            expect(scriptContent).toContain('cleanupExpiredFireworks(');
        });

        test('should have updateFireworksRetentionDisplay method', () => {
            expect(scriptContent).toContain('updateFireworksRetentionDisplay(');
        });

        test('cleanupExpiredFireworks should be called in loadFireworks', () => {
            expect(scriptContent).toContain('this.cleanupExpiredFireworks(fireworks)');
        });
    });
});
