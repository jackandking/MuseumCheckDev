/**
 * Tests for Multi-User Firework Type Persistence
 * Issue: 多人烟花类型
 * 
 * Ensures that firework types are stored with each firework and displayed 
 * correctly regardless of the current user's firework type preference.
 */

const fs = require('fs');
const path = require('path');

// Load HTML and script content
const htmlContent = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const scriptContent = fs.readFileSync(path.join(__dirname, '..', 'script.js'), 'utf8');

describe('Multi-User Firework Type Persistence', () => {
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

    describe('Firework Type Storage', () => {
        test('should save fireworkType when creating a firework', () => {
            if (!museumCheck) {
                console.log('MuseumCheckApp not available, skipping test');
                return;
            }

            // Set firework type to 'circle'
            localStorageMock.setItem('fireworkType', 'circle');
            
            // Create a firework
            museumCheck.addFirework('test-museum', '测试博物馆', '测试任务', '7-12', '北京');
            
            // Load from localStorage
            const savedFireworks = JSON.parse(localStorageMock.getItem('museumCheckFireworks'));
            
            expect(savedFireworks).toHaveLength(1);
            expect(savedFireworks[0]).toHaveProperty('fireworkType', 'circle');
        });

        test('should save different fireworkType for different users', () => {
            if (!museumCheck) {
                console.log('MuseumCheckApp not available, skipping test');
                return;
            }

            // User A with circle firework
            localStorageMock.setItem('fireworkType', 'circle');
            museumCheck.childNickname = '用户A';
            museumCheck.addFirework('forbidden-city', '故宫博物院', '观察建筑', '7-12', '北京');
            
            // User B with heart firework
            localStorageMock.setItem('fireworkType', 'heart');
            museumCheck.childNickname = '用户B';
            museumCheck.addFirework('shanghai-museum', '上海博物馆', '欣赏艺术', '7-12', '上海');
            
            // User C with star firework
            localStorageMock.setItem('fireworkType', 'star');
            museumCheck.childNickname = '用户C';
            museumCheck.addFirework('nanjing-museum', '南京博物院', '学习历史', '7-12', '南京');
            
            // Load from localStorage
            const savedFireworks = JSON.parse(localStorageMock.getItem('museumCheckFireworks'));
            
            expect(savedFireworks).toHaveLength(3);
            expect(savedFireworks[0].fireworkType).toBe('circle');
            expect(savedFireworks[0].childNickname).toBe('用户A');
            expect(savedFireworks[1].fireworkType).toBe('heart');
            expect(savedFireworks[1].childNickname).toBe('用户B');
            expect(savedFireworks[2].fireworkType).toBe('star');
            expect(savedFireworks[2].childNickname).toBe('用户C');
        });

        test('should default to heart fireworkType if not set', () => {
            if (!museumCheck) {
                console.log('MuseumCheckApp not available, skipping test');
                return;
            }

            // Don't set fireworkType in localStorage
            localStorageMock.removeItem('fireworkType');
            
            // Create a firework
            museumCheck.addFirework('test-museum', '测试博物馆', '测试任务', '7-12', '北京');
            
            // Load from localStorage
            const savedFireworks = JSON.parse(localStorageMock.getItem('museumCheckFireworks'));
            
            expect(savedFireworks).toHaveLength(1);
            expect(savedFireworks[0]).toHaveProperty('fireworkType', 'heart');
        });
    });

    describe('Backward Compatibility', () => {
        test('should handle old fireworks without fireworkType field', () => {
            if (!museumCheck) {
                console.log('MuseumCheckApp not available, skipping test');
                return;
            }

            // Create an old firework data structure without fireworkType
            const oldFirework = {
                id: 'old-firework-1',
                museumId: 'test-museum',
                museumName: '测试博物馆',
                museumCity: '北京',
                taskContent: '测试任务',
                ageGroup: '7-12',
                childNickname: '小明',
                timestamp: Date.now(),
                date: new Date().toISOString()
                // No fireworkType field
            };
            
            localStorageMock.setItem('museumCheckFireworks', JSON.stringify([oldFirework]));
            
            // Load fireworks
            const loadedFireworks = museumCheck.loadFireworks();
            
            // Should load successfully
            expect(loadedFireworks).toHaveLength(1);
            expect(loadedFireworks[0].museumName).toBe('测试博物馆');
            // fireworkType can be undefined - that's okay for backward compatibility
        });
    });
});
