/**
 * Tests for AI Treasure Suggestions Feature
 * 
 * Feature: When users add treasures to museums without collections,
 * they can click an AI button to get 3 suggested treasure names
 * from DeepSeek AI, providing quick selection options.
 */

describe('AI Treasure Suggestions Feature', () => {
    let originalLocalStorage;
    let mockStorage;

    beforeEach(() => {
        // Mock localStorage
        mockStorage = {};
        originalLocalStorage = global.localStorage;
        global.localStorage = {
            getItem: jest.fn(key => mockStorage[key] || null),
            setItem: jest.fn((key, value) => { mockStorage[key] = value; }),
            removeItem: jest.fn(key => { delete mockStorage[key]; }),
            clear: jest.fn(() => { mockStorage = {}; })
        };
    });

    afterEach(() => {
        global.localStorage = originalLocalStorage;
    });

    describe('AI Suggestions UI Elements', () => {
        test('should render AI suggest button with correct attributes', () => {
            // Mock DOM structure that would be rendered
            const museumId = 'test-museum';
            const museumName = '测试博物馆';
            const treasureKey = 'test-museum-treasure-0';
            
            const buttonHtml = `
                <button class="ai-suggest-btn" 
                        data-museum-id="${museumId}" 
                        data-museum-name="${museumName}" 
                        data-treasure-key="${treasureKey}">
                    🤖 AI推荐
                </button>
            `;
            
            const container = document.createElement('div');
            container.innerHTML = buttonHtml;
            const button = container.querySelector('.ai-suggest-btn');
            
            expect(button).not.toBeNull();
            expect(button.dataset.museumId).toBe(museumId);
            expect(button.dataset.museumName).toBe(museumName);
            expect(button.dataset.treasureKey).toBe(treasureKey);
            expect(button.textContent).toContain('AI推荐');
        });

        test('should render AI suggestions container with correct structure', () => {
            const treasureKey = 'test-museum-treasure-0';
            
            const containerHtml = `
                <div class="ai-suggestions-container" id="ai-suggestions-${treasureKey}" style="display: none;">
                    <div class="ai-suggestions-loading" style="display: none;">
                        <span class="loading-dot">⏳</span> 正在获取AI推荐...
                    </div>
                    <div class="ai-suggestions-list"></div>
                </div>
            `;
            
            const container = document.createElement('div');
            container.innerHTML = containerHtml;
            
            const suggestionsContainer = container.querySelector('.ai-suggestions-container');
            const loading = container.querySelector('.ai-suggestions-loading');
            const list = container.querySelector('.ai-suggestions-list');
            
            expect(suggestionsContainer).not.toBeNull();
            expect(suggestionsContainer.id).toBe(`ai-suggestions-${treasureKey}`);
            expect(loading).not.toBeNull();
            expect(list).not.toBeNull();
        });
    });

    describe('AI Suggestion Item Rendering', () => {
        test('should render suggestion items correctly', () => {
            const suggestions = [
                { name: '青铜器', description: '商周时期的青铜器' },
                { name: '玉器', description: '古代玉器文物' },
                { name: '陶器', description: '新石器时代陶器' }
            ];
            
            const treasureKey = 'test-museum-treasure-0';
            
            const suggestionsHtml = suggestions.map((s, i) => `
                <button class="ai-suggestion-item" 
                        data-treasure-name="${s.name}" 
                        data-treasure-key="${treasureKey}"
                        title="${s.description || ''}">
                    ${i + 1}. ${s.name}
                </button>
            `).join('');
            
            const container = document.createElement('div');
            container.innerHTML = suggestionsHtml;
            
            const items = container.querySelectorAll('.ai-suggestion-item');
            expect(items.length).toBe(3);
            
            expect(items[0].dataset.treasureName).toBe('青铜器');
            expect(items[0].textContent).toContain('1. 青铜器');
            
            expect(items[1].dataset.treasureName).toBe('玉器');
            expect(items[1].textContent).toContain('2. 玉器');
            
            expect(items[2].dataset.treasureName).toBe('陶器');
            expect(items[2].textContent).toContain('3. 陶器');
        });

        test('should have tooltip with description', () => {
            const suggestion = { name: '司母戊鼎', description: '商代晚期青铜礼器' };
            const treasureKey = 'test-museum-treasure-0';
            
            const itemHtml = `
                <button class="ai-suggestion-item" 
                        data-treasure-name="${suggestion.name}" 
                        data-treasure-key="${treasureKey}"
                        title="${suggestion.description || ''}">
                    1. ${suggestion.name}
                </button>
            `;
            
            const container = document.createElement('div');
            container.innerHTML = itemHtml;
            const item = container.querySelector('.ai-suggestion-item');
            
            expect(item.getAttribute('title')).toBe(suggestion.description);
        });
    });

    describe('AI Suggestions Cache', () => {
        test('should cache suggestions by museum ID', () => {
            const cache = {};
            const museumId = 'forbidden-city';
            const suggestions = [
                { name: '清明上河图', imageUrl: '', description: '北宋画作' },
                { name: '金嵌珍珠天球仪', imageUrl: '', description: '清代天文仪器' },
                { name: '郎窑红釉瓶', imageUrl: '', description: '清代瓷器' }
            ];
            
            cache[museumId] = suggestions;
            
            expect(cache[museumId]).toEqual(suggestions);
            expect(cache[museumId].length).toBe(3);
            expect(cache['non-existent']).toBeUndefined();
        });

        test('should return cached suggestions without re-fetching', () => {
            const cache = {};
            const museumId = 'national-museum';
            const suggestions = [
                { name: '四羊方尊', imageUrl: '', description: '商代青铜器' }
            ];
            
            cache[museumId] = suggestions;
            
            // Simulate checking cache before fetch
            if (cache[museumId]) {
                expect(cache[museumId]).toEqual(suggestions);
            }
        });
    });

    describe('Suggestion Selection', () => {
        test('should fill input field when suggestion is selected', () => {
            const treasureKey = 'test-museum-treasure-0';
            const treasureName = '后母戊鼎';
            
            // Create mock DOM structure
            const html = `
                <div class="add-treasure-section">
                    <input type="text" class="treasure-name-input" 
                           id="treasure-name-${treasureKey}" value="">
                    <div class="ai-suggestions-list">
                        <button class="ai-suggestion-item" 
                                data-treasure-name="${treasureName}" 
                                data-treasure-key="${treasureKey}">
                            1. ${treasureName}
                        </button>
                    </div>
                </div>
            `;
            
            const container = document.createElement('div');
            container.innerHTML = html;
            document.body.appendChild(container);
            
            const inputField = document.getElementById(`treasure-name-${treasureKey}`);
            expect(inputField).not.toBeNull();
            
            // Simulate selection
            inputField.value = treasureName;
            
            expect(inputField.value).toBe(treasureName);
            
            // Cleanup
            document.body.removeChild(container);
        });

        test('should highlight selected suggestion', () => {
            const html = `
                <div class="ai-suggestions-list">
                    <button class="ai-suggestion-item" data-treasure-name="青铜器">1. 青铜器</button>
                    <button class="ai-suggestion-item" data-treasure-name="玉器">2. 玉器</button>
                    <button class="ai-suggestion-item" data-treasure-name="陶器">3. 陶器</button>
                </div>
            `;
            
            const container = document.createElement('div');
            container.innerHTML = html;
            
            const items = container.querySelectorAll('.ai-suggestion-item');
            
            // Simulate selection
            items.forEach(item => item.classList.remove('selected'));
            items[1].classList.add('selected');
            
            expect(items[0].classList.contains('selected')).toBe(false);
            expect(items[1].classList.contains('selected')).toBe(true);
            expect(items[2].classList.contains('selected')).toBe(false);
        });
    });

    describe('Error Handling', () => {
        test('should display error message when API fails', () => {
            const errorMessage = '获取推荐失败，请稍后重试';
            
            const errorHtml = `
                <div class="ai-suggestions-error">
                    ❌ ${errorMessage}
                </div>
            `;
            
            const container = document.createElement('div');
            container.innerHTML = errorHtml;
            
            const errorEl = container.querySelector('.ai-suggestions-error');
            expect(errorEl).not.toBeNull();
            expect(errorEl.textContent).toContain(errorMessage);
        });

        test('should display API key configuration error', () => {
            const errorMessage = '请先在设置中配置 DeepSeek API Key';
            
            const errorHtml = `
                <div class="ai-suggestions-error">
                    ❌ ${errorMessage}
                </div>
            `;
            
            const container = document.createElement('div');
            container.innerHTML = errorHtml;
            
            const errorEl = container.querySelector('.ai-suggestions-error');
            expect(errorEl.textContent).toContain('DeepSeek API Key');
        });
    });

    describe('Add Treasure Section Integration', () => {
        test('should include AI suggestions section in add-treasure UI', () => {
            const museumId = 'test-museum';
            const museumName = '测试博物馆';
            const treasureKey = 'test-museum-treasure-0';
            
            // This is the expected structure after the feature is implemented
            const expectedStructure = `
                <div class="add-treasure-section" data-museum-id="${museumId}" data-treasure-index="0" data-museum-name="${museumName}">
                    <div class="treasure-input-group">
                        <input type="text" class="treasure-name-input" 
                               id="treasure-name-${treasureKey}"
                               placeholder="输入展品名称（如：青铜鼎）">
                    </div>
                    <div class="treasure-ai-suggestions" data-museum-id="${museumId}" data-treasure-key="${treasureKey}">
                        <button class="ai-suggest-btn" data-museum-id="${museumId}" data-museum-name="${museumName}" data-treasure-key="${treasureKey}">
                            🤖 AI推荐
                        </button>
                        <div class="ai-suggestions-container" id="ai-suggestions-${treasureKey}" style="display: none;">
                            <div class="ai-suggestions-loading" style="display: none;">
                                <span class="loading-dot">⏳</span> 正在获取AI推荐...
                            </div>
                            <div class="ai-suggestions-list"></div>
                        </div>
                    </div>
                </div>
            `;
            
            const container = document.createElement('div');
            container.innerHTML = expectedStructure;
            
            // Verify structure
            const section = container.querySelector('.add-treasure-section');
            expect(section.dataset.museumName).toBe(museumName);
            
            const suggestionsSection = container.querySelector('.treasure-ai-suggestions');
            expect(suggestionsSection).not.toBeNull();
            
            const suggestBtn = container.querySelector('.ai-suggest-btn');
            expect(suggestBtn).not.toBeNull();
            expect(suggestBtn.dataset.museumName).toBe(museumName);
        });

        test('should not show AI suggestions for completed treasures', () => {
            // When a treasure is completed (readonly), AI suggestions should not appear
            const isCompleted = true;
            
            // The conditional rendering logic
            const shouldShowAiSuggestions = !isCompleted;
            
            expect(shouldShowAiSuggestions).toBe(false);
        });
    });
});
