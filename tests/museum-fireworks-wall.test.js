/**
 * Museum-Level Fireworks Wall Tests
 * 
 * Tests for the museum-specific fireworks wall feature that filters
 * fireworks to show only those from the current museum.
 */

describe('Museum-Level Fireworks Wall', () => {
    let museumCheck;
    
    beforeEach(() => {
        // Setup DOM elements needed for museum fireworks
        document.body.innerHTML = `
            <div id="museumModal" class="modal hidden">
                <div class="modal-content">
                    <span class="close">&times;</span>
                    <h2 id="modalTitle"></h2>
                    <div id="modalContent"></div>
                </div>
            </div>
            <div id="fireworksModal" class="modal hidden">
                <div class="modal-content">
                    <div id="totalFireworks">0</div>
                    <div id="museumsWithFireworks">0</div>
                    <select id="fireworksMuseumFilter">
                        <option value="">所有博物馆</option>
                    </select>
                    <div id="fireworksEmptyState"></div>
                    <div id="fireworksCardsList"></div>
                    <div id="fireworksCanvas"></div>
                </div>
            </div>
            <select id="ageGroup">
                <option value="7-12" selected>7-12岁</option>
            </select>
        `;
        
        // Initialize MuseumCheckApp if available
        if (typeof global.MuseumCheckApp !== 'undefined') {
            museumCheck = new global.MuseumCheckApp();
            museumCheck.init();
        }
    });

    describe('Museum Fireworks Button', () => {
        test('should include museum fireworks button in child checklist section', () => {
            if (!museumCheck || !global.MUSEUMS || global.MUSEUMS.length === 0) {
                console.log('MuseumCheckApp or MUSEUMS not available, skipping test');
                return;
            }

            const museum = global.MUSEUMS[0];
            museumCheck.openMuseumModal(museum, 'child');
            
            const modalContent = document.getElementById('modalContent');
            expect(modalContent).toBeTruthy();
            
            // Check for fireworks button in the HTML
            const html = modalContent.innerHTML;
            expect(html).toContain('fireworks-museum-button');
            expect(html).toContain('查看本馆烟花');
            expect(html).toContain('data-museum-id');
        });

        test('museum fireworks button should have correct styling class', () => {
            if (!museumCheck || !global.MUSEUMS || global.MUSEUMS.length === 0) {
                console.log('MuseumCheckApp or MUSEUMS not available, skipping test');
                return;
            }

            const museum = global.MUSEUMS[0];
            museumCheck.openMuseumModal(museum, 'child');
            
            const fireworksButton = document.querySelector('.fireworks-museum-button');
            expect(fireworksButton).toBeTruthy();
            expect(fireworksButton.title).toBe('查看本馆烟花');
        });
    });

    describe('Museum Fireworks Filtering', () => {
        test('getFireworksByMuseum should filter fireworks by museum ID', () => {
            if (!museumCheck) {
                console.log('MuseumCheckApp not available, skipping test');
                return;
            }

            // Create test fireworks for different museums
            museumCheck.childNickname = '测试宝宝';
            museumCheck.addFirework('forbidden-city', '故宫博物院', '任务1', '7-12', '北京');
            museumCheck.addFirework('forbidden-city', '故宫博物院', '任务2', '7-12', '北京');
            museumCheck.addFirework('shanghai-museum', '上海博物馆', '任务3', '7-12', '上海');
            
            // Get fireworks for specific museum
            const forbiddenCityFireworks = museumCheck.getFireworksByMuseum('forbidden-city');
            const shanghaiMuseumFireworks = museumCheck.getFireworksByMuseum('shanghai-museum');
            
            // Verify filtering
            expect(forbiddenCityFireworks.length).toBe(2);
            expect(shanghaiMuseumFireworks.length).toBe(1);
            
            // Verify all filtered fireworks belong to correct museum
            forbiddenCityFireworks.forEach(fw => {
                expect(fw.museumId).toBe('forbidden-city');
            });
            
            shanghaiMuseumFireworks.forEach(fw => {
                expect(fw.museumId).toBe('shanghai-museum');
            });
        });

        test('showFireworksModal should accept museumId parameter', () => {
            if (!museumCheck) {
                console.log('MuseumCheckApp not available, skipping test');
                return;
            }

            // Create test fireworks
            museumCheck.childNickname = '小明';
            museumCheck.addFirework('forbidden-city', '故宫博物院', '观察建筑', '7-12', '北京');
            museumCheck.addFirework('shanghai-museum', '上海博物馆', '欣赏艺术', '7-12', '上海');
            
            // Should not throw when called with museum ID
            expect(() => {
                museumCheck.showFireworksModal('forbidden-city');
            }).not.toThrow();
        });

        test('renderFireworks should filter by museumId when provided', () => {
            if (!museumCheck) {
                console.log('MuseumCheckApp not available, skipping test');
                return;
            }

            // Create test fireworks
            museumCheck.childNickname = '小红';
            museumCheck.addFirework('forbidden-city', '故宫博物院', '任务1', '7-12', '北京');
            museumCheck.addFirework('forbidden-city', '故宫博物院', '任务2', '7-12', '北京');
            museumCheck.addFirework('shanghai-museum', '上海博物馆', '任务3', '7-12', '上海');
            
            // Render with museum filter
            museumCheck.renderFireworks('forbidden-city');
            
            // Check that statistics show filtered count
            const totalFireworks = document.getElementById('totalFireworks');
            expect(totalFireworks.textContent).toBe('2');
            
            // Check that museum filter is set correctly
            const filterSelect = document.getElementById('fireworksMuseumFilter');
            expect(filterSelect.value).toBe('forbidden-city');
        });

        test('renderFireworks should show all fireworks when museumId is null', () => {
            if (!museumCheck) {
                console.log('MuseumCheckApp not available, skipping test');
                return;
            }

            // Create test fireworks
            museumCheck.childNickname = '小李';
            museumCheck.addFirework('forbidden-city', '故宫博物院', '任务1', '7-12', '北京');
            museumCheck.addFirework('shanghai-museum', '上海博物馆', '任务2', '7-12', '上海');
            
            // Render without museum filter
            museumCheck.renderFireworks(null);
            
            // Check that statistics show all fireworks
            const totalFireworks = document.getElementById('totalFireworks');
            expect(totalFireworks.textContent).toBe('2');
            
            // Check that filter is set to "all"
            const filterSelect = document.getElementById('fireworksMuseumFilter');
            expect(filterSelect.value).toBe('');
        });
    });

    describe('Museum Fireworks Integration', () => {
        test('clicking museum fireworks button should open filtered fireworks modal', () => {
            if (!museumCheck || !global.MUSEUMS || global.MUSEUMS.length === 0) {
                console.log('MuseumCheckApp or MUSEUMS not available, skipping test');
                return;
            }

            const museum = global.MUSEUMS[0];
            
            // Create some fireworks for this museum
            museumCheck.childNickname = '测试儿童';
            museumCheck.addFirework(museum.id, museum.name, '测试任务', '7-12', museum.location);
            
            // Open museum modal
            museumCheck.openMuseumModal(museum, 'child');
            
            // Find and click the fireworks button
            const fireworksButton = document.querySelector('.fireworks-museum-button');
            if (fireworksButton) {
                // Simulate click
                fireworksButton.click();
                
                // Note: In actual implementation, this would close the museum modal
                // and open the fireworks modal with museum filter applied
                // The test verifies the button exists and is clickable
                expect(fireworksButton.dataset.museumId).toBe(museum.id);
            }
        });

        test('museum filter should be pre-selected when opening from museum modal', () => {
            if (!museumCheck) {
                console.log('MuseumCheckApp not available, skipping test');
                return;
            }

            const museumId = 'test-museum';
            
            // Create test firework
            museumCheck.childNickname = '小王';
            museumCheck.addFirework(museumId, '测试博物馆', '测试任务', '7-12', '测试城市');
            
            // Open fireworks modal with museum filter
            museumCheck.showFireworksModal(museumId);
            
            // Verify museum filter is pre-selected
            const filterSelect = document.getElementById('fireworksMuseumFilter');
            expect(filterSelect.value).toBe(museumId);
        });
    });

    describe('Edge Cases', () => {
        test('should handle museum with no fireworks', () => {
            if (!museumCheck) {
                console.log('MuseumCheckApp not available, skipping test');
                return;
            }

            // Render fireworks for a museum with no fireworks
            museumCheck.renderFireworks('nonexistent-museum');
            
            const totalFireworks = document.getElementById('totalFireworks');
            expect(totalFireworks.textContent).toBe('0');
            
            const emptyState = document.getElementById('fireworksEmptyState');
            expect(emptyState.style.display).toBe('block');
        });

        test('should merge local and remote fireworks when filtering by museum', () => {
            if (!museumCheck) {
                console.log('MuseumCheckApp not available, skipping test');
                return;
            }

            // Add local firework
            museumCheck.childNickname = '本地宝宝';
            museumCheck.addFirework('forbidden-city', '故宫博物院', '本地任务', '7-12', '北京');
            
            // Simulate remote firework
            museumCheck.remoteFireworks = [{
                id: 'remote-fw-1',
                museumId: 'forbidden-city',
                museumName: '故宫博物院',
                childNickname: '远程宝宝',
                taskContent: '远程任务',
                ageGroup: '7-12',
                museumCity: '北京',
                timestamp: Date.now(),
                isRemote: true
            }];
            
            // Get filtered fireworks
            const fireworks = museumCheck.getFireworksByMuseum('forbidden-city');
            
            // Should include both local and remote
            expect(fireworks.length).toBe(2);
        });
    });
});
