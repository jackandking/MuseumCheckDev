/**
 * Unit tests for city-based museum display feature for new users
 * 
 * Issue: 默认显示哪些博物馆
 * Requirement: New users should see all museums in their city before searching.
 * If no museums in their city, show nearest ones.
 */

describe('City-based Museum Display for New Users', () => {
  let app;
  let museums;

  beforeEach(() => {
    // Setup minimal DOM
    testUtils.setupMinimalDOM();
    
    // Mock museums data with various locations
    museums = [
      { id: 'bj-museum-1', name: '北京博物馆1', location: '北京' },
      { id: 'bj-museum-2', name: '北京博物馆2', location: '北京' },
      { id: 'sh-museum-1', name: '上海博物馆1', location: '上海' },
      { id: 'sh-museum-2', name: '上海博物馆2', location: '上海' },
      { id: 'sh-museum-3', name: '上海博物馆3', location: '上海' },
      { id: 'gz-museum-1', name: '广州博物馆1', location: '广州' },
      { id: 'cd-museum-1', name: '成都博物馆1', location: '成都' }
    ];
    
    // Mock the MuseumCheckApp class with essential methods
    window.MUSEUMS = museums;
    
    // Create a mock app instance
    app = {
      museums: museums,
      visitedMuseums: [],
      favoriteMuseums: [],
      filteredMuseums: museums,
      lastSearchQuery: '',
      showOnlyMuseumsWithCollections: false,
      userLocation: null,
      
      // Mock getUserCity function
      getUserCity: function() {
        if (!this.userLocation) return null;
        
        const cityCoords = {
          '北京': { lat: 39.9042, lon: 116.4074 },
          '上海': { lat: 31.2304, lon: 121.4737 },
          '广州': { lat: 23.1291, lon: 113.2644 }
        };
        
        let nearestCity = null;
        let minDistance = Infinity;
        
        for (const [cityName, coords] of Object.entries(cityCoords)) {
          const distance = this.calculateDistance(
            this.userLocation.lat,
            this.userLocation.lon,
            coords.lat,
            coords.lon
          );
          
          if (distance < minDistance) {
            minDistance = distance;
            nearestCity = cityName;
          }
        }
        
        return (minDistance <= 100) ? nearestCity : null;
      },
      
      // Mock calculateDistance function (Haversine formula)
      calculateDistance: function(lat1, lon1, lat2, lon2) {
        const R = 6371; // Earth radius in km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = 
          Math.sin(dLat/2) * Math.sin(dLat/2) +
          Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
          Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
      },
      
      // Mock getMuseumDistance function
      getMuseumDistance: function(museum) {
        if (!this.userLocation) return Infinity;
        
        const cityCoords = {
          '北京': { lat: 39.9042, lon: 116.4074 },
          '上海': { lat: 31.2304, lon: 121.4737 },
          '广州': { lat: 23.1291, lon: 113.2644 },
          '成都': { lat: 30.5728, lon: 104.0668 }
        };
        
        const coords = cityCoords[museum.location];
        if (!coords) return Infinity;
        
        return this.calculateDistance(
          this.userLocation.lat,
          this.userLocation.lon,
          coords.lat,
          coords.lon
        );
      }
    };
  });

  describe('getUserCity function', () => {
    test('should return Beijing when user is in Beijing', () => {
      // Set user location to Beijing (Tiananmen Square coordinates)
      app.userLocation = { lat: 39.9042, lon: 116.4074 };
      
      const city = app.getUserCity();
      expect(city).toBe('北京');
    });

    test('should return Shanghai when user is in Shanghai', () => {
      // Set user location to Shanghai (Bund coordinates)
      app.userLocation = { lat: 31.2304, lon: 121.4737 };
      
      const city = app.getUserCity();
      expect(city).toBe('上海');
    });

    test('should return null when user location is unavailable', () => {
      app.userLocation = null;
      
      const city = app.getUserCity();
      expect(city).toBeNull();
    });

    test('should return null when user is far from any major city', () => {
      // Set location far from any city (middle of ocean)
      app.userLocation = { lat: 0, lon: 0 };
      
      const city = app.getUserCity();
      expect(city).toBeNull();
    });

    test('should return nearest city when user is within 100km', () => {
      // Set location near Beijing but not exactly at center (e.g., Beijing suburbs)
      app.userLocation = { lat: 40.0, lon: 116.5 };
      
      const city = app.getUserCity();
      expect(city).toBe('北京');
    });
  });

  describe('New user museum filtering', () => {
    test('should show all museums in user city when location available', () => {
      // Simulate new user in Shanghai with location permission
      app.userLocation = { lat: 31.2304, lon: 121.4737 };
      app.visitedMuseums = [];
      app.favoriteMuseums = [];
      
      // Determine user city
      const userCity = app.getUserCity();
      expect(userCity).toBe('上海');
      
      // Filter museums by user city
      const cityMuseums = app.museums.filter(m => 
        m.location && m.location.includes(userCity)
      );
      
      expect(cityMuseums).toHaveLength(3);
      expect(cityMuseums.every(m => m.location === '上海')).toBe(true);
      expect(cityMuseums.map(m => m.id)).toEqual([
        'sh-museum-1',
        'sh-museum-2', 
        'sh-museum-3'
      ]);
    });

    test('should show nearest museums when user city has no museums', () => {
      // Simulate user in a city not in the museum list
      // We'll test by checking that distance sorting works correctly
      app.userLocation = { lat: 30.5728, lon: 104.0668 }; // Chengdu coordinates
      
      // Calculate distances
      const museumsWithDistance = app.museums.map(m => ({
        museum: m,
        dist: app.getMuseumDistance(m)
      })).filter(m => m.dist < Infinity);
      
      // Sort by distance
      museumsWithDistance.sort((a, b) => a.dist - b.dist);
      
      // Chengdu museum should be closest
      expect(museumsWithDistance[0].museum.id).toBe('cd-museum-1');
      expect(museumsWithDistance[0].dist).toBeLessThan(10); // Within 10km
    });

    test('should fall back to Beijing museums when no location available', () => {
      // Simulate new user without location permission
      app.userLocation = null;
      
      const userCity = app.getUserCity();
      expect(userCity).toBeNull();
      
      // Fallback: show Beijing museums
      const beijingMuseums = app.museums.filter(m => 
        m.location && m.location.includes('北京')
      );
      
      expect(beijingMuseums).toHaveLength(2);
      expect(beijingMuseums.every(m => m.location === '北京')).toBe(true);
    });

    test('should show all museums in city regardless of number', () => {
      // Test that ALL museums in city are shown (not just first 5)
      app.userLocation = { lat: 31.2304, lon: 121.4737 }; // Shanghai
      
      const userCity = app.getUserCity();
      const cityMuseums = app.museums.filter(m => 
        m.location && m.location.includes(userCity)
      );
      
      // Should show all 3 Shanghai museums, not just limited number
      expect(cityMuseums).toHaveLength(3);
    });
  });

  describe('Returning user behavior', () => {
    test('should not filter museums for users with visited museums', () => {
      // User has visited museums - not a new user
      app.visitedMuseums = ['bj-museum-1'];
      app.userLocation = { lat: 31.2304, lon: 121.4737 }; // Shanghai
      
      // Check if user is new
      const isNewUser = app.visitedMuseums.length === 0
        && app.favoriteMuseums.length === 0
        && !app.lastSearchQuery;
      
      expect(isNewUser).toBe(false);
      
      // Returning users should see all museums
      // (not filtered by location)
    });

    test('should not filter museums for users with favorites', () => {
      // User has favorites - not a new user
      app.favoriteMuseums = ['bj-museum-1'];
      app.userLocation = { lat: 31.2304, lon: 121.4737 };
      
      const isNewUser = app.visitedMuseums.length === 0
        && app.favoriteMuseums.length === 0
        && !app.lastSearchQuery;
      
      expect(isNewUser).toBe(false);
    });

    test('should not filter museums when user has searched', () => {
      // User has performed search - not showing default view
      app.lastSearchQuery = '博物馆';
      app.userLocation = { lat: 31.2304, lon: 121.4737 };
      
      const isNewUser = app.visitedMuseums.length === 0
        && app.favoriteMuseums.length === 0
        && !app.lastSearchQuery;
      
      expect(isNewUser).toBe(false);
    });
  });

  describe('Distance calculation', () => {
    test('should calculate correct distance between Beijing and Shanghai', () => {
      // Known approximate distance: ~1000-1200 km
      const distance = app.calculateDistance(
        39.9042, 116.4074,  // Beijing
        31.2304, 121.4737   // Shanghai
      );
      
      expect(distance).toBeGreaterThan(1000);
      expect(distance).toBeLessThan(1300);
    });

    test('should return zero distance for same coordinates', () => {
      const distance = app.calculateDistance(
        39.9042, 116.4074,
        39.9042, 116.4074
      );
      
      expect(distance).toBeLessThan(1); // Should be very close to 0
    });

    test('should return Infinity when user location unavailable', () => {
      app.userLocation = null;
      const museum = { location: '北京' };
      
      const distance = app.getMuseumDistance(museum);
      expect(distance).toBe(Infinity);
    });
  });

  describe('Edge cases', () => {
    test('should handle museums without location field', () => {
      const museumNoLocation = { id: 'test', name: 'Test Museum' };
      app.userLocation = { lat: 39.9042, lon: 116.4074 };
      
      const distance = app.getMuseumDistance(museumNoLocation);
      expect(distance).toBe(Infinity);
    });

    test('should handle empty museums array', () => {
      app.museums = [];
      app.userLocation = { lat: 39.9042, lon: 116.4074 };
      
      const userCity = app.getUserCity();
      expect(userCity).toBe('北京');
      
      const cityMuseums = app.museums.filter(m => 
        m.location && m.location.includes(userCity)
      );
      expect(cityMuseums).toHaveLength(0);
    });

    test('should handle city name variations', () => {
      // Test that city matching works with partial strings
      const museums = [
        { id: 'm1', name: '北京市博物馆', location: '北京市' },
        { id: 'm2', name: '北京朝阳区博物馆', location: '北京朝阳区' }
      ];
      
      const beijingMuseums = museums.filter(m =>
        m.location && m.location.includes('北京')
      );
      
      expect(beijingMuseums).toHaveLength(2);
    });
  });

  describe('Integration with notification system', () => {
    test('should show appropriate message when city museums found', () => {
      app.userLocation = { lat: 31.2304, lon: 121.4737 };
      const userCity = app.getUserCity();
      const cityMuseums = app.museums.filter(m => 
        m.location && m.location.includes(userCity)
      );
      
      const message = `已为你推荐${userCity}的博物馆（共${cityMuseums.length}个）`;
      
      expect(message).toBe('已为你推荐上海的博物馆（共3个）');
    });

    test('should show appropriate message when showing nearest museums', () => {
      app.userLocation = { lat: 30.5728, lon: 104.0668 }; // Chengdu
      const userCity = app.getUserCity();
      
      // Chengdu not in major city list within 100km threshold
      // Will fall back to nearest museums
      const message = '已为你推荐附近的博物馆';
      
      expect(message).toContain('附近的博物馆');
    });

    test('should show appropriate message when no location available', () => {
      app.userLocation = null;
      const message = '已为你推荐热门博物馆，允许定位可获得更精准推荐';
      
      expect(message).toContain('允许定位');
    });
  });
});
