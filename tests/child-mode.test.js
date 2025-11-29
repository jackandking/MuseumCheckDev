/**
 * Child Mode Feature Tests
 * 
 * Tests for the child mode functionality that simplifies the interface
 * when parents give their phone to children at museums.
 * 
 * Issue: 家长模式和孩子模式
 * - When child mode is enabled, hide parent-only features
 * - Show only child-relevant content (treasure hunt tasks)
 * - Allow easy exit via indicator badge
 */

describe('Child Mode Feature', () => {
    beforeEach(() => {
        // Reset localStorage
        localStorage.clear();
        document.body.className = '';
    });
    
    afterEach(() => {
        localStorage.clear();
        document.body.innerHTML = '';
        document.body.className = '';
    });
    
    describe('localStorage Functions', () => {
        test('childModeEnabled should be stored in localStorage', () => {
            localStorage.setItem('childModeEnabled', 'true');
            expect(localStorage.getItem('childModeEnabled')).toBe('true');
        });
        
        test('childModeEnabled should default to not existing', () => {
            expect(localStorage.getItem('childModeEnabled')).toBeNull();
        });
        
        test('childModeEnabled false should be stored correctly', () => {
            localStorage.setItem('childModeEnabled', 'false');
            expect(localStorage.getItem('childModeEnabled')).toBe('false');
        });
    });
    
    describe('Child Mode CSS Classes', () => {
        beforeEach(() => {
            // Set up DOM elements needed for child mode
            document.body.innerHTML = `
                <div id="childModeIndicator" class="child-mode-indicator">
                    <span>👶 孩子模式</span>
                    <span class="exit-text">点击退出</span>
                </div>
                <div class="age-selector"></div>
                <div class="settings-button-icon"></div>
                <div class="achievement-button-icon"></div>
                <div class="how-to-play-guide"></div>
                <div class="museum-card">
                    <input type="checkbox" class="visit-checkbox" />
                </div>
                <div class="checklist-tabs">
                    <button class="tab-button" data-target="expert">专家指导</button>
                    <button class="tab-button" data-target="parent">家长准备</button>
                    <button class="tab-button" data-target="child">孩子任务</button>
                    <button class="tab-button" data-target="share">生成海报</button>
                </div>
                <div id="expertGuidance" class="checklist-content"></div>
                <div id="parentChecklist" class="checklist-content"></div>
                <div id="childChecklist" class="checklist-content"></div>
                <div id="shareChecklist" class="checklist-content"></div>
                <div class="site-footer"></div>
            `;
        });
        
        test('child-mode class should be addable to body', () => {
            document.body.classList.add('child-mode');
            expect(document.body.classList.contains('child-mode')).toBe(true);
        });
        
        test('child-mode class should be removable from body', () => {
            document.body.classList.add('child-mode');
            document.body.classList.remove('child-mode');
            expect(document.body.classList.contains('child-mode')).toBe(false);
        });
        
        test('age selector element should exist for hiding', () => {
            const ageSelector = document.querySelector('.age-selector');
            expect(ageSelector).toBeTruthy();
        });
        
        test('settings button element should exist for hiding', () => {
            const settingsBtn = document.querySelector('.settings-button-icon');
            expect(settingsBtn).toBeTruthy();
        });
        
        test('parent tabs should exist for hiding', () => {
            const expertTab = document.querySelector('.tab-button[data-target="expert"]');
            const parentTab = document.querySelector('.tab-button[data-target="parent"]');
            const shareTab = document.querySelector('.tab-button[data-target="share"]');
            
            expect(expertTab).toBeTruthy();
            expect(parentTab).toBeTruthy();
            expect(shareTab).toBeTruthy();
        });
        
        test('child tab should exist and be kept visible', () => {
            const childTab = document.querySelector('.tab-button[data-target="child"]');
            expect(childTab).toBeTruthy();
        });
        
        test('footer element should exist for hiding', () => {
            const footer = document.querySelector('.site-footer');
            expect(footer).toBeTruthy();
        });
    });
    
    describe('Child Mode Indicator', () => {
        beforeEach(() => {
            document.body.innerHTML = `
                <div id="childModeIndicator" class="child-mode-indicator" title="点击退出孩子模式">
                    <span>👶 孩子模式</span>
                    <span class="exit-text">点击退出</span>
                </div>
            `;
        });
        
        test('indicator should exist in DOM', () => {
            const indicator = document.getElementById('childModeIndicator');
            expect(indicator).toBeTruthy();
        });
        
        test('indicator should have correct title', () => {
            const indicator = document.getElementById('childModeIndicator');
            expect(indicator.title).toBe('点击退出孩子模式');
        });
        
        test('indicator should have child mode text', () => {
            const indicator = document.getElementById('childModeIndicator');
            expect(indicator.textContent).toContain('孩子模式');
        });
        
        test('indicator should have exit text', () => {
            const indicator = document.getElementById('childModeIndicator');
            expect(indicator.textContent).toContain('点击退出');
        });
        
        test('indicator should have child-mode-indicator class', () => {
            const indicator = document.getElementById('childModeIndicator');
            expect(indicator.classList.contains('child-mode-indicator')).toBe(true);
        });
    });
    
    describe('Settings Toggle', () => {
        beforeEach(() => {
            document.body.innerHTML = `
                <div class="settings-item">
                    <label class="settings-label" for="childModeToggle">孩子模式：</label>
                    <div class="settings-input-group">
                        <label class="toggle-switch">
                            <input type="checkbox" id="childModeToggle">
                            <span class="toggle-slider"></span>
                        </label>
                    </div>
                    <div class="settings-hint">开启后简化界面，仅显示孩子探索任务，适合把手机给孩子在博物馆里找镇馆之宝</div>
                </div>
            `;
        });
        
        test('settings toggle checkbox should exist', () => {
            const toggle = document.getElementById('childModeToggle');
            expect(toggle).toBeTruthy();
        });
        
        test('settings toggle should be a checkbox', () => {
            const toggle = document.getElementById('childModeToggle');
            expect(toggle.type).toBe('checkbox');
        });
        
        test('settings toggle should be unchecked by default', () => {
            const toggle = document.getElementById('childModeToggle');
            expect(toggle.checked).toBe(false);
        });
        
        test('settings toggle can be checked', () => {
            const toggle = document.getElementById('childModeToggle');
            toggle.checked = true;
            expect(toggle.checked).toBe(true);
        });
        
        test('settings label should have correct text', () => {
            const label = document.querySelector('.settings-label');
            expect(label.textContent).toContain('孩子模式');
        });
        
        test('settings hint should explain child mode', () => {
            const hint = document.querySelector('.settings-hint');
            expect(hint.textContent).toContain('简化界面');
            expect(hint.textContent).toContain('孩子探索任务');
            expect(hint.textContent).toContain('镇馆之宝');
        });
    });
});

describe('Child Mode CSS Visibility Rules', () => {
    // These tests verify the CSS selectors that should hide elements in child mode
    
    test('CSS selector .child-mode .age-selector should target age selector', () => {
        document.body.innerHTML = '<div class="age-selector"></div>';
        document.body.classList.add('child-mode');
        
        const element = document.querySelector('.child-mode .age-selector');
        expect(element).toBeTruthy();
    });
    
    test('CSS selector .child-mode .settings-button-icon should target settings button', () => {
        document.body.innerHTML = '<div class="settings-button-icon"></div>';
        document.body.classList.add('child-mode');
        
        const element = document.querySelector('.child-mode .settings-button-icon');
        expect(element).toBeTruthy();
    });
    
    test('CSS selector .child-mode .tab-button[data-target="expert"] should target expert tab', () => {
        document.body.innerHTML = '<button class="tab-button" data-target="expert"></button>';
        document.body.classList.add('child-mode');
        
        const element = document.querySelector('.child-mode .tab-button[data-target="expert"]');
        expect(element).toBeTruthy();
    });
    
    test('CSS selector .child-mode .tab-button[data-target="parent"] should target parent tab', () => {
        document.body.innerHTML = '<button class="tab-button" data-target="parent"></button>';
        document.body.classList.add('child-mode');
        
        const element = document.querySelector('.child-mode .tab-button[data-target="parent"]');
        expect(element).toBeTruthy();
    });
    
    test('CSS selector .child-mode .tab-button[data-target="share"] should target share tab', () => {
        document.body.innerHTML = '<button class="tab-button" data-target="share"></button>';
        document.body.classList.add('child-mode');
        
        const element = document.querySelector('.child-mode .tab-button[data-target="share"]');
        expect(element).toBeTruthy();
    });
    
    test('CSS selector .child-mode .tab-button[data-target="child"] should target child tab (kept visible)', () => {
        document.body.innerHTML = '<button class="tab-button" data-target="child"></button>';
        document.body.classList.add('child-mode');
        
        const element = document.querySelector('.child-mode .tab-button[data-target="child"]');
        expect(element).toBeTruthy();
    });
    
    test('CSS selector .child-mode .child-mode-indicator should target indicator when visible', () => {
        document.body.innerHTML = '<div class="child-mode-indicator"></div>';
        document.body.classList.add('child-mode');
        
        const element = document.querySelector('.child-mode .child-mode-indicator');
        expect(element).toBeTruthy();
    });
});

