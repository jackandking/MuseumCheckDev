/**
 * Fireworks Button Visibility Tests
 * 
 * Tests that the fireworks buttons are only shown when there are fireworks available
 * Issue: 当有对应烟花可以放时才显示烟花按钮
 */

describe('Fireworks Button Visibility', () => {
    let museumCheck;
    
    beforeEach(() => {
        // Setup minimal DOM
        document.body.innerHTML = `
            <button id="fireworksButton" class="fireworks-button" style="display: none;">🎆</button>
            <div id="fireworksModal" class="modal hidden">
                <div id="fireworksEmptyState"></div>
                <div id="fireworksCardsList" style="display: none;"></div>
                <button id="demoFireworkButton" class="demo-firework-button" style="display: none;">🎇 手动放烟花</button>
                <div id="totalFireworks">0</div>
                <div id="museumsWithFireworks">0</div>
                <select id="fireworksMuseumFilter">
                    <option value="">所有博物馆</option>
                </select>
            </div>
        `;
        
        // Clear localStorage
        localStorage.clear();
        
        // Initialize MuseumCheckApp if available
        if (typeof global.MuseumCheckApp !== 'undefined') {
            museumCheck = new global.MuseumCheckApp();
            museumCheck.fireworks = [];
            museumCheck.remoteFireworks = [];
        }
    });
    
    afterEach(() => {
        localStorage.clear();
    });

    describe('Main Fireworks Button (on main page)', () => {
        test('should be hidden when no fireworks exist', () => {
            if (!museumCheck) {
                console.log('MuseumCheckApp not available, skipping test');
                return;
            }

            museumCheck.updateFireworksButtonVisibility();
            
            const button = document.getElementById('fireworksButton');
            expect(button.style.display).toBe('none');
        });

        test('should be visible when local fireworks exist', () => {
            if (!museumCheck) {
                console.log('MuseumCheckApp not available, skipping test');
                return;
            }

            museumCheck.fireworks = [{
                id: 'test-1',
                museumId: 'forbidden-city',
                museumName: '故宫博物院',
                taskContent: '观察建筑',
                timestamp: Date.now()
            }];
            
            museumCheck.updateFireworksButtonVisibility();
            
            const button = document.getElementById('fireworksButton');
            expect(button.style.display).not.toBe('none');
        });

        test('should be visible when remote fireworks exist', () => {
            if (!museumCheck) {
                console.log('MuseumCheckApp not available, skipping test');
                return;
            }

            museumCheck.remoteFireworks = [{
                id: 'test-2',
                museumId: 'shanghai-museum',
                museumName: '上海博物馆',
                taskContent: '欣赏艺术',
                timestamp: Date.now(),
                isRemote: true
            }];
            
            museumCheck.updateFireworksButtonVisibility();
            
            const button = document.getElementById('fireworksButton');
            expect(button.style.display).not.toBe('none');
        });

        test('should be hidden after clearing all fireworks', () => {
            if (!museumCheck) {
                console.log('MuseumCheckApp not available, skipping test');
                return;
            }

            // Start with fireworks
            museumCheck.fireworks = [{
                id: 'test-1',
                museumId: 'forbidden-city',
                museumName: '故宫博物院',
                taskContent: '观察建筑',
                timestamp: Date.now()
            }];
            
            museumCheck.updateFireworksButtonVisibility();
            const button = document.getElementById('fireworksButton');
            expect(button.style.display).not.toBe('none');
            
            // Clear fireworks
            museumCheck.fireworks = [];
            museumCheck.remoteFireworks = [];
            museumCheck.updateFireworksButtonVisibility();
            
            expect(button.style.display).toBe('none');
        });
    });

    describe('Button visibility with no fireworks', () => {
        test('should hide button when there are no fireworks', () => {
            if (!museumCheck) {
                console.log('MuseumCheckApp not available, skipping test');
                return;
            }

            // Clear any existing fireworks
            localStorage.setItem('museumCheckFireworks', JSON.stringify([]));
            
            // Render fireworks (should be empty)
            museumCheck.renderFireworks();
            
            // Button should be hidden
            const demoButton = document.getElementById('demoFireworkButton');
            expect(demoButton.style.display).toBe('none');
        });

        test('should show empty state when there are no fireworks', () => {
            if (!museumCheck) {
                console.log('MuseumCheckApp not available, skipping test');
                return;
            }

            // Clear any existing fireworks
            localStorage.setItem('museumCheckFireworks', JSON.stringify([]));
            
            // Render fireworks
            museumCheck.renderFireworks();
            
            // Empty state should be visible
            const emptyState = document.getElementById('fireworksEmptyState');
            expect(emptyState.style.display).not.toBe('none');
            expect(emptyState.style.display).toBeTruthy();
        });
    });

    describe('Button visibility with fireworks', () => {
        test('should show button when there are fireworks', () => {
            if (!museumCheck) {
                console.log('MuseumCheckApp not available, skipping test');
                return;
            }

            // Add some test fireworks
            const testFireworks = [
                {
                    id: 'test-1',
                    museumId: 'forbidden-city',
                    museumName: '故宫博物院',
                    taskContent: '观察建筑',
                    childNickname: '小明',
                    ageGroup: '7-12',
                    timestamp: Date.now(),
                    city: '北京'
                },
                {
                    id: 'test-2',
                    museumId: 'forbidden-city',
                    museumName: '故宫博物院',
                    taskContent: '学习历史',
                    childNickname: '小红',
                    ageGroup: '7-12',
                    timestamp: Date.now(),
                    city: '北京'
                }
            ];
            
            localStorage.setItem('museumCheckFireworks', JSON.stringify(testFireworks));
            
            // Render fireworks
            museumCheck.renderFireworks();
            
            // Button should be visible
            const demoButton = document.getElementById('demoFireworkButton');
            expect(demoButton.style.display).toBe('block');
        });

        test('should hide empty state when there are fireworks', () => {
            if (!museumCheck) {
                console.log('MuseumCheckApp not available, skipping test');
                return;
            }

            // Add test fireworks
            const testFireworks = [
                {
                    id: 'test-1',
                    museumId: 'forbidden-city',
                    museumName: '故宫博物院',
                    taskContent: '观察建筑',
                    childNickname: '小明',
                    ageGroup: '7-12',
                    timestamp: Date.now(),
                    city: '北京'
                }
            ];
            
            localStorage.setItem('museumCheckFireworks', JSON.stringify(testFireworks));
            
            // Render fireworks
            museumCheck.renderFireworks();
            
            // Empty state should be hidden
            const emptyState = document.getElementById('fireworksEmptyState');
            expect(emptyState.style.display).toBe('none');
        });

        test('should show fireworks list when there are fireworks', () => {
            if (!museumCheck) {
                console.log('MuseumCheckApp not available, skipping test');
                return;
            }

            // Add test fireworks
            const testFireworks = [
                {
                    id: 'test-1',
                    museumId: 'forbidden-city',
                    museumName: '故宫博物院',
                    taskContent: '观察建筑',
                    childNickname: '小明',
                    ageGroup: '7-12',
                    timestamp: Date.now(),
                    city: '北京'
                }
            ];
            
            localStorage.setItem('museumCheckFireworks', JSON.stringify(testFireworks));
            
            // Render fireworks
            museumCheck.renderFireworks();
            
            // Fireworks list should be visible
            const fireworksList = document.getElementById('fireworksCardsList');
            expect(fireworksList.style.display).toBe('block');
        });
    });

    describe('Button visibility toggling', () => {
        test('should hide button when transitioning from fireworks to empty', () => {
            if (!museumCheck) {
                console.log('MuseumCheckApp not available, skipping test');
                return;
            }

            // Start with fireworks
            const testFireworks = [
                {
                    id: 'test-1',
                    museumId: 'forbidden-city',
                    museumName: '故宫博物院',
                    taskContent: '观察建筑',
                    childNickname: '小明',
                    ageGroup: '7-12',
                    timestamp: Date.now(),
                    city: '北京'
                }
            ];
            
            localStorage.setItem('museumCheckFireworks', JSON.stringify(testFireworks));
            museumCheck.renderFireworks();
            
            // Button should be visible
            const demoButton = document.getElementById('demoFireworkButton');
            expect(demoButton.style.display).toBe('block');
            
            // Clear fireworks
            localStorage.setItem('museumCheckFireworks', JSON.stringify([]));
            museumCheck.renderFireworks();
            
            // Button should now be hidden
            expect(demoButton.style.display).toBe('none');
        });

        test('should show button when transitioning from empty to fireworks', () => {
            if (!museumCheck) {
                console.log('MuseumCheckApp not available, skipping test');
                return;
            }

            // Start with no fireworks
            localStorage.setItem('museumCheckFireworks', JSON.stringify([]));
            museumCheck.renderFireworks();
            
            // Button should be hidden
            const demoButton = document.getElementById('demoFireworkButton');
            expect(demoButton.style.display).toBe('none');
            
            // Add fireworks
            const testFireworks = [
                {
                    id: 'test-1',
                    museumId: 'forbidden-city',
                    museumName: '故宫博物院',
                    taskContent: '观察建筑',
                    childNickname: '小明',
                    ageGroup: '7-12',
                    timestamp: Date.now(),
                    city: '北京'
                }
            ];
            
            localStorage.setItem('museumCheckFireworks', JSON.stringify(testFireworks));
            museumCheck.renderFireworks();
            
            // Button should now be visible
            expect(demoButton.style.display).toBe('block');
        });
    });

    describe('Museum-Level Fireworks Button', () => {
        beforeEach(() => {
            // Add museum cards to DOM
            document.body.innerHTML += `
                <div id="museumGrid">
                    <div class="museum-card">
                        <button class="museum-fireworks-button" data-museum="forbidden-city" style="display: none;">🎆</button>
                    </div>
                    <div class="museum-card">
                        <button class="museum-fireworks-button" data-museum="shanghai-museum" style="display: none;">🎆</button>
                    </div>
                    <div class="museum-card">
                        <button class="museum-fireworks-button" data-museum="national-museum" style="display: none;">🎆</button>
                    </div>
                </div>
            `;
        });

        test('should hide all museum buttons when no fireworks exist', () => {
            if (!museumCheck) {
                console.log('MuseumCheckApp not available, skipping test');
                return;
            }

            museumCheck.fireworks = [];
            museumCheck.remoteFireworks = [];
            museumCheck.updateFireworksButtonVisibility();
            
            const buttons = document.querySelectorAll('.museum-fireworks-button');
            buttons.forEach(button => {
                expect(button.style.display).toBe('none');
            });
        });

        test('should show button only for museums with fireworks', () => {
            if (!museumCheck) {
                console.log('MuseumCheckApp not available, skipping test');
                return;
            }

            // Add fireworks for forbidden-city only
            museumCheck.fireworks = [{
                id: 'test-1',
                museumId: 'forbidden-city',
                museumName: '故宫博物院',
                taskContent: '观察建筑',
                timestamp: Date.now()
            }];
            museumCheck.remoteFireworks = [];
            
            museumCheck.updateFireworksButtonVisibility();
            
            const forbiddenCityButton = document.querySelector('[data-museum="forbidden-city"]');
            const shanghaiButton = document.querySelector('[data-museum="shanghai-museum"]');
            const nationalButton = document.querySelector('[data-museum="national-museum"]');
            
            expect(forbiddenCityButton.style.display).not.toBe('none');
            expect(shanghaiButton.style.display).toBe('none');
            expect(nationalButton.style.display).toBe('none');
        });

        test('should show buttons for multiple museums with fireworks', () => {
            if (!museumCheck) {
                console.log('MuseumCheckApp not available, skipping test');
                return;
            }

            // Add fireworks for multiple museums
            museumCheck.fireworks = [{
                id: 'test-1',
                museumId: 'forbidden-city',
                museumName: '故宫博物院',
                taskContent: '观察建筑',
                timestamp: Date.now()
            }];
            museumCheck.remoteFireworks = [{
                id: 'test-2',
                museumId: 'shanghai-museum',
                museumName: '上海博物馆',
                taskContent: '欣赏艺术',
                timestamp: Date.now(),
                isRemote: true
            }];
            
            museumCheck.updateFireworksButtonVisibility();
            
            const forbiddenCityButton = document.querySelector('[data-museum="forbidden-city"]');
            const shanghaiButton = document.querySelector('[data-museum="shanghai-museum"]');
            const nationalButton = document.querySelector('[data-museum="national-museum"]');
            
            expect(forbiddenCityButton.style.display).not.toBe('none');
            expect(shanghaiButton.style.display).not.toBe('none');
            expect(nationalButton.style.display).toBe('none');
        });

        test('should hide museum button when fireworks are cleared', () => {
            if (!museumCheck) {
                console.log('MuseumCheckApp not available, skipping test');
                return;
            }

            // Start with fireworks
            museumCheck.fireworks = [{
                id: 'test-1',
                museumId: 'forbidden-city',
                museumName: '故宫博物院',
                taskContent: '观察建筑',
                timestamp: Date.now()
            }];
            
            museumCheck.updateFireworksButtonVisibility();
            const button = document.querySelector('[data-museum="forbidden-city"]');
            expect(button.style.display).not.toBe('none');
            
            // Clear fireworks
            museumCheck.fireworks = [];
            museumCheck.remoteFireworks = [];
            museumCheck.updateFireworksButtonVisibility();
            
            expect(button.style.display).toBe('none');
        });

        test('should handle mixed local and remote fireworks correctly', () => {
            if (!museumCheck) {
                console.log('MuseumCheckApp not available, skipping test');
                return;
            }

            // Add local firework for forbidden-city
            museumCheck.fireworks = [{
                id: 'test-1',
                museumId: 'forbidden-city',
                museumName: '故宫博物院',
                taskContent: '观察建筑',
                timestamp: Date.now()
            }];
            
            // Add remote firework for forbidden-city (should still show only one button)
            museumCheck.remoteFireworks = [{
                id: 'test-2',
                museumId: 'forbidden-city',
                museumName: '故宫博物院',
                taskContent: '学习历史',
                timestamp: Date.now(),
                isRemote: true
            }];
            
            museumCheck.updateFireworksButtonVisibility();
            
            const forbiddenCityButton = document.querySelector('[data-museum="forbidden-city"]');
            expect(forbiddenCityButton.style.display).not.toBe('none');
        });
    });
});
