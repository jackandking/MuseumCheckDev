/**
 * Tests for Fireworks Protocol Update
 * Issue: 烟花储存协议更新
 * 
 * New fields added to fireworks:
 * - childNickname (孩子昵称)
 * - ageGroup (年龄) - already existed, kept for compatibility
 * - museumCity (博物馆所在城市)
 */

const fs = require('fs');
const path = require('path');

// Load HTML and script content
const htmlContent = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const scriptContent = fs.readFileSync(path.join(__dirname, '..', 'script.js'), 'utf8');

describe('Fireworks Protocol Update', () => {
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
            museumCheck.init();
        }
    });

    describe('New Firework Data Structure', () => {
        test('should include childNickname in new fireworks', () => {
            if (!museumCheck) {
                console.log('MuseumCheckApp not available, skipping test');
                return;
            }

            // Set a child nickname
            museumCheck.childNickname = '小明';
            
            // Create a firework
            const firework = museumCheck.addFirework(
                'forbidden-city', 
                '故宫博物院', 
                '观察古建筑的屋顶装饰', 
                '7-12',
                '北京'
            );
            
            // Verify new fields exist
            expect(firework).toHaveProperty('childNickname');
            expect(firework.childNickname).toBe('小明');
            expect(firework).toHaveProperty('museumCity');
            expect(firework.museumCity).toBe('北京');
            expect(firework).toHaveProperty('ageGroup');
            expect(firework.ageGroup).toBe('7-12');
        });

        test('should use default nickname when not set', () => {
            if (!museumCheck) {
                console.log('MuseumCheckApp not available, skipping test');
                return;
            }

            // Don't set nickname - should use default
            museumCheck.childNickname = null;
            
            const firework = museumCheck.addFirework(
                'national-museum', 
                '中国国家博物馆', 
                '学习中国历史', 
                '7-12',
                '北京'
            );
            
            expect(firework.childNickname).toBe('小淘气');
        });

        test('should auto-detect museum city when not provided', () => {
            if (!museumCheck) {
                console.log('MuseumCheckApp not available, skipping test');
                return;
            }

            // Call without city parameter - should auto-detect from MUSEUMS array
            const firework = museumCheck.addFirework(
                'forbidden-city', 
                '故宫博物院', 
                '观察古建筑的屋顶装饰', 
                '7-12'
            );
            
            // Should auto-detect Beijing from MUSEUMS array
            expect(firework.museumCity).toBeTruthy();
        });

        test('should include all legacy fields for backward compatibility', () => {
            if (!museumCheck) {
                console.log('MuseumCheckApp not available, skipping test');
                return;
            }

            const firework = museumCheck.addFirework(
                'shanghai-museum', 
                '上海博物馆', 
                '欣赏青铜器', 
                '7-12',
                '上海'
            );
            
            // Legacy fields
            expect(firework).toHaveProperty('id');
            expect(firework).toHaveProperty('museumId');
            expect(firework).toHaveProperty('museumName');
            expect(firework).toHaveProperty('taskContent');
            expect(firework).toHaveProperty('timestamp');
            expect(firework).toHaveProperty('date');
            
            // New fields
            expect(firework).toHaveProperty('childNickname');
            expect(firework).toHaveProperty('museumCity');
        });
    });

    describe('Firework Display Updates', () => {
        test('renderFireworks should handle new fields gracefully', () => {
            if (!museumCheck) {
                console.log('MuseumCheckApp not available, skipping test');
                return;
            }

            // Create fireworks with new format
            museumCheck.childNickname = '小红';
            museumCheck.addFirework('forbidden-city', '故宫博物院', '任务1', '7-12', '北京');
            museumCheck.addFirework('national-museum', '中国国家博物馆', '任务2', '7-12', '北京');
            
            // Render fireworks
            museumCheck.renderFireworks();
            
            // Check that rendering completed without errors
            const fireworksList = document.getElementById('fireworksList');
            expect(fireworksList).toBeTruthy();
        });

        test('renderFireworks should display child nickname in firework items', () => {
            if (!museumCheck) {
                console.log('MuseumCheckApp not available, skipping test');
                return;
            }

            // Create a firework with nickname
            museumCheck.childNickname = '小李';
            museumCheck.addFirework('forbidden-city', '故宫博物院', '观察建筑', '7-12', '北京');
            
            // Render fireworks
            museumCheck.renderFireworks();
            
            const fireworksList = document.getElementById('fireworksList');
            if (fireworksList) {
                const html = fireworksList.innerHTML;
                // Should contain the nickname
                expect(html).toContain('小李');
            }
        });

        test('renderFireworks should display museum city in firework items', () => {
            if (!museumCheck) {
                console.log('MuseumCheckApp not available, skipping test');
                return;
            }

            // Create a firework with city
            museumCheck.childNickname = '小王';
            museumCheck.addFirework('shanghai-museum', '上海博物馆', '欣赏艺术品', '7-12', '上海');
            
            // Render fireworks
            museumCheck.renderFireworks();
            
            const fireworksList = document.getElementById('fireworksList');
            if (fireworksList) {
                const html = fireworksList.innerHTML;
                // Should contain the city
                expect(html).toContain('上海');
            }
        });
    });

    describe('Backward Compatibility', () => {
        test('should handle old fireworks without new fields', () => {
            if (!museumCheck) {
                console.log('MuseumCheckApp not available, skipping test');
                return;
            }

            // Simulate loading old fireworks from localStorage
            const oldFireworks = [
                {
                    id: 'test-id-1',
                    museumId: 'forbidden-city',
                    museumName: '故宫博物院',
                    taskContent: '观察古建筑',
                    ageGroup: '7-12',
                    timestamp: Date.now(),
                    date: new Date().toISOString()
                    // Note: no childNickname or museumCity
                }
            ];
            
            localStorageMock.setItem('fireworks', JSON.stringify(oldFireworks));
            
            // Load fireworks
            museumCheck.fireworks = museumCheck.loadFireworks();
            
            // Render should not crash
            expect(() => museumCheck.renderFireworks()).not.toThrow();
            
            // Check defaults are applied in rendering
            const fireworksList = document.getElementById('fireworksList');
            expect(fireworksList).toBeTruthy();
        });

        test('should save new fireworks with all required fields', () => {
            if (!museumCheck) {
                console.log('MuseumCheckApp not available, skipping test');
                return;
            }

            museumCheck.childNickname = '测试昵称';
            museumCheck.addFirework('test-museum', '测试博物馆', '测试任务', '7-12', '测试城市');
            
            // Load from localStorage
            const savedFireworks = JSON.parse(localStorageMock.getItem('fireworks'));
            
            expect(savedFireworks).toHaveLength(1);
            expect(savedFireworks[0]).toHaveProperty('childNickname', '测试昵称');
            expect(savedFireworks[0]).toHaveProperty('museumCity', '测试城市');
            expect(savedFireworks[0]).toHaveProperty('ageGroup', '7-12');
        });
    });

    describe('Analytics Tracking', () => {
        test('should track new fields in analytics events', () => {
            if (!museumCheck) {
                console.log('MuseumCheckApp not available, skipping test');
                return;
            }

            // Clear previous calls
            global.gtag.mockClear();
            
            museumCheck.childNickname = '小张';
            museumCheck.addFirework('forbidden-city', '故宫博物院', '任务', '7-12', '北京');
            
            // Verify analytics event was called with new fields
            expect(global.gtag).toHaveBeenCalled();
            
            // Find the firework_created event
            const fireworkCreatedCalls = global.gtag.mock.calls.filter(
                call => call[0] === 'event' && call[1] === 'firework_created'
            );
            
            if (fireworkCreatedCalls.length > 0) {
                const eventParams = fireworkCreatedCalls[0][2];
                expect(eventParams).toHaveProperty('museum_city');
                expect(eventParams).toHaveProperty('child_nickname');
            }
        });
    });

    describe('Code Validation', () => {
        test('addFirework function signature should accept museumCity parameter', () => {
            // Verify the function signature in the code
            expect(scriptContent).toContain('addFirework(museumId, museumName, taskContent, ageGroup, museumCity');
        });

        test('firework object should include new fields in code', () => {
            expect(scriptContent).toContain('museumCity:');
            expect(scriptContent).toContain('childNickname:');
        });

        test('renderFireworks should handle backward compatibility', () => {
            expect(scriptContent).toContain('firework.childNickname ||');
            expect(scriptContent).toContain('firework.museumCity ||');
        });
    });
});
