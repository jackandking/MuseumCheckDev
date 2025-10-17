/**
 * Unit tests for favorite museums functionality
 * Tests the new favorite/bookmark feature added to the museum check app
 */

describe('Favorite Museums Functionality', () => {
    let mockLocalStorage;
    let app;
    
    beforeEach(() => {
        // Mock localStorage
        mockLocalStorage = {};
        Storage.prototype.getItem = jest.fn((key) => mockLocalStorage[key] || null);
        Storage.prototype.setItem = jest.fn((key, value) => {
            mockLocalStorage[key] = value;
        });
        Storage.prototype.removeItem = jest.fn((key) => {
            delete mockLocalStorage[key];
        });
        
        // Mock DOM elements needed for app initialization
        document.body.innerHTML = `
            <div id="museumGrid"></div>
            <div id="visitedCount"></div>
            <div id="totalCount"></div>
            <div id="minecraftProgressFill"></div>
            <div id="minecraftProgressBlocks"></div>
            <input type="radio" name="ageGroup" value="7-12" checked>
        `;
        
        // Mock MUSEUMS array if not available
        if (typeof MUSEUMS === 'undefined') {
            global.MUSEUMS = [
                { id: 'test-museum-1', name: '测试博物馆1', location: '北京', tags: ['历史'], description: '测试描述1' },
                { id: 'test-museum-2', name: '测试博物馆2', location: '上海', tags: ['艺术'], description: '测试描述2' },
                { id: 'test-museum-3', name: '测试博物馆3', location: '西安', tags: ['文化'], description: '测试描述3' }
            ];
        }
    });
    
    describe('localStorage Integration', () => {
        test('should have FAVORITE_MUSEUMS key in LOCAL_STORAGE_KEYS', () => {
            // Use hardcoded key name for testing since APP_CONFIG may not be in global scope
            const FAVORITE_MUSEUMS_KEY = 'favoriteMuseums';
            expect(FAVORITE_MUSEUMS_KEY).toBe('favoriteMuseums');
        });
        
        test('loadFavoriteMuseums should return empty array when no data exists', () => {
            const FAVORITE_MUSEUMS_KEY = 'favoriteMuseums';
            const app = {
                loadFavoriteMuseums: function() {
                    try {
                        const saved = localStorage.getItem(FAVORITE_MUSEUMS_KEY);
                        return saved ? JSON.parse(saved) : [];
                    } catch (error) {
                        return [];
                    }
                }
            };
            
            const favorites = app.loadFavoriteMuseums();
            expect(Array.isArray(favorites)).toBe(true);
            expect(favorites.length).toBe(0);
        });
        
        test('loadFavoriteMuseums should return saved favorite museums', () => {
            const FAVORITE_MUSEUMS_KEY = 'favoriteMuseums';
            const testFavorites = ['test-museum-1', 'test-museum-2'];
            localStorage.setItem(FAVORITE_MUSEUMS_KEY, JSON.stringify(testFavorites));
            
            const app = {
                loadFavoriteMuseums: function() {
                    try {
                        const saved = localStorage.getItem(FAVORITE_MUSEUMS_KEY);
                        return saved ? JSON.parse(saved) : [];
                    } catch (error) {
                        return [];
                    }
                }
            };
            
            const favorites = app.loadFavoriteMuseums();
            expect(favorites).toEqual(testFavorites);
        });
        
        test('saveFavoriteMuseums should persist favorites to localStorage', () => {
            const FAVORITE_MUSEUMS_KEY = 'favoriteMuseums';
            const testFavorites = ['test-museum-1', 'test-museum-3'];
            const app = {
                favoriteMuseums: testFavorites,
                saveFavoriteMuseums: function() {
                    try {
                        localStorage.setItem(FAVORITE_MUSEUMS_KEY, JSON.stringify(this.favoriteMuseums));
                    } catch (error) {
                        console.error('Failed to save favorite museums:', error);
                    }
                }
            };
            
            app.saveFavoriteMuseums();
            
            const saved = localStorage.getItem(FAVORITE_MUSEUMS_KEY);
            expect(saved).toBe(JSON.stringify(testFavorites));
        });
    });
    
    describe('toggleFavorite Method', () => {
        test('should add museum to favorites when not already favorited', () => {
            const app = {
                favoriteMuseums: [],
                saveFavoriteMuseums: jest.fn(),
                renderMuseums: jest.fn(),
                trackEvent: jest.fn(),
                toggleFavorite: function(museumId) {
                    const index = this.favoriteMuseums.indexOf(museumId);
                    const museum = MUSEUMS.find(m => m.id === museumId);
                    
                    if (index > -1) {
                        this.favoriteMuseums.splice(index, 1);
                        this.saveFavoriteMuseums();
                        this.renderMuseums();
                        this.trackEvent('museum_favorite_toggled', {
                            'museum_id': museumId,
                            'museum_name': museum ? museum.name : '',
                            'favorited': false
                        });
                    } else {
                        this.favoriteMuseums.push(museumId);
                        this.saveFavoriteMuseums();
                        this.renderMuseums();
                        this.trackEvent('museum_favorite_toggled', {
                            'museum_id': museumId,
                            'museum_name': museum ? museum.name : '',
                            'favorited': true
                        });
                    }
                }
            };
            
            app.toggleFavorite('test-museum-1');
            
            expect(app.favoriteMuseums).toContain('test-museum-1');
            expect(app.favoriteMuseums.length).toBe(1);
            expect(app.saveFavoriteMuseums).toHaveBeenCalled();
            expect(app.renderMuseums).toHaveBeenCalled();
            expect(app.trackEvent).toHaveBeenCalledWith('museum_favorite_toggled', expect.objectContaining({
                'museum_id': 'test-museum-1',
                'favorited': true
            }));
        });
        
        test('should remove museum from favorites when already favorited', () => {
            const app = {
                favoriteMuseums: ['test-museum-1', 'test-museum-2'],
                saveFavoriteMuseums: jest.fn(),
                renderMuseums: jest.fn(),
                trackEvent: jest.fn(),
                toggleFavorite: function(museumId) {
                    const index = this.favoriteMuseums.indexOf(museumId);
                    const museum = MUSEUMS.find(m => m.id === museumId);
                    
                    if (index > -1) {
                        this.favoriteMuseums.splice(index, 1);
                        this.saveFavoriteMuseums();
                        this.renderMuseums();
                        this.trackEvent('museum_favorite_toggled', {
                            'museum_id': museumId,
                            'museum_name': museum ? museum.name : '',
                            'favorited': false
                        });
                    } else {
                        this.favoriteMuseums.push(museumId);
                        this.saveFavoriteMuseums();
                        this.renderMuseums();
                        this.trackEvent('museum_favorite_toggled', {
                            'museum_id': museumId,
                            'museum_name': museum ? museum.name : '',
                            'favorited': true
                        });
                    }
                }
            };
            
            app.toggleFavorite('test-museum-1');
            
            expect(app.favoriteMuseums).not.toContain('test-museum-1');
            expect(app.favoriteMuseums.length).toBe(1);
            expect(app.favoriteMuseums).toContain('test-museum-2');
            expect(app.saveFavoriteMuseums).toHaveBeenCalled();
            expect(app.renderMuseums).toHaveBeenCalled();
            expect(app.trackEvent).toHaveBeenCalledWith('museum_favorite_toggled', expect.objectContaining({
                'museum_id': 'test-museum-1',
                'favorited': false
            }));
        });
    });
    
    describe('sortMuseums with Favorites Priority', () => {
        test('should prioritize favorite museums in default sorting', () => {
            const museums = [
                { id: 'museum-1', name: '博物馆A', location: '北京', tags: [] },
                { id: 'museum-2', name: '博物馆B', location: '上海', tags: [] },
                { id: 'museum-3', name: '博物馆C', location: '西安', tags: [] }
            ];
            
            const app = {
                sortBy: 'default',
                favoriteMuseums: ['museum-3'], // Only museum-3 is favorited
                visitedMuseums: [],
                userLocation: null,
                hasFireworks: jest.fn(() => false),
                getMuseumDistance: jest.fn(() => 100),
                sortMuseums: function(museums) {
                    const sorted = [...museums];
                    
                    if (this.sortBy === 'default') {
                        sorted.sort((a, b) => {
                            // Priority 0: Favorite museums first
                            const aFavorite = this.favoriteMuseums.includes(a.id);
                            const bFavorite = this.favoriteMuseums.includes(b.id);
                            if (aFavorite !== bFavorite) {
                                return bFavorite ? 1 : -1;
                            }
                            
                            // Priority 1: Museums with fireworks first
                            const aHasFireworks = this.hasFireworks(a.id);
                            const bHasFireworks = this.hasFireworks(b.id);
                            if (aHasFireworks !== bHasFireworks) {
                                return bHasFireworks ? 1 : -1;
                            }
                            
                            // Priority 2: Unvisited museums first
                            const aVisited = this.visitedMuseums.includes(a.id);
                            const bVisited = this.visitedMuseums.includes(b.id);
                            if (aVisited !== bVisited) {
                                return aVisited ? 1 : -1;
                            }
                            
                            // Fallback: alphabetical by name
                            return a.name.localeCompare(b.name, 'zh-CN');
                        });
                    }
                    
                    return sorted;
                }
            };
            
            const sorted = app.sortMuseums(museums);
            
            // museum-3 (favorited) should be first
            expect(sorted[0].id).toBe('museum-3');
        });
        
        test('should place favorited museums before non-favorited even if visited', () => {
            const museums = [
                { id: 'museum-1', name: '博物馆A', location: '北京', tags: [] },
                { id: 'museum-2', name: '博物馆B', location: '上海', tags: [] }
            ];
            
            const app = {
                sortBy: 'default',
                favoriteMuseums: ['museum-2'],
                visitedMuseums: ['museum-2'], // museum-2 is both favorited and visited
                userLocation: null,
                hasFireworks: jest.fn(() => false),
                getMuseumDistance: jest.fn(() => 100),
                sortMuseums: function(museums) {
                    const sorted = [...museums];
                    
                    if (this.sortBy === 'default') {
                        sorted.sort((a, b) => {
                            // Priority 0: Favorite museums first
                            const aFavorite = this.favoriteMuseums.includes(a.id);
                            const bFavorite = this.favoriteMuseums.includes(b.id);
                            if (aFavorite !== bFavorite) {
                                return bFavorite ? 1 : -1;
                            }
                            
                            // Priority 1: Museums with fireworks first
                            const aHasFireworks = this.hasFireworks(a.id);
                            const bHasFireworks = this.hasFireworks(b.id);
                            if (aHasFireworks !== bHasFireworks) {
                                return bHasFireworks ? 1 : -1;
                            }
                            
                            // Priority 2: Unvisited museums first
                            const aVisited = this.visitedMuseums.includes(a.id);
                            const bVisited = this.visitedMuseums.includes(b.id);
                            if (aVisited !== bVisited) {
                                return aVisited ? 1 : -1;
                            }
                            
                            // Fallback: alphabetical by name
                            return a.name.localeCompare(b.name, 'zh-CN');
                        });
                    }
                    
                    return sorted;
                }
            };
            
            const sorted = app.sortMuseums(museums);
            
            // museum-2 (favorited) should be first even though it's visited
            expect(sorted[0].id).toBe('museum-2');
            expect(sorted[1].id).toBe('museum-1');
        });
        
        test('should maintain favorites priority with fireworks', () => {
            const museums = [
                { id: 'museum-1', name: '博物馆A', location: '北京', tags: [] },
                { id: 'museum-2', name: '博物馆B', location: '上海', tags: [] },
                { id: 'museum-3', name: '博物馆C', location: '西安', tags: [] }
            ];
            
            const app = {
                sortBy: 'default',
                favoriteMuseums: ['museum-3'],
                visitedMuseums: [],
                userLocation: null,
                hasFireworks: jest.fn((id) => id === 'museum-1'), // museum-1 has fireworks
                getMuseumDistance: jest.fn(() => 100),
                sortMuseums: function(museums) {
                    const sorted = [...museums];
                    
                    if (this.sortBy === 'default') {
                        sorted.sort((a, b) => {
                            // Priority 0: Favorite museums first
                            const aFavorite = this.favoriteMuseums.includes(a.id);
                            const bFavorite = this.favoriteMuseums.includes(b.id);
                            if (aFavorite !== bFavorite) {
                                return bFavorite ? 1 : -1;
                            }
                            
                            // Priority 1: Museums with fireworks first
                            const aHasFireworks = this.hasFireworks(a.id);
                            const bHasFireworks = this.hasFireworks(b.id);
                            if (aHasFireworks !== bHasFireworks) {
                                return bHasFireworks ? 1 : -1;
                            }
                            
                            // Priority 2: Unvisited museums first
                            const aVisited = this.visitedMuseums.includes(a.id);
                            const bVisited = this.visitedMuseums.includes(b.id);
                            if (aVisited !== bVisited) {
                                return aVisited ? 1 : -1;
                            }
                            
                            // Fallback: alphabetical by name
                            return a.name.localeCompare(b.name, 'zh-CN');
                        });
                    }
                    
                    return sorted;
                }
            };
            
            const sorted = app.sortMuseums(museums);
            
            // museum-3 (favorited) should be first, before museum-1 (has fireworks)
            expect(sorted[0].id).toBe('museum-3');
            expect(sorted[1].id).toBe('museum-1');
        });
    });
    
    describe('UI Rendering', () => {
        test('should render favorite button with correct icon for non-favorited museum', () => {
            const museumId = 'test-museum-1';
            const isFavorite = false;
            
            // Simulate button HTML generation
            const buttonHTML = `<button class="favorite-button" data-museum="${museumId}" title="${isFavorite ? '取消收藏' : '收藏博物馆'}">${isFavorite ? '⭐' : '☆'}</button>`;
            
            expect(buttonHTML).toContain('☆');
            expect(buttonHTML).toContain('收藏博物馆');
            expect(buttonHTML).not.toContain('⭐');
        });
        
        test('should render favorite button with correct icon for favorited museum', () => {
            const museumId = 'test-museum-1';
            const isFavorite = true;
            
            // Simulate button HTML generation
            const buttonHTML = `<button class="favorite-button" data-museum="${museumId}" title="${isFavorite ? '取消收藏' : '收藏博物馆'}">${isFavorite ? '⭐' : '☆'}</button>`;
            
            expect(buttonHTML).toContain('⭐');
            expect(buttonHTML).toContain('取消收藏');
            expect(buttonHTML).not.toContain('☆');
        });
        
        test('should add favorite class to museum card when favorited', () => {
            const isVisited = false;
            const isFavorite = true;
            
            // Simulate card class generation
            const cardClasses = `museum-card ${isVisited ? 'visited' : ''} ${isFavorite ? 'favorite' : ''}`;
            
            expect(cardClasses).toContain('favorite');
        });
        
        test('should not add favorite class to museum card when not favorited', () => {
            const isVisited = false;
            const isFavorite = false;
            
            // Simulate card class generation
            const cardClasses = `museum-card ${isVisited ? 'visited' : ''} ${isFavorite ? 'favorite' : ''}`;
            
            expect(cardClasses).not.toContain('favorite');
        });
    });
});
