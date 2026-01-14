/**
 * Test: Returning users should see browsed museums
 * Scenario: User clicks a museum card → enters museum-checkin page → returns to homepage
 * Expected: The clicked museum should be visible on homepage
 */

// Mock localStorage
const localStorageMock = {};
global.localStorage = {
    getItem: (key) => localStorageMock[key] || null,
    setItem: (key, value) => { localStorageMock[key] = value; },
    removeItem: (key) => { delete localStorageMock[key]; },
    clear: () => { for (let key in localStorageMock) delete localStorageMock[key]; }
};

// Mock MUSEUMS array (simplified)
const MUSEUMS = [
    { id: 'natural-history', name: '自然博物馆', location: '北京' },
    { id: 'forbidden-city', name: '故宫博物院', location: '北京' },
    { id: 'shanghai-museum', name: '上海博物馆', location: '上海' }
];

// Mock APP_CONFIG
const APP_CONFIG = {
    LOCAL_STORAGE_KEYS: {
        VISITED_MUSEUMS: 'visitedMuseums',
        VISITED_MUSEUMS_META: 'visitedMuseumsMeta',
        BROWSED_MUSEUMS: 'browsedMuseums',
        FAVORITE_MUSEUMS: 'favoriteMuseums',
        MUSEUM_CHECKLISTS: 'museumChecklists'
    },
    DEFAULT_AGE: '7-12'
};

describe('Browsed Museums Display', () => {
    let app;

    beforeEach(() => {
        localStorage.clear();
        
        // Simulate the MuseumCheckApp initialization (simplified)
        app = {
            visitedMuseums: [],
            favoriteMuseums: [],
            browsedMuseums: {},
            lastSearchQuery: '',
            filteredMuseums: MUSEUMS,
            
            loadBrowsedMuseums() {
                try {
                    const saved = localStorage.getItem(APP_CONFIG.LOCAL_STORAGE_KEYS.BROWSED_MUSEUMS);
                    return saved ? JSON.parse(saved) : {};
                } catch (error) {
                    return {};
                }
            },
            
            saveBrowsedMuseums() {
                try {
                    localStorage.setItem(APP_CONFIG.LOCAL_STORAGE_KEYS.BROWSED_MUSEUMS, JSON.stringify(this.browsedMuseums));
                } catch (error) {
                    console.error('Failed to save browsed museums:', error);
                }
            },
            
            markMuseumAsBrowsed(museumId) {
                if (!museumId) return;
                this.browsedMuseums[museumId] = Date.now();
                this.saveBrowsedMuseums();
            },
            
            loadVisitedMuseumsMeta() {
                try {
                    const saved = localStorage.getItem(APP_CONFIG.LOCAL_STORAGE_KEYS.VISITED_MUSEUMS_META);
                    return saved ? JSON.parse(saved) : {};
                } catch (error) {
                    return {};
                }
            },
            
            getVisitedMuseumsSorted() {
                const meta = this.loadVisitedMuseumsMeta();
                const sortedIds = Object.entries(meta)
                    .sort((a, b) => (b[1].timestamp || 0) - (a[1].timestamp || 0))
                    .map(entry => entry[0]);
                return sortedIds.map(id => MUSEUMS.find(m => m.id === id)).filter(m => m);
            },
            
            renderMuseums() {
                // Determine if user is new
                const isNewUser = (!this.visitedMuseums || this.visitedMuseums.length === 0)
                    && (!this.favoriteMuseums || this.favoriteMuseums.length === 0)
                    && (!this.lastSearchQuery || this.lastSearchQuery.trim() === '')
                    && (!this.browsedMuseums || Object.keys(this.browsedMuseums).length === 0);

                // Determine returning user
                const isReturningUser = (Array.isArray(this.visitedMuseums) && this.visitedMuseums.length > 0)
                    || (Object.keys(this.loadVisitedMuseumsMeta() || {}).length > 0)
                    || (Object.keys(this.browsedMuseums || {}).length > 0);

                let museumsToRender = this.filteredMuseums;

                // Returning users: show browsed museums sorted by recent browse time
                if (isReturningUser) {
                    // Get visited museums (fully completed) - these come first
                    const visitedMuseums = this.getVisitedMuseumsSorted();
                    
                    // Get browsed museums (just clicked the card) - these come after, sorted by browse time
                    const browsedMuseumIds = Object.keys(this.browsedMuseums);
                    const browsedMuseumsNotVisited = browsedMuseumIds
                        .filter(id => !this.visitedMuseums.includes(id))
                        .map(id => MUSEUMS.find(m => m.id === id))
                        .filter(m => m)
                        .sort((a, b) => {
                            const timeA = this.browsedMuseums[a.id] || 0;
                            const timeB = this.browsedMuseums[b.id] || 0;
                            return timeB - timeA;
                        });
                    
                    // Combine visited and browsed
                    museumsToRender = [...visitedMuseums, ...browsedMuseumsNotVisited];
                }

                return museumsToRender;
            }
        };
        
        // Initialize browsedMuseums from localStorage
        app.browsedMuseums = app.loadBrowsedMuseums();
    });

    test('should show all museums for new users', () => {
        const result = app.renderMuseums();
        expect(result.length).toBe(3);
    });

    test('should show clicked museum after returning from museum-checkin page', () => {
        // Step 1: User clicks natural-history museum card
        app.markMuseumAsBrowsed('natural-history');
        
        // Verify it's saved in localStorage
        const saved = localStorage.getItem(APP_CONFIG.LOCAL_STORAGE_KEYS.BROWSED_MUSEUMS);
        expect(saved).toBeTruthy();
        
        // Step 2: User navigates away (simulated by new page load)
        // This is what happens when page reloads
        app.browsedMuseums = app.loadBrowsedMuseums();
        
        // Step 3: Render museums on returned homepage
        const result = app.renderMuseums();
        
        // The museum should be in the display
        const museumIds = result.map(m => m.id);
        expect(museumIds).toContain('natural-history');
    });

    test('should show browsed museums in order of most recent first', () => {
        // User clicks multiple museums at different times
        app.markMuseumAsBrowsed('natural-history');
        
        // Manually set different timestamps for testing (instead of setTimeout)
        app.browsedMuseums['natural-history'] = 1000;
        app.browsedMuseums['forbidden-city'] = 2000; // More recent
        app.saveBrowsedMuseums();
        
        // Reload from localStorage
        app.browsedMuseums = app.loadBrowsedMuseums();
        
        const result = app.renderMuseums();
        const museumIds = result.map(m => m.id);
        
        // Should contain both browsed museums
        expect(museumIds).toContain('natural-history');
        expect(museumIds).toContain('forbidden-city');
        
        // Most recent (2000) should come before older (1000)
        expect(museumIds.indexOf('forbidden-city')).toBeLessThan(museumIds.indexOf('natural-history'));
    });

    test('should show visited museums first, then browsed', () => {
        // Simulate a visited museum (fully completed checklist)
        const visitedMeta = {
            'forbidden-city': {
                timestamp: Date.now() - 1000,
                completedAt: Date.now() - 1000
            }
        };
        localStorage.setItem(APP_CONFIG.LOCAL_STORAGE_KEYS.VISITED_MUSEUMS_META, JSON.stringify(visitedMeta));
        
        // Then user browses another museum
        app.markMuseumAsBrowsed('natural-history');
        
        // Reload
        app.browsedMuseums = app.loadBrowsedMuseums();
        
        const result = app.renderMuseums();
        const museumIds = result.map(m => m.id);
        
        // Visited should come before browsed
        const visitedIndex = museumIds.indexOf('forbidden-city');
        const browsedIndex = museumIds.indexOf('natural-history');
        expect(visitedIndex).toBeLessThan(browsedIndex);
    });
});
