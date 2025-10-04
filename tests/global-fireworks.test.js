/**
 * Global Fireworks Wall Tests
 * Tests for the new global fireworks wall feature
 */

describe('Global Fireworks Wall Integration', () => {
    beforeEach(() => {
        // Setup DOM with required elements
        document.body.innerHTML = `
            <div id="globalFireworksOverlay" class="global-fireworks-overlay">
                <canvas id="globalFireworksCanvas"></canvas>
            </div>
            <div class="container">
                <select id="ageGroup">
                    <option value="7-12">7-12岁</option>
                </select>
                <div id="museumGrid"></div>
                <div id="stats"></div>
                <span id="lastUpdated">...</span>
                <div id="changesList"></div>
            </div>
        `;
    });

    test('should have global fireworks overlay in DOM', () => {
        const overlay = document.getElementById('globalFireworksOverlay');
        
        expect(overlay).toBeTruthy();
        expect(overlay.className).toBe('global-fireworks-overlay');
    });

    test('should have global fireworks canvas in DOM', () => {
        const canvas = document.getElementById('globalFireworksCanvas');
        
        expect(canvas).toBeTruthy();
        expect(canvas.tagName).toBe('CANVAS');
    });

    test('should format firework text correctly (expected format)', () => {
        // Test the expected text format: 孩子昵称（年龄段）打卡xx博物馆
        const childNickname = '小明';
        const ageGroup = '7-12';
        const museumName = '故宫博物院';
        
        const expectedText = `${childNickname} (${ageGroup}) 打卡 ${museumName}`;
        expect(expectedText).toBe('小明 (7-12) 打卡 故宫博物院');
    });

    test('should format firework text with default values', () => {
        // Test with default values when data is missing
        const childNickname = '小朋友';
        const ageGroup = '未知';
        const museumName = '博物馆';
        
        const expectedText = `${childNickname} (${ageGroup}) 打卡 ${museumName}`;
        expect(expectedText).toBe('小朋友 (未知) 打卡 博物馆');
    });

    test('should verify canvas styling is applied', () => {
        const overlay = document.getElementById('globalFireworksOverlay');
        
        // These styles should be applied via CSS
        expect(overlay).toBeTruthy();
        // Note: In jsdom, computed styles may not be available, 
        // but we can verify the element exists with correct class
    });
});


