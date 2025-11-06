const fs = require('fs');
const path = require('path');

/**
 * UT: Validate Forbidden City Museum collections structure
 * - Collections should have name, url, and description
 * - Should contain authentic Beijing Forbidden City treasures
 * - URLs should be from reliable public sources (Wikimedia Commons)
 */

describe('Forbidden City Museum collections', () => {
  beforeAll(() => {
    const filePath = path.join(__dirname, '..', 'museums', 'forbidden-city.js');
    expect(fs.existsSync(filePath)).toBe(true);
    delete require.cache[filePath];
    require(filePath); // defines window.MUSEUM_FORBIDDEN_CITY
  });

  test('collections have valid structure with URLs', () => {
    const museum = window && window.MUSEUM_FORBIDDEN_CITY;
    expect(museum).toBeTruthy();
    expect(Array.isArray(museum.collections)).toBe(true);
    expect(museum.collections.length).toBe(3); // Should have 3 treasures

    museum.collections.forEach((item) => {
      expect(item && typeof item.name === 'string' && item.name.trim().length > 0).toBe(true);
      expect(item && typeof item.imageUrl === 'string' && item.imageUrl.trim().length > 0).toBe(true);
      expect(item && typeof item.description === 'string' && item.description.trim().length > 0).toBe(true);
      
      // Verify URL is a valid URL
      let u;
      try { u = new URL(item.imageUrl); } catch { u = null; }
      expect(u).toBeTruthy();
      expect(u.protocol).toBe('https:');
    });
  });

  test('collections contain authentic Beijing Forbidden City treasures', () => {
    const museum = window && window.MUSEUM_FORBIDDEN_CITY;
    const treasureNames = (museum.collections || []).map(i => i.name);
    
    // Should contain 清明上河图 (Along the River During the Qingming Festival)
    expect(treasureNames).toContain('《清明上河图》');
    
    // Should contain 金瓯永固杯 (Golden Ou Yonggu Cup) - Beijing Forbidden City treasure
    expect(treasureNames).toContain('金瓯永固杯');
    
    // Should contain 酗亚方尊 (Ya Fangzun) - Beijing Forbidden City treasure
    expect(treasureNames).toContain('酗亚方尊');
    
    // Should NOT contain Taiwan NPM treasures like 翠玉白菜
    expect(treasureNames).not.toContain('翠玉白菜');
  });

  test('image URLs are from reliable public sources', () => {
    const museum = window && window.MUSEUM_FORBIDDEN_CITY;
    const urls = (museum.collections || []).map(i => i.imageUrl);
    
    // All URLs should be from Wikimedia Commons (reliable public source)
    urls.forEach((url) => {
      expect(url).toMatch(/wikimedia\.org|upload\.wikimedia\.org/);
    });
  });
});
