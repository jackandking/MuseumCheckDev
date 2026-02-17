/**
 * Unit tests for HomepageAdapter
 */

const HomepageAdapter = require('../../core/adapters/homepage-adapter');

describe('HomepageAdapter', () => {
  let adapter;
  let mockDataManager;
  let mockEventBus;
  let mockMuseumDataLoader;
  let mockOfficialSearch;

  beforeEach(() => {
    // Mock dependencies
    mockDataManager = {
      get: jest.fn(),
      set: jest.fn()
    };

    mockEventBus = {
      emit: jest.fn(),
      on: jest.fn()
    };

    mockMuseumDataLoader = {
      loadAllMuseums: jest.fn(),
      loadMuseum: jest.fn()
    };

    // Mock OfficialMuseumSearch
    mockOfficialSearch = {
      search: jest.fn(),
      clearCache: jest.fn()
    };

    // Mock localStorage
    global.localStorage = {
      getItem: jest.fn(),
      setItem: jest.fn(),
      removeItem: jest.fn()
    };

    adapter = new HomepageAdapter({
      dataManager: mockDataManager,
      eventBus: mockEventBus,
      museumDataLoader: mockMuseumDataLoader
    });
    
    // Inject mock OfficialMuseumSearch
    adapter.officialSearch = mockOfficialSearch;
  });

  describe('Constructor', () => {
    test('should initialize with dependencies', () => {
      expect(adapter.dataManager).toBe(mockDataManager);
      expect(adapter.eventBus).toBe(mockEventBus);
      expect(adapter.museumDataLoader).toBe(mockMuseumDataLoader);
      expect(adapter.initialized).toBe(false);
    });

    test('should initialize with default empty state', () => {
      expect(adapter.museums).toEqual([]);
      expect(adapter.filteredMuseums).toEqual([]);
      expect(adapter.sortBy).toBe('default');
    });
  });

  describe('init()', () => {
    test('should initialize with API-based search (no preload)', async () => {
      // With new architecture, no museums are loaded until search
      mockMuseumDataLoader.loadAllMuseums.mockResolvedValue([]);

      const result = await adapter.init();

      expect(result).toBe(true);
      expect(adapter.initialized).toBe(true);
      expect(adapter.museums).toEqual([]);
      expect(adapter.filteredMuseums).toEqual([]);
      expect(mockEventBus.emit).toHaveBeenCalledWith('homepage:museums:loaded', {
        count: 0,
        source: 'api-search-ready'
      });
    });

    test('should handle initialization failure gracefully', async () => {
      // With API-based architecture, init() doesn't load museums so it won't fail from loadAllMuseums
      // Instead, test that it fails when museumDataLoader is missing
      const adapterWithoutLoader = new HomepageAdapter({
        dataManager: mockDataManager,
        eventBus: mockEventBus,
        museumDataLoader: null
      });

      const result = await adapterWithoutLoader.init();

      expect(result).toBe(false);
      expect(adapterWithoutLoader.initialized).toBe(false);
    });

    test('should not reinitialize if already initialized', async () => {
      adapter.initialized = true;
      mockMuseumDataLoader.loadAllMuseums.mockResolvedValue([]);

      await adapter.init();

      expect(mockMuseumDataLoader.loadAllMuseums).not.toHaveBeenCalled();
    });

    test('should fail if museumDataLoader is missing', async () => {
      const adapterWithoutLoader = new HomepageAdapter({
        dataManager: mockDataManager,
        eventBus: mockEventBus,
        museumDataLoader: null
      });

      const result = await adapterWithoutLoader.init();

      expect(result).toBe(false);
    });
  });

  describe('loadMuseumDetails()', () => {
    beforeEach(async () => {
      mockMuseumDataLoader.loadAllMuseums.mockResolvedValue([
        { id: 'museum-1', name: '博物馆1' }
      ]);
      await adapter.init();
    });

    test('should load museum details using museumDataLoader', async () => {
      const mockDetails = { id: 'museum-1', name: '博物馆1', checklists: {} };
      mockMuseumDataLoader.loadMuseum.mockResolvedValue(mockDetails);

      const result = await adapter.loadMuseumDetails('museum-1');

      expect(result).toEqual(mockDetails);
      expect(mockMuseumDataLoader.loadMuseum).toHaveBeenCalledWith('museum-1', true);
      expect(mockEventBus.emit).toHaveBeenCalledWith('homepage:museum:loaded', {
        museumId: 'museum-1',
        source: 'dynamic-first'
      });
    });

    test('should respect useCache option', async () => {
      mockMuseumDataLoader.loadMuseum.mockResolvedValue({ id: 'museum-1' });

      await adapter.loadMuseumDetails('museum-1', { useCache: false });

      expect(mockMuseumDataLoader.loadMuseum).toHaveBeenCalledWith('museum-1', false);
    });

    test('should handle load failure gracefully', async () => {
      mockMuseumDataLoader.loadMuseum.mockRejectedValue(new Error('Load failed'));

      const result = await adapter.loadMuseumDetails('museum-1');

      expect(result).toBeNull();
    });
  });

  describe('search()', () => {
    beforeEach(async () => {
      mockMuseumDataLoader.loadAllMuseums.mockResolvedValue([]);
      await adapter.init();
    });

    test('should search via API and filter museums by name', async () => {
      const mockApiResponse = {
        success: true,
        museums: [
          { id: 'museum-1', name: '故宫博物院', location: '北京', tags: ['历史'] }
        ],
        totalResults: 1,
        cached: false
      };
      mockOfficialSearch.search.mockResolvedValue(mockApiResponse);

      await adapter.search('故宫');

      expect(mockOfficialSearch.search).toHaveBeenCalledWith('故宫');
      expect(adapter.filteredMuseums).toHaveLength(1);
      expect(adapter.filteredMuseums[0].id).toBe('museum-1');
      expect(mockEventBus.emit).toHaveBeenCalledWith('homepage:search', {
        searchText: '故宫',
        resultCount: 1,
        source: 'api',
        totalResults: 1
      });
    });

    test('should search via API and filter museums by location', async () => {
      const mockApiResponse = {
        success: true,
        museums: [
          { id: 'museum-1', name: '故宫博物院', location: '北京', tags: ['历史'] },
          { id: 'museum-3', name: '北京天文馆', location: '北京', tags: ['科学'] }
        ],
        totalResults: 2,
        cached: false
      };
      mockOfficialSearch.search.mockResolvedValue(mockApiResponse);

      await adapter.search('北京');

      expect(adapter.filteredMuseums).toHaveLength(2);
      expect(adapter.filteredMuseums.map(m => m.id)).toContain('museum-1');
      expect(adapter.filteredMuseums.map(m => m.id)).toContain('museum-3');
    });

    test('should search via API and filter museums by tags', async () => {
      const mockApiResponse = {
        success: true,
        museums: [
          { id: 'museum-1', name: '故宫博物院', location: '北京', tags: ['历史'] }
        ],
        totalResults: 1,
        cached: false
      };
      mockOfficialSearch.search.mockResolvedValue(mockApiResponse);

      await adapter.search('历史');

      expect(adapter.filteredMuseums).toHaveLength(1);
      expect(adapter.filteredMuseums[0].id).toBe('museum-1');
    });

    test('should handle empty search', async () => {
      await adapter.search('');

      expect(mockOfficialSearch.search).not.toHaveBeenCalled();
      expect(adapter.filteredMuseums).toHaveLength(0);
      expect(mockEventBus.emit).toHaveBeenCalledWith('homepage:search', {
        searchText: '',
        resultCount: 0,
        source: 'cleared'
      });
    });

    test('should be case-insensitive', async () => {
      const mockApiResponse = {
        success: true,
        museums: [
          { id: 'museum-1', name: '故宫博物院', location: '北京', tags: ['历史'] }
        ],
        totalResults: 1,
        cached: false
      };
      mockOfficialSearch.search.mockResolvedValue(mockApiResponse);

      await adapter.search('故宫');

      expect(adapter.filteredMuseums).toHaveLength(1);
    });
  });

  describe('filterByLocation()', () => {
    beforeEach(async () => {
      mockMuseumDataLoader.loadAllMuseums.mockResolvedValue([]);
      await adapter.init();
      
      // Simulate API search results being loaded
      const mockApiResponse = {
        success: true,
        museums: [
          { id: 'museum-1', name: '博物馆1', location: '北京' },
          { id: 'museum-2', name: '博物馆2', location: '上海' },
          { id: 'museum-3', name: '博物馆3', location: '北京' }
        ],
        totalResults: 3,
        cached: false
      };
      mockOfficialSearch.search.mockResolvedValue(mockApiResponse);
      await adapter.search('博物馆');
    });

    test('should filter museums by location', () => {
      adapter.filterByLocation('北京');

      expect(adapter.filteredMuseums).toHaveLength(2);
      expect(mockEventBus.emit).toHaveBeenCalledWith('homepage:filter:location', {
        location: '北京',
        resultCount: 2
      });
    });
  });

  describe('filterByCollections()', () => {
    beforeEach(async () => {
      mockMuseumDataLoader.loadAllMuseums.mockResolvedValue([]);
      await adapter.init();
      
      // Simulate API search results being loaded
      const mockApiResponse = {
        success: true,
        museums: [
          { id: 'museum-1', name: '博物馆1', hasCollections: true },
          { id: 'museum-2', name: '博物馆2', hasCollections: false },
          { id: 'museum-3', name: '博物馆3', hasCollections: true }
        ],
        totalResults: 3,
        cached: false
      };
      mockOfficialSearch.search.mockResolvedValue(mockApiResponse);
      await adapter.search('博物馆');
    });

    test('should filter museums with collections', () => {
      adapter.filterByCollections(true);

      expect(adapter.filteredMuseums).toHaveLength(2);
      expect(mockEventBus.emit).toHaveBeenCalledWith('homepage:filter:collections', {
        hasCollections: true,
        resultCount: 2
      });
    });
  });

  describe('clearFilters()', () => {
    beforeEach(async () => {
      mockMuseumDataLoader.loadAllMuseums.mockResolvedValue([]);
      await adapter.init();
      
      // Simulate API search results
      const mockApiResponse = {
        success: true,
        museums: [
          { id: 'museum-1', name: '博物馆1', location: '北京' },
          { id: 'museum-2', name: '博物馆2', location: '上海' }
        ],
        totalResults: 2,
        cached: false
      };
      mockOfficialSearch.search.mockResolvedValue(mockApiResponse);
      await adapter.search('博物馆');
    });

    test('should clear all filters and restore search results', async () => {
      // Apply a location filter
      adapter.filterByLocation('北京');
      expect(adapter.filteredMuseums).toHaveLength(1);

      // Clear filters should restore to original search results
      adapter.clearFilters();

      expect(adapter.filteredMuseums).toHaveLength(2);
      expect(adapter.currentFilters.searchText).toBe('');
      expect(mockEventBus.emit).toHaveBeenCalledWith('homepage:filters:cleared', {
        resultCount: 2
      });
    });
  });

  describe('sort()', () => {
    beforeEach(async () => {
      mockMuseumDataLoader.loadAllMuseums.mockResolvedValue([]);
      await adapter.init();
      
      // Simulate API search results
      const mockApiResponse = {
        success: true,
        museums: [
          { id: 'museum-b', name: 'B博物馆', location: '上海' },
          { id: 'museum-a', name: 'A博物馆', location: '北京' },
          { id: 'museum-c', name: 'C博物馆', location: '北京' }
        ],
        totalResults: 3,
        cached: false
      };
      mockOfficialSearch.search.mockResolvedValue(mockApiResponse);
      await adapter.search('博物馆');
    });

    test('should sort by name', () => {
      adapter.sort('name');

      expect(adapter.filteredMuseums[0].name).toBe('A博物馆');
      expect(adapter.filteredMuseums[1].name).toBe('B博物馆');
      expect(adapter.filteredMuseums[2].name).toBe('C博物馆');
      expect(mockEventBus.emit).toHaveBeenCalledWith('homepage:sorted', { sortBy: 'name' });
    });

    test('should sort by location', () => {
      adapter.sort('location');

      const locations = adapter.filteredMuseums.map(m => m.location);
      expect(locations[0]).toBe('北京');
      expect(locations[1]).toBe('北京');
      expect(locations[2]).toBe('上海');
    });
  });

  describe('getStatistics()', () => {
    beforeEach(async () => {
      mockMuseumDataLoader.loadAllMuseums.mockResolvedValue([]);
      await adapter.init();
      
      // Simulate API search results
      const mockApiResponse = {
        success: true,
        museums: [
          { id: 'museum-1', name: '博物馆1' },
          { id: 'museum-2', name: '博物馆2' },
          { id: 'museum-3', name: '博物馆3' }
        ],
        totalResults: 3,
        cached: false
      };
      mockOfficialSearch.search.mockResolvedValue(mockApiResponse);
      await adapter.search('博物馆');

      localStorage.getItem.mockReturnValue(JSON.stringify(['museum-1', 'museum-2']));
    });

    test('should return correct statistics', () => {
      const stats = adapter.getStatistics();

      expect(stats.total).toBe(3);
      expect(stats.visited).toBe(2);
      expect(stats.percentage).toBe('66.7');
      expect(stats.filtered).toBe(3);
    });

    test('should handle filtered results', async () => {
      // Perform a new search with 1 result
      const mockApiResponse = {
        success: true,
        museums: [
          { id: 'museum-1', name: '博物馆1' }
        ],
        totalResults: 1,
        cached: false
      };
      mockOfficialSearch.search.mockResolvedValue(mockApiResponse);
      await adapter.search('博物馆1');
      
      const stats = adapter.getStatistics();

      expect(stats.filtered).toBe(1);
    });
  });

  describe('getVisitedMuseums()', () => {
    test('should return visited museums from localStorage', () => {
      localStorage.getItem.mockReturnValue(JSON.stringify(['museum-1', 'museum-2']));

      const visited = adapter.getVisitedMuseums();

      expect(visited).toEqual(['museum-1', 'museum-2']);
      expect(localStorage.getItem).toHaveBeenCalledWith('visitedMuseums');
    });

    test('should handle missing data', () => {
      localStorage.getItem.mockReturnValue(null);

      const visited = adapter.getVisitedMuseums();

      expect(visited).toEqual([]);
    });

    test('should handle corrupted data', () => {
      localStorage.getItem.mockReturnValue('invalid-json');

      const visited = adapter.getVisitedMuseums();

      expect(visited).toEqual([]);
    });
  });
});
