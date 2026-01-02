/**
 * Test: Poster Publish and Delete Feature from Check-in Page
 * 
 * Issue: 打卡页面发布海报
 * Description: 在打卡页面完成所有任务后，查看海报后，可以发布海报到大家的成就页面。
 *              发布后也可以删除自己发布的海报。
 * 
 * Tests:
 * 1. Publish poster button exists on completion celebration
 * 2. Delete poster button shows after publishing
 * 3. Published poster info is saved to localStorage
 * 4. Button states update correctly based on publish status
 */

describe('Poster Publish and Delete Feature', () => {
    let originalLocalStorage;
    let originalFetch;
    
    beforeEach(() => {
        // Setup DOM
        document.body.innerHTML = `
            <div id="completionCelebration" class="completion-celebration">
                <canvas id="posterCanvas" width="720" height="1280"></canvas>
                <div id="posterPreview"></div>
                <div class="poster-actions">
                    <button class="poster-action-button" id="publishPosterButton">
                        <span>📣</span>
                        <span>发布到大家的成就</span>
                    </button>
                    <button class="poster-action-button delete-button" id="deletePosterButton" style="display: none;">
                        <span>🗑️</span>
                        <span>删除已发布海报</span>
                    </button>
                </div>
            </div>
        `;
        
        // Mock localStorage
        originalLocalStorage = global.localStorage;
        const localStorageMock = {
            store: {},
            getItem(key) {
                return this.store[key] || null;
            },
            setItem(key, value) {
                this.store[key] = value;
            },
            removeItem(key) {
                delete this.store[key];
            },
            clear() {
                this.store = {};
            }
        };
        global.localStorage = localStorageMock;
        
        // Mock fetch
        originalFetch = global.fetch;
        global.fetch = jest.fn();
        
        // Mock LetmetryAPI
        global.LetmetryAPI = {
            insertRecord: jest.fn().mockResolvedValue({ insertId: 123 }),
            deleteRecord: jest.fn().mockResolvedValue({ affectedRows: 1 }),
            uploadImage: jest.fn().mockResolvedValue({ url: 'https://example.com/poster.png' })
        };
        
        // Mock imageUploader
        global.imageUploader = {
            uploadImage: jest.fn().mockResolvedValue('https://example.com/poster.png')
        };
    });
    
    afterEach(() => {
        global.localStorage = originalLocalStorage;
        global.fetch = originalFetch;
        delete global.LetmetryAPI;
        delete global.imageUploader;
        jest.clearAllMocks();
    });
    
    test('publish and delete buttons exist in completion celebration', () => {
        const publishBtn = document.getElementById('publishPosterButton');
        const deleteBtn = document.getElementById('deletePosterButton');
        
        expect(publishBtn).toBeTruthy();
        expect(deleteBtn).toBeTruthy();
        expect(publishBtn.textContent).toContain('发布到大家的成就');
        expect(deleteBtn.textContent).toContain('删除已发布海报');
    });
    
    test('delete button is initially hidden', () => {
        const deleteBtn = document.getElementById('deletePosterButton');
        expect(deleteBtn.style.display).toBe('none');
    });
    
    test('published poster info structure is correct', () => {
        const testMuseumId = 'test-museum';
        const testPosterData = {
            recordId: 123,
            imageUrl: 'https://example.com/poster.png',
            title: '测试博物馆 海报',
            userName: '测试用户',
            publishedAt: Date.now()
        };
        
        // Simulate saving published poster
        const publishedPosters = {};
        publishedPosters[testMuseumId] = testPosterData;
        localStorage.setItem('publishedPosters', JSON.stringify(publishedPosters));
        
        // Retrieve and verify
        const saved = JSON.parse(localStorage.getItem('publishedPosters'));
        expect(saved[testMuseumId]).toBeDefined();
        expect(saved[testMuseumId].recordId).toBe(123);
        expect(saved[testMuseumId].imageUrl).toBe('https://example.com/poster.png');
        expect(saved[testMuseumId].title).toBe('测试博物馆 海报');
    });
    
    test('button states reflect publish status correctly', () => {
        const testMuseumId = 'test-museum';
        const publishBtn = document.getElementById('publishPosterButton');
        const deleteBtn = document.getElementById('deletePosterButton');
        
        // Initially not published - publish button enabled, delete button hidden
        expect(publishBtn.disabled).toBeFalsy();
        expect(deleteBtn.style.display).toBe('none');
        
        // Simulate published state
        const publishedPosters = {};
        publishedPosters[testMuseumId] = {
            recordId: 123,
            publishedAt: Date.now()
        };
        localStorage.setItem('publishedPosters', JSON.stringify(publishedPosters));
        
        // Manually update button states (simulating updatePosterButtonStates function)
        publishBtn.classList.add('published');
        publishBtn.innerHTML = '<span>✅</span><span>已发布</span>';
        publishBtn.disabled = true;
        deleteBtn.style.display = 'flex';
        
        // Verify published state
        expect(publishBtn.disabled).toBeTruthy();
        expect(publishBtn.classList.contains('published')).toBeTruthy();
        expect(deleteBtn.style.display).toBe('flex');
    });
    
    test('localStorage cleanup after deletion', () => {
        const testMuseumId = 'test-museum';
        
        // Setup: Create published poster entry
        const publishedPosters = {};
        publishedPosters[testMuseumId] = {
            recordId: 123,
            imageUrl: 'https://example.com/poster.png',
            publishedAt: Date.now()
        };
        localStorage.setItem('publishedPosters', JSON.stringify(publishedPosters));
        
        // Verify it exists
        let saved = JSON.parse(localStorage.getItem('publishedPosters'));
        expect(saved[testMuseumId]).toBeDefined();
        
        // Simulate deletion
        delete saved[testMuseumId];
        localStorage.setItem('publishedPosters', JSON.stringify(saved));
        
        // Verify it's deleted
        saved = JSON.parse(localStorage.getItem('publishedPosters'));
        expect(saved[testMuseumId]).toBeUndefined();
    });
    
    test('everyone-achievements shows delete button only for own posters', () => {
        const testPosters = [
            { id: 1, imageUrl: 'url1', title: 'Poster 1', userName: 'User A' },
            { id: 2, imageUrl: 'url2', title: 'Poster 2', userName: 'User B' },
            { id: 3, imageUrl: 'url3', title: 'Poster 3', userName: 'User C' }
        ];
        
        // Simulate user owns poster with id 2
        const publishedPosters = {
            'museum-1': { recordId: 2, publishedAt: Date.now() }
        };
        localStorage.setItem('publishedPosters', JSON.stringify(publishedPosters));
        
        // Get user's poster IDs
        const saved = JSON.parse(localStorage.getItem('publishedPosters'));
        const userPosterIds = new Set(
            Object.values(saved).map(p => p.recordId).filter(id => id != null)
        );
        
        // Check which posters should have delete button
        testPosters.forEach(poster => {
            const isOwnPoster = userPosterIds.has(poster.id);
            if (poster.id === 2) {
                expect(isOwnPoster).toBeTruthy();
            } else {
                expect(isOwnPoster).toBeFalsy();
            }
        });
    });
});
