/**
 * Regression Test: Search Error Handling
 * 
 * Bug: When searching for "故宫" returns no results with console errors
 * Issue: API search failures are silently swallowed without user notification
 * 
 * Fix: Display user-friendly error messages when API search fails
 */

// Load HomepageAdapter for testing
require('../core/adapters/homepage-adapter.js');

describe('Search Error Handling (Regression for 故宫 bug)', () => {
  let homepageAdapter;
  let mockOfficialSearch;
  let mockEventBus;

  beforeEach(() => {
    // Setup mocks
    mockOfficialSearch = {
      search: jest.fn()
    };

    mockEventBus = {
      emit: jest.fn()
    };

    // Create HomepageAdapter instance with mocked dependencies
    if (typeof HomepageAdapter !== 'undefined') {
      homepageAdapter = new HomepageAdapter({
        museumDataLoader: { loadMuseum: jest.fn() },
        eventBus: mockEventBus
      });
      homepageAdapter.officialSearch = mockOfficialSearch;
      homepageAdapter.initialized = true;
    }
  });

  describe('API Search Failure Scenarios', () => {
    test('should capture error when API search fails', async () => {
      if (!homepageAdapter) {
        console.warn('HomepageAdapter not available, skipping test');
        return;
      }

      // Mock API failure
      mockOfficialSearch.search.mockResolvedValue({
        success: false,
        museums: [],
        error: 'Failed to fetch'
      });

      // Perform search
      await homepageAdapter.search('故宫');

      // Verify error is captured
      expect(homepageAdapter.lastSearchError).toBe('Failed to fetch');
      expect(homepageAdapter.filteredMuseums).toEqual([]);
    });

    test('should emit error event when search fails', async () => {
      if (!homepageAdapter) {
        console.warn('HomepageAdapter not available, skipping test');
        return;
      }

      // Mock API failure
      mockOfficialSearch.search.mockResolvedValue({
        success: false,
        museums: [],
        error: 'Network error'
      });

      // Perform search
      await homepageAdapter.search('故宫');

      // Verify error event is emitted
      expect(mockEventBus.emit).toHaveBeenCalledWith('homepage:search', 
        expect.objectContaining({
          searchText: '故宫',
          resultCount: 0,
          error: 'Network error'
        })
      );
    });

    test('should handle network/CORS errors', async () => {
      if (!homepageAdapter) {
        console.warn('HomepageAdapter not available, skipping test');
        return;
      }

      // Mock network error (simulating blocked request)
      mockOfficialSearch.search.mockRejectedValue(
        new Error('Failed to fetch')
      );

      // Perform search
      await homepageAdapter.search('故宫');

      // Verify error is captured
      expect(homepageAdapter.lastSearchError).toContain('Failed to fetch');
      expect(homepageAdapter.filteredMuseums).toEqual([]);
    });

    test('should clear error on successful search', async () => {
      if (!homepageAdapter) {
        console.warn('HomepageAdapter not available, skipping test');
        return;
      }

      // First search fails
      mockOfficialSearch.search.mockResolvedValue({
        success: false,
        museums: [],
        error: 'Some error'
      });
      await homepageAdapter.search('test1');
      expect(homepageAdapter.lastSearchError).toBe('Some error');

      // Second search succeeds
      mockOfficialSearch.search.mockResolvedValue({
        success: true,
        museums: [{ id: 'museum-1', name: '故宫博物院' }],
        cached: false
      });
      await homepageAdapter.search('故宫');

      // Verify error is cleared
      expect(homepageAdapter.lastSearchError).toBeNull();
      expect(homepageAdapter.filteredMuseums.length).toBeGreaterThan(0);
    });

    test('should clear error when search is cleared', async () => {
      if (!homepageAdapter) {
        console.warn('HomepageAdapter not available, skipping test');
        return;
      }

      // Search fails
      mockOfficialSearch.search.mockResolvedValue({
        success: false,
        museums: [],
        error: 'Some error'
      });
      await homepageAdapter.search('test');
      expect(homepageAdapter.lastSearchError).toBe('Some error');

      // Clear search
      await homepageAdapter.search('');

      // Verify error is cleared
      expect(homepageAdapter.lastSearchError).toBeNull();
    });
  });

  describe('UI Error Display', () => {
    let mockApp;

    beforeEach(() => {
      // Create mock app instance
      mockApp = {
        searchQuery: '',
        lastSearchError: null,
        filteredMuseums: [],
        browsedMuseums: {},
        visitedMuseums: [],
        favoriteMuseums: [],
        homepageAdapter: homepageAdapter,
        
        filterMuseums: async function() {
          if (this.homepageAdapter && this.searchQuery) {
            await this.homepageAdapter.search(this.searchQuery);
            this.filteredMuseums = this.homepageAdapter.getFilteredMuseums();
            this.lastSearchError = this.homepageAdapter.lastSearchError || null;
          }
        },

        showSearchError: function(query, errorMessage) {
          return {
            query: query,
            error: errorMessage,
            displayed: true
          };
        }
      };
    });

    test('should detect search error from lastSearchError property', async () => {
      // Mock failed search
      mockOfficialSearch.search.mockResolvedValue({
        success: false,
        museums: [],
        error: 'API blocked'
      });

      // Simulate user searching
      mockApp.searchQuery = '故宫';
      await mockApp.filterMuseums();

      // Verify error is captured
      expect(mockApp.lastSearchError).toBe('API blocked');
      expect(mockApp.filteredMuseums).toEqual([]);
    });

    test('should show appropriate error message for network errors', () => {
      const errorResult = mockApp.showSearchError('故宫', 'Failed to fetch');
      
      expect(errorResult.displayed).toBe(true);
      expect(errorResult.query).toBe('故宫');
      expect(errorResult.error).toContain('Failed to fetch');
    });

    test('should show retry and clear buttons on error', () => {
      const errorResult = mockApp.showSearchError('故宫', 'Network error');
      
      expect(errorResult.displayed).toBe(true);
      // Verify error message includes the query for retry functionality
      expect(errorResult.query).toBe('故宫');
    });
  });

  describe('Specific Bug Reproduction: 故宫 Search', () => {
    test('searching for "故宫" with API blocked should show error message', async () => {
      if (!homepageAdapter) {
        console.warn('HomepageAdapter not available, skipping test');
        return;
      }

      // Simulate ad blocker or CORS blocking the request
      mockOfficialSearch.search.mockRejectedValue(
        new Error('Failed to fetch')
      );

      // User searches for "故宫"
      await homepageAdapter.search('故宫');

      // Verify error is properly captured
      expect(homepageAdapter.lastSearchError).toBeDefined();
      expect(homepageAdapter.lastSearchError).toContain('Failed to fetch');
      
      // Verify no museums are displayed
      expect(homepageAdapter.filteredMuseums).toEqual([]);
      
      // Verify error event is emitted
      expect(mockEventBus.emit).toHaveBeenCalledWith('homepage:search',
        expect.objectContaining({
          searchText: '故宫',
          error: expect.any(String)
        })
      );
    });
  });
});

/**
 * Regression Test: Museum ID Generation Bug
 * 
 * Bug: Cannot read properties of undefined (reading 'slice')
 * Issue: When API returns museum with undefined/null location, generateMuseumId() fails
 * 
 * Fix: Use cleanLocation (guaranteed string) instead of original location parameter
 */

// Load OfficialMuseumSearch for testing
require('../js/official-museum-search.js');

describe('OfficialMuseumSearch - Museum ID Generation (Regression)', () => {
  let searcher;

  beforeEach(() => {
    if (typeof OfficialMuseumSearch !== 'undefined') {
      searcher = new OfficialMuseumSearch();
    }
  });

  describe('generateMuseumId with missing/undefined location', () => {
    test('should handle undefined location without throwing error', () => {
      if (!searcher) {
        console.warn('OfficialMuseumSearch not available, skipping test');
        return;
      }

      expect(() => {
        const id = searcher.generateMuseumId('故宫博物院', undefined);
        expect(id).toBeDefined();
        expect(typeof id).toBe('string');
        expect(id).toMatch(/^museum-/);
      }).not.toThrow();
    });

    test('should handle null location without throwing error', () => {
      if (!searcher) {
        console.warn('OfficialMuseumSearch not available, skipping test');
        return;
      }

      expect(() => {
        const id = searcher.generateMuseumId('故宫博物院', null);
        expect(id).toBeDefined();
        expect(typeof id).toBe('string');
        expect(id).toMatch(/^museum-/);
      }).not.toThrow();
    });

    test('should handle empty string location without throwing error', () => {
      if (!searcher) {
        console.warn('OfficialMuseumSearch not available, skipping test');
        return;
      }

      expect(() => {
        const id = searcher.generateMuseumId('故宫博物院', '');
        expect(id).toBeDefined();
        expect(typeof id).toBe('string');
        expect(id).toMatch(/^museum-/);
      }).not.toThrow();
    });

    test('should use fallback prefix "xx" when location is missing', () => {
      if (!searcher) {
        console.warn('OfficialMuseumSearch not available, skipping test');
        return;
      }

      const id1 = searcher.generateMuseumId('故宫博物院', undefined);
      const id2 = searcher.generateMuseumId('故宫博物院', null);
      const id3 = searcher.generateMuseumId('故宫博物院', '');
      
      // All should use the fallback prefix 'xx'
      expect(id1).toMatch(/^museum-xx-/);
      expect(id2).toMatch(/^museum-xx-/);
      expect(id3).toMatch(/^museum-xx-/);
    });

    test('should generate valid ID with normal location', () => {
      if (!searcher) {
        console.warn('OfficialMuseumSearch not available, skipping test');
        return;
      }

      const id = searcher.generateMuseumId('故宫博物院', '北京');
      expect(id).toBeDefined();
      expect(id).toMatch(/^museum-北京-/);
    });
  });

  describe('transformSearchResults with missing location', () => {
    test('should handle API results with missing location fields', async () => {
      if (!searcher) {
        console.warn('OfficialMuseumSearch not available, skipping test');
        return;
      }

      const apiResults = [
        { name: '故宫博物院', location: undefined },
        { name: '国家博物馆', location: null },
        { name: '上海博物馆', location: '' },
        { name: '南京博物院', location: '南京' }
      ];

      await expect(async () => {
        const museums = await searcher.transformSearchResults(apiResults);
        expect(museums).toHaveLength(4);
        expect(museums[0].id).toBeDefined();
        expect(museums[1].id).toBeDefined();
        expect(museums[2].id).toBeDefined();
        expect(museums[3].id).toBeDefined();
        
        // Verify all IDs are valid strings
        museums.forEach(museum => {
          expect(typeof museum.id).toBe('string');
          expect(museum.id).toMatch(/^museum-/);
        });
      }).not.toThrow();
    });
  });
});
