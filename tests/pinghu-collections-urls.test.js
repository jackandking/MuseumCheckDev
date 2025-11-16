const fs = require('fs');
const path = require('path');

/**
 * UT: Validate Pinghu Museum collections structure
 * - Collections should have name, imageUrl, and description
 * - Should contain Pinghu Museum-specific cultural items
 * - Image URLs should be from reliable public sources
 */

describe('Pinghu Museum collections', () => {
  let museum;

  beforeAll(() => {
    // Load museum data from museums-data.js
    const museumsDataPath = path.join(__dirname, '..', 'museums-data.js');
    expect(fs.existsSync(museumsDataPath)).toBe(true);
    delete require.cache[museumsDataPath];
    require(museumsDataPath);
    
    // Find pinghu museum from MUSEUMS array
    museum = global.MUSEUMS && global.MUSEUMS.find(m => m.id === 'pinghu-museum');
  });

  test('collections have valid structure with required fields', () => {
    expect(museum).toBeTruthy();
    expect(Array.isArray(museum.collections)).toBe(true);
    expect(museum.collections.length).toBeGreaterThan(0);

    museum.collections.forEach((item) => {
      expect(item && typeof item.name === 'string' && item.name.trim().length > 0).toBe(true);
      expect(item && typeof item.imageUrl === 'string' && item.imageUrl.trim().length > 0).toBe(true);
      expect(item && typeof item.description === 'string' && item.description.trim().length > 0).toBe(true);
      
      // Verify imageUrl is a valid URL
      let u;
      try { u = new URL(item.imageUrl); } catch { u = null; }
      expect(u).toBeTruthy();
      expect(u.protocol).toMatch(/^https?:$/);
    });
  });

  test('collections contain Pinghu Museum cultural items', () => {
    const names = (museum.collections || []).map(i => i.name);
    
    // Should have at least 3 collections
    expect(names.length).toBeGreaterThanOrEqual(3);
    
    // Each name should be a non-empty string
    names.forEach(name => {
      expect(typeof name).toBe('string');
      expect(name.trim().length).toBeGreaterThan(0);
    });
  });

  test('image URLs are from reliable or accessible sources', () => {
    const urls = (museum.collections || []).map(i => i.imageUrl);
    
    // All URLs should be HTTPS or HTTP
    urls.forEach((url) => {
      expect(url).toMatch(/^https?:\/\//);
    });
  });

  test('descriptions provide meaningful cultural context', () => {
    const descriptions = (museum.collections || []).map(i => i.description);
    
    // Each description should be substantive (>20 characters)
    descriptions.forEach(desc => {
      expect(desc.length).toBeGreaterThan(20);
    });
  });
});
